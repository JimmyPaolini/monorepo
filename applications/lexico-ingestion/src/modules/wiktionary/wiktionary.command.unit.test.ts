import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { LoggerModule } from "../logger/logger.module";
import { LoggerService } from "../logger/logger.service";

import { WiktionaryCommand } from "./wiktionary.command";

describe("WiktionaryCommand", () => {
  let command: WiktionaryCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        WiktionaryCommand,
        {
          provide: LoggerService,
          useValue: {
            debug: vi.fn(),
            error: vi.fn(),
            log: vi.fn(),
            setContext: vi.fn(),
            verbose: vi.fn(),
            warn: vi.fn(),
          },
        },
      ],
    }).compile();

    command = await module.resolve(WiktionaryCommand);
  });

  it("should be defined", () => {
    expect(command).toBeDefined();
  });
});
