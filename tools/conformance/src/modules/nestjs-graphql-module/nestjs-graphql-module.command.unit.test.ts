import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { NestjsGraphqlModuleCommand } from "./nestjs-graphql-module.command";

describe(NestjsGraphqlModuleCommand, () => {
  let command: NestjsGraphqlModuleCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NestjsGraphqlModuleCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    command = await module.resolve(NestjsGraphqlModuleCommand);
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
      providers: [
        NestjsGraphqlModuleCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith(
      "NestjsGraphqlModuleCommand",
    );
  });
});
