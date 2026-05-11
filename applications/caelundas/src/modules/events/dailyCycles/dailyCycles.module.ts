import { EphemerisModule } from "@caelundas/src/modules/ephemeris/ephemeris.module";
import { MathModule } from "@caelundas/src/modules/math/math.module";
import { Module } from "@nestjs/common";

import { DailyCyclesService } from "./dailyCycles.service";

/**
 * NestJS module for daily solar and lunar cycle event detection.
 * Exports {@link DailyCyclesService} which identifies sunrise, solar noon, sunset,
 * solar midnight, moonrise, lunar noon, moonset, and lunar midnight events.
 */
@Module({
  imports: [EphemerisModule, MathModule],
  providers: [DailyCyclesService],
  exports: [DailyCyclesService],
})
export class DailyCyclesModule {}
