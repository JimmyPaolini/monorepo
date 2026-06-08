import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { LexicoDatabaseModule } from "@monorepo/lexico-entities";

import { ClearModule } from "../clear/clear.module";
import { DictionaryModule } from "../dictionary/dictionary.module";
import { LoggerModule } from "../logger/logger.module";
import { ManualModule } from "../manual/manual.module";
import { WiktionaryModule } from "../wiktionary/wiktionary.module";
import { WordsModule } from "../words/words.module";

import { LexicoIngestionCommand } from "./lexico-ingestion.command";
import { environmentSchema } from "./lexico-ingestion.constants";
import { LexicoIngestionService } from "./lexico-ingestion.service";

/**
 * Root application module for lexicoIngestion.
 * Configures database connection, environment validation, and registers all ingestion sub-modules.
 */
@Module({
  controllers: [],
  exports: [LexicoIngestionService],
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
    ManualModule,
    ClearModule,
    LoggerModule,
  ],
  providers: [LexicoIngestionCommand, LexicoIngestionService],
})
export class LexicoIngestionModule {}
