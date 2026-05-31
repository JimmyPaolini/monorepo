import { Global, Module } from "@nestjs/common";

import { LexicoIngestionLogger } from "./logger.service";

/**
 * Global logger module — import once in the root module and
 * `LexicoIngestionLogger` becomes injectable everywhere without
 * needing to add this module to individual feature module imports.
 */
@Global()
@Module({
  controllers: [],
  exports: [LexicoIngestionLogger],
  imports: [],
  providers: [LexicoIngestionLogger],
})
export class LoggerModule {}
