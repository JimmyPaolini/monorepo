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
    const startTime = performance.now();

    // Create base data directory
    const dataPath = path.resolve("data", "library");
    await fs.mkdir(dataPath, { recursive: true });

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
      current++;
      const progressString = ` (${((current / total) * 100).toFixed(2)}%, ${current}/${total})`;
      this.logger.log(
        `🏛️ Running ingestion for provider: ${provider.name}${progressString}`,
      );
      try {
        const ingestOptions: { author?: string; text?: string } = {};
        if (author) ingestOptions.author = author;
        if (text) ingestOptions.text = text;

        await provider.ingest(ingestOptions);
      } catch (error) {
        this.logger.error(
          `❌ Error in provider ${provider.name}`,
          error instanceof Error ? error.stack : undefined,
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

/**
 *
 */
export function cleanBoilerplate(text: string): string {
  let cleaned = text;

  // Remove various forms of The Latin Library / The Classics Page boilerplate
  cleaned = cleaned.replaceAll(/The Latin Library/gi, "");
  cleaned = cleaned.replaceAll(/The Classics Page/gi, "");
  cleaned = cleaned.replaceAll(/Neo-Latin/gi, "");

  return cleaned.trim();
}

/**
 *
 */
export function formatLineNumber(line: string): string {
  let formattedLine = line.trim();

  // If the line has an end-of-line poetry number padded with whitespace
  // Move it to the beginning and bold it.
  const endLineMatch = /^(.*?)\s{3,}(\d+)\s*$/.exec(formattedLine);
  if (endLineMatch) {
    formattedLine = `**${endLineMatch[2]}** ${endLineMatch[1]}`.trim();
  } else {
    // Check if the line already starts with bold text, if so skip prefixes formatting
    if (!formattedLine.startsWith("**")) {
      const bracketMatch = /^\[([a-zA-Z0-9]+)\]\s*(.*)$/.exec(formattedLine);
      const decimalMatch = /^((?:\d+\.)+[a-zA-Z0-9]*\.?)\s+(.*)$/.exec(
        formattedLine,
      );
      const simpleMatch = /^(\d+[a-zA-Z]*|[MDCLXVI]+)\.?\s+(.*)$/.exec(
        formattedLine,
      );

      if (bracketMatch) {
        formattedLine = `**[${bracketMatch[1]}]** ${bracketMatch[2]}`;
      } else if (decimalMatch) {
        formattedLine = `**${decimalMatch[1]}** ${decimalMatch[2]}`;
      } else if (simpleMatch) {
        formattedLine = `**${simpleMatch[1]}** ${simpleMatch[2]}`;
      }
    }
  }

  // Double check if there's any case where end of line number was already bolded but at the end
  const boldEndLineMatch = /^(.*?)\s{2,}\*\*(\d+)\*\*\s*$/.exec(formattedLine);
  if (boldEndLineMatch) {
    formattedLine = `**${boldEndLineMatch[2]}** ${boldEndLineMatch[1]}`.trim();
  }

  return formattedLine;
}

/**
 *
 */
export function hasValidTextContent(paragraphs: string[]): boolean {
  if (paragraphs.length === 0) return false;

  const allText = paragraphs.join(" ");
  // Check if there is at least one alphabetical character in the combined text
  return /[a-zA-Z]/.test(allText);
}

/**
 *
 */
export function isEnglishBoilerplate(line: string): boolean {
  const stopWords = new Set([
    "and",
    "by",
    "from",
    "of",
    "that",
    "the",
    "this",
    "to",
    "which",
    "with",
  ]);
  const words = line.toLowerCase().match(/\b[a-z]+\b/g) || [];
  if (words.length === 0) return false;

  let stopWordCount = 0;
  for (const word of words) {
    if (stopWords.has(word)) stopWordCount++;
  }

  // If a significant portion of words are english stop words, it's english text.
  return (
    stopWordCount >= 3 ||
    (words.length > 5 && stopWordCount / words.length > 0.2)
  );
}
