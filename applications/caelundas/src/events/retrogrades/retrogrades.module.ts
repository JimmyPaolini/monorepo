import { Module } from "@nestjs/common";

import { EphemerisModule } from "@caelundas/src/ephemeris/ephemeris.module";

import { RetrogradesService } from "./retrogrades.service";

/**
 *
 */
@Module({
  imports: [EphemerisModule],
  providers: [RetrogradesService],
  exports: [RetrogradesService],
})
export class RetrogradesModule {}
