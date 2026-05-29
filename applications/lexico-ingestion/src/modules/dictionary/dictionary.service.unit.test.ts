import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Entry, Word, Translation } from "@monorepo/lexico-entities";
import { beforeAll, describe, expect, it } from "vitest";

import { DictionaryService } from "./dictionary.service";
import { IngesterService } from "./ingester.service";

describe("DictionaryService", () => {
  let service: DictionaryService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DictionaryService,
        IngesterService,
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
