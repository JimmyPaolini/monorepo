import { Module } from "@nestjs/common";

import { ProgressiveUtilities } from "./progressive.utilities";

/**
 * NestJS module providing utilities for progressive event construction.
 * Exports {@link ProgressiveUtilities} for pairing start/end events into duration spans.
 */
@Module({
  controllers: [],
  exports: [ProgressiveUtilities],
  imports: [],
  providers: [ProgressiveUtilities],
})
export class ProgressiveUtilitiesModule {}
