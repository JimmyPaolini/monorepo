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
  description: "Run the library ingestion command",
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
  }

  private readonly providers: {
    ingest: (options?: { author?: string; text?: string }) => Promise<Author[]>;
    name: string;
  }[];

  // 🔒 Private Methods

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
    const dataDir = path.resolve("data", "library");
    const texts: {
      authorSlug: string;
      fullPath: string;
      pathParts: string[];
      provider: string;
      textSlug: string;
      title: string;
    }[] = [];

    async function walk(
      dir: string,
      currentPathParts: string[],
      providerName: string,
      authorSlug: string,
    ): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          await walk(
            path.join(dir, entry.name),
            [...currentPathParts, entry.name],
            providerName,
            authorSlug,
          );
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          texts.push({
            authorSlug,
            fullPath: path.join(dir, entry.name),
            pathParts: currentPathParts,
            provider: providerName,
            textSlug: path.basename(entry.name, ".md"),
            title: _.startCase(path.basename(entry.name, ".md")),
          });
        }
      }
    }

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

          await walk(
            path.join(dataDir, providerName, authorSlug),
            [],
            providerName,
            authorSlug,
          );
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
  async run(_args: string[], options: LibraryCommandOptions): Promise<void> {
    this.logger.log("📚 Starting library ingestion...");
    this.logger.log(`⚙️ Options: ${JSON.stringify(options)}`);
    const startTime = performance.now();

    // Create base data directory
    const dataPath = path.resolve("data", "library");
    await fs.mkdir(dataPath, { recursive: true });

    const outputDir = path.join(process.cwd(), "output");
    await fs.mkdir(outputDir, { recursive: true });
    const logFilePath = path.join(
      outputDir,
      `library-${new Date().toISOString().replaceAll(/[:.]/g, "-")}.log`,
    );

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

    let providersToRun = this.providers;
    if (providerName) {
      providersToRun = providersToRun.filter((p) => p.name === providerName);
    }

    let current = 0;
    const total = providersToRun.length;

    for (const provider of providersToRun) {
      this.logger.log(`🏛️ Starting ingestion for provider: ${provider.name}`);
      try {
        const ingestOptions: { author?: string; text?: string } = {};
        if (author) ingestOptions.author = author;
        if (text) ingestOptions.text = text;

        await provider.ingest(ingestOptions);

        current++;
        const progressString = ` (${((current / total) * 100).toFixed(2)}%, ${current}/${total})`;
        this.logger.log(
          `🏛️ Completed ingestion for provider: ${provider.name}${progressString}`,
        );
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.stack || error.message : String(error);
        this.logger.error(
          `❌ Error in provider ${provider.name}`,
          error instanceof Error ? error.stack : undefined,
        );
        await fs.appendFile(
          logFilePath,
          `[${new Date().toISOString()}] ${provider.name}: ${errorMessage}\n`,
        );
      }
    }

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    this.logger.log(
      `📚 Successfully finished library ingestion in ${duration} seconds.`,
    );
  }
}
