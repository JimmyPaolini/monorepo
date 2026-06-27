import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { LoggerService } from "../logger/logger.service";

/**
 * CLI entry point for synchronization.
 */
@Command({
  description: "Run the synchronization command-line application",
  name: "synchronization",
})
@Injectable()
export class SynchronizationCommand extends CommandRunner {
  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(SynchronizationCommand.name);
  }

  /** Delegates to the configured sync sub-commands registered in the module. */
  async run(): Promise<void> {
    await Promise.resolve();
  }
}
