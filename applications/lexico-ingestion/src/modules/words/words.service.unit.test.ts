import { Entry, Word } from "@monorepo/lexico-entities";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, describe, expect, it } from "vitest";

import { WordsService } from "./words.service";

describe("WordsService", () => {
  let service: WordsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WordsService,
        { provide: getRepositoryToken(Entry), useValue: {} },
        { provide: getRepositoryToken(Word), useValue: {} },
      ],
    }).compile();

    service = module.get(WordsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
