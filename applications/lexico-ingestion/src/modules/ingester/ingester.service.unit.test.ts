import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../logger/logger.service";
import { PartOfSpeechService } from "../partOfSpeech/partOfSpeech.service";
import { PronunciationService } from "../pronunciation/pronunciation.service";

import { IngesterService } from "./ingester.service";

describe("IngesterService", () => {
  let service: IngesterService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        IngesterService,
        PartOfSpeechService,
        PronunciationService,
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

    service = module.get(IngesterService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
