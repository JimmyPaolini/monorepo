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

import { Author, Line, Text, Token, Word } from "@monorepo/lexico-entities";

import { LoggerService } from "../logger/logger.service.js";
import { NumeralsService } from "../numerals/numerals.service.js";

import { authorIdToName } from "./literature.constants.js";

import type { LiteratureCommandOptions } from "./literature.types.js";
import type { Paragraph } from "mdast";

/**
 * Ingest local literature texts into the database.
 */
@Command({
  description: "Ingest local literature text files into the database",
  name: "literature",
})
@Injectable()
export class LiteratureCommand extends CommandRunner {
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
  }

  private wordsCache: Map<string, string> | null = null;

  // 🔒 Private Methods

  private escapeCapitals(word: string): string {
    return word.replaceAll(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
  }

  private async getAuthorChoices(): Promise<
    { title: string; value: string }[]
  > {
    const dataDir = path.join(process.cwd(), "./data/library");
    try {
      await fs.access(dataDir);
    } catch {
      return [];
    }

    const entries = await fs.readdir(dataDir, { withFileTypes: true });
    return entries
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => ({ title: dirent.name, value: dirent.name }));
  }

  private async getTextChoices(
    authorSlug?: string,
  ): Promise<{ title: string; value: string }[]> {
    const dataDir = path.join(process.cwd(), "./data/library");
    const choices: { title: string; value: string }[] = [];

    try {
      let authors: string[] = [];
      if (authorSlug) {
        authors = [authorSlug];
      } else {
        const entries = await fs.readdir(dataDir, { withFileTypes: true });
        authors = entries.filter((d) => d.isDirectory()).map((d) => d.name);
      }

      for (const author of authors) {
        const authorPath = path.join(dataDir, author);
        const entries = await fs.readdir(authorPath, {
          withFileTypes: true,
        });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const texts = await fs.readdir(path.join(authorPath, entry.name), {
              withFileTypes: true,
            });
            for (const textFile of texts) {
              if (textFile.isFile() && textFile.name.endsWith(".md")) {
                const slug = `${author}/${entry.name}/${path.basename(
                  textFile.name,
                  ".md",
                )}`;
                choices.push({ title: slug, value: slug });
              }
            }
          } else if (entry.isFile() && entry.name.endsWith(".md")) {
            const slug = `${author}/${path.basename(entry.name, ".md")}`;
            choices.push({ title: slug, value: slug });
          }
        }
      }
    } catch {
      // Ignore
    }
    return choices;
  }

  private async getWordsCache(): Promise<Map<string, string>> {
    if (!this.wordsCache) {
      this.logger.log("Caching dictionary words for token mapping...");
      const words = await this.wordRepository.find({
        select: { id: true, word: true },
      });
      this.wordsCache = new Map(words.map((w) => [w.word, w.id]));
      this.logger.log(`Cached ${this.wordsCache.size} words.`);
    }
    return this.wordsCache;
  }

  private async ingestAuthor(
    slug: string,
    basePath: string,
    targetTextSlug?: string,
  ): Promise<void> {
    this.logger.log(`👤 Ingesting author: ${slug}`);

    try {
      await this.authorRepository.upsert(
        {
          name: authorIdToName[slug] || slug,
          slug,
        },
        { conflictPaths: ["slug"], skipUpdateIfNoValuesChanged: true },
      );

      const author = await this.authorRepository.findOneOrFail({
        where: { slug },
      });

      const authorPath = path.join(basePath, slug);
      const entries = await fs.readdir(authorPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(authorPath, entry.name);

        if (entry.isDirectory()) {
          const dirPrefix = `${slug}/${entry.name}/`;
          if (targetTextSlug && !targetTextSlug.startsWith(dirPrefix)) {
            continue;
          }
          const title = _.startCase(entry.name);
          await this.ingestTextDir(
            author,
            title,
            entry.name,
            fullPath,
            targetTextSlug,
          );
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          const slugName = path.basename(entry.name, ".md");
          const textSlug = `${slug}/${slugName}`;
          if (targetTextSlug && targetTextSlug !== textSlug) {
            continue;
          }
          const title = _.startCase(slugName);
          await this.ingestText(author, undefined, title, slugName, fullPath);
        }
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error ingesting author ${slug}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  private async ingestLines(text: Text, textPath: string): Promise<void> {
    this.logger.log(`  📜 Parsing lines for ${text.title}`);
    const content = await fs.readFile(textPath, "utf8");

    const wordMap = await this.getWordsCache();
    const tokenEntities: DeepPartial<Token>[] = [];

    const ast = remark().use(remarkFrontmatter).use(remarkGfm).parse(content);

    const paragraphs = ast.children.filter(
      (child): child is Paragraph => child.type === "paragraph",
    );

    if (paragraphs.length === 0) {
      this.logger.log(`NO LINES in ${text.slug}`);
    }

    const lineEntities = paragraphs.map((para, index) => {
      let label = `${index + 1}`;
      let lineNodes = para.children;
      const firstNode = lineNodes[0];

      if (firstNode?.type === "strong") {
        const strongNode = firstNode;
        const rawLabel = toString(strongNode).trim();

        // Extract the actual label if it's mixed with a title (e.g. "XXVII. Canis et...")
        const labelMatch = /^([IVXLCDM]+|[0-9]+[a-zA-Z]*)\.?\s*(.*)$/i.exec(
          rawLabel,
        );
        if (labelMatch?.[1]) {
          label = labelMatch[1];
          if (/^[IVXLCDM]+$/i.test(label)) {
            label = `${this.numeralsService.toDecimal(label)}`;
          }

          const remainder = labelMatch[2];
          lineNodes = lineNodes.slice(1);

          if (remainder) {
            const newNode = {
              type: "text",
              value: `${remainder} `,
            } as Extract<
              Parameters<typeof lineNodes.unshift>[0],
              { type: "text" }
            >;
            lineNodes.unshift(newNode);
          }
        } else {
          // If it doesn't match a standard label format, just use the raw label if it fits, or fallback
          if (rawLabel.length <= 32) {
            label = rawLabel;
            if (/^[IVXLCDM]+$/i.test(label)) {
              label = `${this.numeralsService.toDecimal(label)}`;
            }
          }
          lineNodes = lineNodes.slice(1);
          // If we rejected the rawLabel as a label because it was too long, we should put it back in the text
          if (rawLabel.length > 32) {
            const newNode = {
              type: "text",
              value: `${rawLabel} `,
            } as Extract<
              Parameters<typeof lineNodes.unshift>[0],
              { type: "text" }
            >;
            lineNodes.unshift(newNode);
          }
        }

        const nextNode = lineNodes[0];
        if (nextNode?.type === "text" && "value" in nextNode) {
          nextNode.value = nextNode.value.replace(/^\s+/, "");
        }
      }

      const lineText = toString({ children: lineNodes, type: "paragraph" });

      return {
        author: text.author,
        data: lineText,
        index,
        label,
        text,
      };
    });

    const lineChunkSize = 1000;
    for (let i = 0; i < lineEntities.length; i += lineChunkSize) {
      const chunk = lineEntities.slice(i, i + lineChunkSize);
      await this.lineRepository.upsert(chunk, {
        conflictPaths: ["text", "index"],
        skipUpdateIfNoValuesChanged: true,
      });
    }

    const savedLines = await this.lineRepository.find({
      order: { index: "ASC" },
      relations: { text: { author: true } },
      where: { text: { id: text.id } },
    });

    this.logger.log(
      `  💾 Saved ${savedLines.length} lines. Extracting tokens...`,
    );

    for (const line of savedLines) {
      const tokenStrings = line.data.match(/[\p{L}]+|[^\p{L}\s]+/gu) || [];
      tokenStrings.forEach((tokenText, index) => {
        const isPunctuation = !/^[\p{L}]+$/u.test(tokenText);
        let wordId: null | string = null;
        if (!isPunctuation) {
          const normalized = this.escapeCapitals(this.normalize(tokenText));
          wordId = wordMap.get(normalized) || null;
        }

        tokenEntities.push({
          author: line.text.author,
          index,
          isPunctuation,
          line,
          text: line.text,
          textValue: tokenText,
          word: wordId ? { id: wordId } : null,
        });
      });
    }

    this.logger.log(
      `  💾 Saving ${tokenEntities.length} tokens for ${text.title}...`,
    );
    const chunkSize = 5000;
    for (let i = 0; i < tokenEntities.length; i += chunkSize) {
      await this.tokenRepository.upsert(tokenEntities.slice(i, i + chunkSize), {
        conflictPaths: ["line", "index"],
        skipUpdateIfNoValuesChanged: true,
      });
    }
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

    const textSaveObj: DeepPartial<Text> = {
      author,
      slug: textSlug,
      title,
      type: "text",
    };
    if (parentText) {
      textSaveObj.parentText = parentText;
    }

    await this.textRepository.upsert(textSaveObj, {
      conflictPaths: ["slug"],
      skipUpdateIfNoValuesChanged: true,
    });

    const text = await this.textRepository.findOneOrFail({
      relations: { author: true },
      where: { slug: textSlug },
    });

    await this.ingestLines(text, textPath);
  }

  private async ingestTextDir(
    author: Author,
    title: string,
    dirSlug: string,
    dirPath: string,
    targetTextSlug?: string,
  ): Promise<void> {
    const parentTextSlug = `${author.slug}/${dirSlug}`;
    await this.textRepository.upsert(
      {
        author,
        slug: parentTextSlug,
        title,
        type: "book",
      },
      { conflictPaths: ["slug"], skipUpdateIfNoValuesChanged: true },
    );

    const parentText = await this.textRepository.findOneOrFail({
      relations: { author: true },
      where: { slug: parentTextSlug },
    });

    const texts = await fs.readdir(dirPath, { withFileTypes: true });
    for (const textFile of texts) {
      if (!textFile.isFile() || !textFile.name.endsWith(".md")) continue;
      const slugName = path.basename(textFile.name, ".md");
      const textSlug = `${author.slug}/${dirSlug}/${slugName}`;

      if (targetTextSlug && targetTextSlug !== textSlug) {
        continue;
      }

      const textTitle = _.startCase(slugName);
      const fullPath = path.join(dirPath, textFile.name);
      await this.ingestText(author, parentText, textTitle, slugName, fullPath);
    }
  }

  private normalize(str: string): string {
    return str
      .normalize("NFD")
      .replaceAll(/[\u0300-\u036F]/gu, "")
      .toLowerCase()
      .trim();
  }

  // 🌎 Public Methods

  /**
   *
   */
  @Option({
    description: "The author to ingest",
    flags: "-a, --author [author]",
  })
  async parseAuthor(author?: string): Promise<string | undefined> {
    if (!author) return undefined;

    const choices = await this.getAuthorChoices();
    if (typeof author === "string") {
      if (choices.some((choice) => choice.value === author)) {
        return author;
      } else {
        throw new Error(`Author "${author}" not found in the dataset.`);
      }
    }

    const response = (await prompts({
      choices: [{ title: "None", value: null }, ...choices],
      message: "Select the author",
      name: "author",
      type: "autocomplete",
    })) as { author: null | string };

    if (response.author === null || typeof response.author !== "string") {
      return undefined;
    }

    return response.author;
  }

  /**
   *
   */
  @Option({
    description: "The specific text to ingest",
    flags: "-t, --text [text]",
  })
  async parseText(text?: string, author?: string): Promise<string | undefined> {
    if (!text) return undefined;

    const choices = await this.getTextChoices(author);
    if (typeof text === "string") {
      if (choices.some((choice) => choice.value === text)) {
        return text;
      } else {
        throw new Error(`Text "${text}" not found in the dataset.`);
      }
    }

    const response = (await prompts({
      choices: [{ title: "None", value: null }, ...choices],
      message: "Select the text",
      name: "text",
      type: "autocomplete",
    })) as { text: null | string };

    if (response.text === null || typeof response.text !== "string") {
      return undefined;
    }

    return response.text;
  }

  /** Runs the literature ingestion pipeline. */
  async run(_args: string[], options: LiteratureCommandOptions): Promise<void> {
    const dataPath = path.resolve("data", "library");
    this.logger.log(`📚 Ingesting literature from ${dataPath}`);

    try {
      await fs.access(dataPath);
    } catch {
      this.logger.warn(`Directory not found: ${dataPath}`);
      return;
    }

    const author = await this.parseAuthor(options.author ?? undefined);
    const text = await this.parseText(options.text ?? undefined, author);

    const readdirResult = await fs.readdir(dataPath, { withFileTypes: true });
    let authorDirs = readdirResult
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    if (author) {
      authorDirs = authorDirs.filter((dir) => dir === author);
    } else if (text) {
      const textAuthor = text.split("/")[0];
      if (textAuthor) {
        authorDirs = authorDirs.filter((dir) => dir === textAuthor);
      }
    }

    for (const slug of authorDirs) {
      await this.ingestAuthor(slug, dataPath, text);
    }

    this.logger.log("📚 Literature ingestion complete");
  }
}
