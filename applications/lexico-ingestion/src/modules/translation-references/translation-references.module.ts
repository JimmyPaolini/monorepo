import { Lexeme, Translation } from "@monorepo/lexico-entities";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { TranslationReferencesCommand } from "./translation-references.command.js";
import { TranslationReferencesService } from "./translation-references.service";

/**
 * Handles resolving \{*reference*\} markers in translation text.
 */
@Module({
  controllers: [],
  exports: [TranslationReferencesService],
  imports: [TypeOrmModule.forFeature([Lexeme, Translation])],
  providers: [TranslationReferencesService, TranslationReferencesCommand],
})
export class TranslationReferencesModule {}
