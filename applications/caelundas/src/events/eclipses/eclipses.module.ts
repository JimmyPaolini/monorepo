import { EphemerisModule } from "@caelundas/src/ephemeris/ephemeris.module";
import { MathModule } from "@caelundas/src/math/math.module";
import { Module } from "@nestjs/common";

import { EclipsesService } from "./eclipses.service";

/**
 *
 */
@Module({
  imports: [EphemerisModule, MathModule],
  providers: [EclipsesService],
  exports: [EclipsesService],
})
export class EclipsesModule {}
