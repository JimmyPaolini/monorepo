import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerModule } from "../logger/logger.module";

import { {{namePascalCase}}Command } from "./{{nameKebabCase}}.command";

describe({{namePascalCase}}Command, () => {
  let command: {{namePascalCase}}Command;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [{{namePascalCase}}Command],
    }).compile();

    command = await module.resolve({{namePascalCase}}Command);
  });

  it("is defined", () => {
        expect(command).toBeDefined();
  });
});
