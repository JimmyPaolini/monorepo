import { EphemerisModule } from "@caelundas/src/modules/ephemeris/ephemeris.module";
import { Module } from "@nestjs/common";

import { MonthlyLunarCycleService } from "./monthlyLunarCycle.service";

/**
 * NestJS module for monthly lunar cycle event detection.
 * Exports {@link MonthlyLunarCycleService} which identifies the four primary lunar phases.
 */
@Module({
  imports: [EphemerisModule],
  providers: [MonthlyLunarCycleService],
  exports: [MonthlyLunarCycleService],
})
export class MonthlyLunarCycleModule {}
