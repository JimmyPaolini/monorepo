import { Lexeme } from "@monorepo/lexico-entities";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerModule } from "../logger/logger.module";

import { PrincipalPartsService } from "./principal-parts.service";

/**
 * Owns persistence and parsing logic for Lexeme principal parts.
 */
@Module({
  controllers: [],
  exports: [PrincipalPartsService],
  imports: [TypeOrmModule.forFeature([Lexeme]), LoggerModule],
  providers: [PrincipalPartsService],
})
export class PrincipalPartsModule {}
