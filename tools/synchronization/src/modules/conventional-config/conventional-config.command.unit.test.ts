import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { ConventionalConfigSynchronizationService } from "./conventional-config-synchronization.service";
import { ConventionalConfigCommand } from "./conventional-config.command";

const buildModule = async (): Promise<{
  command: ConventionalConfigCommand;
  logger: LoggerService;
  synchronizationService: ConventionalConfigSynchronizationService;
}> => {
  const synchronizationService =
    createMock<ConventionalConfigSynchronizationService>();
  const module = await Test.createTestingModule({
    providers: [
      ConventionalConfigCommand,
      {
        provide: ConventionalConfigSynchronizationService,
        useValue: synchronizationService,
      },
      {
        provide: LoggerService,
        useValue: createMock<LoggerService>(),
      },
    ],
  }).compile();

  return {
    command: await module.resolve(ConventionalConfigCommand),
    logger: await module.resolve(LoggerService),
    synchronizationService,
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
    const { command: localCommand, synchronizationService } =
      await buildModule();

    await localCommand.run([]);

    expect(synchronizationService.runSynchronization).toHaveBeenCalledWith("");
  });

  it("runs synchronization with the provided mode", async () => {
    const { command: localCommand, synchronizationService } =
      await buildModule();

    await localCommand.run(["write"]);

    expect(synchronizationService.runSynchronization).toHaveBeenCalledWith(
      "write",
    );
  });
});
