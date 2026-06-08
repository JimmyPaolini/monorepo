import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { ClearService } from "../clear/clear.service";
import { DictionaryService } from "../dictionary/dictionary.service";
import { LoggerService } from "../logger/logger.service";
import { ManualService } from "../manual/manual.service";
import { WiktionaryService } from "../wiktionary/wiktionary.service";

/**
 * Root CLI entry point for lexicoIngestion.
 * Runs all ingestion steps in order when invoked without a sub-command.
 * Sub-commands: wiktionary, dictionary, words, manual, clear
 */
@Command({
  description: "Ingest Wiktionary Latin dictionary data into PostgreSQL",
  name: "lexico-ingestion",
})
@Injectable()
export class LexicoIngestionCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(
    private readonly logger: LoggerService,
    private readonly clearService: ClearService,
    private readonly wiktionaryService: WiktionaryService,
    private readonly dictionaryService: DictionaryService,
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
    this.logger.log("Starting full ingestion pipeline");

    this.logger.log("Step 1/4: Clearing dictionary data");
    await this.clearService.clearDictionary();

    this.logger.log("Step 2/4: Ingesting Wiktionary pages");
    await this.wiktionaryService.ingestWiktionary();

    this.logger.log("Step 3/4: Processing dictionary lexemes");
    await this.dictionaryService.ingestAll();

    this.logger.log("Step 4/4: Ingesting manual lexemes");
    await this.manualService.ingestManual();

    this.logger.log("Full ingestion pipeline complete");
  }
}
