import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Lexeme } from "@monorepo/lexico-entities";

import { WordsModule } from "../words/words.module";

import { ManualService } from "./manual.service";

/**
 * Handles ingesting manually-curated dictionary lexemes (hic, ille, omnis, Roman numerals).
 */
@Module({
  controllers: [],
  exports: [ManualService],
  imports: [TypeOrmModule.forFeature([Lexeme]), WordsModule],
  providers: [ManualService],
})
export class ManualModule {}
