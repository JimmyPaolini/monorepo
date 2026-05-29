import { describe, expect, it } from "vitest";

import { environmentSchema } from "./lexicoIngestion.constants";

describe("environment schema e2e", () => {
  it("allows an empty schema by default", () => {
    expect(environmentSchema.parse({})).toEqual({});
  });
});
