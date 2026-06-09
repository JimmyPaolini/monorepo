import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { ClearCommand } from "../clear/clear.command";
import { DictionaryCommand } from "../dictionary/dictionary.command";
import { LoggerService } from "../logger/logger.service";
import { ManualService } from "../manual/manual.service";
import { WiktionaryCommand } from "../wiktionary/wiktionary.command";

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
    private readonly clearCommand: ClearCommand,
    private readonly wiktionaryCommand: WiktionaryCommand,
    private readonly dictionaryCommand: DictionaryCommand,
    private readonly manualService: ManualService,
  ) {
    super();
    this.logger.setContext(LexicoIngestionCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   * Runs the full ingestion pipeline in order:
   * clear → wiktionary → dictionary → manual
   */
  async run(): Promise<void> {
    this.logger.log("🚀 Starting full ingestion pipeline");

    this.logger.log("🗂️ Step 1/4: Clearing dictionary data");
    await this.clearCommand.clearDictionary();

    this.logger.log("🗂️ Step 2/4: Ingesting Wiktionary pages");
    await this.wiktionaryCommand.ingestWiktionary();

    this.logger.log("🗂️ Step 3/4: Processing dictionary lexemes");
    await this.dictionaryCommand.ingestAll();

    this.logger.log("🗂️ Step 4/4: Ingesting manual lexemes");
    await this.manualService.ingestManual();

    this.logger.log("✅ Full ingestion pipeline complete");
  }
}
