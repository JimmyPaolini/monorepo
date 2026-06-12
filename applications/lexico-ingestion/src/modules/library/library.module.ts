import { Module } from "@nestjs/common";

import { LoggerModule } from "../logger/logger.module";

import { LibraryCommand } from "./library.command";
import { CorpusScriptorumEcclesiasticorumLatinorumLibraryProvider } from "./providers/corpus-scriptorum-ecclesiasticorum-latinorum-library.provider";
import { EpigraphikDatenbankClaussSlabyLibraryProvider } from "./providers/epigraphik-datenbank-clauss-slaby-library.provider";
import { LatinLibraryProvider } from "./providers/latin-library.provider";
import { PerseusLibraryProvider } from "./providers/perseus-library.provider";

/**
 * Scrape literature from various sources.
 */
@Module({
  controllers: [],
  exports: [LibraryCommand],
  imports: [LoggerModule],
  providers: [
    LibraryCommand,
    CorpusScriptorumEcclesiasticorumLatinorumLibraryProvider,
    EpigraphikDatenbankClaussSlabyLibraryProvider,
    LatinLibraryProvider,
    PerseusLibraryProvider,
  ],
})
export class LibraryModule {}
