import { MathModule } from "@caelundas/src/modules/math/math.module";
import { Module } from "@nestjs/common";

import { SextupleAspectsService } from "./sextuple-aspects.service";

/**
 * NestJS module for 6-body compound aspect pattern detection.
 * Exports {@link SextupleAspectsService} which identifies Hexagram (Star of David)
 * configurations from trine and sextile aspects among six celestial bodies.
 */
@Module({
  controllers: [],
  exports: [SextupleAspectsService],
  imports: [MathModule],
  providers: [SextupleAspectsService],
})
export class SextupleAspectsModule {}
