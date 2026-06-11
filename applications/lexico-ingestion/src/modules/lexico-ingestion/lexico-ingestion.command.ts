import { Injectable } from "@nestjs/common";
import { Command, CommandRunner, Option } from "nest-commander";
import prompts from "prompts";

import { CorpusScriptorumEcclesiasticorumLatinorumCommand } from "../corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command";
import { DictionaryCommand } from "../dictionary/dictionary.command";
import { EpigraphikDatenbankClaussSlabyCommand } from "../epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command";
import { LatinLibraryCommand } from "../latin-library/latin-library.command";
import { LibraryCommand } from "../library/library.command";
import { LiteratureCommand } from "../literature/literature.command";
import { LoggerService } from "../logger/logger.service";
import { PerseusCommand } from "../perseus/perseus.command";
import { WiktionaryCommand } from "../wiktionary/wiktionary.command";

/**
 *
 */
export interface LexicoIngestionCommandOptions {
  dictionary?: boolean;
  library?: boolean;
  librarySources?: boolean;
  literature?: boolean;
  wikipedia?: boolean;
}

/**
 * CLI entry point for lexico-ingestion.
 * Root CLI entry point for lexicoIngestion.
 * Runs all ingestion steps in order when invoked without a sub-command.
 * Sub-commands: wiktionary, dictionary, words, manual, clear
 */
@Command({
  description: "Run the lexico-ingestion command-line application",
  name: "lexico-ingestion",
})
@Injectable()
export class LexicoIngestionCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(
    private readonly logger: LoggerService,
    private readonly corpusScriptorumEcclesiasticorumLatinorumCommand: CorpusScriptorumEcclesiasticorumLatinorumCommand,
    private readonly dictionaryCommand: DictionaryCommand,
    private readonly epigraphikDatenbankClaussSlabyCommand: EpigraphikDatenbankClaussSlabyCommand,
    private readonly latinLibraryCommand: LatinLibraryCommand,
    private readonly libraryCommand: LibraryCommand,
    private readonly literatureCommand: LiteratureCommand,
    private readonly perseusCommand: PerseusCommand,
    private readonly wiktionaryCommand: WiktionaryCommand,
  ) {
    super();
    this.logger.setContext(LexicoIngestionCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   *
   */
  @Option({
    description: "Activate/deactivate the dictionary stage",
    flags: "--dictionary [boolean]",
  })
  parseDictionary(value: string | undefined): boolean {
    if (value === undefined) return true;
    return value !== "false" && value !== "0";
  }

  /**
   *
   */
  @Option({
    description: "Activate/deactivate the library stage",
    flags: "--library [boolean]",
  })
  parseLibrary(value: string | undefined): boolean {
    if (value === undefined) return true;
    return value !== "false" && value !== "0";
  }

  /**
   *
   */
  @Option({
    description: "Activate/deactivate the library sources stage",
    flags: "--library-sources [boolean]",
  })
  parseLibrarySources(value: string | undefined): boolean {
    if (value === undefined) return true;
    return value !== "false" && value !== "0";
  }

  /**
   *
   */
  @Option({
    description: "Activate/deactivate the literature stage",
    flags: "--literature [boolean]",
  })
  parseLiterature(value: string | undefined): boolean {
    if (value === undefined) return true;
    return value !== "false" && value !== "0";
  }

  /**
   *
   */
  @Option({
    description: "Activate/deactivate the Wikipedia (Wiktionary) stage",
    flags: "--wikipedia [boolean]",
  })
  parseWikipedia(value: string | undefined): boolean {
    if (value === undefined) return true;
    return value !== "false" && value !== "0";
  }

  /**
   * Runs the full ingestion pipeline in order:
   * wikipedia → dictionary → library sources → library → literature
   */
  async run(
    _passedParameters: string[],
    options: LexicoIngestionCommandOptions,
  ): Promise<void> {
    if (options.wikipedia === undefined) {
      const response = await prompts({
        initial: true,
        message: "Run the Wikipedia (Wiktionary) stage?",
        name: "wikipedia",
        type: "confirm",
      });
      options.wikipedia = response.wikipedia as boolean;
    }

    if (options.dictionary === undefined) {
      const response = await prompts({
        initial: true,
        message: "Run the dictionary stage?",
        name: "dictionary",
        type: "confirm",
      });
      options.dictionary = response.dictionary as boolean;
    }

    if (options.librarySources === undefined) {
      const response = await prompts({
        initial: true,
        message: "Run the library sources stage?",
        name: "librarySources",
        type: "confirm",
      });
      options.librarySources = response.librarySources as boolean;
    }

    if (options.library === undefined) {
      const response = await prompts({
        initial: true,
        message: "Run the library stage?",
        name: "library",
        type: "confirm",
      });
      options.library = response.library as boolean;
    }

    if (options.literature === undefined) {
      const response = await prompts({
        initial: true,
        message: "Run the literature stage?",
        name: "literature",
        type: "confirm",
      });
      options.literature = response.literature as boolean;
    }

    this.logger.log("🚀 Starting full ingestion pipeline");
    this.logger.log(`⚙️ Options: ${JSON.stringify(options)}`);

    let step = 1;

    if (options.wikipedia) {
      this.logger.log(
        `🗂️ Step ${step++}: Ingesting Wikipedia (Wiktionary) pages 🌐`,
      );
      await this.wiktionaryCommand.run();
    }

    if (options.dictionary) {
      this.logger.log(`🗂️ Step ${step++}: Processing dictionary lexemes 📖`);
      await this.dictionaryCommand.ingestAll();
    }

    if (options.librarySources) {
      this.logger.log(`🗂️ Step ${step++}: Downloading library sources 📥`);
      await this.perseusCommand.run();
      await this.latinLibraryCommand.run();
      await this.corpusScriptorumEcclesiasticorumLatinorumCommand.run();
      await this.epigraphikDatenbankClaussSlabyCommand.run();
    }

    if (options.library) {
      this.logger.log(`🗂️ Step ${step++}: Parsing library into markdown 📝`);
      await this.libraryCommand.run([], {});
    }

    if (options.literature) {
      this.logger.log(`🗂️ Step ${step}: Ingesting literature texts 📜`);
      await this.literatureCommand.run([], {});
    }

    this.logger.log("✅ Full ingestion pipeline complete 🎉");
  }
}
