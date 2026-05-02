import { Module } from "@nestjs/common";

import { EphemerisModule } from "@caelundas/src/ephemeris/ephemeris.module";

import { TwilightsService } from "./twilights.service";

/**
 *
 */
@Module({
  imports: [EphemerisModule],
  providers: [TwilightsService],
  exports: [TwilightsService],
})
export class TwilightsModule {}
