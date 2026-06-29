import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { NestjsServiceFileGeneratorCommand } from "./nestjs-service-file-generator.command";

describe(NestjsServiceFileGeneratorCommand, () => {
  let command: NestjsServiceFileGeneratorCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NestjsServiceFileGeneratorCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    command = await module.resolve(NestjsServiceFileGeneratorCommand);
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
      providers: [
        NestjsServiceFileGeneratorCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith(
      "NestjsServiceFileGeneratorCommand",
    );
  });
});
