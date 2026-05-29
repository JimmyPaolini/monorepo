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
import { DictionaryModule } from "./modules/dictionary/dictionary.module.js";
import { WiktionaryModule } from "./modules/wiktionary/wiktionary.module.js";

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
        host: config.get<string>("DATABASE_HOST", "localhost"),
        port: config.get<number>("DATABASE_PORT", 5432),
        username: config.get<string>("DATABASE_USER", "lexico"),
        password: config.get<string>("DATABASE_PASSWORD", "lexico"),
        database: config.get<string>("DATABASE_NAME", "lexico"),
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
  ],
  providers: [LexicoIngestionCommand],
})
export class LexicoIngestionModule {}
