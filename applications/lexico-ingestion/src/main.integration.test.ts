import { describe, expect, it } from "vitest";

import { environmentSchema } from "./lexicoIngestion.constants";

describe("environmentSchema", () => {
  it("parses valid environment", () => {
    const parsed = environmentSchema.parse({
      INPUT_SOURCE_TYPE: "wiktionary-latin",
      INPUT_SOURCE_PATH: "./fixtures/entry.md",
      POSTGRES_HOST: "localhost",
      POSTGRES_PORT: 5432,
      POSTGRES_USER: "postgres",
      POSTGRES_PASSWORD: "postgres",
      POSTGRES_DATABASE: "lexico_ingestion",
    });

    expect(parsed.INPUT_SOURCE_TYPE).toBe("wiktionary-latin");
    expect(parsed.INPUT_SOURCE_PATH).toBe("./fixtures/entry.md");
    expect(parsed.POSTGRES_DATABASE).toBe("lexico_ingestion");
  });
});
