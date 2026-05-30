import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { WordsService } from "./words.service";

describe("WordsService", () => {
  let service: WordsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [WordsService],
    }).compile();

    service = module.get(WordsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
