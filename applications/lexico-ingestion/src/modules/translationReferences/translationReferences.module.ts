import { Entry, Translation } from "@monorepo/lexico-entities";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { TranslationReferencesCommand } from "./translationReferences.command.js";
import { TranslationReferencesService } from "./translationReferences.service";

/**
 * Handles resolving \{*reference*\} markers in translation text.
 */
@Module({
  controllers: [],
  exports: [TranslationReferencesService],
  imports: [TypeOrmModule.forFeature([Entry, Translation])],
  providers: [TranslationReferencesService, TranslationReferencesCommand],
})
export class TranslationReferencesModule {}
