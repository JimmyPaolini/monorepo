import { EphemerisModule } from "@caelundas/src/ephemeris/ephemeris.module";
import { MathModule } from "@caelundas/src/math/math.module";
import { Module } from "@nestjs/common";

import { RetrogradesService } from "./retrogrades.service";

/**
 *
 */
@Module({
  imports: [EphemerisModule, MathModule],
  providers: [RetrogradesService],
  exports: [RetrogradesService],
})
export class RetrogradesModule {}
