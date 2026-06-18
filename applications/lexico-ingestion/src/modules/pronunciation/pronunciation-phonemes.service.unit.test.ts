import { describe, expect, it } from "vitest";

import { PronunciationPhonemesService } from "./pronunciation-phonemes.service";

describe("PronunciationPhonemesService", () => {
  const service = new PronunciationPhonemesService();

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should return a string phoneme when key points to string value", () => {
    const value = service.getStringPhoneme({ a: "a" }, "a");

    expect(value).toBe("a");
  });

  it("should return empty string when key points to nested value", () => {
    const value = service.getStringPhoneme({ a: [["a"]] }, "a");

    expect(value).toBe("");
  });
});
