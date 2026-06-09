import { Injectable } from "@nestjs/common";
import { Command, CommandRunner, Option } from "nest-commander";

import { LoggerService } from "../logger/logger.service.js";

import { ClearService } from "./clear.service.js";

interface ClearCommandOptions {
  dictionary?: boolean;
  literature?: boolean;
}

/**
 * Clears dictionary and literature data from the database.
 */
@Command({
  description: "Run the clear command",
  name: "clear",
})
@Injectable()
export class ClearCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(
    private readonly logger: LoggerService,
    private readonly clearService: ClearService,
  ) {
    super();
    this.logger.setContext(ClearCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /** Deletes all `Word`, `Translation`, and `Lexeme` rows from the database
   * in dependency order to avoid foreign-key constraint violations. */
  async clearDictionary(): Promise<void> {
    await this.clearService.clearDictionary();
  }

  /** Parses the `--dictionary` flag; returns `true` when present. */
  @Option({
    description: "Clear all dictionary entries, translations, and words",
    flags: "--dictionary",
  })
  parseDictionary(): boolean {
    return true;
  }

  /** Parses the `--literature` flag; returns `true` when present. */
  @Option({
    description: "Clear all literature entries (authors, books, texts, lines)",
    flags: "--literature",
  })
  parseLiterature(): boolean {
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
    }
    if (options.literature) {
      await this.clearService.clearLiterature();
    }
    if (!options.dictionary && !options.literature) {
      this.logger.warn(
        "No options specified. Use --dictionary or --literature to clear data.",
      );
    }
  }
}
