import { EphemerisModule } from "@caelundas/src/ephemeris/ephemeris.module";
import { MathModule } from "@caelundas/src/math/math.module";
import { Module } from "@nestjs/common";

import { PhasesService } from "./phases.service";

/**
 *
 */
@Module({
  imports: [EphemerisModule, MathModule],
  providers: [PhasesService],
  exports: [PhasesService],
})
export class PhasesModule {}
