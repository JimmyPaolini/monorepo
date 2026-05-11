import { EphemerisModule } from "@caelundas/src/modules/ephemeris/ephemeris.module";
import { MathModule } from "@caelundas/src/modules/math/math.module";
import { ProgressiveUtilitiesModule } from "@caelundas/src/modules/progressive/progressive.utilities.module";
import { Module } from "@nestjs/common";

import { PhasesService } from "./phases.service";

/**
 *
 */
@Module({
  imports: [EphemerisModule, MathModule, ProgressiveUtilitiesModule],
  providers: [PhasesService],
  exports: [PhasesService],
})
export class PhasesModule {}
