import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { PullRequestTemplateCommand } from "./pull-request-template.command";

describe(PullRequestTemplateCommand, () => {
  let command: PullRequestTemplateCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PullRequestTemplateCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    command = await module.resolve(PullRequestTemplateCommand);
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
      providers: [
        PullRequestTemplateCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith(
      "PullRequestTemplateCommand",
    );
  });
});
