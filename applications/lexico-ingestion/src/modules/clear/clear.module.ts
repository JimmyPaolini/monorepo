import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Lexeme, Translation, Word } from "@monorepo/lexico-entities";

import { ClearCommand } from "./clear.command";

/**
 * Handles clearing dictionary data from the database.
 */
@Module({
  controllers: [],
  exports: [ClearCommand],
  imports: [TypeOrmModule.forFeature([Lexeme, Translation, Word])],
  providers: [ClearCommand],
})
export class ClearModule {}
