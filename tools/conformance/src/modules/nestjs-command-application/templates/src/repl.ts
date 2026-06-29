import "reflect-metadata";

import { repl } from "@nestjs/core";

import { {{namePascalCase}}Module } from "./modules/{{nameKebabCase}}/{{nameKebabCase}}.module";

async function bootstrap(): Promise<void> {
  await repl({{namePascalCase}}Module);
}

void bootstrap();
