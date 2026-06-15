import { Dirent, existsSync, mkdirSync } from "node:fs";
import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import _ from "lodash";
import { Command, CommandRunner, Option } from "nest-commander";
import prompts from "prompts";

import { LoggerService } from "../logger/logger.service";

import { CorpusScriptorumEcclesiasticorumLatinorumLibraryProvider } from "./providers/corpus-scriptorum-ecclesiasticorum-latinorum-library.provider";
import { EpigraphikDatenbankClaussSlabyLibraryProvider } from "./providers/epigraphik-datenbank-clauss-slaby-library.provider";
import { LatinLibraryProvider } from "./providers/latin-library.provider";
import { PerseusLibraryProvider } from "./providers/perseus-library.provider";

import type { LibraryCommandOptions } from "./library.types";
import type { Author } from "@monorepo/lexico-entities";

/**
 * Scrape literature data from various sources to markdown files.
 */
@Command({
  description: "Run the library command",
  name: "library",
})
@Injectable()
export class LibraryCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(
    private readonly logger: LoggerService,
    corpusScriptorumEcclesiasticorumLatinorumProvider: CorpusScriptorumEcclesiasticorumLatinorumLibraryProvider,
    epigraphikDatenbankClaussSlabyProvider: EpigraphikDatenbankClaussSlabyLibraryProvider,
    latinLibraryProvider: LatinLibraryProvider,
    perseusProvider: PerseusLibraryProvider,
  ) {
    super();
    this.logger.setContext(LibraryCommand.name);
    this.providers = [
      corpusScriptorumEcclesiasticorumLatinorumProvider,
      epigraphikDatenbankClaussSlabyProvider,
      latinLibraryProvider,
      perseusProvider,
    ];

    const outputDirectory = path.join(process.cwd(), "output");
    if (!existsSync(outputDirectory))
      mkdirSync(outputDirectory, { recursive: true });
    this.logFilePath = path.join(
      outputDirectory,
      `library-${new Date().toISOString().replaceAll(/[:.]/g, "-")}.log`,
    );
  }

  // 🔐 Private Fields

  private readonly logFilePath: string;
  private readonly providers: {
    ingest: (options?: { author?: string; text?: string }) => Promise<Author[]>;
    name: string;
  }[];

  // 🔑 Public Fields

  // 🔏 Private Methods

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

  private getProviderChoices(): { title: string; value: string }[] {
    const providers = this.providers.map((p) => p.name).toSorted();
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

  private async parseIngestOptions(options: LibraryCommandOptions): Promise<{
    author: string | undefined;
    providerName: string | undefined;
    text: string | undefined;
  }> {
    const providerName = await this.parseProvider(
      options.provider ?? undefined,
    );
    const author = await this.parseAuthor(
      options.author ?? undefined,
      providerName,
    );
    const text = await this.parseText(
      options.text ?? undefined,
      providerName,
      author,
    );
    return { author, providerName, text };
  }

  private async processProvider(
    provider: {
      ingest: (options?: {
        author?: string;
        text?: string;
      }) => Promise<Author[]>;
      name: string;
    },
    current: number,
    total: number,
    ingestOptions: { author?: string; text?: string },
  ): Promise<void> {
    const providerName = provider.name;
    this.logger.log(`🏛️ Starting ingestion for provider: ${providerName}`);
    try {
      await provider.ingest(ingestOptions);

      const progressString = ` (${((current / total) * 100).toFixed(2)}%, ${current}/${total})`;
      this.logger.log(
        `🏛️ Completed ingestion for provider: ${providerName}${progressString}`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.stack || error.message : String(error);
      this.logger.error(
        `❌ Error in provider ${providerName}`,
        error instanceof Error ? error.stack : undefined,
      );
      await fs.appendFile(
        this.logFilePath,
        `[${new Date().toISOString()}] ${provider.name}: ${errorMessage}\n`,
      );
    }
  }

  private pushTextEntry(
    directory: string,
    entry: Dirent,
    currentPathParts: string[],
    providerName: string,
    authorSlug: string,
    texts: {
      authorSlug: string;
      fullPath: string;
      pathParts: string[];
      provider: string;
      textSlug: string;
      title: string;
    }[],
  ): void {
    texts.push({
      authorSlug,
      fullPath: path.join(directory, entry.name),
      pathParts: currentPathParts,
      provider: providerName,
      textSlug: path.basename(entry.name, ".md"),
      title: _.startCase(path.basename(entry.name, ".md")),
    });
  }

  private async scanLibrary(): Promise<
    {
      authorSlug: string;
      fullPath: string;
      pathParts: string[];
      provider: string;
      textSlug: string;
      title: string;
    }[]
  > {
    const dataDirectory = path.resolve("data", "library");
    const texts: {
      authorSlug: string;
      fullPath: string;
      pathParts: string[];
      provider: string;
      textSlug: string;
      title: string;
    }[] = [];

    try {
      const providers = await fs.readdir(dataDirectory, {
        withFileTypes: true,
      });
      for (const provider of providers) {
        if (!provider.isDirectory()) continue;
        await this.scanLibraryProvider(dataDirectory, provider.name, texts);
      }
    } catch {
      // Ignore if data directory doesn't exist yet
    }
    return texts;
  }

  private async scanLibraryAuthor(
    dataDirectory: string,
    providerName: string,
    authorSlug: string,
    texts: {
      authorSlug: string;
      fullPath: string;
      pathParts: string[];
      provider: string;
      textSlug: string;
      title: string;
    }[],
  ): Promise<void> {
    await this.walkLibraryDirectory(
      path.join(dataDirectory, providerName, authorSlug),
      [],
      providerName,
      authorSlug,
      texts,
    );
  }

  // 🌎 Public Methods

  private async scanLibraryProvider(
    dataDirectory: string,
    providerName: string,
    texts: {
      authorSlug: string;
      fullPath: string;
      pathParts: string[];
      provider: string;
      textSlug: string;
      title: string;
    }[],
  ): Promise<void> {
    const authors = await fs.readdir(path.join(dataDirectory, providerName), {
      withFileTypes: true,
    });
    for (const author of authors) {
      if (!author.isDirectory()) continue;
      await this.scanLibraryAuthor(
        dataDirectory,
        providerName,
        author.name,
        texts,
      );
    }
  }

  private async walkLibraryDirectory(
    directory: string,
    currentPathParts: string[],
    providerName: string,
    authorSlug: string,
    texts: {
      authorSlug: string;
      fullPath: string;
      pathParts: string[];
      provider: string;
      textSlug: string;
      title: string;
    }[],
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
        this.pushTextEntry(
          directory,
          entry,
          currentPathParts,
          providerName,
          authorSlug,
          texts,
        );
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
      // Allow custom input in case it's not downloaded yet
      return author;
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
    const choices = this.getProviderChoices();
    if (typeof provider === "string" && provider.trim() !== "") {
      if (choices.some((choice) => choice.value === provider)) {
        return provider;
      } else {
        throw new Error(`Provider "${provider}" not found.`);
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
      // Allow custom input in case it's not downloaded yet
      return text;
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

  /** Orchestrate ingestion from library sources */
  async run(
    _arguments: string[],
    options: LibraryCommandOptions,
  ): Promise<void> {
    this.logger.log("📚 Starting library ingestion...");
    this.logger.log(`⚙️ Options: ${JSON.stringify(options)}`);
    const startTime = performance.now();

    const dataPath = path.resolve("data", "library");
    await fs.mkdir(dataPath, { recursive: true });

    const { author, providerName, text } =
      await this.parseIngestOptions(options);

    let providersToRun = this.providers;
    if (providerName) {
      providersToRun = providersToRun.filter((p) => p.name === providerName);
    }

    const total = providersToRun.length;
    const ingestOptions: { author?: string; text?: string } = {};
    if (author) ingestOptions.author = author;
    if (text) ingestOptions.text = text;

    for (let current = 0; current < total; current++) {
      const provider = providersToRun[current];
      if (provider) {
        await this.processProvider(provider, current + 1, total, ingestOptions);
      }
    }

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    this.logger.log(
      `📚 Successfully finished library ingestion in ${duration} seconds.`,
    );
  }
}
