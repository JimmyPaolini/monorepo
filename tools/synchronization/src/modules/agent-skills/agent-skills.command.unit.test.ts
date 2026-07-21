import { createMock } from "@golevelup/ts-vitest";
import { Test, type TestingModule } from "@nestjs/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { expectProcessExitOne } from "../../../testing/mocks";
import { LoggerService } from "../logger/logger.service";
import { SynchronizationModeService } from "../synchronization/synchronization-mode.service";

import { AgentSkillsCommand } from "./agent-skills.command";

describe(AgentSkillsCommand, () => {
  let command: AgentSkillsCommand;
  let logger: LoggerService;

  const createTestingModule = async (): Promise<TestingModule> => {
    return Test.createTestingModule({
      providers: [
        AgentSkillsCommand,
        SynchronizationModeService,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();
  };

  beforeAll(async () => {
    const module = await createTestingModule();
    command = await module.resolve(AgentSkillsCommand);
    logger = await module.resolve(LoggerService);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await createTestingModule();
    const instanceLogger = await module.resolve(LoggerService);

    expect(instanceLogger.setContext).toHaveBeenCalledWith(
      "AgentSkillsCommand",
    );
  });

  it("exits with error for invalid mode", async () => {
    await expectProcessExitOne(async () => command.run(["invalid-mode"]));

    expect(logger.error).toHaveBeenCalledWith("❌ Unknown mode: invalid-mode");
    expect(logger.error).toHaveBeenCalledWith("Expected 'check' or 'write'");
  });

  it("handles missing synchronized inputs by exiting with a runtime error", async () => {
    await expectProcessExitOne(async () => command.run(["check"]));

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("❌ Error:"),
    );
  });
});
