import { EphemerisModule } from "@caelundas/src/modules/ephemeris/ephemeris.module";
import { MathModule } from "@caelundas/src/modules/math/math.module";
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
