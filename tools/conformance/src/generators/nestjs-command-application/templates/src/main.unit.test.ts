import { describe, expect, it } from "vitest";

import { environmentSchema } from "./modules/{{nameKebabCase}}/{{nameKebabCase}}.constants";

describe("environment schema", () => {
  it("parses an empty environment object", () => {
    const result = environmentSchema.parse({});
    expect(result).toEqual({});
  });
});
