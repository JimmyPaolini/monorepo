import { EphemerisModule } from "@caelundas/src/ephemeris/ephemeris.module";
import { MathModule } from "@caelundas/src/math/math.module";
import { Module } from "@nestjs/common";

import { DailyCyclesService } from "./daily-cycles.service";

/**
 *
 */
@Module({
  imports: [EphemerisModule, MathModule],
  providers: [DailyCyclesService],
  exports: [DailyCyclesService],
})
export class DailyCyclesModule {}
