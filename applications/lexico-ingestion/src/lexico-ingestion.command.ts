import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { LexicoIngestionLogger } from "./modules/logger/logger.service.js";

/**
 * Root CLI entry point for lexico-ingestion.
 * Sub-commands: wiktionary, dictionary, words, translation-references, manual, clear
 */
@Injectable()
@Command({
  name: "lexico-ingestion",
  description:
    "Ingest Wiktionary Latin entries and dictionary data into PostgreSQL",
})
export class LexicoIngestionCommand extends CommandRunner {
  constructor(private readonly logger: LexicoIngestionLogger) {
    super();
    this.logger.setContext(LexicoIngestionCommand.name);
  }

  /**
   *
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async run(): Promise<void> {
    this.logger.log(
      "Use a sub-command: wiktionary | dictionary | words | translation-references | manual | clear",
    );
  }
}
