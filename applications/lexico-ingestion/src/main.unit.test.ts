import { describe, expect, it } from "vitest";

import { environmentSchema } from "./modules/lexico-ingestion/lexico-ingestion.constants";

describe("environment schema", () => {
  it("parses an empty environment object using defaults", () => {
    const result = environmentSchema.parse({});
    expect(result).toEqual({
      POSTGRES_HOST: "localhost",
      POSTGRES_PORT: 5432,
      POSTGRES_USER: "postgres",
      POSTGRES_PASSWORD: "postgres",
      POSTGRES_DB: "postgres",
    });
  });
});
