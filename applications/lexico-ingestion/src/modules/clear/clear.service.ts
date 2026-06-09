import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  Author,
  Lexeme,
  Line,
  Text,
  Token,
  Translation,
  Word,
} from "@monorepo/lexico-entities";

/**
 * Clears dictionary and literature data from the database.
 */
@Injectable()
export class ClearService {
  // 🏗️ Dependency Injection
  constructor(
    @InjectRepository(Lexeme)
    private readonly lexemesRepository: Repository<Lexeme>,
    @InjectRepository(Translation)
    private readonly translationsRepository: Repository<Translation>,
    @InjectRepository(Word)
    private readonly wordsRepository: Repository<Word>,
    @InjectRepository(Line)
    private readonly linesRepository: Repository<Line>,
    @InjectRepository(Text)
    private readonly textsRepository: Repository<Text>,
    @InjectRepository(Author)
    private readonly authorsRepository: Repository<Author>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
  ) {}

  private readonly logger = new Logger(ClearService.name);

  /** Deletes all `Word`, `Translation`, and `Lexeme` rows from the database
   * in dependency order to avoid foreign-key constraint violations. */
  async clearDictionary(): Promise<void> {
    this.logger.log("🗑️ Clearing dictionary");
    this.logger.log("  🧹 Deleting words...");
    await this.wordsRepository.createQueryBuilder().delete().execute();
    this.logger.log("  🧹 Deleting translations...");
    await this.translationsRepository.createQueryBuilder().delete().execute();
    this.logger.log("  🧹 Deleting lexemes...");
    await this.lexemesRepository.createQueryBuilder().delete().execute();
    this.logger.log("✨ Cleared dictionary");
  }

  /** Deletes all literature data */
  async clearLiterature(): Promise<void> {
    this.logger.log("🗑️ Clearing literature");
    this.logger.log("  🧹 Deleting tokens...");
    await this.tokensRepository.createQueryBuilder().delete().execute();
    this.logger.log("  🧹 Deleting lines...");
    await this.linesRepository.createQueryBuilder().delete().execute();
    this.logger.log("  🧹 Deleting texts...");
    await this.textsRepository.createQueryBuilder().delete().execute();
    this.logger.log("  🧹 Deleting authors...");
    await this.authorsRepository.createQueryBuilder().delete().execute();
    this.logger.log("✨ Cleared literature");
  }
}
