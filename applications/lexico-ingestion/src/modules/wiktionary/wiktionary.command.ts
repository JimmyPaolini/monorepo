import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { WiktionaryService } from "./wiktionary.service.js";

/**
 * Ingest all Latin Wiktionary entries.
 */
@Injectable()
@Command({
  name: "wiktionary",
  description: "Ingest Latin entries from Wiktionary into the database",
})
export class WiktionaryCommand extends CommandRunner {
  constructor(private readonly wiktionaryService: WiktionaryService) {
    super();
  }

  async run(): Promise<void> {
    await this.wiktionaryService.ingestWiktionary();
  }
}
