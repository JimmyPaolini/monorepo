import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

import { AdjectiveInflection } from "../entities/inflection/AdjectiveInflection.entity.js";
import { AdverbInflection } from "../entities/inflection/AdverbInflection.entity.js";
import { Inflection } from "../entities/inflection/Inflection.entity.js";
import { NounInflection } from "../entities/inflection/NounInflection.entity.js";
import { PrepositionInflection } from "../entities/inflection/PrepositionInflection.entity.js";
import { Uninflected } from "../entities/inflection/Uninflected.entity.js";
import { VerbInflection } from "../entities/inflection/VerbInflection.entity.js";
import { Lexeme } from "../entities/Lexeme.entity.js";
import { PrincipalPart } from "../entities/PrincipalPart.entity.js";
import { Pronunciation } from "../entities/Pronunciation.entity.js";
import { Translation } from "../entities/Translation.entity.js";
import { Word } from "../entities/Word.entity.js";

/**
 *
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get<string>("POSTGRES_HOST", "localhost"),
        port: config.get<number>("POSTGRES_PORT", 5432),
        username: config.get<string>("POSTGRES_USER", "postgres"),
        password: config.get<string>("POSTGRES_PASSWORD", "postgres"),
        database: config.get<string>("POSTGRES_DB", "postgres"),
        namingStrategy: new SnakeNamingStrategy(),
        entities: [
          Lexeme,
          Inflection,
          NounInflection,
          VerbInflection,
          AdjectiveInflection,
          AdverbInflection,
          PrepositionInflection,
          Uninflected,
          PrincipalPart,
          Pronunciation,
          Word,
          Translation,
        ],
        synchronize: true,
        logging: false,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class LexicoDatabaseModule {}
