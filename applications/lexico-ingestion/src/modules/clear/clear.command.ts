import { Logger } from "@nestjs/common";
import { Command, CommandRunner, Option } from "nest-commander";

import { ClearService } from "./clear.service.js";

interface ClearCommandOptions {
  dictionary?: boolean;
}

/**
 * CLI command: `lexico-ingestion clear`
 * Clears dictionary data from the database.
 */
@Command({
  name: "clear",
  description: "Clear dictionary data from the database",
})
export class ClearCommand extends CommandRunner {
  private readonly logger = new Logger(ClearCommand.name);

  constructor(private readonly clearService: ClearService) {
    super();
  }

  /** Parses the `--dictionary` flag; returns `true` when present. */
  @Option({
    flags: "--dictionary",
    description: "Clear all dictionary entries, translations, and words",
  })
  parseDictionary(): boolean {
    return true;
  }

  /** Runs the clear pipeline for the options provided. Warns if no option
   * was specified. */
  async run(
    _passedParams: string[],
    options: ClearCommandOptions,
  ): Promise<void> {
    this.logger.log("Running clear command");
    if (options.dictionary) {
      await this.clearService.clearDictionary();
    } else {
      this.logger.warn(
        "No options specified. Use --dictionary to clear dictionary data.",
      );
    }
  }
}
