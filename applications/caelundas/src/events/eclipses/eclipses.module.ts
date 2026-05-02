import { Module } from "@nestjs/common";

import { EphemerisModule } from "@caelundas/src/ephemeris/ephemeris.module";

import { EclipsesService } from "./eclipses.service";

/**
 *
 */
@Module({
  imports: [EphemerisModule],
  providers: [EclipsesService],
  exports: [EclipsesService],
})
export class EclipsesModule {}
