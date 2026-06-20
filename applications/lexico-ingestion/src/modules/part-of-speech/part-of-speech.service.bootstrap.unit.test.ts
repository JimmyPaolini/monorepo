import { afterEach, describe, expect, it, vi } from "vitest";

describe("PartOfSpeechService module initialization", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("./part-of-speech.constants");
  });

  it("handles non-array constant values during normalization", async () => {
    vi.doMock("./part-of-speech.constants", async () => {
      const actualModule = await vi.importActual("./part-of-speech.constants");

      return {
        ...actualModule,
        adjectiveDeclensionValues: {},
      };
    });

    const { PartOfSpeechService } = await import("./part-of-speech.service");
    const partOfSpeechService = new PartOfSpeechService();

    expect(partOfSpeechService).toBeDefined();
  });
});
