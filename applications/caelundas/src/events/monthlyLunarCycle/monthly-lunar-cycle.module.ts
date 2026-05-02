import { EphemerisModule } from "@caelundas/src/ephemeris/ephemeris.module";
import { Module } from "@nestjs/common";


import { MonthlyLunarCycleService } from "./monthly-lunar-cycle.service";

/**
 *
 */
@Module({
  imports: [EphemerisModule],
  providers: [MonthlyLunarCycleService],
  exports: [MonthlyLunarCycleService],
})
export class MonthlyLunarCycleModule {}
