import { describe, expect, it } from "vitest";

import { environmentSchema } from "./{{nameCamelCase}}.constants";

describe("environment schema", () => {
  it("parses a valid environment object", () => {
    const result = environmentSchema.parse({
      END_DATE: "2026-01-31",
      LATITUDE: "39.949309",
      LONGITUDE: "-75.17169",
      OUTPUT_DIRECTORY: "./output",
      START_DATE: "2026-01-01",
    });

    expect(result.OUTPUT_DIRECTORY).toBe("./output");
  });
});
