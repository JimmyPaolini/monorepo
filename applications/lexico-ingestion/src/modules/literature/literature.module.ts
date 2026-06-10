import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import {
  Author,
  LexicoDatabaseModule,
  Line,
  Text,
  Token,
  Word,
} from "@monorepo/lexico-entities";

import { LoggerModule } from "../logger/logger.module.js";
import { NumeralsModule } from "../numerals/numerals.module.js";

import { LiteratureCommand } from "./literature.command.js";

/**
 * Module for literature ingestion.
 */
@Module({
  exports: [LiteratureCommand],
  imports: [
    LexicoDatabaseModule,
    TypeOrmModule.forFeature([Author, Text, Line, Token, Word]),
    LoggerModule,
    NumeralsModule,
  ],
  providers: [LiteratureCommand],
})
export class LiteratureModule {}
