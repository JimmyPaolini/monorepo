import { Command, CommandRunner } from "nest-commander";

import { LexicoIngestionLogger } from "../logger/logger.service.js";

import { WordsService } from "./words.service.js";

/**
 * CLI command: `lexico-ingestion words`
 * Ingests Word search records from all dictionary entries.
 */
@Command({
  name: "words",
  description: "Ingest word search records from dictionary entries",
})
export class WordsCommand extends CommandRunner {
  constructor(
    private readonly logger: LexicoIngestionLogger,
    private readonly wordsService: WordsService,
  ) {
    super();
    this.logger.setContext(WordsCommand.name);
  }

  /**
   *
   */
  async run(): Promise<void> {
    this.logger.log("Running words command");
    await this.wordsService.ingestWords();
  }
}
