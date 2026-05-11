import { MathModule } from "@caelundas/src/modules/math/math.module";
import { Module } from "@nestjs/common";

import { EphemerisService } from "./ephemeris.service";

/**
 *
 */
@Module({
  imports: [MathModule],
  providers: [EphemerisService],
  exports: [EphemerisService],
})
export class EphemerisModule {}
