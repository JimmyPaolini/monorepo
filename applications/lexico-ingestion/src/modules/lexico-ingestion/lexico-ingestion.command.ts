import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { ClearService } from "../clear/clear.service.js";
import { DictionaryService } from "../dictionary/dictionary.service.js";
import { LoggerService } from "../logger/logger.service.js";
import { ManualService } from "../manual/manual.service.js";
import { TranslationReferencesService } from "../translationReferences/translationReferences.service.js";
import { WiktionaryService } from "../wiktionary/wiktionary.service.js";
import { WordsService } from "../words/words.service.js";

/**
 * Root CLI entry point for lexico-ingestion.
 * Runs all ingestion steps in order when invoked without a sub-command.
 * Sub-commands: wiktionary, dictionary, words, translation-references, manual, clear
 */
@Injectable()
@Command({
  name: "lexico-ingestion",
  description:
    "Ingest Wiktionary Latin entries and dictionary data into PostgreSQL",
})
export class LexicoIngestionCommand extends CommandRunner {
  constructor(
    private readonly logger: LoggerService,
    private readonly clearService: ClearService,
    private readonly wiktionaryService: WiktionaryService,
    private readonly dictionaryService: DictionaryService,
    private readonly manualService: ManualService,
    private readonly translationReferencesService: TranslationReferencesService,
    private readonly wordsService: WordsService,
  ) {
    super();
    this.logger.setContext(LexicoIngestionCommand.name);
  }

  /**
   * Runs the full ingestion pipeline in order:
   * clear → wiktionary → dictionary → manual → translation-references → words
   */
  async run(): Promise<void> {
    this.logger.log("Starting full ingestion pipeline");

    this.logger.log("Step 1/6: Clearing dictionary data");
    await this.clearService.clearDictionary();

    this.logger.log("Step 2/6: Ingesting Wiktionary entries");
    await this.wiktionaryService.ingestWiktionary();

    this.logger.log("Step 3/6: Processing dictionary entries");
    await this.dictionaryService.ingestAll();

    this.logger.log("Step 4/6: Ingesting manual entries");
    await this.manualService.ingestManual();

    this.logger.log("Step 5/6: Resolving translation references");
    await this.translationReferencesService.ingestTranslationReferences();

    this.logger.log("Step 6/6: Building word search index");
    await this.wordsService.ingestWords();

    this.logger.log("Full ingestion pipeline complete");
  }
}
