import { Lexeme, Word } from "@monorepo/lexico-entities";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { WordsCommand } from "./words.command.js";
import { WordsService } from "./words.service";

/**
 * Handles ingesting Word records from dictionary entries.
 */
@Module({
  controllers: [],
  exports: [WordsService],
  imports: [TypeOrmModule.forFeature([Lexeme, Word])],
  providers: [WordsService, WordsCommand],
})
export class WordsModule {}
