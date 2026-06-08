import "reflect-metadata";
import { repl } from "@nestjs/core";

import { LexicoIngestionModule } from "./modules/lexico-ingestion/lexico-ingestion.module.js";

async function bootstrap(): Promise<void> {
  await repl(LexicoIngestionModule);
}

void bootstrap();
