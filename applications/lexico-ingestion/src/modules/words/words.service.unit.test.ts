import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, describe, expect, it } from "vitest";

import { Word, WordForm, WordLexeme } from "@monorepo/lexico-entities";

import { WordsService } from "./words.service";

describe("WordsService", () => {
  let service: WordsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WordsService,
        { provide: getRepositoryToken(Word), useValue: {} },
        { provide: getRepositoryToken(WordLexeme), useValue: {} },
        { provide: getRepositoryToken(WordForm), useValue: {} },
      ],
    }).compile();

    service = await module.resolve(WordsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
