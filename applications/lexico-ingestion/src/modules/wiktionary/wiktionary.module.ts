import { Lexeme, Word } from "@monorepo/lexico-entities";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { WiktionaryCommand } from "./wiktionary.command";
import { WiktionaryService } from "./wiktionary.service";

/**
 * TODO: Document the wiktionary module.
 */
@Module({
  controllers: [],
  imports: [TypeOrmModule.forFeature([Lexeme, Word])],
  providers: [WiktionaryCommand, WiktionaryService],
  exports: [WiktionaryService],
})
export class WiktionaryModule {}
