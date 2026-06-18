import "reflect-metadata";
import { repl } from "@nestjs/core";

import { LexicoIngestionModule } from "./modules/lexico-ingestion/lexico-ingestion.module";

/** Starts an interactive NestJS REPL session for the ingestion module — useful for ad-hoc service calls during development. */
async function bootstrap(): Promise<void> {
  await repl(LexicoIngestionModule);
}

void bootstrap();
