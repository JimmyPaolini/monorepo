import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, describe, expect, it } from "vitest";

import { Lexeme } from "@monorepo/lexico-entities";

import { LoggerService } from "../logger/logger.service";

import { PronunciationClassicalService } from "./pronunciation-classical.service";
import { PronunciationClassifier } from "./pronunciation-classifier.service";
import { PronunciationEcclesiasticalService } from "./pronunciation-ecclesiastical.service";
import { PronunciationPhonemesService } from "./pronunciation-phonemes.service";
import { PronunciationService } from "./pronunciation.service";

describe("PronunciationService", () => {
  let service: PronunciationService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PronunciationService,
        { provide: getRepositoryToken(Lexeme), useValue: {} },
        {
          provide: LoggerService,
          useValue: { log: () => {}, setContext: () => {} },
        },
        {
          provide: PronunciationClassicalService,
          useValue: { processClassicalCharacter: () => 0 },
        },
        {
          provide: PronunciationPhonemesService,
          useValue: { getStringPhoneme: () => "" },
        },
        {
          provide: PronunciationEcclesiasticalService,
          useValue: {
            processEcclesiasticalCharacter: () => 0,
          },
        },
        {
          provide: PronunciationClassifier,
          useValue: {
            applyWiktionaryPronunciations: () => {},
            processClassicalCharacter: () => 0,
            processEcclesiasticalCharacter: () => 0,
          },
        },
      ],
    }).compile();

    service = module.get(PronunciationService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
