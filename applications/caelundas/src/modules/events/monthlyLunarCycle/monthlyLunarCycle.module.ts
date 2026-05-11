import { EphemerisModule } from "@caelundas/src/modules/ephemeris/ephemeris.module";
import { Module } from "@nestjs/common";

import { MonthlyLunarCycleService } from "./monthlyLunarCycle.service";

/**
 *
 */
@Module({
  imports: [EphemerisModule],
  providers: [MonthlyLunarCycleService],
  exports: [MonthlyLunarCycleService],
})
export class MonthlyLunarCycleModule {}
