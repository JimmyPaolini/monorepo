import { WordsModule } from "@lexico-ingestion/src/modules/words/words.module.js";
import { Lexeme } from "@monorepo/lexico-entities";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { EtymologyModule } from "../etymology/etymology.module.js";
import { FormsModule } from "../forms/forms.module.js";
import { PartOfSpeechModule } from "../part-of-speech/part-of-speech.module.js";
import { PrincipalPartsModule } from "../principal-parts/principal-parts.module.js";
import { PronunciationModule } from "../pronunciation/pronunciation.module.js";
import { TranslationsModule } from "../translations/translations.module.js";

import { LexemesService } from "./lexemes.service.js";

/**
 * Wires POS detection, pronunciation parsing, and full Wiktionary entry
 * orchestration into a single injectable module.
 */
@Module({
  controllers: [],
  exports: [LexemesService],
  imports: [
    TypeOrmModule.forFeature([Lexeme]),
    EtymologyModule,
    FormsModule,
    PartOfSpeechModule,
    PrincipalPartsModule,
    PronunciationModule,
    TranslationsModule,
    WordsModule,
  ],
  providers: [LexemesService],
})
export class LexemesModule {}
