import { EphemerisModule } from "@caelundas/src/ephemeris/ephemeris.module";
import { MathModule } from "@caelundas/src/math/math.module";
import { Module } from "@nestjs/common";

import { AnnualSolarCycleService } from "./annual-solar-cycle.service";

/**
 *
 */
@Module({
  imports: [EphemerisModule, MathModule],
  providers: [AnnualSolarCycleService],
  exports: [AnnualSolarCycleService],
})
export class AnnualSolarCycleModule {}
