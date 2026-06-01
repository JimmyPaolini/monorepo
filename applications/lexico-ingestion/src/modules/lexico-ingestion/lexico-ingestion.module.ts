import {
  AdjectiveForms,
  AdjectiveInflection,
  AdverbForms,
  AdverbInflection,
  Entry,
  Forms,
  Inflection,
  NounForms,
  NounInflection,
  PrepositionInflection,
  PrincipalPart,
  Translation,
  Uninflected,
  VerbForms,
  VerbInflection,
  Word,
} from "@monorepo/lexico-entities";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ClearModule } from "../clear/clear.module.js";
import { DictionaryModule } from "../dictionary/dictionary.module.js";
import { LoggerModule } from "../logger/logger.module.js";
import { ManualModule } from "../manual/manual.module.js";
import { TranslationReferencesModule } from "../translationReferences/translationReferences.module.js";
import { WiktionaryModule } from "../wiktionary/wiktionary.module.js";
import { WordsModule } from "../words/words.module.js";

import { LexicoIngestionCommand } from "./lexico-ingestion.command.js";
import { environmentSchema } from "./lexico-ingestion.constants.js";

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
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get<string>("POSTGRES_HOST", "localhost"),
        port: config.get<number>("POSTGRES_PORT", 5432),
        username: config.get<string>("POSTGRES_USER", "postgres_user"),
        password: config.get<string>("POSTGRES_PASSWORD", "postgres_password"),
        database: config.get<string>("POSTGRES_DB", "monorepo"),
        entities: [
          Entry,
          Inflection,
          NounInflection,
          VerbInflection,
          AdjectiveInflection,
          AdverbInflection,
          PrepositionInflection,
          Uninflected,
          Forms,
          NounForms,
          VerbForms,
          AdjectiveForms,
          AdverbForms,
          PrincipalPart,
          Word,
          Translation,
        ],
        synchronize: true,
        logging: false,
      }),
    }),
    WiktionaryModule,
    DictionaryModule,
    WordsModule,
    TranslationReferencesModule,
    ManualModule,
    ClearModule,
    LoggerModule,
  ],
  providers: [LexicoIngestionCommand],
})
export class LexicoIngestionModule {}
