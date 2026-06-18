import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerModule } from "../logger/logger.module";

import { PerseusCommand } from "./perseus.command";

describe("PerseusCommand", () => {
  let command: PerseusCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [PerseusCommand],
    }).compile();

    command = module.get(PerseusCommand);
  });

  it("should be defined", () => {
    expect(command).toBeDefined();
  });
});
