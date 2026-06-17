import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import {
  Author,
  DatabaseModule,
  Line,
  Text,
  Token,
  Word,
} from "@monorepo/lexico-entities";

import { LoggerModule } from "../logger/logger.module";
import { NumeralsModule } from "../numerals/numerals.module";

import { LiteratureCommand } from "./literature.command";
import { LiteratureService } from "./literature.service";
import { LiteratureTextIngestionService } from "./literature.text-ingestion.service";

/**
 * Module for literature ingestion.
 */
@Module({
  controllers: [],
  exports: [LiteratureCommand],
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Author, Text, Line, Token, Word]),
    LoggerModule,
    NumeralsModule,
  ],
  providers: [
    LiteratureCommand,
    LiteratureService,
    LiteratureTextIngestionService,
  ],
})
export class LiteratureModule {}
