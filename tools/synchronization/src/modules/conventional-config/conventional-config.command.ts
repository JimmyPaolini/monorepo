import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { LoggerService } from "../logger/logger.service";

import { ConventionalConfigSynchronizationService } from "./conventional-config-synchronization.service";

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
    private readonly synchronizationService: ConventionalConfigSynchronizationService,
    private readonly logger: LoggerService,
  ) {
    super();
    this.logger.setContext(ConventionalConfigCommand.name);
  }

  // 🌎 Public Methods

  /** Runs the conventional-config sync command, delegating to helpers and exiting 1 on drift. */
  async run(
    passedParameters: string[],
    _options?: Record<string, unknown>,
  ): Promise<void> {
    await Promise.resolve();
    const mode = passedParameters[0] ?? "";
    this.synchronizationService.runSynchronization(mode);
  }
}
