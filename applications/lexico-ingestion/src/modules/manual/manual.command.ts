import { Command, CommandRunner } from "nest-commander";

import { LoggerService } from "../logger/logger.service.js";

import { ManualService } from "./manual.service.js";

/**
 * CLI command: `lexico-ingestion manual`
 * Ingests manually-curated lexemes (hic, ille, omnis, Roman numerals).
 */
@Command({
  name: "manual",
  description:
    "Ingest manually-curated dictionary lexemes (hic, ille, omnis, Roman numerals)",
})
export class ManualCommand extends CommandRunner {
  constructor(
    private readonly logger: LoggerService,
    private readonly manualService: ManualService,
  ) {
    super();
    this.logger.setContext(ManualCommand.name);
  }

  /** Runs the manual-entry ingestion pipeline. */
  async run(): Promise<void> {
    this.logger.log("Running manual command");
    await this.manualService.ingestManual();
  }
}
