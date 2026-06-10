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
import { MusisqueDeoqueLibraryProvider } from "./providers/musisque-deoque-library.provider";
import { OpenGreekAndLatinProvider } from "./providers/open-greek-and-latin.provider";
import { PerseusLibraryProvider } from "./providers/perseus-library.provider";

import type { LibraryAuthor, LibraryCommandOptions } from "./library.types";

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
    musisqueDeoqueProvider: MusisqueDeoqueLibraryProvider,
    openGreekAndLatinProvider: OpenGreekAndLatinProvider,
    perseusProvider: PerseusLibraryProvider,
  ) {
    super();
    this.logger.setContext(LibraryCommand.name);
    this.providers = [
      corpusScriptorumEcclesiasticorumLatinorumProvider,
      epigraphikDatenbankClaussSlabyProvider,
      latinLibraryProvider,
      musisqueDeoqueProvider,
      openGreekAndLatinProvider,
      perseusProvider,
    ];
  }

  private readonly providers: {
    ingest: (options?: {
      author?: string;
      text?: string;
    }) => Promise<LibraryAuthor[]>;
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
          t.bookSlug
            ? `${t.authorSlug}/${t.bookSlug}/${t.textSlug}`
            : `${t.authorSlug}/${t.textSlug}`,
        ),
      ),
    ].toSorted();
    return textSlugs.map((t) => ({ title: t, value: t }));
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

    const choices = await this.getAuthorChoices();
    if (typeof author === "string") {
      // Allow custom input in case it's not downloaded yet
      return author;
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

    const choices = this.getProviderChoices();
    if (typeof provider === "string") {
      if (choices.some((choice) => choice.value === provider)) {
        return provider;
      } else {
        throw new Error(`Provider "${provider}" not found.`);
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
      // Allow custom input in case it's not downloaded yet
      return text;
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

  /** Orchestrate ingestion from library sources */
  async run(_args: string[], options: LibraryCommandOptions): Promise<void> {
    this.logger.log("Starting library ingestion...");

    // Create base data directory
    const dataPath = path.resolve("data", "library");
    await fs.mkdir(dataPath, { recursive: true });

    const providerName = await this.parseProvider(
      options.provider ?? undefined,
    );
    const author = await this.parseAuthor(options.author ?? undefined);
    const text = await this.parseText(options.text ?? undefined);

    let providersToRun = this.providers;
    if (providerName) {
      providersToRun = providersToRun.filter((p) => p.name === providerName);
    }

    for (const provider of providersToRun) {
      this.logger.log(`Running ingestion for provider: ${provider.name}`);
      try {
        const ingestOptions: { author?: string; text?: string } = {};
        if (author) ingestOptions.author = author;
        if (text) ingestOptions.text = text;

        const authors = await provider.ingest(ingestOptions);
        await fs.writeFile(
          path.join(dataPath, `${provider.name}.json`),
          JSON.stringify(authors, null, 2),
        );
      } catch (error) {
        this.logger.error(
          `Error in provider ${provider.name}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    this.logger.log("Successfully finished library ingestion.");
  }
}
