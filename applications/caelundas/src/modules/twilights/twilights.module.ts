import { EphemerisModule } from "@caelundas/src/modules/ephemeris/ephemeris.module";
import { MathModule } from "@caelundas/src/modules/math/math.module";
import { ProgressiveUtilitiesModule } from "@caelundas/src/modules/progressive/progressive.utilities.module";
import { Module } from "@nestjs/common";

import { TwilightsService } from "./twilights.service";

/**
 * NestJS module for solar twilight event detection.
 * Exports {@link TwilightsService} which identifies astronomical, nautical, and civil
 * dawn and dusk transitions based on solar depression angles.
 */
@Module({
  controllers: [],
  exports: [TwilightsService],
  imports: [EphemerisModule, MathModule, ProgressiveUtilitiesModule],
  providers: [TwilightsService],
})
export class TwilightsModule {}
