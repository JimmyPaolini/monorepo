import {
  Form,
  Lexeme,
  Translation,
  Word,
  WordForm,
  WordLexeme,
} from "@monorepo/lexico-entities";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LexemesModule } from "../lexemes/lexemes.module.js";

import { DictionaryCommand } from "./dictionary.command.js";
import { DictionaryService } from "./dictionary.service";

/**
 * TODO: Document the dictionary module.
 */
@Module({
  controllers: [],
  imports: [
    TypeOrmModule.forFeature([
      Lexeme,
      Form,
      Word,
      WordLexeme,
      WordForm,
      Translation,
    ]),
    LexemesModule,
  ],
  providers: [DictionaryCommand, DictionaryService],
  exports: [DictionaryService],
})
export class DictionaryModule {}
