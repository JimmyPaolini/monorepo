import "reflect-metadata";

import { CommandFactory } from "nest-commander";

import { LexicoIngestionModule } from "./lexico-ingestion.module";

async function main(): Promise<void> {
  await CommandFactory.run(LexicoIngestionModule, ["warn", "error"]);
}

void main();
