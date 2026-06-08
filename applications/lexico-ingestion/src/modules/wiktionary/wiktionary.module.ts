import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Lexeme, Word } from "@monorepo/lexico-entities";

import { WiktionaryCommand } from "./wiktionary.command";
import { WiktionaryService } from "./wiktionary.service";

/**
 * TODO: Document the wiktionary module.
 */
@Module({
  controllers: [],
  exports: [WiktionaryService],
  imports: [TypeOrmModule.forFeature([Lexeme, Word])],
  providers: [WiktionaryCommand, WiktionaryService],
})
export class WiktionaryModule {}
