import { Lexeme, Translation, Word } from "@monorepo/lexico-entities";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ClearCommand } from "./clear.command.js";
import { ClearService } from "./clear.service";

/**
 * Handles clearing dictionary data from the database.
 */
@Module({
  controllers: [],
  exports: [ClearService],
  imports: [TypeOrmModule.forFeature([Lexeme, Translation, Word])],
  providers: [ClearService, ClearCommand],
})
export class ClearModule {}
