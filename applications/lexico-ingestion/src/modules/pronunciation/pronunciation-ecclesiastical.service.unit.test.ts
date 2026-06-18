import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { PronunciationEcclesiasticalService } from "./pronunciation-ecclesiastical.service";
import { PronunciationPhonemesService } from "./pronunciation-phonemes.service";

import type { PronunciationPhoneme } from "./pronunciation.types";

describe("PronunciationEcclesiasticalService", () => {
  let service: PronunciationEcclesiasticalService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PronunciationEcclesiasticalService,
        {
          provide: PronunciationPhonemesService,
          useValue: { getStringPhoneme: () => "" },
        },
      ],
    }).compile();

    service = await module.resolve(PronunciationEcclesiasticalService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should classify c before e as ch", () => {
    const phonemes: PronunciationPhoneme[] = [];

    const nextIndex = service.processEcclesiasticalCharacter({
      ch: "c",
      index: 0,
      isVowel: (letter: string) => ["a", "e", "i", "o", "u"].includes(letter),
      phonemes,
      word: ["c", "e", "n", "a"],
      wordString: "cena",
    });

    expect(nextIndex).toBe(0);
    expect(phonemes).toContain("ch");
  });

  it("should classify default character with a phoneme", () => {
    const phonemes: PronunciationPhoneme[] = [];

    const nextIndex = service.processEcclesiasticalCharacter({
      ch: "a",
      index: 0,
      isVowel: (letter: string) => ["a", "e", "i", "o", "u"].includes(letter),
      phonemes,
      word: ["a"],
      wordString: "a",
    });

    expect(nextIndex).toBe(0);
    expect(phonemes.length).toBeGreaterThan(0);
  });
});
