import { EphemerisModule } from "@caelundas/src/modules/ephemeris/ephemeris.module";
import { MathModule } from "@caelundas/src/modules/math/math.module";
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
