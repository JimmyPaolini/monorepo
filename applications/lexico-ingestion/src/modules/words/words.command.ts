import { Logger } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

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
  private readonly logger = new Logger(WordsCommand.name);

  constructor(private readonly wordsService: WordsService) {
    super();
  }

  /**
   *
   */
  async run(): Promise<void> {
    this.logger.log("Running words command");
    await this.wordsService.ingestWords();
  }
}
