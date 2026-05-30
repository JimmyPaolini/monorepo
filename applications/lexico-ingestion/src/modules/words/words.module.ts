import { Entry, Word } from "@monorepo/lexico-entities";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { WordsCommand } from "./words.command.js";
import { WordsService } from "./words.service.js";

/**
 * Handles ingesting Word records from dictionary entries.
 */
@Module({
  controllers: [],
  exports: [WordsService],
  imports: [TypeOrmModule.forFeature([Entry, Word])],
  providers: [WordsService, WordsCommand],
})
export class WordsModule {}
