import { Logger } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { ManualService } from "./manual.service.js";

/**
 * CLI command: `lexico-ingestion manual`
 * Ingests manually-curated entries (hic, ille, omnis, Roman numerals).
 */
@Command({
  name: "manual",
  description:
    "Ingest manually-curated dictionary entries (hic, ille, omnis, Roman numerals)",
})
export class ManualCommand extends CommandRunner {
  private readonly logger = new Logger(ManualCommand.name);

  constructor(private readonly manualService: ManualService) {
    super();
  }

  /**
   *
   */
  async run(): Promise<void> {
    this.logger.log("Running manual command");
    await this.manualService.ingestManual();
  }
}
