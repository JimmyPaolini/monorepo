import { Entry, Translation, Word } from "@monorepo/lexico-entities";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { IngesterService } from "../ingester/ingester.service";
import { LoggerService } from "../logger/logger.service";
import { PartOfSpeechService } from "../part-of-speech/part-of-speech.service";
import { PronunciationService } from "../pronunciation/pronunciation.service";

import { DictionaryService } from "./dictionary.service";

describe("DictionaryService", () => {
  let service: DictionaryService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DictionaryService,
        IngesterService,
        PartOfSpeechService,
        PronunciationService,
        { provide: getRepositoryToken(Entry), useValue: {} },
        { provide: getRepositoryToken(Word), useValue: {} },
        { provide: getRepositoryToken(Translation), useValue: {} },
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

    service = await module.resolve(DictionaryService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
