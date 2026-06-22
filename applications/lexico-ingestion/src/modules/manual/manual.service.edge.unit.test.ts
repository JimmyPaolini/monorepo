import { afterEach, describe, expect, it } from "vitest";

import { Lexeme } from "@monorepo/lexico-entities";

interface ManualServiceInstance {
  buildPraenomenLexeme: (
    abbreviation: string,
    praenomen: { feminine?: string; masculine?: string },
  ) => Lexeme;
  ingestRomanNumerals: () => Promise<void>;
}

describe("manualService edge branches", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("./manual.constants");
  });

  it("handles templates without principal parts and inflection in praenomen builder", async () => {
    vi.doMock("./manual.constants", async () => {
      const actualModule = await vi.importActual("./manual.constants");

      return {
        ...actualModule,
        buildPraenomenAbbreviationTemplate: () => {
          const lexeme = new Lexeme();
          lexeme.partOfSpeech = "noun";
          lexeme.principalParts = [];
          return lexeme;
        },
      };
    });

    const { ManualService } = await import("./manual.service");

    const service = new ManualService(
      {
        delete: vi.fn<(criteria: unknown) => Promise<void>>(
          async () => await Promise.resolve(),
        ),
        save: vi.fn<(lexeme: Lexeme) => Promise<Lexeme>>(
          async (lexeme: Lexeme) => await Promise.resolve(lexeme),
        ),
      } as never,
      {
        ingestLexemeWords: vi.fn<(lexeme: Lexeme) => Promise<void>>(
          async () => await Promise.resolve(),
        ),
      } as never,
      {
        toRoman: vi.fn<(value: number | string) => string>(String),
      } as never,
    ) as unknown as ManualServiceInstance;

    const result = service.buildPraenomenLexeme("abbr", {
      masculine: "abbr-name",
    });

    expect(result.lemma).toBe("abbr");
    expect(result.principalParts).toStrictEqual([]);
  });

  it("handles templates with inflection object that has no gender field", async () => {
    vi.doMock("./manual.constants", async () => {
      const actualModule = await vi.importActual("./manual.constants");

      return {
        ...actualModule,
        buildPraenomenAbbreviationTemplate: () => {
          const lexeme = new Lexeme();
          lexeme.partOfSpeech = "noun";
          lexeme.principalParts = [];
          lexeme.inflection = {} as never;
          return lexeme;
        },
      };
    });

    const { ManualService } = await import("./manual.service");

    const service = new ManualService(
      {
        delete: vi.fn<() => Promise<void>>(async () => await Promise.resolve()),
        save: vi.fn<(lexeme: Lexeme) => Promise<Lexeme>>(
          async (lexeme: Lexeme) => await Promise.resolve(lexeme),
        ),
      } as never,
      {
        ingestLexemeWords: vi.fn<() => Promise<void>>(
          async () => await Promise.resolve(),
        ),
      } as never,
      {
        toRoman: vi.fn<(value: number | string) => string>(String),
      } as never,
    ) as unknown as ManualServiceInstance;

    const result = service.buildPraenomenLexeme("abbr", {
      feminine: "abbr-name",
    });

    expect(result.lemma).toBe("abbr");
    expect(result.inflection).toStrictEqual({});
  });

  it("skips principal-part assignment when roman template has no primary part", async () => {
    vi.doMock("./manual.constants", async () => {
      const actualModule = await vi.importActual("./manual.constants");

      return {
        ...actualModule,
        buildRomanNumeralTemplate: () => {
          const lexeme = new Lexeme();
          lexeme.partOfSpeech = "numeral";
          lexeme.principalParts = [];
          return lexeme;
        },
      };
    });

    const { ManualService } = await import("./manual.service");

    const service = new ManualService(
      {
        delete: vi.fn<(criteria: unknown) => Promise<void>>(
          async () => await Promise.resolve(),
        ),
        save: vi.fn<(lexeme: Lexeme) => Promise<Lexeme>>(
          async (lexeme: Lexeme) => await Promise.resolve(lexeme),
        ),
      } as never,
      {
        ingestLexemeWords: vi.fn<(lexeme: Lexeme) => Promise<void>>(
          async () => await Promise.resolve(),
        ),
      } as never,
      {
        toRoman: vi.fn<(value: number | string) => string>(String),
      } as never,
    ) as unknown as ManualServiceInstance;

    await expect(service.ingestRomanNumerals()).resolves.toBeUndefined();
  });
});
