import { Lexeme, Translation } from "@monorepo/lexico-entities";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerModule } from "../logger/logger.module.js";

import { TranslationsService } from "./translations.service";

/**
 * Owns Translation persistence and reference resolution for Lexeme entities.
 */
@Module({
  controllers: [],
  exports: [TranslationsService],
  imports: [TypeOrmModule.forFeature([Lexeme, Translation]), LoggerModule],
  providers: [TranslationsService],
})
export class TranslationsModule {}
