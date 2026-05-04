import { EphemerisModule } from "@caelundas/src/ephemeris/ephemeris.module";
import { Module } from "@nestjs/common";

import { PhasesService } from "./phases.service";

/**
 *
 */
@Module({
  imports: [EphemerisModule],
  providers: [PhasesService],
  exports: [PhasesService],
})
export class PhasesModule {}
