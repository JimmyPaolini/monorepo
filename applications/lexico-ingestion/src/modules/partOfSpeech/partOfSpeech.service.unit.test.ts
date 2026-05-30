import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { PartOfSpeechService } from "./partOfSpeech.service";

describe("PartOfSpeechService", () => {
  let service: PartOfSpeechService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [PartOfSpeechService],
    }).compile();

    service = module.get(PartOfSpeechService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
