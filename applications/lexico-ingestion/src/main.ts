import "reflect-metadata";

import { CommandFactory } from "nest-commander";

import { LexicoIngestionModule } from "./lexicoIngestion.module";

async function main(): Promise<void> {
  await CommandFactory.run(LexicoIngestionModule, ["warn", "error"]);
}

void main();
