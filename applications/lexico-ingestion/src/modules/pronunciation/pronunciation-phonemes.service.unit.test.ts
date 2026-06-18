import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { PronunciationPhonemesService } from "./pronunciation-phonemes.service";

describe("PronunciationPhonemesService", () => {
  let service: PronunciationPhonemesService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [PronunciationPhonemesService],
    }).compile();

    service = await module.resolve(PronunciationPhonemesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  const localService = new PronunciationPhonemesService();

  it("should be defined", () => {
    expect(localService).toBeDefined();
  });

  it("should return a string phoneme when key points to string value", () => {
    const value = localService.getStringPhoneme({ a: "a" }, "a");

    expect(value).toBe("a");
  });

  it("should return empty string when key points to nested value", () => {
    const value = localService.getStringPhoneme({ a: [["a"]] }, "a");

    expect(value).toBe("");
  });
});
