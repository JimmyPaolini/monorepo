import { Module } from "@nestjs/common";

import { DailyCyclesService } from "./daily-cycles.service";

/**
 *
 */
@Module({
  providers: [DailyCyclesService],
  exports: [DailyCyclesService],
})
export class DailyCyclesModule {}
