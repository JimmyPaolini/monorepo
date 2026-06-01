import { Command, CommandRunner } from "nest-commander";

import { LoggerService } from "../logger/logger.service.js";

import { WordsService } from "./words.service.js";

/**
 * CLI command: `lexico-ingestion words`
 * Ingests Word search records from all dictionary lexemes.
 */
@Command({
  name: "words",
  description: "Ingest word search records from dictionary lexemes",
})
export class WordsCommand extends CommandRunner {
  constructor(
    private readonly logger: LoggerService,
    private readonly wordsService: WordsService,
  ) {
    super();
    this.logger.setContext(WordsCommand.name);
  }

  /** Runs the words ingestion pipeline. */
  async run(): Promise<void> {
    this.logger.log("Running words command");
    await this.wordsService.ingestWords();
  }
}
