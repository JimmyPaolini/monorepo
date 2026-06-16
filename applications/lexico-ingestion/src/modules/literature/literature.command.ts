import { existsSync, mkdirSync } from "node:fs";
import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import _ from "lodash";
import { toString } from "mdast-util-to-string";
import { Command, CommandRunner, Option } from "nest-commander";
import prompts from "prompts";
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { type DeepPartial, Repository } from "typeorm";
import YAML from "yaml";

import { Author, Line, Text, Token, Word } from "@monorepo/lexico-entities";

import { LoggerService } from "../logger/logger.service";
import { NumeralsService } from "../numerals/numerals.service";

import { authorIdToName } from "./literature.constants";

import type { LiteratureCommandOptions } from "./literature.types";
import type { Paragraph, PhrasingContent, Root, Strong } from "mdast";
import type { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity.js";

// 🏷️ Types

interface LibraryEntry {
  authorSlug: string;
  fullPath: string;
  pathParts: string[];
  provider: string;
  textSlug: string;
  title: string;
}

/**
 * Ingest local literature texts into the database.
 */
@Command({
  description: "Run the literature command",
  name: "literature",
})
@Injectable()
export class LiteratureCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(
    @InjectRepository(Author)
    private readonly authorRepository: Repository<Author>,
    @InjectRepository(Text)
    private readonly textRepository: Repository<Text>,
    @InjectRepository(Line)
    private readonly lineRepository: Repository<Line>,
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    @InjectRepository(Word)
    private readonly wordRepository: Repository<Word>,
    private readonly logger: LoggerService,
    private readonly numeralsService: NumeralsService,
  ) {
    super();
    this.logger.setContext(LiteratureCommand.name);

    const outputDirectory = path.join(process.cwd(), "output");
    if (!existsSync(outputDirectory))
      mkdirSync(outputDirectory, { recursive: true });
    this.logFilePath = path.join(
      outputDirectory,
      `literature-${new Date().toISOString().replaceAll(/[:.]/g, "-")}.log`,
    );
  }

  // 🔐 Private Fields

  private readonly logFilePath: string;
  private readonly memoizedWordCache = new Map<string, null | string>();

  // Ordered by priority
  private readonly priorityProviders = [
    "perseus",
    "corpus-scriptorum-ecclesiasticorum-latinorum",
    "thelatinlibrary",
    "epigraphik-datenbank-clauss-slaby",
  ];

  private wordsCache: Map<string, string> | null = null;

  // 🔒 Private Methods

  private buildLineEntityFromParagraph(
    para: Paragraph,
    index: number,
    text: Text,
  ): DeepPartial<Line> {
    let label = `${index + 1}`;
    let lineNodes: PhrasingContent[] = [...para.children];
    const firstNode = lineNodes[0];
    if (firstNode?.type === "strong") {
      const parsed = this.parseLabelFromStrongNode(firstNode, lineNodes);
      label = parsed.label;
      lineNodes = parsed.lineNodes;
    }
    const lineText = toString({ children: lineNodes, type: "paragraph" });
    return { author: text.author, data: lineText, index, label, text };
  }

  // 🔑 Public Fields

  // 🔏 Private Methods

  private deduplicateByProvider(texts: LibraryEntry[]): LibraryEntry[] {
    const textMap = new Map<string, LibraryEntry>();
    for (const text of texts) {
      const slug = [text.authorSlug, ...text.pathParts, text.textSlug].join(
        "/",
      );
      const existing = textMap.get(slug);
      if (existing) {
        const existingPriority = this.priorityProviders.indexOf(
          existing.provider,
        );
        const newPriority = this.priorityProviders.indexOf(text.provider);
        if (
          newPriority !== -1 &&
          (existingPriority === -1 || newPriority < existingPriority)
        ) {
          textMap.set(slug, text);
        }
      } else {
        textMap.set(slug, text);
      }
    }
    return [...textMap.values()];
  }

  private async ensureParentTexts(
    authorEntity: Author,
    authorSlug: string,
    texts: LibraryEntry[],
  ): Promise<Map<string, Text>> {
    const parentTexts = new Map<string, Text>();
    for (const t of texts) {
      if (t.pathParts.length === 0) continue;
      let currentPath = authorSlug;
      for (const part of t.pathParts) {
        const parentSlug = currentPath;
        currentPath = `${currentPath}/${part}`;
        if (parentTexts.has(currentPath)) continue;
        const pText = parentTexts.get(parentSlug);
        await this.textRepository.upsert(
          {
            author: authorEntity,
            parentText: pText,
            slug: currentPath,
            title: _.startCase(part),
            type: "book",
          } as QueryDeepPartialEntity<Text>,
          { conflictPaths: ["slug"], skipUpdateIfNoValuesChanged: true },
        );
        const newParent = await this.textRepository.findOneOrFail({
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

  private async getAuthorChoices(
    provider?: string,
  ): Promise<{ title: string; value: string }[]> {
    const library = await this.scanLibrary();
    const filtered = provider
      ? library.filter((t) => t.provider === provider)
      : library;
    const authors = [...new Set(filtered.map((t) => t.authorSlug))].toSorted();
    return authors.map((a) => ({ title: a, value: a }));
  }

  private async getProviderChoices(): Promise<
    { title: string; value: string }[]
  > {
    const library = await this.scanLibrary();
    const providers = [...new Set(library.map((t) => t.provider))].toSorted();
    return providers.map((p) => ({ title: p, value: p }));
  }

  private async getTextChoices(
    provider?: string,
    authorSlug?: string,
  ): Promise<{ title: string; value: string }[]> {
    const library = await this.scanLibrary();
    let filtered = library;
    if (provider) filtered = filtered.filter((t) => t.provider === provider);
    if (authorSlug)
      filtered = filtered.filter((t) => t.authorSlug === authorSlug);

    const textSlugs = [
      ...new Set(
        filtered.map((t) =>
          [t.authorSlug, ...t.pathParts, t.textSlug].join("/"),
        ),
      ),
    ].toSorted();
    return textSlugs.map((t) => ({ title: t, value: t }));
  }

  private async getWordsCache(): Promise<Map<string, string>> {
    if (!this.wordsCache) {
      this.logger.log("📖 Caching dictionary words for token mapping...");
      const words = await this.wordRepository.find({
        select: { data: true, id: true },
      });
      this.wordsCache = new Map(words.map((w) => [w.data, w.id]));
      this.logger.log(`📖 Cached ${this.wordsCache.size} words.`);
    }
    return this.wordsCache;
  }

  private async ingestAllAuthors(textsToIngest: LibraryEntry[]): Promise<void> {
    const grouped = _.groupBy(textsToIngest, "authorSlug");
    const authors = Object.entries(grouped);
    let currentAuthor = 0;
    const totalAuthors = authors.length;
    for (const [authorSlug, texts] of authors) {
      await this.ingestAuthorGroup(authorSlug, texts);
      currentAuthor++;
      const authorProgress = ` (${((currentAuthor / totalAuthors) * 100).toFixed(2)}%, ${currentAuthor}/${totalAuthors})`;
      this.logger.log(`👤 Completed author: ${authorSlug}${authorProgress}`);
    }
  }

  private async ingestAuthorGroup(
    authorSlug: string,
    texts: LibraryEntry[],
  ): Promise<void> {
    this.logger.log(`👤 Starting author: ${authorSlug}`);
    await this.authorRepository.upsert(
      {
        name: authorIdToName[authorSlug] || _.startCase(authorSlug),
        slug: authorSlug,
      },
      { conflictPaths: ["slug"], skipUpdateIfNoValuesChanged: true },
    );
    const authorEntity = await this.authorRepository.findOneOrFail({
      where: { slug: authorSlug },
    });
    const parentTexts = await this.ensureParentTexts(
      authorEntity,
      authorSlug,
      texts,
    );
    await this.ingestTextChunks(authorEntity, authorSlug, texts, parentTexts);
  }

  private async ingestLines(text: Text, ast: Root): Promise<void> {
    this.logger.log(`  📜 Parsing lines for ${text.title}`);
    const wordMap = await this.getWordsCache();
    const tokenEntities: DeepPartial<Token>[] = [];
    const paragraphs = ast.children.filter(
      (child): child is Paragraph => child.type === "paragraph",
    );
    if (paragraphs.length === 0)
      this.logger.warn(`⚠️ NO LINES in ${text.slug}`);
    const lineEntities = paragraphs.map((para, index) =>
      this.buildLineEntityFromParagraph(para, index, text),
    );
    const savedLines = await this.upsertAndFetchLines(lineEntities, text);
    this.logger.log(
      `  💾 Saved ${savedLines.length} lines. Extracting tokens...`,
    );
    for (const line of savedLines) {
      const tokens = this.extractTokensFromLine(line, text, wordMap);
      tokenEntities.push(...tokens);
    }
    await this.upsertTokens(tokenEntities, text);
  }

  private async ingestText(
    author: Author,
    parentText: Text | undefined,
    title: string,
    textSlugName: string,
    textPath: string,
  ): Promise<void> {
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
      await this.authorRepository.save(author);
    }
    const text = await this.saveTextToDatabase(
      author,
      parentText,
      textSlug,
      title,
      frontmatterData,
    );
    await this.ingestLines(text, ast);
  }

  private async ingestTextChunks(
    authorEntity: Author,
    authorSlug: string,
    texts: LibraryEntry[],
    parentTexts: Map<string, Text>,
  ): Promise<void> {
    let currentText = 0;
    const totalTexts = texts.length;
    const textChunks = _.chunk(texts, 5);
    for (const chunk of textChunks) {
      await Promise.all(
        chunk.map(async (t) => {
          let parentText: Text | undefined;
          if (t.pathParts.length > 0) {
            const currentPath = [authorSlug, ...t.pathParts].join("/");
            parentText = parentTexts.get(currentPath);
          }
          const hierarchy = parentText
            ? `${parentText.slug.replace(`${authorSlug}/`, "")} / `
            : "";
          this.logger.log(
            `  📜 Starting: ${hierarchy}${t.title} (from ${t.provider})`,
          );
          try {
            await this.ingestText(
              authorEntity,
              parentText,
              t.title,
              t.textSlug,
              t.fullPath,
            );
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error
                ? error.stack || error.message
                : String(error);
            this.logger.error(
              `❌ Failed to process ${hierarchy}${t.title} (from ${t.provider}): ${String(error)}`,
            );
            await fs.appendFile(
              this.logFilePath,
              `[${new Date().toISOString()}] ${t.fullPath}: ${errorMessage}\n`,
            );
          }
          currentText++;
          const textProgress = ` (${((currentText / totalTexts) * 100).toFixed(2)}%, ${currentText}/${totalTexts})`;
          this.logger.log(
            `  ✅ Completed: ${hierarchy}${t.title} (from ${t.provider})${textProgress}`,
          );
        }),
      );
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
        ? `${this.numeralsService.toDecimal(rawLabel)}`
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
      label = `${this.numeralsService.toDecimal(label)}`;
    }
    const remainder = labelMatch[2];
    let resultNodes: PhrasingContent[] = lineNodes.slice(1);
    if (remainder) {
      resultNodes = [{ type: "text", value: `${remainder} ` }, ...resultNodes];
    }
    return { label, lineNodes: resultNodes };
  }

  // 🌎 Public Methods

  private async saveTextToDatabase(
    author: Author,
    parentText: Text | undefined,
    textSlug: string,
    title: string,
    frontmatterData: Record<string, unknown>,
  ): Promise<Text> {
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
    await this.textRepository.upsert(
      textSaveObject as QueryDeepPartialEntity<Text>,
      {
        conflictPaths: ["slug"],
        skipUpdateIfNoValuesChanged: true,
      },
    );
    return this.textRepository.findOneOrFail({
      relations: { author: true },
      where: { slug: textSlug },
    });
  }

  private async scanLibrary(): Promise<LibraryEntry[]> {
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
          { withFileTypes: true },
        );
        for (const author of authors) {
          if (!author.isDirectory()) continue;
          const authorSlug = author.name;
          await this.walkLibraryDirectory(
            path.join(dataDirectory, providerName, authorSlug),
            [],
            providerName,
            authorSlug,
            texts,
          );
        }
      }
    } catch {
      // Ignore if data directory doesn't exist yet
    }
    return texts;
  }

  private selectTextsToIngest(
    library: LibraryEntry[],
    provider: string | undefined,
    author: string | undefined,
    text: string | undefined,
  ): LibraryEntry[] {
    let filtered = library;
    if (provider) filtered = filtered.filter((t) => t.provider === provider);
    if (author) filtered = filtered.filter((t) => t.authorSlug === author);
    if (text) {
      filtered = filtered.filter(
        (t) => [t.authorSlug, ...t.pathParts, t.textSlug].join("/") === text,
      );
    }
    return this.deduplicateByProvider(filtered);
  }

  private async upsertAndFetchLines(
    lineEntities: DeepPartial<Line>[],
    text: Text,
  ): Promise<Line[]> {
    const lineChunkSize = 1000;
    const lineChunks = _.chunk(lineEntities, lineChunkSize);
    await Promise.all(
      lineChunks.map(async (chunk) =>
        this.lineRepository.upsert(chunk as QueryDeepPartialEntity<Line>[], {
          conflictPaths: ["text", "index"],
          skipUpdateIfNoValuesChanged: true,
        }),
      ),
    );
    return this.lineRepository.find({
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
    this.logger.log(
      `  💾 Saving ${tokenEntities.length} tokens for ${text.title}...`,
    );
    const chunkSize = 2000;
    const tokenChunks = _.chunk(tokenEntities, chunkSize);
    await Promise.all(
      tokenChunks.map(async (chunk) =>
        this.tokenRepository.upsert(chunk as QueryDeepPartialEntity<Token>[], {
          conflictPaths: ["line", "index"],
          skipUpdateIfNoValuesChanged: true,
        }),
      ),
    );
  }

  private async walkLibraryDirectory(
    directory: string,
    currentPathParts: string[],
    providerName: string,
    authorSlug: string,
    texts: LibraryEntry[],
  ): Promise<void> {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await this.walkLibraryDirectory(
          path.join(directory, entry.name),
          [...currentPathParts, entry.name],
          providerName,
          authorSlug,
          texts,
        );
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

  /**
   *
   */
  @Option({
    description: "The author to ingest",
    flags: "-a, --author [author]",
  })
  async parseAuthor(
    author?: string,
    provider?: string,
  ): Promise<string | undefined> {
    const choices = await this.getAuthorChoices(
      typeof provider === "string" ? provider : undefined,
    );
    if (typeof author === "string" && author.trim() !== "") {
      if (choices.some((choice) => choice.value === author)) {
        return author;
      } else {
        throw new Error(`Author "${author}" not found in the dataset.`);
      }
    }

    const response = (await prompts({
      choices: [{ title: "All", value: "ALL" }, ...choices],
      message: "Select the author",
      name: "author",
      type: "autocomplete",
    })) as { author: string };

    if (response.author === "ALL" || typeof response.author !== "string") {
      return undefined;
    }

    return response.author;
  }

  /**
   *
   */
  @Option({
    description: "The provider to ingest from",
    flags: "-p, --provider [provider]",
  })
  async parseProvider(provider?: string): Promise<string | undefined> {
    const choices = await this.getProviderChoices();
    if (typeof provider === "string" && provider.trim() !== "") {
      if (choices.some((choice) => choice.value === provider)) {
        return provider;
      } else {
        throw new Error(`Provider "${provider}" not found in the dataset.`);
      }
    }

    const response = (await prompts({
      choices: [{ title: "All", value: "ALL" }, ...choices],
      message: "Select the provider",
      name: "provider",
      type: "autocomplete",
    })) as { provider: string };

    if (response.provider === "ALL" || typeof response.provider !== "string") {
      return undefined;
    }

    return response.provider;
  }

  /**
   *
   */
  @Option({
    description: "The specific text to ingest",
    flags: "-t, --text [text]",
  })
  async parseText(
    text?: string,
    provider?: string,
    authorSlug?: string,
  ): Promise<string | undefined> {
    const choices = await this.getTextChoices(
      typeof provider === "string" ? provider : undefined,
      typeof authorSlug === "string" ? authorSlug : undefined,
    );
    if (typeof text === "string" && text.trim() !== "") {
      if (choices.some((choice) => choice.value === text)) {
        return text;
      } else {
        throw new Error(`Text "${text}" not found in the dataset.`);
      }
    }

    const response = (await prompts({
      choices: [{ title: "All", value: "ALL" }, ...choices],
      message: "Select the text",
      name: "text",
      type: "autocomplete",
    })) as { text: string };

    if (response.text === "ALL" || typeof response.text !== "string") {
      return undefined;
    }

    return response.text;
  }

  // 🌎 Public Methods

  /** Runs the literature ingestion pipeline. */
  async run(
    _arguments: string[],
    options: LiteratureCommandOptions,
  ): Promise<void> {
    this.logger.log(`📚 Starting literature ingestion...`);
    this.logger.log(`⚙️ Options: ${JSON.stringify(options)}`);
    const startTime = performance.now();
    const library = await this.scanLibrary();
    if (library.length === 0) {
      this.logger.warn(`⚠️ No texts found in data/library directory.`);
      return;
    }
    const provider = await this.parseProvider(options.provider ?? undefined);
    const author = await this.parseAuthor(
      options.author ?? undefined,
      provider,
    );
    const text = await this.parseText(
      options.text ?? undefined,
      provider,
      author,
    );
    const textsToIngest = this.selectTextsToIngest(
      library,
      provider,
      author,
      text,
    );
    this.logger.log(`📚 Selected ${textsToIngest.length} texts for ingestion.`);
    await this.ingestAllAuthors(textsToIngest);
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    this.logger.log(`📚 Literature ingestion complete in ${duration} seconds`);
  }
}
