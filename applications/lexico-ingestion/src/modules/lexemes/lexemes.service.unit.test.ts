import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { Lexeme } from "@monorepo/lexico-entities";

import { EtymologyService } from "../etymology/etymology.service";
import { FormsService } from "../forms/forms.service";
import { LoggerService } from "../logger/logger.service";
import { PartOfSpeechService } from "../part-of-speech/part-of-speech.service";
import { PrincipalPartsService } from "../principal-parts/principal-parts.service";
import { PronunciationService } from "../pronunciation/pronunciation.service";
import { TranslationsService } from "../translations/translations.service";
import { WordsService } from "../words/words.service";

import { LexemesService } from "./lexemes.service";

describe("LexemesService", () => {
  let service: LexemesService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LexemesService,
        { provide: getRepositoryToken(Lexeme), useValue: {} },
        { provide: EtymologyService, useValue: {} },
        { provide: FormsService, useValue: {} },
        { provide: PartOfSpeechService, useValue: {} },
        { provide: PrincipalPartsService, useValue: {} },
        { provide: PronunciationService, useValue: {} },
        { provide: TranslationsService, useValue: {} },
        { provide: WordsService, useValue: {} },
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

    service = module.get(LexemesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
