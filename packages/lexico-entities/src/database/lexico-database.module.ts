import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

import { Entry } from "../entities/Entry.entity.js";
import { PrincipalPart } from "../entities/PrincipalPart.entity.js";
import { Translation } from "../entities/Translation.entity.js";
import { Word } from "../entities/Word.entity.js";
import { AdjectiveForms } from "../entities/forms/AdjectiveForms.entity.js";
import { AdverbForms } from "../entities/forms/AdverbForms.entity.js";
import { Forms } from "../entities/forms/Forms.entity.js";
import { NounForms } from "../entities/forms/NounForms.entity.js";
import { VerbForms } from "../entities/forms/VerbForms.entity.js";
import { AdjectiveInflection } from "../entities/inflection/AdjectiveInflection.entity.js";
import { AdverbInflection } from "../entities/inflection/AdverbInflection.entity.js";
import { Inflection } from "../entities/inflection/Inflection.entity.js";
import { NounInflection } from "../entities/inflection/NounInflection.entity.js";
import { PrepositionInflection } from "../entities/inflection/PrepositionInflection.entity.js";
import { Uninflected } from "../entities/inflection/Uninflected.entity.js";
import { VerbInflection } from "../entities/inflection/VerbInflection.entity.js";

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
  ],
  exports: [TypeOrmModule],
})
export class LexicoDatabaseModule {}
