import { Module } from "@nestjs/common";

import { LoggerModule } from "../logger/logger.module";

import { ConformanceGeneratorsCommand } from "./conformance-generators.command";

/**
 * TODO: Document the conformanceGenerators module.
 */
@Module({
  controllers: [],
  exports: [ConformanceGeneratorsCommand],
  imports: [LoggerModule],
  providers: [ConformanceGeneratorsCommand],
})
export class ConformanceGeneratorsModule {}
