import "reflect-metadata";

import { CommandFactory } from "nest-commander";

import { CaelundasModule } from "./caelundas.module";

async function main(): Promise<void> {
  await CommandFactory.run(CaelundasModule, ["warn", "error"]);
}

void main();
