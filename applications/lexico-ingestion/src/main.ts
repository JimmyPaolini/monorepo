import "reflect-metadata";
import { CommandFactory } from "nest-commander";

import { LexicoIngestionModule } from "./modules/lexico-ingestion/lexico-ingestion.module";
import { LoggerService } from "./modules/logger/logger.service";

import type { CommandFactoryRunOptions } from "nest-commander/src/command-factory.interface";

async function main(): Promise<void> {
  const logger = new LoggerService();
  logger.setContext("CommandFactory");
  const options: CommandFactoryRunOptions = { bufferLogs: true, logger };
  await CommandFactory.run(LexicoIngestionModule, options);
}

void main();
