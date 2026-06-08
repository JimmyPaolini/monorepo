import "reflect-metadata";
import { CommandFactory } from "nest-commander";

import { CaelundasModule } from "./modules/caelundas/caelundas.module";
import { LoggerService } from "./modules/logger/logger.service";

async function main(): Promise<void> {
  const logger = new LoggerService();
  logger.setContext("CommandFactory");

  await CommandFactory.run(CaelundasModule, { bufferLogs: true, logger });
}

void main();
