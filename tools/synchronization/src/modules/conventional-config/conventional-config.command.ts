import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { LoggerService } from "../logger/logger.service";
import { SynchronizationModeService } from "../synchronization/synchronization-mode.service";

import { ConventionalConfigService } from "./conventional-config.service";

/**
 * CLI command that runs the conventional-config sync in check or write mode.
 * Reads the mode from the first positional argument (check|write) and delegates
 * to the synchronization service, exiting with code 1 on drift.
 */
@Command({
  description: "Sync conventional commit config files (check|write)",
  name: "conventional-config",
})
@Injectable()
export class ConventionalConfigCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(
    private readonly conventionalConfigService: ConventionalConfigService,
    private readonly loggerService: LoggerService,
    private readonly synchronizationModeService: SynchronizationModeService,
  ) {
    super();
    this.loggerService.setContext(ConventionalConfigCommand.name);
  }

  // 🌎 Public Methods

  /** Runs the conventional-config sync command, delegating to helpers and exiting 1 on drift. */
  async run(
    passedParameters: string[],
    _options?: Record<string, unknown>,
  ): Promise<void> {
    await Promise.resolve();
    const mode =
      this.synchronizationModeService.resolveSynchronizationModeOrExit({
        invalidModeLabel: "Invalid mode",
        loggerService: this.loggerService,
        passedParameters,
        usageMessage:
          "💡 Usage: nx run synchronization:conventional-config [check|write]",
      });
    this.conventionalConfigService.runSynchronization(mode);
  }
}
