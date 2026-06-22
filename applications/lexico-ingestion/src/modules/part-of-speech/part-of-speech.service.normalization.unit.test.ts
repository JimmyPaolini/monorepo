import * as cheerio from "cheerio";
import { afterEach, describe, expect, it } from "vitest";

import type { AnyNode } from "domhandler";

describe("partOfSpeechService normalization guards", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@monorepo/lexico-entities");
  });

  it("handles non-array enum exports during module initialization", async () => {
    vi.doMock("@monorepo/lexico-entities", async () => {
      const actualModule = await vi.importActual("@monorepo/lexico-entities");

      return {
        ...actualModule,
        adjectiveDeclensionValues: {},
      };
    });

    const { PartOfSpeechService } = await import("./part-of-speech.service");
    const service = new PartOfSpeechService();

    expect(service).toBeDefined();
  });

  it("filters non-string enum values during module initialization", async () => {
    vi.doMock("@monorepo/lexico-entities", async () => {
      const actualModule = await vi.importActual("@monorepo/lexico-entities");

      return {
        ...actualModule,
        partOfSpeechEnumValues: ["noun", 123, "verb"],
      };
    });

    const { PartOfSpeechService } = await import("./part-of-speech.service");
    const service = new PartOfSpeechService();

    const $ = cheerio.load(`
      <div class="mw-heading"><h3>Noun[edit]</h3></div>
      <p id="entry">word</p>
    `);

    const entryNode = $("#entry").get(0);

    expect(entryNode).toBeDefined();

    const partOfSpeech = service.getPartOfSpeech($, entryNode as AnyNode);

    expect(partOfSpeech).toBe("noun");
  });
});
