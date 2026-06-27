import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

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
  let command: SynchronizationCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
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

    command = await module.resolve(SynchronizationCommand);
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
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

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith("SynchronizationCommand");
  });
});
