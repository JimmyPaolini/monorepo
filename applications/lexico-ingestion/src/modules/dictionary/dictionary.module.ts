import { Module } from "@nestjs/common";

import { FormsModule } from "../forms/forms.module.js";
import { LexemesModule } from "../lexemes/lexemes.module.js";
import { TranslationsModule } from "../translations/translations.module.js";
import { WordsModule } from "../words/words.module.js";

import { DictionaryCommand } from "./dictionary.command.js";
import { DictionaryService } from "./dictionary.service";

/**
 * TODO: Document the dictionary module.
 */
@Module({
  controllers: [],
  imports: [FormsModule, LexemesModule, TranslationsModule, WordsModule],
  providers: [DictionaryCommand, DictionaryService],
  exports: [DictionaryService],
})
export class DictionaryModule {}
