import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Command, CommandRunner, Option } from "nest-commander";
import prompts from "prompts";
import { Repository } from "typeorm";

import { Author, Line, Text, Token, Word } from "@monorepo/lexico-entities";

import { LoggerService } from "../logger/logger.service";
import { NumeralsService } from "../numerals/numerals.service";

import { LiteratureIngestionHelper } from "./literature.ingestion.helper.js";

import type {
  LibraryEntry,
  LiteratureCommandOptions,
} from "./literature.types.js";

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

    this.helper = new LiteratureIngestionHelper({
      authorRepository: this.authorRepository,
      lineRepository: this.lineRepository,
      logFilePath: this.logFilePath,
      logger: this.logger,
      numeralsService: this.numeralsService,
      textRepository: this.textRepository,
      tokenRepository: this.tokenRepository,
      wordRepository: this.wordRepository,
    });
  }
  private readonly helper: LiteratureIngestionHelper;

  private readonly logFilePath: string;

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  private deduplicateByProvider(texts: LibraryEntry[]): LibraryEntry[] {
    const priorityProviders = [
      "perseus",
      "corpus-scriptorum-ecclesiasticorum-latinorum",
      "thelatinlibrary",
      "epigraphik-datenbank-clauss-slaby",
    ];
    const textMap = new Map<string, LibraryEntry>();
    for (const text of texts) {
      const slug = [text.authorSlug, ...text.pathParts, text.textSlug].join(
        "/",
      );
      const existing = textMap.get(slug);
      if (existing) {
        const existingPriority = priorityProviders.indexOf(existing.provider);
        const newPriority = priorityProviders.indexOf(text.provider);
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

  private async getAuthorChoices(
    provider?: string,
  ): Promise<{ title: string; value: string }[]> {
    const library = await this.helper.scanLibrary();
    const filtered = provider
      ? library.filter((entry) => entry.provider === provider)
      : library;
    const authors = [
      ...new Set(filtered.map((entry) => entry.authorSlug)),
    ].toSorted();
    return authors.map((author) => ({ title: author, value: author }));
  }

  private async getProviderChoices(): Promise<
    { title: string; value: string }[]
  > {
    const library = await this.helper.scanLibrary();
    const providers = [
      ...new Set(library.map((entry) => entry.provider)),
    ].toSorted();
    return providers.map((provider) => ({ title: provider, value: provider }));
  }

  private async getTextChoices(
    provider?: string,
    authorSlug?: string,
  ): Promise<{ title: string; value: string }[]> {
    const library = await this.helper.scanLibrary();
    let filtered = library;
    if (provider)
      filtered = filtered.filter((entry) => entry.provider === provider);
    if (authorSlug)
      filtered = filtered.filter((entry) => entry.authorSlug === authorSlug);

    const textSlugs = [
      ...new Set(
        filtered.map((entry) =>
          [entry.authorSlug, ...entry.pathParts, entry.textSlug].join("/"),
        ),
      ),
    ].toSorted();
    return textSlugs.map((textSlug) => ({ title: textSlug, value: textSlug }));
  }

  private selectTextsToIngest(args: {
    author: string | undefined;
    library: LibraryEntry[];
    provider: string | undefined;
    text: string | undefined;
  }): LibraryEntry[] {
    const { author, library, provider, text } = args;
    let filtered = library;
    if (provider)
      filtered = filtered.filter((entry) => entry.provider === provider);
    if (author)
      filtered = filtered.filter((entry) => entry.authorSlug === author);
    if (text) {
      filtered = filtered.filter(
        (entry) =>
          [entry.authorSlug, ...entry.pathParts, entry.textSlug].join("/") ===
          text,
      );
    }
    return this.deduplicateByProvider(filtered);
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
      }
      throw new Error(`Author "${author}" not found in the dataset.`);
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
      }
      throw new Error(`Provider "${provider}" not found in the dataset.`);
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
      }
      throw new Error(`Text "${text}" not found in the dataset.`);
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
    const library = await this.helper.scanLibrary();
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
    const textsToIngest = this.selectTextsToIngest({
      author,
      library,
      provider,
      text,
    });
    this.logger.log(`📚 Selected ${textsToIngest.length} texts for ingestion.`);
    await this.helper.ingestAllAuthors(textsToIngest);
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    this.logger.log(`📚 Literature ingestion complete in ${duration} seconds`);
  }
}
