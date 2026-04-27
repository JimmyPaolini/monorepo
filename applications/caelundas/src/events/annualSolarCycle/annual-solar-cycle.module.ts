import { Module } from "@nestjs/common";

import { AnnualSolarCycleService } from "./annual-solar-cycle.service";

/**
 *
 */
@Module({
  providers: [AnnualSolarCycleService],
  exports: [AnnualSolarCycleService],
})
export class AnnualSolarCycleModule {}
