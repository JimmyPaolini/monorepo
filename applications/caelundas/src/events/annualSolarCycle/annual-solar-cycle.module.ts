import { Module } from "@nestjs/common";

import { EphemerisModule } from "@caelundas/src/ephemeris/ephemeris.module";

import { AnnualSolarCycleService } from "./annual-solar-cycle.service";

/**
 *
 */
@Module({
  imports: [EphemerisModule],
  providers: [AnnualSolarCycleService],
  exports: [AnnualSolarCycleService],
})
export class AnnualSolarCycleModule {}
