import { describe, expect, it } from "vitest";

import { environmentSchema } from "./{{nameCamelCase}}.constants";

describe("environment schema e2e", () => {
  it("throws when required fields are missing", () => {
    expect(() => environmentSchema.parse({})).toThrow();
  });
});
