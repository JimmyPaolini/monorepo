import { describe, expect, it } from "vitest";

import { environmentSchema } from "./modules/conformance-generator/conformance-generator.constants";

describe("environment schema e2e", () => {
  it("allows an empty schema by default", () => {
    expect.hasAssertions();
    expect(environmentSchema.parse({})).toStrictEqual({});
  });
});
