import { describe, expect, it } from "vitest";

import { environmentSchema } from "./lexicoIngestion.constants";

describe("environment schema e2e", () => {
  it("provides defaults when environment variables are omitted", () => {
    expect(environmentSchema.parse({})).toEqual({
      INPUT_SOURCE_TYPE: "wiktionary-latin",
      INPUT_SOURCE_PATH: "./data/wiktionary-latin-entry.md",
      POSTGRES_HOST: "localhost",
      POSTGRES_PORT: 5432,
      POSTGRES_USER: "postgres",
      POSTGRES_PASSWORD: "postgres",
      POSTGRES_DATABASE: "lexico_ingestion",
    });
  });
});
