import { EphemerisModule } from "@caelundas/src/modules/ephemeris/ephemeris.module";
import { MathModule } from "@caelundas/src/modules/math/math.module";
import { ProgressiveUtilitiesModule } from "@caelundas/src/modules/progressive/progressive.utilities.module";
import { Module } from "@nestjs/common";

import { EclipsesService } from "./eclipses.service";

/**
 *
 */
@Module({
  imports: [EphemerisModule, MathModule, ProgressiveUtilitiesModule],
  providers: [EclipsesService],
  exports: [EclipsesService],
})
export class EclipsesModule {}
