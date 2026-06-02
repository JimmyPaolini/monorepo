import { Lexeme } from "@monorepo/lexico-entities";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { FormsService } from "../forms/forms.service";
import { LoggerService } from "../logger/logger.service";
import { PartOfSpeechService } from "../part-of-speech/part-of-speech.service";
import { PronunciationService } from "../pronunciation/pronunciation.service";

import { LexemesService } from "./lexemes.service";

describe("LexemesService", () => {
  let service: LexemesService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LexemesService,
        { provide: getRepositoryToken(Lexeme), useValue: {} },
        { provide: FormsService, useValue: {} },
        { provide: PartOfSpeechService, useValue: {} },
        { provide: PronunciationService, useValue: {} },
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

    service = await module.resolve(LexemesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
