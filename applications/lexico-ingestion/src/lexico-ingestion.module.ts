import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Entry, Translation, Word } from "@monorepo/lexico-entities";

import { LexicoIngestionCommand } from "./lexico-ingestion.command.js";
import { environmentSchema } from "./lexico-ingestion.constants.js";
import { WiktionaryModule } from "./modules/wiktionary/wiktionary.module.js";
import { DictionaryModule } from "./modules/dictionary/dictionary.module.js";

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
        entities: [Entry, Word, Translation],
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
