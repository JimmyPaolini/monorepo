import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import {
  Author,
  Lexeme,
  LexicoDatabaseModule,
  Line,
  Text,
  Token,
  Translation,
  Word,
} from "@monorepo/lexico-entities";

import { ClearCommand } from "./clear.command";
import { ClearService } from "./clear.service";

/**
 * Handles clearing dictionary data from the database.
 */
@Module({
  controllers: [],
  exports: [ClearCommand, ClearService],
  imports: [
    LexicoDatabaseModule,
    TypeOrmModule.forFeature([
      Lexeme,
      Translation,
      Word,
      Line,
      Text,
      Author,
      Token,
    ]),
  ],
  providers: [ClearCommand, ClearService],
})
export class ClearModule {}
