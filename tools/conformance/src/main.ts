import "reflect-metadata";
import { CommandFactory } from "nest-commander";

import { ConformanceModule } from "./conformance.module";
import { LoggerService } from "./modules/logger/logger.service";

import type { CommandFactoryRunOptions } from "nest-commander/src/command-factory.interface";

/**
 * Auto-generated documentation placeholder.
 */
async function main(): Promise<void> {
  const logger = new LoggerService();
  logger.setContext("CommandFactory");
  const options: CommandFactoryRunOptions = { bufferLogs: true, logger };
  await CommandFactory.run(ConformanceModule, options);
}

void main();
