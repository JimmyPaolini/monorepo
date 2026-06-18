import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { PronunciationClassicalService } from "./pronunciation-classical.service";

describe("PronunciationClassicalService", () => {
  let service: PronunciationClassicalService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [PronunciationClassicalService],
    }).compile();

    service = await module.resolve(PronunciationClassicalService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should classify initial h as H", () => {
    const phonemes: string[] = [];

    const nextIndex = service.processClassicalCharacter({
      ch: "h",
      index: 0,
      isVowel: () => false,
      phonemes,
      word: ["h", "o", "r", "a"],
    });

    expect(nextIndex).toBe(0);
    expect(phonemes).toContain("H");
  });

  it("should return the same index for a single default character", () => {
    const phonemes: string[] = [];

    const nextIndex = service.processClassicalCharacter({
      ch: "a",
      index: 0,
      isVowel: () => true,
      phonemes,
      word: ["a"],
    });

    expect(nextIndex).toBe(0);
    expect(phonemes.length).toBeGreaterThan(0);
  });
});
