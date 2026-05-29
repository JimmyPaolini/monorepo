import "reflect-metadata";

import { CommandFactory } from "nest-commander";

import { {{namePascalCase}}Module } from "./{{nameKebabCase}}.module";

async function main(): Promise<void> {
  await CommandFactory.run({{namePascalCase}}Module, ["warn", "error"]);
}

void main();
