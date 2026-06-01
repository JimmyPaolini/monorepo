import { Entry, Word } from "@monorepo/lexico-entities";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, describe, expect, it } from "vitest";

import { WordsService } from "../words/words.service";

import { ManualService } from "./manual.service";

describe("ManualService", () => {
  let service: ManualService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ManualService,
        WordsService,
        { provide: getRepositoryToken(Entry), useValue: {} },
        { provide: getRepositoryToken(Word), useValue: {} },
      ],
    }).compile();

    service = await module.resolve(ManualService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
