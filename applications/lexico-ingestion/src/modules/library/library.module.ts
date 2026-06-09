import { Module } from "@nestjs/common";

import { LoggerModule } from "../logger/logger.module";

import { LibraryCommand } from "./library.command";

/**
 * Scrape thelatinlibrary.com to populate library.json.
 */
@Module({
  controllers: [],
  exports: [LibraryCommand],
  imports: [LoggerModule],
  providers: [LibraryCommand],
})
export class LibraryModule {}
