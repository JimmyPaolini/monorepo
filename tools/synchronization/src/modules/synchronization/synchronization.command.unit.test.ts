import { createMock } from "@golevelup/ts-vitest";
import { Test, type TestingModule } from "@nestjs/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { AgentSkillsCommand } from "../agent-skills/agent-skills.command";
import { ConformanceGeneratorsCommand } from "../conformance-generators/conformance-generators.command";
import { ConventionalConfigCommand } from "../conventional-config/conventional-config.command";
import { DevcontainerConfigurationCommand } from "../devcontainer-configuration/devcontainer-configuration.command";
import { LoggerService } from "../logger/logger.service";
import { PullRequestTemplateCommand } from "../pull-request-template/pull-request-template.command";

import { SynchronizationCommand } from "./synchronization.command";

const createCommandProvider = <T extends object>(
  token: new (...args: never[]) => T,
): { provide: new (...args: never[]) => T; useValue: T } => {
  return {
    provide: token,
    useValue: createMock<T>(),
  };
};

describe(SynchronizationCommand, () => {
  let agentSkillsCommand: AgentSkillsCommand;
  let command: SynchronizationCommand;
  let conformanceGeneratorsCommand: ConformanceGeneratorsCommand;
  let conventionalConfigCommand: ConventionalConfigCommand;
  let devcontainerConfigurationCommand: DevcontainerConfigurationCommand;
  let logger: LoggerService;
  let pullRequestTemplateCommand: PullRequestTemplateCommand;

  const createTestingModule = async (): Promise<TestingModule> => {
    return Test.createTestingModule({
      providers: [
        SynchronizationCommand,
        createCommandProvider(AgentSkillsCommand),
        createCommandProvider(ConformanceGeneratorsCommand),
        createCommandProvider(ConventionalConfigCommand),
        createCommandProvider(DevcontainerConfigurationCommand),
        createCommandProvider(PullRequestTemplateCommand),
        createCommandProvider(LoggerService),
      ],
    }).compile();
  };

  beforeAll(async () => {
    const module = await createTestingModule();

    agentSkillsCommand = await module.resolve(AgentSkillsCommand);
    command = await module.resolve(SynchronizationCommand);
    conformanceGeneratorsCommand = await module.resolve(
      ConformanceGeneratorsCommand,
    );
    conventionalConfigCommand = await module.resolve(ConventionalConfigCommand);
    devcontainerConfigurationCommand = await module.resolve(
      DevcontainerConfigurationCommand,
    );
    logger = await module.resolve(LoggerService);
    pullRequestTemplateCommand = await module.resolve(
      PullRequestTemplateCommand,
    );
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await createTestingModule();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith("SynchronizationCommand");
  });

  it("runs all sync commands in order with default check mode", async () => {
    await command.run([]);

    expect(agentSkillsCommand.run).toHaveBeenNthCalledWith(1, ["check"]);
    expect(conformanceGeneratorsCommand.run).toHaveBeenNthCalledWith(1, [
      "check",
    ]);
    expect(conventionalConfigCommand.run).toHaveBeenNthCalledWith(1, ["check"]);
    expect(devcontainerConfigurationCommand.run).toHaveBeenNthCalledWith(1, [
      "check",
    ]);
    expect(pullRequestTemplateCommand.run).toHaveBeenNthCalledWith(1, [
      "check",
    ]);
    expect(logger.log).toHaveBeenCalledWith(
      "🔄 Running 5 synchronization commands in check mode",
    );
    expect(logger.log).toHaveBeenCalledWith(
      "✅ Synchronization suite completed",
    );
  });

  it("runs all sync commands with write mode", async () => {
    await command.run(["write"]);

    expect(agentSkillsCommand.run).toHaveBeenNthCalledWith(1, ["write"]);
    expect(conformanceGeneratorsCommand.run).toHaveBeenNthCalledWith(1, [
      "write",
    ]);
    expect(conventionalConfigCommand.run).toHaveBeenNthCalledWith(1, ["write"]);
    expect(devcontainerConfigurationCommand.run).toHaveBeenNthCalledWith(1, [
      "write",
    ]);
    expect(pullRequestTemplateCommand.run).toHaveBeenNthCalledWith(1, [
      "write",
    ]);
  });

  it("throws for invalid mode", async () => {
    await expect(command.run(["invalid-mode"])).rejects.toThrow(
      "Invalid synchronization mode: invalid-mode",
    );

    expect(logger.error).toHaveBeenCalledWith("❌ Invalid mode: invalid-mode");
    expect(logger.error).toHaveBeenCalledWith(
      "💡 Usage: synchronization [check|write]",
    );
    expect(agentSkillsCommand.run).not.toHaveBeenCalled();
    expect(conformanceGeneratorsCommand.run).not.toHaveBeenCalled();
    expect(conventionalConfigCommand.run).not.toHaveBeenCalled();
    expect(devcontainerConfigurationCommand.run).not.toHaveBeenCalled();
    expect(pullRequestTemplateCommand.run).not.toHaveBeenCalled();
  });
});
