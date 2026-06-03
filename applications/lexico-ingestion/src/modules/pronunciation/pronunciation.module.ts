import { Lexeme } from "@monorepo/lexico-entities";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerModule } from "../logger/logger.module";

import { PronunciationService } from "./pronunciation.service";

/**
 * TODO: Document the pronunciation module.
 */
@Module({
  controllers: [],
  exports: [PronunciationService],
  imports: [TypeOrmModule.forFeature([Lexeme]), LoggerModule],
  providers: [PronunciationService],
})
export class PronunciationModule {}
