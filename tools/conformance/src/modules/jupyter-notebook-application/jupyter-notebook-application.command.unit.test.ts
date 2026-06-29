import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { JupyterNotebookApplicationCommand } from "./jupyter-notebook-application.command";

describe(JupyterNotebookApplicationCommand, () => {
  let command: JupyterNotebookApplicationCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JupyterNotebookApplicationCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    command = await module.resolve(JupyterNotebookApplicationCommand);
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
      providers: [
        JupyterNotebookApplicationCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith(
      "JupyterNotebookApplicationCommand",
    );
  });
});
