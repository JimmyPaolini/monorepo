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

  // Ordered by priority
  private readonly priorityProviders = [
    "perseus",
    "corpus-scriptorum-ecclesiasticorum-latinorum",
    "musisque-deoque",
    "open-greek-and-latin",
    "thelatinlibrary",
    "epigraphik-datenbank-clauss-slaby",
  ];

  private wordsCache: Map<string, string> | null = null;

  // 🔒 Private Methods

  private escapeCapitals(word: string): string {
    return word.replaceAll(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
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
          t.bookSlug
            ? `${t.authorSlug}/${t.bookSlug}/${t.textSlug}`
            : `${t.authorSlug}/${t.textSlug}`,
        ),
      ),
    ].toSorted();
    return textSlugs.map((t) => ({ title: t, value: t }));
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

  private normalize(str: string): string {
    return str
      .normalize("NFD")
      .replaceAll(/[\u0300-\u036F]/gu, "")
      .toLowerCase()
      .trim();
  }

  private async scanLibrary(): Promise<
    {
      authorSlug: string;
      bookSlug?: string;
      fullPath: string;
      provider: string;
      textSlug: string;
      title: string;
    }[]
  > {
    const dataDir = path.resolve("data", "library");
    const texts: {
      authorSlug: string;
      bookSlug?: string;
      fullPath: string;
      provider: string;
      textSlug: string;
      title: string;
    }[] = [];

    try {
      const providers = await fs.readdir(dataDir, { withFileTypes: true });
      for (const provider of providers) {
        if (!provider.isDirectory()) continue;
        const providerName = provider.name;

        const authors = await fs.readdir(path.join(dataDir, providerName), {
          withFileTypes: true,
        });
        for (const author of authors) {
          if (!author.isDirectory()) continue;
          const authorSlug = author.name;

          const authorContents = await fs.readdir(
            path.join(dataDir, providerName, authorSlug),
            { withFileTypes: true },
          );
          for (const entry of authorContents) {
            if (entry.isDirectory()) {
              const bookSlug = entry.name;
              const bookContents = await fs.readdir(
                path.join(dataDir, providerName, authorSlug, bookSlug),
                { withFileTypes: true },
              );
              for (const textFile of bookContents) {
                if (textFile.isFile() && textFile.name.endsWith(".md")) {
                  texts.push({
                    authorSlug,
                    bookSlug,
                    fullPath: path.join(
                      dataDir,
                      providerName,
                      authorSlug,
                      bookSlug,
                      textFile.name,
                    ),
                    provider: providerName,
                    textSlug: path.basename(textFile.name, ".md"),
                    title: _.startCase(path.basename(textFile.name, ".md")),
                  });
                }
              }
            } else if (entry.isFile() && entry.name.endsWith(".md")) {
              texts.push({
                authorSlug,
                fullPath: path.join(
                  dataDir,
                  providerName,
                  authorSlug,
                  entry.name,
                ),
                provider: providerName,
                textSlug: path.basename(entry.name, ".md"),
                title: _.startCase(path.basename(entry.name, ".md")),
              });
            }
          }
        }
      }
    } catch {
      // Ignore if data directory doesn't exist yet
    }
    return texts;
  }

  // 🌎 Public Methods

  /**
   *
   */
  @Option({
    description: "The author to ingest",
    flags: "-a, --author [author]",
  })
  async parseAuthor(
    author?: string,
    _ignored?: unknown,
    _options?: unknown,
  ): Promise<string | undefined> {
    if (!author) return undefined;

    // Use passed provider context if available when prompted manually, though nest-commander usually resolves these sequentially
    // So we'll pass undefined provider to getAuthorChoices to just allow any author if specified.
    // The filtering will happen later.
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
    description: "The provider to ingest from",
    flags: "-p, --provider [provider]",
  })
  async parseProvider(provider?: string): Promise<string | undefined> {
    if (!provider) return undefined;

    const choices = await this.getProviderChoices();
    if (typeof provider === "string") {
      if (choices.some((choice) => choice.value === provider)) {
        return provider;
      } else {
        throw new Error(`Provider "${provider}" not found in the dataset.`);
      }
    }

    const response = (await prompts({
      choices: [{ title: "None", value: null }, ...choices],
      message: "Select the provider",
      name: "provider",
      type: "autocomplete",
    })) as { provider: null | string };

    if (response.provider === null || typeof response.provider !== "string") {
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
    _ignored?: unknown,
    _options?: unknown,
  ): Promise<string | undefined> {
    if (!text) return undefined;

    const choices = await this.getTextChoices();
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
    this.logger.log(`📚 Starting literature ingestion...`);

    const library = await this.scanLibrary();
    if (library.length === 0) {
      this.logger.warn(`No texts found in data/library directory.`);
      return;
    }

    const provider = await this.parseProvider(options.provider ?? undefined);
    const author = await this.parseAuthor(options.author ?? undefined);
    const text = await this.parseText(options.text ?? undefined);

    let filtered = library;

    if (provider) {
      filtered = filtered.filter((t) => t.provider === provider);
    }
    if (author) {
      filtered = filtered.filter((t) => t.authorSlug === author);
    }
    if (text) {
      filtered = filtered.filter(
        (t) =>
          (t.bookSlug
            ? `${t.authorSlug}/${t.bookSlug}/${t.textSlug}`
            : `${t.authorSlug}/${t.textSlug}`) === text,
      );
    }

    // De-duplicate by selecting the highest priority provider for each text
    const textMap = new Map<string, (typeof filtered)[0]>();

    for (const t of filtered) {
      const slug = t.bookSlug
        ? `${t.authorSlug}/${t.bookSlug}/${t.textSlug}`
        : `${t.authorSlug}/${t.textSlug}`;
      const existing = textMap.get(slug);

      if (existing) {
        const existingPriority = this.priorityProviders.indexOf(
          existing.provider,
        );
        const newPriority = this.priorityProviders.indexOf(t.provider);

        // If the new provider has a higher priority (lower index, but not -1), or the existing provider is not in the priority list
        if (
          newPriority !== -1 &&
          (existingPriority === -1 || newPriority < existingPriority)
        ) {
          textMap.set(slug, t);
        }
      } else {
        textMap.set(slug, t);
      }
    }

    const textsToIngest = [...textMap.values()];
    this.logger.log(`Selected ${textsToIngest.length} texts for ingestion.`);

    // Group by author -> book -> text
    const grouped = _.groupBy(textsToIngest, "authorSlug");

    for (const [authorSlug, texts] of Object.entries(grouped)) {
      this.logger.log(`👤 Ingesting author: ${authorSlug}`);

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

      const textsByBook = _.groupBy(texts, "bookSlug");

      for (const [bookSlug, bookTexts] of Object.entries(textsByBook)) {
        if (bookSlug === "undefined") {
          // Direct texts
          for (const t of bookTexts) {
            this.logger.log(`  -> Ingesting: ${t.title} (from ${t.provider})`);
            await this.ingestText(
              authorEntity,
              undefined,
              t.title,
              t.textSlug,
              t.fullPath,
            );
          }
        } else {
          // Inside a book/directory
          const parentTextSlug = `${authorSlug}/${bookSlug}`;

          await this.textRepository.upsert(
            {
              author: authorEntity,
              slug: parentTextSlug,
              title: _.startCase(bookSlug),
              type: "book",
            },
            { conflictPaths: ["slug"], skipUpdateIfNoValuesChanged: true },
          );

          const parentText = await this.textRepository.findOneOrFail({
            where: { slug: parentTextSlug },
          });

          for (const t of bookTexts) {
            this.logger.log(
              `  -> Ingesting: ${parentText.title} / ${t.title} (from ${t.provider})`,
            );
            await this.ingestText(
              authorEntity,
              parentText,
              t.title,
              t.textSlug,
              t.fullPath,
            );
          }
        }
      }
    }

    this.logger.log("📚 Literature ingestion complete");
  }
}
