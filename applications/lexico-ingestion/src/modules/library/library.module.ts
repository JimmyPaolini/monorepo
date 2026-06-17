import { Module } from "@nestjs/common";

import { LoggerModule } from "../logger/logger.module";

import { LibraryCommand } from "./library.command";
import { LIBRARY_PROVIDERS_TOKEN } from "./library.constants.js";
import { CorpusScriptorumEcclesiasticorumLatinorumLibraryProvider } from "./providers/corpus-scriptorum-ecclesiasticorum-latinorum-library.provider.js";
import { EpigraphikDatenbankClaussSlabyLibraryProvider } from "./providers/epigraphik-datenbank-clauss-slaby-library.provider.js";
import { LatinLibraryBuilder } from "./providers/latin-library.builder.js";
import { LatinLibraryProvider } from "./providers/latin-library.provider.js";
import { PerseusLibraryProvider } from "./providers/perseus-library.provider.js";

import type { LibrarySourceProvider } from "./library.types.js";

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
    LatinLibraryBuilder,
    LatinLibraryProvider,
    PerseusLibraryProvider,
    {
      inject: [
        CorpusScriptorumEcclesiasticorumLatinorumLibraryProvider,
        EpigraphikDatenbankClaussSlabyLibraryProvider,
        LatinLibraryProvider,
        PerseusLibraryProvider,
      ],
      provide: LIBRARY_PROVIDERS_TOKEN,
      useFactory: (
        corpusScriptorumEcclesiasticorumLatinorum: CorpusScriptorumEcclesiasticorumLatinorumLibraryProvider,
        epigraphikDatenbankClaussSlaby: EpigraphikDatenbankClaussSlabyLibraryProvider,
        latinLibrary: LatinLibraryProvider,
        perseus: PerseusLibraryProvider,
      ): LibrarySourceProvider[] => {
        return [
          corpusScriptorumEcclesiasticorumLatinorum,
          epigraphikDatenbankClaussSlaby,
          latinLibrary,
          perseus,
        ];
      },
    },
  ],
})
export class LibraryModule {}
