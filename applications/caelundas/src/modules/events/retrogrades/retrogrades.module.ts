import { EphemerisModule } from "@caelundas/src/modules/ephemeris/ephemeris.module";
import { MathModule } from "@caelundas/src/modules/math/math.module";
import { ProgressiveUtilitiesModule } from "@caelundas/src/modules/progressive/progressive.utilities.module";
import { Module } from "@nestjs/common";

import { RetrogradesService } from "./retrogrades.service";

/**
 * NestJS module for planetary retrograde event detection.
 * Exports {@link RetrogradesService} which identifies when planets reverse apparent direction.
 */
@Module({
  controllers: [],
  imports: [EphemerisModule, MathModule, ProgressiveUtilitiesModule],
  providers: [RetrogradesService],
  exports: [RetrogradesService],
})
export class RetrogradesModule {}
