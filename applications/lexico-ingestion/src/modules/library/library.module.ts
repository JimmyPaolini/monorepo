import { Module } from "@nestjs/common";

import { LoggerModule } from "../logger/logger.module";

import { LibraryCommand } from "./library.command";
import { LibraryService } from "./library.service";

/**
 * TODO: Document the library module.
 */
@Module({
  controllers: [],
  exports: [LibraryCommand, LibraryService],
  imports: [LoggerModule],
  providers: [LibraryCommand, LibraryService],
})
export class LibraryModule {}
