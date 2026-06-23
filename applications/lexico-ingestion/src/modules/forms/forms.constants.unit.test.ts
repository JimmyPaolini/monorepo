import { afterEach, describe, expect, it, vi } from "vitest";

describe("forms.constants normalization guards", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@monorepo/lexico-entities");
  });

  it("returns empty lists when form enums are not arrays", async () => {
    vi.doMock("@monorepo/lexico-entities", async () => {
      const actualModule = await vi.importActual("@monorepo/lexico-entities");

      return {
        ...actualModule,
        formCaseValues: {},
      };
    });

    const constants = await import("./forms.constants");

    expect(constants.formCaseValueList).toStrictEqual([]);
  });

  it("filters non-string values from mixed form enums", async () => {
    vi.doMock("@monorepo/lexico-entities", async () => {
      const actualModule = await vi.importActual("@monorepo/lexico-entities");

      return {
        ...actualModule,
        formCaseValues: ["nominative", 1, "genitive"],
      };
    });

    const constants = await import("./forms.constants");

    expect(constants.formCaseValueList).toStrictEqual([
      "nominative",
      "genitive",
    ]);
  });
});
