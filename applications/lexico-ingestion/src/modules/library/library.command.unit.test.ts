import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { LoggerModule } from "../logger/logger.module";
import { LoggerService } from "../logger/logger.service";

import { LibraryCommand } from "./library.command";
import { LIBRARY_PROVIDERS_TOKEN } from "./library.constants";

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
          provide: LIBRARY_PROVIDERS_TOKEN,
          useValue: [
            {
              ingest: vi.fn().mockResolvedValue([]),
              name: "corpus-scriptorum-ecclesiasticorum-latinorum",
            },
            {
              ingest: vi.fn().mockResolvedValue([]),
              name: "epigraphik-datenbank-clauss-slaby",
            },
            { ingest: vi.fn().mockResolvedValue([]), name: "thelatinlibrary" },
            { ingest: vi.fn().mockResolvedValue([]), name: "perseus" },
          ],
        },
      ],
    }).compile();

    command = await module.resolve(LibraryCommand);
  });

  it("should be defined", () => {
    expect(command).toBeDefined();
  });
});
