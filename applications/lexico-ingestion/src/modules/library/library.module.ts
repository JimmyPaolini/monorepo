import { Module } from "@nestjs/common";

import { LoggerModule } from "../logger/logger.module";

import { LibraryCommand } from "./library.command";
import { CorpusScriptorumEcclesiasticorumLatinorumLibraryProvider } from "./providers/corpus-scriptorum-ecclesiasticorum-latinorum-library.provider";
import { EpigraphikDatenbankClaussSlabyLibraryProvider } from "./providers/epigraphik-datenbank-clauss-slaby-library.provider";
import { LatinLibraryProvider } from "./providers/latin-library.provider";
import { MusisqueDeoqueLibraryProvider } from "./providers/musisque-deoque-library.provider";
import { OpenGreekAndLatinProvider } from "./providers/open-greek-and-latin.provider";
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
    MusisqueDeoqueLibraryProvider,
    OpenGreekAndLatinProvider,
    PerseusLibraryProvider,
  ],
})
export class LibraryModule {}
