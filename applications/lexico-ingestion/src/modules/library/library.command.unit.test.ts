import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { LibraryCommand } from "./library.command";

describe("LibraryCommand", () => {
  let command: LibraryCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LibraryCommand,
        {
          provide: LoggerService,
          useValue: {
            log: vi.fn(),
            setContext: vi.fn(),
            warn: vi.fn(),
          },
        },
      ],
    }).compile();

    command = await module.resolve(LibraryCommand);
  });

  it("should be defined", () => {
    expect(command).toBeDefined();
  });
});
