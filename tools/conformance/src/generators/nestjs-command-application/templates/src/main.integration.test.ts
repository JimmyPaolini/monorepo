import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";

import { LoggerService } from "./modules/logger/logger.service";
import { {{namePascalCase}}Command } from "./modules/{{nameKebabCase}}/{{nameKebabCase}}.command";

describe("{{namePascalCase}}Command", () => {
  it("can be created by the Nest testing module", async () => {
    const module = await Test.createTestingModule({
      providers: [
        {{namePascalCase}}Command,
        { provide: LoggerService, useValue: { setContext: () => {}, log: () => {} } },
      ],
    }).compile();

    const command = module.get({{namePascalCase}}Command);
    expect(command).toBeDefined();
  });
});
