import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { WiktionaryService } from "./wiktionary.service";

describe("WiktionaryService", () => {
  let service: WiktionaryService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WiktionaryService,
        {
          provide: LoggerService,
          useValue: {
            setContext: vi.fn(),
            log: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
            verbose: vi.fn(),
          },
        },
      ],
    }).compile();

    service = await module.resolve(WiktionaryService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
