import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AdjectivalForm } from "../entities/form/AdjectivalForm.entity.js";
import { AdverbForm } from "../entities/form/AdverbForm.entity.js";
import { FiniteVerbForm } from "../entities/form/FiniteVerbForm.entity.js";
import { Form } from "../entities/form/Form.entity.js";
import { GerundForm } from "../entities/form/GerundForm.entity.js";
import { InfinitiveForm } from "../entities/form/InfinitiveForm.entity.js";
import { NominalForm } from "../entities/form/NominalForm.entity.js";
import { ParticipleForm } from "../entities/form/ParticipleForm.entity.js";
import { SupineForm } from "../entities/form/SupineForm.entity.js";
import { AdjectiveInflection } from "../entities/inflection/AdjectiveInflection.entity.js";
import { AdverbInflection } from "../entities/inflection/AdverbInflection.entity.js";
import { Inflection } from "../entities/inflection/Inflection.entity.js";
import { NounInflection } from "../entities/inflection/NounInflection.entity.js";
import { PrepositionInflection } from "../entities/inflection/PrepositionInflection.entity.js";
import { Uninflected } from "../entities/inflection/Uninflected.entity.js";
import { VerbInflection } from "../entities/inflection/VerbInflection.entity.js";
import { Lexeme } from "../entities/Lexeme.entity.js";
import { Author } from "../entities/literature/Author.entity.js";
import { Line } from "../entities/literature/Line.entity.js";
import { Text } from "../entities/literature/Text.entity.js";
import { Token } from "../entities/literature/Token.entity.js";
import { PrincipalPart } from "../entities/PrincipalPart.entity.js";
import { Pronunciation } from "../entities/Pronunciation.entity.js";
import { Translation } from "../entities/Translation.entity.js";
import { Word } from "../entities/Word.entity.js";
import { WordForm } from "../entities/WordForm.entity.js";
import { WordLexeme } from "../entities/WordLexeme.entity.js";

import { LexicoNamingStrategy } from "./lexico-naming-strategy.js";

/**
 * Database module handling the TypeORM setup for Lexico.
 */
@Module({
  exports: [TypeOrmModule],
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        database: config.get<string>("POSTGRES_DB", "postgres"),
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
          Form,
          NominalForm,
          AdjectivalForm,
          AdverbForm,
          FiniteVerbForm,
          InfinitiveForm,
          ParticipleForm,
          GerundForm,
          SupineForm,
          WordForm,
          WordLexeme,
          Author,
          Text,
          Line,
          Token,
        ],
        host: config.get<string>("POSTGRES_HOST", "localhost"),
        logging: false,
        namingStrategy: new LexicoNamingStrategy(),
        password: config.get<string>("POSTGRES_PASSWORD", "postgres"),
        port: config.get<number>("POSTGRES_PORT", 5432),
        synchronize: true,
        type: "postgres",
        username: config.get<string>("POSTGRES_USER", "postgres"),
      }),
    }),
  ],
})
export class LexicoDatabaseModule {}
