import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { WiktionaryService } from "./wiktionary.service";

/**
 * Ingest all Latin Wiktionary pages.
 */
@Command({
  description: "Ingest Latin pages from Wiktionary into a local folder",
  name: "wiktionary",
})
@Injectable()
export class WiktionaryCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly wiktionaryService: WiktionaryService) {
    super();
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /** Runs the Wiktionary ingestion pipeline. */
  async run(): Promise<void> {
    await this.wiktionaryService.ingestWiktionary();
  }
}
