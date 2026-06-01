import { describe, expect, it } from "vitest";

import { environmentSchema } from "./modules/lexico-ingestion/lexico-ingestion.constants";

describe("environment schema e2e", () => {
  it("allows an empty schema by default", () => {
    expect(environmentSchema.parse({})).toEqual({
      DATABASE_HOST: "localhost",
      DATABASE_PORT: 5432,
      DATABASE_USER: "lexico",
      DATABASE_PASSWORD: "lexico",
      DATABASE_NAME: "lexico",
    });
  });
});
