import { Lexeme } from "@monorepo/lexico-entities";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { EtymologyService } from "../etymology/etymology.service.js";
import { FormsService } from "../forms/forms.service.js";
import { LoggerService } from "../logger/logger.service.js";
import { PartOfSpeechService } from "../part-of-speech/part-of-speech.service.js";
import { PrincipalPartsService } from "../principal-parts/principal-parts.service.js";
import { PronunciationService } from "../pronunciation/pronunciation.service.js";
import { TranslationsService } from "../translations/translations.service.js";

import { LexemesService } from "./lexemes.service.js";

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
