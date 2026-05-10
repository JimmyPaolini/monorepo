import { EphemerisModule } from "@caelundas/src/ephemeris/ephemeris.module";
import { MathModule } from "@caelundas/src/math/math.module";
import { Module } from "@nestjs/common";

import { TwilightsService } from "./twilights.service";

/**
 *
 */
@Module({
  imports: [EphemerisModule, MathModule],
  providers: [TwilightsService],
  exports: [TwilightsService],
})
export class TwilightsModule {}
