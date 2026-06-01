import { Entry, Translation, Word } from "@monorepo/lexico-entities";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, describe, expect, it } from "vitest";

import { ClearService } from "./clear.service";

describe("ClearService", () => {
  let service: ClearService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ClearService,
        { provide: getRepositoryToken(Entry), useValue: {} },
        { provide: getRepositoryToken(Translation), useValue: {} },
        { provide: getRepositoryToken(Word), useValue: {} },
      ],
    }).compile();

    service = module.get(ClearService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
