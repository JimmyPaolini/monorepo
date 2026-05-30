import { Entry, Translation, Word } from "@monorepo/lexico-entities";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

/**
 * Clears dictionary data from the database.
 */
@Injectable()
export class ClearService {
  private readonly logger = new Logger(ClearService.name);

  constructor(
    @InjectRepository(Entry)
    private readonly entriesRepository: Repository<Entry>,
    @InjectRepository(Translation)
    private readonly translationsRepository: Repository<Translation>,
    @InjectRepository(Word)
    private readonly wordsRepository: Repository<Word>,
  ) {}

  /**
   *
   */
  async clearDictionary(): Promise<void> {
    this.logger.log("Clearing dictionary");
    await this.wordsRepository.delete({});
    await this.translationsRepository.delete({});
    await this.entriesRepository.delete({});
    this.logger.log("Cleared dictionary");
  }
}
