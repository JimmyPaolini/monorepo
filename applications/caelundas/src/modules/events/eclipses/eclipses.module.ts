import { EphemerisModule } from "@caelundas/src/modules/ephemeris/ephemeris.module";
import { MathModule } from "@caelundas/src/modules/math/math.module";
import { ProgressiveUtilitiesModule } from "@caelundas/src/modules/progressive/progressive.utilities.module";
import { Module } from "@nestjs/common";

import { EclipsesService } from "./eclipses.service";

/**
 * NestJS module for solar and lunar eclipse event detection.
 * Exports {@link EclipsesService} which identifies eclipse phases (beginning, maximum, ending)
 * in both geocentric and topocentric reference frames.
 */
@Module({
  controllers: [],
  imports: [EphemerisModule, MathModule, ProgressiveUtilitiesModule],
  providers: [EclipsesService],
  exports: [EclipsesService],
})
export class EclipsesModule {}
