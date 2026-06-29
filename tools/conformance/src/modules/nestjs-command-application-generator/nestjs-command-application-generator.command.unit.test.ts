import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { NestjsCommandApplicationGeneratorCommand } from "./nestjs-command-application-generator.command";

describe(NestjsCommandApplicationGeneratorCommand, () => {
  let command: NestjsCommandApplicationGeneratorCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NestjsCommandApplicationGeneratorCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    command = await module.resolve(NestjsCommandApplicationGeneratorCommand);
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
      providers: [
        NestjsCommandApplicationGeneratorCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith(
      "NestjsCommandApplicationGeneratorCommand",
    );
  });
});
