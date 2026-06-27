import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { ConformanceGeneratorsCommand } from "./conformance-generators.command";

describe(ConformanceGeneratorsCommand, () => {
  let command: ConformanceGeneratorsCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ConformanceGeneratorsCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    command = await module.resolve(ConformanceGeneratorsCommand);
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
      providers: [
        ConformanceGeneratorsCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith(
      "ConformanceGeneratorsCommand",
    );
  });
});
