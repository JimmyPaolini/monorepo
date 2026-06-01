import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { PronunciationService } from "./pronunciation.service";

describe("PronunciationService", () => {
  let service: PronunciationService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [PronunciationService],
    }).compile();

    service = await module.resolve(PronunciationService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
