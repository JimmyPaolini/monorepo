import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AdjectivalForm } from "../entities/dictionary/form/AdjectivalForm.entity.js";
import { AdverbForm } from "../entities/dictionary/form/AdverbForm.entity.js";
import { FiniteVerbForm } from "../entities/dictionary/form/FiniteVerbForm.entity.js";
import { Form } from "../entities/dictionary/form/Form.entity.js";
import { GerundForm } from "../entities/dictionary/form/GerundForm.entity.js";
import { InfinitiveForm } from "../entities/dictionary/form/InfinitiveForm.entity.js";
import { NominalForm } from "../entities/dictionary/form/NominalForm.entity.js";
import { ParticipleForm } from "../entities/dictionary/form/ParticipleForm.entity.js";
import { SupineForm } from "../entities/dictionary/form/SupineForm.entity.js";
import { AdjectiveInflection } from "../entities/dictionary/inflection/AdjectiveInflection.entity.js";
import { AdverbInflection } from "../entities/dictionary/inflection/AdverbInflection.entity.js";
import { Inflection } from "../entities/dictionary/inflection/Inflection.entity.js";
import { NounInflection } from "../entities/dictionary/inflection/NounInflection.entity.js";
import { PrepositionInflection } from "../entities/dictionary/inflection/PrepositionInflection.entity.js";
import { Uninflected } from "../entities/dictionary/inflection/Uninflected.entity.js";
import { VerbInflection } from "../entities/dictionary/inflection/VerbInflection.entity.js";
import { Lexeme } from "../entities/dictionary/Lexeme.entity.js";
import { PrincipalPart } from "../entities/dictionary/PrincipalPart.entity.js";
import { Pronunciation } from "../entities/dictionary/Pronunciation.entity.js";
import { Translation } from "../entities/dictionary/Translation.entity.js";
import { Word } from "../entities/dictionary/Word.entity.js";
import { WordForm } from "../entities/dictionary/WordForm.entity.js";
import { WordLexeme } from "../entities/dictionary/WordLexeme.entity.js";
import { Author } from "../entities/literature/Author.entity.js";
import { Line } from "../entities/literature/Line.entity.js";
import { Text } from "../entities/literature/Text.entity.js";
import { Token } from "../entities/literature/Token.entity.js";

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
