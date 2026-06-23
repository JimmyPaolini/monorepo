import { Module } from "@nestjs/common";

import { ProgressiveUtilitiesService } from "./progressive-utilities.service";

/**
 * NestJS module providing utilities for progressive event construction.
 * Exports {@link ProgressiveUtilitiesService} for pairing start/end events into duration spans.
 */
@Module({
  controllers: [],
  exports: [ProgressiveUtilitiesService],
  imports: [],
  providers: [ProgressiveUtilitiesService],
})
export class ProgressiveUtilitiesModule {}
