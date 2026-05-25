import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";

import { {{namePascalCase}}Command } from "./{{nameCamelCase}}.command";

describe("{{namePascalCase}}Command", () => {
  it("can be created by the Nest testing module", async () => {
    const module = await Test.createTestingModule({
      providers: [{{namePascalCase}}Command],
    }).compile();

    const command = module.get({{namePascalCase}}Command);
    expect(command).toBeDefined();
  });
});
