import "reflect-metadata";

import { CommandFactory } from "nest-commander";

import { {{namePascalCase}}Module } from "./modules/{{nameKebabCase}}/{{nameKebabCase}}.module";
import { LoggerService } from "./modules/logger/logger.service";

async function main(): Promise<void> {
  const logger = new LoggerService();
  logger.setContext("CommandFactory");

  await CommandFactory.run({{namePascalCase}}Module, { bufferLogs: true, logger });
}

void main();
