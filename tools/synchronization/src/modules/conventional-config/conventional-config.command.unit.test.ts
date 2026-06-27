import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { ConventionalConfigCommand } from "./conventional-config.command";
import { ConventionalConfigService } from "./conventional-config.service";

const buildModule = async (): Promise<{
  command: ConventionalConfigCommand;
  conventionalConfigService: ConventionalConfigService;
  logger: LoggerService;
}> => {
  const conventionalConfigService = createMock<ConventionalConfigService>();
  const module = await Test.createTestingModule({
    providers: [
      ConventionalConfigCommand,
      {
        provide: ConventionalConfigService,
        useValue: conventionalConfigService,
      },
      {
        provide: LoggerService,
        useValue: createMock<LoggerService>(),
      },
    ],
  }).compile();

  return {
    command: await module.resolve(ConventionalConfigCommand),
    conventionalConfigService,
    logger: await module.resolve(LoggerService),
  };
};

describe(ConventionalConfigCommand, () => {
  let command: ConventionalConfigCommand;

  beforeAll(async () => {
    ({ command } = await buildModule());
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const { logger } = await buildModule();

    expect(logger.setContext).toHaveBeenCalledWith("ConventionalConfigCommand");
  });

  it("runs synchronization in check mode by default", async () => {
    const { command: localCommand, conventionalConfigService } =
      await buildModule();

    await localCommand.run([]);

    expect(conventionalConfigService.runSynchronization).toHaveBeenCalledWith(
      "",
    );
  });

  it("runs synchronization with the provided mode", async () => {
    const { command: localCommand, conventionalConfigService } =
      await buildModule();

    await localCommand.run(["write"]);

    expect(conventionalConfigService.runSynchronization).toHaveBeenCalledWith(
      "write",
    );
  });
});
