import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { NestjsServiceModuleGeneratorCommand } from "./nestjs-service-module-generator.command";

describe(NestjsServiceModuleGeneratorCommand, () => {
  let command: NestjsServiceModuleGeneratorCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NestjsServiceModuleGeneratorCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    command = await module.resolve(NestjsServiceModuleGeneratorCommand);
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
      providers: [
        NestjsServiceModuleGeneratorCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith(
      "NestjsServiceModuleGeneratorCommand",
    );
  });
});
