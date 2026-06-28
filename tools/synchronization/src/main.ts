import "reflect-metadata";
import { CommandFactory } from "nest-commander";

import { LoggerService } from "./modules/logger/logger.service";
import { SynchronizationModule } from "./modules/synchronization/synchronization.module";

/** Bootstraps the synchronization CLI application. */
async function main(): Promise<void> {
  const logger = new LoggerService();
  logger.setContext("CommandFactory");

  await CommandFactory.run(SynchronizationModule, { bufferLogs: true, logger });
}

void main();
