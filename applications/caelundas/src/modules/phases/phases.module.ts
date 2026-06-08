import { EphemerisModule } from "@caelundas/src/modules/ephemeris/ephemeris.module";
import { MathModule } from "@caelundas/src/modules/math/math.module";
import { ProgressiveUtilitiesModule } from "@caelundas/src/modules/progressive/progressive.utilities.module";
import { Module } from "@nestjs/common";

import { PhasesService } from "./phases.service";

/**
 * NestJS module for inner-planet phase event detection.
 * Exports {@link PhasesService} which identifies Venus, Mercury, and Mars phase events
 * such as maximum elongation, maximum brightness, and morning/evening visibility transitions.
 */
@Module({
  controllers: [],
  exports: [PhasesService],
  imports: [EphemerisModule, MathModule, ProgressiveUtilitiesModule],
  providers: [PhasesService],
})
export class PhasesModule {}
