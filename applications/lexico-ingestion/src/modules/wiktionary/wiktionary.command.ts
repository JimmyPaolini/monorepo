import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { WiktionaryService } from "./wiktionary.service";

/**
 * Ingest all Latin Wiktionary pages.
 */
@Injectable()
@Command({
  name: "wiktionary",
  description: "Ingest Latin pages from Wiktionary into a local folder",
})
export class WiktionaryCommand extends CommandRunner {
  constructor(private readonly wiktionaryService: WiktionaryService) {
    super();
  }

  /** Runs the Wiktionary ingestion pipeline. */
  async run(): Promise<void> {
    await this.wiktionaryService.ingestWiktionary();
  }
}
