import { MathModule } from "@caelundas/src/modules/math/math.module";
import { Module } from "@nestjs/common";

import { EphemerisAggregatesService } from "./ephemeris.aggregates";
import { EphemerisService } from "./ephemeris.service";

/**
 *
 */
@Module({
  imports: [MathModule],
  providers: [EphemerisService, EphemerisAggregatesService],
  exports: [EphemerisService, EphemerisAggregatesService],
})
export class EphemerisModule {}
