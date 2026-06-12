import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { LoggerModule } from "../logger/logger.module";
import { LoggerService } from "../logger/logger.service";

import { LibraryCommand } from "./library.command";
import { CorpusScriptorumEcclesiasticorumLatinorumLibraryProvider } from "./providers/corpus-scriptorum-ecclesiasticorum-latinorum-library.provider";
import { EpigraphikDatenbankClaussSlabyLibraryProvider } from "./providers/epigraphik-datenbank-clauss-slaby-library.provider";
import { LatinLibraryProvider } from "./providers/latin-library.provider";
import { PerseusLibraryProvider } from "./providers/perseus-library.provider";

describe("LibraryCommand", () => {
  let command: LibraryCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        LibraryCommand,
        {
          provide: LoggerService,
          useValue: {
            error: vi.fn(),
            log: vi.fn(),
            setContext: vi.fn(),
            warn: vi.fn(),
          },
        },
        {
          provide: CorpusScriptorumEcclesiasticorumLatinorumLibraryProvider,
          useValue: { ingest: vi.fn().mockResolvedValue([]) },
        },
        {
          provide: EpigraphikDatenbankClaussSlabyLibraryProvider,
          useValue: { ingest: vi.fn().mockResolvedValue([]) },
        },
        {
          provide: LatinLibraryProvider,
          useValue: { ingest: vi.fn().mockResolvedValue([]) },
        },
        {
          provide: PerseusLibraryProvider,
          useValue: { ingest: vi.fn().mockResolvedValue([]) },
        },
      ],
    }).compile();

    command = await module.resolve(LibraryCommand);
  });

  it("should be defined", () => {
    expect(command).toBeDefined();
  });
});
