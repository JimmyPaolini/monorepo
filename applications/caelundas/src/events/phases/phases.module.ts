import { Module } from "@nestjs/common";

import { EphemerisModule } from "@caelundas/src/ephemeris/ephemeris.module";

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
