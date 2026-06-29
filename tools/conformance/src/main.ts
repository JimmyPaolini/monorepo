import "reflect-metadata";
import { CommandFactory } from "nest-commander";

// eslint-disable-next-line unicorn/prevent-abbreviations
import { AppModule } from "./modules/app.module";
import { LoggerService } from "./modules/logger/logger.service";

import type { CommandFactoryRunOptions } from "nest-commander/src/command-factory.interface";

/**
 * Auto-generated documentation placeholder.
 */
async function main(): Promise<void> {
  const logger = new LoggerService();
  logger.setContext("CommandFactory");
  const options: CommandFactoryRunOptions = { bufferLogs: true, logger };
  await CommandFactory.run(AppModule, options);
}

void main();
