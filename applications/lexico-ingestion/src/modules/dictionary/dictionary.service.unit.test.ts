import { Entry, Translation, Word } from "@monorepo/lexico-entities";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, describe, expect, it } from "vitest";

import { IngesterService } from "../ingester/ingester.service";
import { PartOfSpeechService } from "../partOfSpeech/partOfSpeech.service";
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
      ],
    }).compile();

    service = module.get(DictionaryService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
