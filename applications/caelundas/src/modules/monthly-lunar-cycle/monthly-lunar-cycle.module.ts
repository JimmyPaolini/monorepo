import { EphemerisModule } from "@caelundas/src/modules/ephemeris/ephemeris.module";
import { Module } from "@nestjs/common";

import { MonthlyLunarCycleService } from "./monthly-lunar-cycle.service";

/**
 * NestJS module for monthly lunar cycle event detection.
 * Exports {@link MonthlyLunarCycleService} which identifies the four primary lunar phases.
 */
@Module({
  controllers: [],
  exports: [MonthlyLunarCycleService],
  imports: [EphemerisModule],
  providers: [MonthlyLunarCycleService],
})
export class MonthlyLunarCycleModule {}
