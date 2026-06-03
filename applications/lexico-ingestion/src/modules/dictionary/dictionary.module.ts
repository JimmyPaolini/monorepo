import { Module } from "@nestjs/common";

import { FormsModule } from "../forms/forms.module";
import { LexemesModule } from "../lexemes/lexemes.module";
import { ManualModule } from "../manual/manual.module";
import { PrincipalPartsModule } from "../principal-parts/principalParts.module";
import { PronunciationModule } from "../pronunciation/pronunciation.module";
import { TranslationsModule } from "../translations/translations.module";
import { WordsModule } from "../words/words.module";

import { DictionaryCommand } from "./dictionary.command";
import { DictionaryService } from "./dictionary.service";

/**
 * TODO: Document the dictionary module.
 */
@Module({
  controllers: [],
  imports: [
    FormsModule,
    LexemesModule,
    ManualModule,
    PrincipalPartsModule,
    PronunciationModule,
    TranslationsModule,
    WordsModule,
  ],
  providers: [DictionaryCommand, DictionaryService],
  exports: [DictionaryService],
})
export class DictionaryModule {}
