import "reflect-metadata";

import { CommandFactory } from "nest-commander";

import { AppModule } from "./app.module";

async function main(): Promise<void> {
  await CommandFactory.run(AppModule, ["warn", "error"]);
}

void main();
