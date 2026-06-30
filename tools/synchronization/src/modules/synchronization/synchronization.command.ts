import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { AgentSkillsCommand } from "../agent-skills/agent-skills.command";
import { ConformanceGeneratorsCommand } from "../conformance-generators/conformance-generators.command";
import { ConventionalConfigCommand } from "../conventional-config/conventional-config.command";
import { DevcontainerConfigurationCommand } from "../devcontainer-configuration/devcontainer-configuration.command";
import { LoggerService } from "../logger/logger.service";
import { PullRequestTemplateCommand } from "../pull-request-template/pull-request-template.command";

import { SynchronizationModeService } from "./synchronization-mode.service";

import type {
  SynchronizationMode,
  SynchronizationTask,
} from "./synchronization.types";

/**
 * CLI entry point for synchronization.
 */
@Command({
  description: "Run the synchronization command-line application",
  name: "synchronization",
})
@Injectable()
export class SynchronizationCommand extends CommandRunner {
  constructor(
    private readonly agentSkillsCommand: AgentSkillsCommand,
    private readonly conformanceGeneratorsCommand: ConformanceGeneratorsCommand,
    private readonly conventionalConfigCommand: ConventionalConfigCommand,
    private readonly devcontainerConfigurationCommand: DevcontainerConfigurationCommand,
    private readonly loggerService: LoggerService,
    private readonly pullRequestTemplateCommand: PullRequestTemplateCommand,
    private readonly synchronizationModeService: SynchronizationModeService,
  ) {
    super();
    this.loggerService.setContext(SynchronizationCommand.name);
  }

  // 🔏 Private Methods

  /** Parses and validates synchronization mode argument. */
  private getMode(passedParameters: string[]): SynchronizationMode {
    return this.synchronizationModeService.resolveSynchronizationModeOrThrow({
      invalidModeLabel: "Invalid mode",
      loggerService: this.loggerService,
      passedParameters,
      usageMessage: "💡 Usage: synchronization [check|write]",
    });
  }

  /** Builds the ordered task list executed by the root synchronization command. */
  private getTasks(): SynchronizationTask[] {
    return [
      {
        commandName: "agent-skills",
        runCommand: async (mode: SynchronizationMode): Promise<void> => {
          await this.agentSkillsCommand.run([mode]);
        },
      },
      {
        commandName: "conformance-generators",
        runCommand: async (mode: SynchronizationMode): Promise<void> => {
          await this.conformanceGeneratorsCommand.run([mode]);
        },
      },
      {
        commandName: "conventional-config",
        runCommand: async (mode: SynchronizationMode): Promise<void> => {
          await this.conventionalConfigCommand.run([mode]);
        },
      },
      {
        commandName: "devcontainer-configuration",
        runCommand: async (mode: SynchronizationMode): Promise<void> => {
          await this.devcontainerConfigurationCommand.run([mode]);
        },
      },
      {
        commandName: "pull-request-template",
        runCommand: async (mode: SynchronizationMode): Promise<void> => {
          await this.pullRequestTemplateCommand.run([mode]);
        },
      },
    ];
  }

  // 🌎 Public Methods

  /** Runs all synchronization commands in order using a shared mode. */
  async run(
    passedParameters: string[],
    _options?: Record<string, unknown>,
  ): Promise<void> {
    const mode = this.getMode(passedParameters);
    const tasks = this.getTasks();
    this.loggerService.log(
      `🔄 Running ${tasks.length} synchronization commands in ${mode} mode`,
    );

    for (const task of tasks) {
      this.loggerService.log(`➡️ Running ${task.commandName}...`);
      await task.runCommand(mode);
    }

    this.loggerService.log("✅ Synchronization suite completed");
  }
}
