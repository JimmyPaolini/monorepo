import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { ReactComponentGeneratorCommand } from "./react-component-generator.command";

describe(ReactComponentGeneratorCommand, () => {
  let command: ReactComponentGeneratorCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReactComponentGeneratorCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    command = await module.resolve(ReactComponentGeneratorCommand);
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReactComponentGeneratorCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith(
      "ReactComponentGeneratorCommand",
    );
  });
});
