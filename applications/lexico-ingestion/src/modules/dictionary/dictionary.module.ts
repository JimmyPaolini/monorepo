import { Entry, Translation, Word } from "@monorepo/lexico-entities";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DictionaryCommand } from "./dictionary.command.js";
import { DictionaryService } from "./dictionary.service";
import { IngesterModule } from "./ingester.module.js";

/**
 * TODO: Document the dictionary module.
 */
@Module({
  controllers: [],
  imports: [
    TypeOrmModule.forFeature([Entry, Word, Translation]),
    IngesterModule,
  ],
  providers: [DictionaryCommand, DictionaryService],
  exports: [DictionaryService],
})
export class DictionaryModule {}
