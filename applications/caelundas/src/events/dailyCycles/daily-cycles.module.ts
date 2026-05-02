import { Module } from "@nestjs/common";

import { EphemerisModule } from "@caelundas/src/ephemeris/ephemeris.module";

import { DailyCyclesService } from "./daily-cycles.service";

/**
 *
 */
@Module({
  imports: [EphemerisModule],
  providers: [DailyCyclesService],
  exports: [DailyCyclesService],
})
export class DailyCyclesModule {}
