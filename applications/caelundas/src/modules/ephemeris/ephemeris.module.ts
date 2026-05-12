import { MathModule } from "@caelundas/src/modules/math/math.module";
import { Module } from "@nestjs/common";

import { EphemerisService } from "./ephemeris.service";

/**
 * NestJS module providing Swiss Ephemeris astronomical calculations.
 * Exports {@link EphemerisService} for computing planetary positions, illumination, and diameters.
 */
@Module({
  imports: [MathModule],
  providers: [EphemerisService],
  exports: [EphemerisService],
})
export class EphemerisModule {}
