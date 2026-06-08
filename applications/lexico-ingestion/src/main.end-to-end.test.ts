import { describe, expect, it } from "vitest";

import { environmentSchema } from "./modules/lexico-ingestion/lexico-ingestion.constants";

describe("environment schema e2e", () => {
  it("allows an empty schema by default", () => {
    expect(environmentSchema.parse({})).toEqual({
      POSTGRES_DB: "postgres",
      POSTGRES_HOST: "localhost",
      POSTGRES_PASSWORD: "postgres",
      POSTGRES_PORT: 5432,
      POSTGRES_USER: "postgres",
    });
  });
});
