import * as fs from "node:fs/promises";
import path from "node:path";

import _ from "lodash";
import { toString } from "mdast-util-to-string";
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import YAML from "yaml";

import { authorIdToName } from "./literature.constants.js";

import type { LoggerService } from "../logger/logger.service.js";
import type { NumeralsService } from "../numerals/numerals.service.js";
import type { LibraryEntry } from "./literature.types.js";
import type {
  Author,
  Line,
  Text,
  Token,
  Word,
} from "@monorepo/lexico-entities";
import type { Paragraph, PhrasingContent, Root, Strong } from "mdast";
import type { DeepPartial, Repository } from "typeorm";
import type { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity.js";

/** Scans provider markdown files and ingests normalized literature data. */
export class LiteratureIngestionHelper {
  public constructor(
    private readonly options: {
      authorRepository: Repository<Author>;
      lineRepository: Repository<Line>;
      logFilePath: string;
      logger: LoggerService;
      numeralsService: NumeralsService;
      textRepository: Repository<Text>;
      tokenRepository: Repository<Token>;
      wordRepository: Repository<Word>;
    },
  ) {}
  private readonly memoizedWordCache = new Map<string, null | string>();
  private wordsCache: Map<string, string> | null = null;
  private buildLineEntityFromParagraph(
    paragraph: Paragraph,
    index: number,
    text: Text,
  ): DeepPartial<Line> {
    let label = `${index + 1}`;
    let lineNodes: PhrasingContent[] = [...paragraph.children];
    const firstNode = lineNodes[0];
    if (firstNode?.type === "strong") {
      const parsed = this.parseLabelFromStrongNode(firstNode, lineNodes);
      label = parsed.label;
      lineNodes = parsed.lineNodes;
    }
    const lineText = toString({ children: lineNodes, type: "paragraph" });
    return { author: text.author, data: lineText, index, label, text };
  }
  private async ensureParentTexts(
    authorEntity: Author,
    authorSlug: string,
    texts: LibraryEntry[],
  ): Promise<Map<string, Text>> {
    const parentTexts = new Map<string, Text>();
    for (const text of texts) {
      if (text.pathParts.length === 0) continue;
      let currentPath = authorSlug;
      for (const part of text.pathParts) {
        const parentSlug = currentPath;
        currentPath = `${currentPath}/${part}`;
        if (parentTexts.has(currentPath)) continue;
        const parentText = parentTexts.get(parentSlug);
        await this.options.textRepository.upsert(
          {
            author: authorEntity,
            parentText,
            slug: currentPath,
            title: _.startCase(part),
            type: "book",
          } as QueryDeepPartialEntity<Text>,
          { conflictPaths: ["slug"], skipUpdateIfNoValuesChanged: true },
        );
        const newParent = await this.options.textRepository.findOneOrFail({
          where: { slug: currentPath },
        });
        parentTexts.set(currentPath, newParent);
      }
    }
    return parentTexts;
  }
  private escapeCapitals(word: string): string {
    return word.replaceAll(
      /[A-Z]/g,
      (character) => `_${character.toLowerCase()}`,
    );
  }
  private extractTokensFromLine(
    line: Line,
    text: Text,
    wordMap: Map<string, string>,
  ): DeepPartial<Token>[] {
    const tokenStrings = line.data.match(/[\p{L}]+|[^\p{L}\s]+/gu) || [];
    return tokenStrings.map((data, index) => {
      const isPunctuation = !/^[\p{L}]+$/u.test(data);
      let wordId: null | string = null;
      if (!isPunctuation) {
        wordId = this.memoizedWordCache.get(data) || null;
        if (!wordId) {
          const normalized = this.escapeCapitals(this.normalize(data));
          wordId = wordMap.get(normalized) || null;
          this.memoizedWordCache.set(data, wordId);
        }
      }
      return {
        author: text.author,
        data,
        index,
        isPunctuation,
        line,
        text,
        word: wordId ? { id: wordId } : null,
      };
    });
  }
  private async getWordsCache(): Promise<Map<string, string>> {
    if (!this.wordsCache) {
      this.options.logger.log(
        "📖 Caching dictionary words for token mapping...",
      );
      const words = await this.options.wordRepository.find({
        select: { data: true, id: true },
      });
      this.wordsCache = new Map(words.map((word) => [word.data, word.id]));
      this.options.logger.log(`📖 Cached ${this.wordsCache.size} words.`);
    }
    return this.wordsCache;
  }
  private async ingestAuthorGroup(
    authorSlug: string,
    texts: LibraryEntry[],
  ): Promise<void> {
    this.options.logger.log(`👤 Starting author: ${authorSlug}`);
    await this.options.authorRepository.upsert(
      {
        name: authorIdToName[authorSlug] || _.startCase(authorSlug),
        slug: authorSlug,
      },
      { conflictPaths: ["slug"], skipUpdateIfNoValuesChanged: true },
    );
    const authorEntity = await this.options.authorRepository.findOneOrFail({
      where: { slug: authorSlug },
    });
    const parentTexts = await this.ensureParentTexts(
      authorEntity,
      authorSlug,
      texts,
    );
    await this.ingestTextChunks({
      authorEntity,
      authorSlug,
      parentTexts,
      texts,
    });
  }
  private async ingestLines(text: Text, ast: Root): Promise<void> {
    this.options.logger.log(`  📜 Parsing lines for ${text.title}`);
    const wordMap = await this.getWordsCache();
    const tokenEntities: DeepPartial<Token>[] = [];
    const paragraphs = ast.children.filter(
      (child): child is Paragraph => child.type === "paragraph",
    );
    if (paragraphs.length === 0)
      this.options.logger.warn(`⚠️ NO LINES in ${text.slug}`);
    const lineEntities = paragraphs.map((paragraph, index) =>
      this.buildLineEntityFromParagraph(paragraph, index, text),
    );
    const savedLines = await this.upsertAndFetchLines(lineEntities, text);
    this.options.logger.log(
      `  💾 Saved ${savedLines.length} lines. Extracting tokens...`,
    );
    for (const line of savedLines) {
      const tokens = this.extractTokensFromLine(line, text, wordMap);
      tokenEntities.push(...tokens);
    }
    await this.upsertTokens(tokenEntities, text);
  }
  private async ingestText(args: {
    author: Author;
    parentText: Text | undefined;
    textPath: string;
    textSlugName: string;
    title: string;
  }): Promise<void> {
    const { author, parentText, textPath, textSlugName, title } = args;
    const textSlug = parentText
      ? `${parentText.slug}/${textSlugName}`
      : `${author.slug}/${textSlugName}`;
    const content = await fs.readFile(textPath, "utf8");
    const ast = remark().use(remarkFrontmatter).use(remarkGfm).parse(content);
    const frontmatterData = this.parseFrontmatter(ast);
    if (frontmatterData["author_metadata"]) {
      const existingMetadata =
        (author.metadata as null | Record<string, unknown>) || {};
      author.metadata = _.merge(
        existingMetadata,
        frontmatterData["author_metadata"],
      );
      await this.options.authorRepository.save(author);
    }
    const text = await this.saveTextToDatabase({
      author,
      frontmatterData,
      parentText,
      textSlug,
      title,
    });
    await this.ingestLines(text, ast);
  }
  private async ingestTextChunks(args: {
    authorEntity: Author;
    authorSlug: string;
    parentTexts: Map<string, Text>;
    texts: LibraryEntry[];
  }): Promise<void> {
    const { authorEntity, authorSlug, parentTexts, texts } = args;
    let currentText = 0;
    const totalTexts = texts.length;
    const textChunks = _.chunk(texts, 5);
    for (const chunk of textChunks) {
      for (const textEntry of chunk) {
        let parentText: Text | undefined;
        if (textEntry.pathParts.length > 0) {
          const currentPath = [authorSlug, ...textEntry.pathParts].join("/");
          parentText = parentTexts.get(currentPath);
        }
        const hierarchy = parentText
          ? `${parentText.slug.replace(`${authorSlug}/`, "")} / `
          : "";
        this.options.logger.log(
          `  📜 Starting: ${hierarchy}${textEntry.title} (from ${textEntry.provider})`,
        );
        try {
          await this.ingestText({
            author: authorEntity,
            parentText,
            textPath: textEntry.fullPath,
            textSlugName: textEntry.textSlug,
            title: textEntry.title,
          });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.stack || error.message
              : String(error);
          this.options.logger.error(
            `❌ Failed to process ${hierarchy}${textEntry.title} (from ${textEntry.provider}): ${String(error)}`,
          );
          await fs.appendFile(
            this.options.logFilePath,
            `[${new Date().toISOString()}] ${textEntry.fullPath}: ${errorMessage}\n`,
          );
        }
        currentText++;
        const textProgress = ` (${((currentText / totalTexts) * 100).toFixed(2)}%, ${currentText}/${totalTexts})`;
        this.options.logger.log(
          `  ✅ Completed: ${hierarchy}${textEntry.title} (from ${textEntry.provider})${textProgress}`,
        );
      }
    }
  }
  private normalize(str: string): string {
    return str
      .normalize("NFD")
      .replaceAll(/[\u0300-\u036F]/gu, "")
      .toLowerCase()
      .trim();
  }
  private parseFrontmatter(ast: Root): Record<string, unknown> {
    const yamlNode = ast.children.find((node) => node.type === "yaml") as
      | undefined
      | { value: string };
    if (!yamlNode?.value) return {};
    try {
      const parsed = YAML.parse(yamlNode.value) as null | Record<
        string,
        unknown
      >;
      return parsed ?? {};
    } catch {
      return {};
    }
  }
  private parseLabelFromStrongNode(
    strongNode: Strong,
    lineNodes: PhrasingContent[],
  ): { label: string; lineNodes: PhrasingContent[] } {
    const rawLabel = toString(strongNode).trim();
    const labelMatch = /^([IVXLCDM]+|[0-9]+[a-zA-Z]*)\.?\s*(.*)$/i.exec(
      rawLabel,
    );
    if (labelMatch?.[1]) {
      return this.parseStandardLabel(labelMatch, lineNodes);
    }
    return this.parseNonStandardLabel(rawLabel, lineNodes);
  }
  private parseNonStandardLabel(
    rawLabel: string,
    lineNodes: PhrasingContent[],
  ): { label: string; lineNodes: PhrasingContent[] } {
    let label = `${lineNodes.length + 1}`;
    let resultNodes: PhrasingContent[] = lineNodes.slice(1);
    if (rawLabel.length <= 32) {
      label = /^[IVXLCDM]+$/i.test(rawLabel)
        ? `${this.options.numeralsService.toDecimal(rawLabel)}`
        : rawLabel;
    } else {
      resultNodes = [{ type: "text", value: `${rawLabel} ` }, ...resultNodes];
    }
    const nextNode = resultNodes[0];
    if (nextNode?.type === "text" && "value" in nextNode) {
      const textNode = nextNode as { type: "text"; value: string };
      textNode.value = textNode.value.replace(/^\s+/, "");
    }
    return { label, lineNodes: resultNodes };
  }
  private parseStandardLabel(
    labelMatch: RegExpExecArray,
    lineNodes: PhrasingContent[],
  ): { label: string; lineNodes: PhrasingContent[] } {
    let label = labelMatch[1] ?? "";
    if (/^[IVXLCDM]+$/i.test(label)) {
      label = `${this.options.numeralsService.toDecimal(label)}`;
    }
    const remainder = labelMatch[2];
    let resultNodes: PhrasingContent[] = lineNodes.slice(1);
    if (remainder) {
      resultNodes = [{ type: "text", value: `${remainder} ` }, ...resultNodes];
    }
    return { label, lineNodes: resultNodes };
  }
  private async saveTextToDatabase(args: {
    author: Author;
    frontmatterData: Record<string, unknown>;
    parentText: Text | undefined;
    textSlug: string;
    title: string;
  }): Promise<Text> {
    const { author, frontmatterData, parentText, textSlug, title } = args;
    const textSaveObject: DeepPartial<Text> = {
      author,
      slug: textSlug,
      title,
      type: "text",
    };
    if (parentText) {
      textSaveObject.parentText = parentText;
    }
    if (frontmatterData["text_metadata"]) {
      textSaveObject.metadata = frontmatterData["text_metadata"];
    }
    await this.options.textRepository.upsert(
      textSaveObject as QueryDeepPartialEntity<Text>,
      {
        conflictPaths: ["slug"],
        skipUpdateIfNoValuesChanged: true,
      },
    );
    return this.options.textRepository.findOneOrFail({
      relations: { author: true },
      where: { slug: textSlug },
    });
  }
  private async upsertAndFetchLines(
    lineEntities: DeepPartial<Line>[],
    text: Text,
  ): Promise<Line[]> {
    const lineChunkSize = 1000;
    const lineChunks = _.chunk(lineEntities, lineChunkSize);
    await Promise.all(
      lineChunks.map(async (chunk) =>
        this.options.lineRepository.upsert(
          chunk as QueryDeepPartialEntity<Line>[],
          {
            conflictPaths: ["text", "index"],
            skipUpdateIfNoValuesChanged: true,
          },
        ),
      ),
    );
    return this.options.lineRepository.find({
      loadEagerRelations: false,
      order: { index: "ASC" },
      select: { data: true, id: true, index: true },
      where: { text: { id: text.id } },
    });
  }
  private async upsertTokens(
    tokenEntities: DeepPartial<Token>[],
    text: Text,
  ): Promise<void> {
    this.options.logger.log(
      `  💾 Saving ${tokenEntities.length} tokens for ${text.title}...`,
    );
    const chunkSize = 2000;
    const tokenChunks = _.chunk(tokenEntities, chunkSize);
    await Promise.all(
      tokenChunks.map(async (chunk) =>
        this.options.tokenRepository.upsert(
          chunk as QueryDeepPartialEntity<Token>[],
          {
            conflictPaths: ["line", "index"],
            skipUpdateIfNoValuesChanged: true,
          },
        ),
      ),
    );
  }
  private async walkLibraryDirectory(args: {
    authorSlug: string;
    currentPathParts: string[];
    directory: string;
    providerName: string;
    texts: LibraryEntry[];
  }): Promise<void> {
    const { authorSlug, currentPathParts, directory, providerName, texts } =
      args;
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await this.walkLibraryDirectory({
          authorSlug,
          currentPathParts: [...currentPathParts, entry.name],
          directory: path.join(directory, entry.name),
          providerName,
          texts,
        });
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        texts.push({
          authorSlug,
          fullPath: path.join(directory, entry.name),
          pathParts: currentPathParts,
          provider: providerName,
          textSlug: path.basename(entry.name, ".md"),
          title: _.startCase(path.basename(entry.name, ".md")),
        });
      }
    }
  }

  /** Ingests all selected texts grouped by author. */
  public async ingestAllAuthors(textsToIngest: LibraryEntry[]): Promise<void> {
    const grouped = _.groupBy(textsToIngest, "authorSlug");
    const authors = Object.entries(grouped);
    let currentAuthor = 0;
    const totalAuthors = authors.length;
    for (const [authorSlug, texts] of authors) {
      await this.ingestAuthorGroup(authorSlug, texts);
      currentAuthor++;
      const authorProgress = ` (${((currentAuthor / totalAuthors) * 100).toFixed(2)}%, ${currentAuthor}/${totalAuthors})`;
      this.options.logger.log(
        `👤 Completed author: ${authorSlug}${authorProgress}`,
      );
    }
  }

  /** Scans the local library directory and returns discovered text entries. */
  public async scanLibrary(): Promise<LibraryEntry[]> {
    const dataDirectory = path.resolve("data", "library");
    const texts: LibraryEntry[] = [];
    try {
      const providers = await fs.readdir(dataDirectory, {
        withFileTypes: true,
      });
      for (const provider of providers) {
        if (!provider.isDirectory()) continue;
        const providerName = provider.name;
        const authors = await fs.readdir(
          path.join(dataDirectory, providerName),
          {
            withFileTypes: true,
          },
        );
        for (const author of authors) {
          if (!author.isDirectory()) continue;
          const authorSlug = author.name;
          await this.walkLibraryDirectory({
            authorSlug,
            currentPathParts: [],
            directory: path.join(dataDirectory, providerName, authorSlug),
            providerName,
            texts,
          });
        }
      }
    } catch {
      // Ignore if data directory doesn't exist yet
    }
    return texts;
  }
}
