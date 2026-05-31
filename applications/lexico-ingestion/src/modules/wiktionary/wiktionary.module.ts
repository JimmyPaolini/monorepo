import { Entry, Word } from "@monorepo/lexico-entities";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { WiktionaryCommand } from "./wiktionary.command.js";
import { WiktionaryService } from "./wiktionary.service.js";

/**
 * TODO: Document the wiktionary module.
 */
@Module({
  controllers: [],
  imports: [TypeOrmModule.forFeature([Entry, Word])],
  providers: [WiktionaryCommand, WiktionaryService],
  exports: [WiktionaryService],
})
export class WiktionaryModule {}
