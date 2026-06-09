import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Command, CommandRunner, Option } from "nest-commander";
import { Repository } from "typeorm";

import { Lexeme, Translation, Word } from "@monorepo/lexico-entities";

import { LoggerService } from "../logger/logger.service";

interface ClearCommandOptions {
  dictionary?: boolean;
}

/**
 * TODO: Document the clear command.
 * Clears dictionary data from the database.
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
    @InjectRepository(Lexeme)
    private readonly lexemesRepository: Repository<Lexeme>,
    @InjectRepository(Translation)
    private readonly translationsRepository: Repository<Translation>,
    @InjectRepository(Word)
    private readonly wordsRepository: Repository<Word>,
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
    this.logger.log("🗑️ Clearing dictionary");
    await this.wordsRepository.delete({});
    await this.translationsRepository.delete({});
    await this.lexemesRepository.delete({});
    this.logger.log("🗑️ Cleared dictionary");
  }

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
      await this.clearDictionary();
    } else {
      this.logger.warn(
        "No options specified. Use --dictionary to clear dictionary data.",
      );
    }
  }
}
