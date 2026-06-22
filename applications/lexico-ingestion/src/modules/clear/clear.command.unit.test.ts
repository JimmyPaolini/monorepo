import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerModule } from "../logger/logger.module";

import { ClearCommand } from "./clear.command";

describe(ClearCommand, () => {
  let command: ClearCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [ClearCommand],
    }).compile();

    command = await module.resolve(ClearCommand);
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });
});
