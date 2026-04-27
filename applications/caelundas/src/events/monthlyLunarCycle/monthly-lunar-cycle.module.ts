import { Module } from "@nestjs/common";

import { MonthlyLunarCycleService } from "./monthly-lunar-cycle.service";

/**
 *
 */
@Module({
  providers: [MonthlyLunarCycleService],
  exports: [MonthlyLunarCycleService],
})
export class MonthlyLunarCycleModule {}
