import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Author, Line, Text, Token, Word } from "@monorepo/lexico-entities";

import { LiteratureCommand } from "./literature.command.js";
import { LiteratureService } from "./literature.service.js";

/**
 * Module for literature ingestion.
 */
@Module({
  exports: [LiteratureService],
  imports: [TypeOrmModule.forFeature([Author, Text, Line, Token, Word])],
  providers: [LiteratureService, LiteratureCommand],
})
export class LiteratureModule {}
