import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { expectProcessExitOne } from "../../../testing/mocks";
import { LoggerService } from "../logger/logger.service";
import { SynchronizationModeService } from "../synchronization/synchronization-mode.service";

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
      SynchronizationModeService,
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

  it.each([
    {
      expectedMode: "check",
      modeArguments: [],
      scenarioName: "runs synchronization in check mode by default",
    },
    {
      expectedMode: "write",
      modeArguments: ["write"],
      scenarioName: "runs synchronization with the provided mode",
    },
  ])("$scenarioName", async ({ expectedMode, modeArguments }) => {
    const { command: localCommand, conventionalConfigService } =
      await buildModule();

    await localCommand.run(modeArguments);

    expect(conventionalConfigService.runSynchronization).toHaveBeenCalledWith(
      expectedMode,
    );
  });

  it("exits for invalid mode", async () => {
    const { command: localCommand, logger } = await buildModule();

    await expectProcessExitOne(async () => localCommand.run(["invalid-mode"]));

    expect(logger.error).toHaveBeenCalledWith("❌ Invalid mode: invalid-mode");
    expect(logger.error).toHaveBeenCalledWith(
      "💡 Usage: nx run synchronization:start:conventional-config-check (or synchronization:start:conventional-config-write)",
    );
  });
});
