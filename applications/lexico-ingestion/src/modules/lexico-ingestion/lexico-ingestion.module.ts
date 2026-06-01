import { LexicoDatabaseModule } from "@monorepo/lexico-entities";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { ClearModule } from "../clear/clear.module.js";
import { DictionaryModule } from "../dictionary/dictionary.module.js";
import { LoggerModule } from "../logger/logger.module.js";
import { ManualModule } from "../manual/manual.module.js";
import { TranslationReferencesModule } from "../translationReferences/translationReferences.module.js";
import { WiktionaryModule } from "../wiktionary/wiktionary.module.js";
import { WordsModule } from "../words/words.module.js";

import { LexicoIngestionCommand } from "./lexico-ingestion.command.js";
import { environmentSchema } from "./lexico-ingestion.constants.js";
import { LexicoIngestionService } from "./lexico-ingestion.service.js";

/**
 * Root application module for lexico-ingestion.
 * Configures database connection, environment validation, and registers all ingestion sub-modules.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
      validate: (config: Record<string, unknown>) =>
        environmentSchema.parse(config),
    }),
    LexicoDatabaseModule,
    WiktionaryModule,
    DictionaryModule,
    WordsModule,
    TranslationReferencesModule,
    ManualModule,
    ClearModule,
    LoggerModule,
  ],
  providers: [LexicoIngestionCommand, LexicoIngestionService],
})
export class LexicoIngestionModule {}
