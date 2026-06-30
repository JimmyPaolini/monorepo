import { Module } from "@nestjs/common";

import { LoggerModule } from "../logger/logger.module";
import { SynchronizationModeService } from "../synchronization/synchronization-mode.service";

import { ConformanceGeneratorsCommand } from "./conformance-generators.command";

/**
 * TODO: Document the conformanceGenerators module.
 */
@Module({
  controllers: [],
  exports: [ConformanceGeneratorsCommand],
  imports: [LoggerModule],
  providers: [ConformanceGeneratorsCommand, SynchronizationModeService],
})
export class ConformanceGeneratorsModule {}
