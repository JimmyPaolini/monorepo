import { EphemerisModule } from "@caelundas/src/ephemeris/ephemeris.module";
import { Module } from "@nestjs/common";

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
