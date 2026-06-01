import { describe, expect, it } from "vitest";

import { environmentSchema } from "./modules/lexico-ingestion/lexico-ingestion.constants";

describe("environment schema", () => {
  it("parses an empty environment object using defaults", () => {
    const result = environmentSchema.parse({});
    expect(result).toEqual({
      DATABASE_HOST: "localhost",
      DATABASE_PORT: 5432,
      DATABASE_USER: "lexico",
      DATABASE_PASSWORD: "lexico",
      DATABASE_NAME: "lexico",
    });
  });
});
