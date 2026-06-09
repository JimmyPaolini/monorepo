import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Author, Line, Text, Token, Word } from "@monorepo/lexico-entities";

import { LiteratureCommand } from "./literature.command.js";

/**
 * Module for literature ingestion.
 */
@Module({
  exports: [LiteratureCommand],
  imports: [TypeOrmModule.forFeature([Author, Text, Line, Token, Word])],
  providers: [LiteratureCommand],
})
export class LiteratureModule {}
