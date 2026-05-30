import { Entry } from "@monorepo/lexico-entities";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { WordsModule } from "../words/words.module.js";

import { ManualCommand } from "./manual.command.js";
import { ManualService } from "./manual.service.js";

/**
 * Handles ingesting manually-curated dictionary entries (hic, ille, omnis, Roman numerals).
 */
@Module({
  controllers: [],
  exports: [ManualService],
  imports: [TypeOrmModule.forFeature([Entry]), WordsModule],
  providers: [ManualService, ManualCommand],
})
export class ManualModule {}
