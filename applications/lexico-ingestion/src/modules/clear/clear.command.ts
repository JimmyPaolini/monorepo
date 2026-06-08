import { Logger } from "@nestjs/common";
import { Command, CommandRunner, Option } from "nest-commander";

import { ClearService } from "./clear.service";

interface ClearCommandOptions {
  dictionary?: boolean;
}

/**
 * CLI command: `lexico-ingestion clear`
 * Clears dictionary data from the database.
 */
@Command({
  description: "Clear dictionary data from the database",
  name: "clear",
})
export class ClearCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly clearService: ClearService) {
    super();
  }

  // 🔐 Private Fields

  private readonly logger = new Logger(ClearCommand.name);

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /** Parses the `--dictionary` flag; returns `true` when present. */
  @Option({
    description: "Clear all dictionary entries, translations, and words",
    flags: "--dictionary",
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
