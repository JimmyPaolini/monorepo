import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, describe, expect, it } from "vitest";

import { Lexeme, Word, WordForm, WordLexeme } from "@monorepo/lexico-entities";

import { NumeralsService } from "../numerals/numerals.service";
import { WordsService } from "../words/words.service";

import { ManualService } from "./manual.service";

describe("ManualService", () => {
  let service: ManualService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ManualService,
        WordsService,
        { provide: getRepositoryToken(Lexeme), useValue: {} },
        { provide: getRepositoryToken(Word), useValue: {} },
        { provide: getRepositoryToken(WordLexeme), useValue: {} },
        { provide: getRepositoryToken(WordForm), useValue: {} },
        { provide: NumeralsService, useValue: { toRoman: () => "I" } },
      ],
    }).compile();

    service = module.get(ManualService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
