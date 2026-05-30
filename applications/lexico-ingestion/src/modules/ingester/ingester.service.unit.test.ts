import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { PartOfSpeechService } from "../partOfSpeech/partOfSpeech.service";
import { PronunciationService } from "../pronunciation/pronunciation.service";
import { IngesterService } from "./ingester.service";

describe("IngesterService", () => {
  let service: IngesterService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [IngesterService, PartOfSpeechService, PronunciationService],
    }).compile();

    service = module.get(IngesterService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
