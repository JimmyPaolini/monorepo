import "reflect-metadata";
import { repl } from "@nestjs/core";

import { SynchronizationModule } from "./modules/synchronization/synchronization.module";

/** Starts the NestJS REPL for interactive development. */
async function bootstrap(): Promise<void> {
  await repl(SynchronizationModule);
}

void bootstrap();
