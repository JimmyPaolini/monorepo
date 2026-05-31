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

import { LexicoIngestionCommand } from "./lexico-ingestion.command.js";
import { environmentSchema } from "./lexico-ingestion.constants.js";
import { ClearModule } from "./modules/clear/clear.module.js";
import { DictionaryModule } from "./modules/dictionary/dictionary.module.js";
import { LoggerModule } from "./modules/logger/logger.module.js";
import { ManualModule } from "./modules/manual/manual.module.js";
import { TranslationReferencesModule } from "./modules/translationReferences/translationReferences.module.js";
import { WiktionaryModule } from "./modules/wiktionary/wiktionary.module.js";
import { WordsModule } from "./modules/words/words.module.js";

/**
 *
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
        database: config.get<string>("POSTGRES_NAME", "monorepo"),
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
