import { Test } from "@nestjs/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { PronunciationClassicalService } from "./pronunciation-classical.service";
import { PronunciationClassifierService } from "./pronunciation-classifier.service";
import { PronunciationEcclesiasticalService } from "./pronunciation-ecclesiastical.service";

describe("PronunciationClassifierService", () => {
  let service: PronunciationClassifierService;
  const processClassicalCharacter = vi.fn();
  const processEcclesiasticalCharacter = vi.fn();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PronunciationClassifierService,
        {
          provide: PronunciationClassicalService,
          useValue: { processClassicalCharacter },
        },
        {
          provide: PronunciationEcclesiasticalService,
          useValue: { processEcclesiasticalCharacter },
        },
      ],
    }).compile();

    service = module.get(PronunciationClassifierService);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should delegate classical processing", () => {
    processClassicalCharacter.mockReturnValueOnce(2);

    const result = service.processClassicalCharacter({
      ch: "a",
      index: 1,
      isVowel: () => true,
      phonemes: [],
      word: ["a"],
    });

    expect(result).toBe(2);
    expect(processClassicalCharacter).toHaveBeenCalledTimes(1);
  });

  it("should delegate ecclesiastical processing", () => {
    processEcclesiasticalCharacter.mockReturnValueOnce(3);

    const result = service.processEcclesiasticalCharacter({
      ch: "c",
      index: 0,
      isVowel: () => true,
      phonemes: [],
      word: ["c", "a"],
      wordString: "ca",
    });

    expect(result).toBe(3);
    expect(processEcclesiasticalCharacter).toHaveBeenCalledTimes(1);
  });
});
