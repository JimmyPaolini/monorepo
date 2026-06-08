import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Lexeme, Translation, Word } from "@monorepo/lexico-entities";

/**
 * Clears dictionary data from the database.
 */
@Injectable()
export class ClearService {
  // 🏗 Dependency Injection

  constructor(
    @InjectRepository(Lexeme)
    private readonly lexemesRepository: Repository<Lexeme>,
    @InjectRepository(Translation)
    private readonly translationsRepository: Repository<Translation>,
    @InjectRepository(Word)
    private readonly wordsRepository: Repository<Word>,
  ) {}

  // 🔐 Private Fields

  private readonly logger = new Logger(ClearService.name);

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
}
