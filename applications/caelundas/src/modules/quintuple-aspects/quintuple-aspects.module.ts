import { MathModule } from "@caelundas/src/modules/math/math.module";
import { Module } from "@nestjs/common";

import { QuintupleAspectsService } from "./quintuple-aspects.service";

/**
 * NestJS module for 5-body compound aspect pattern detection.
 * Exports {@link QuintupleAspectsService} which identifies Pentagram configurations
 * from quintile (72°) aspects among five celestial bodies.
 */
@Module({
  controllers: [],
  exports: [QuintupleAspectsService],
  imports: [MathModule],
  providers: [QuintupleAspectsService],
})
export class QuintupleAspectsModule {}
