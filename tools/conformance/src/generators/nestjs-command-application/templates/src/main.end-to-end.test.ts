import { describe, expect, it } from "vitest";

import { environmentSchema } from "./modules/{{nameKebabCase}}/{{nameKebabCase}}.constants";

describe("environment schema e2e", () => {
  it("allows an empty schema by default", () => {
    expect(environmentSchema.parse({})).toEqual({});
  });
});
