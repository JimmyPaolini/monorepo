import { MathModule } from "@caelundas/src/modules/math/math.module";
import { Module } from "@nestjs/common";

import { AspectsUtilities } from "./aspects.utilities";

/**
 * NestJS module providing core aspect detection utilities.
 * Exports {@link AspectsUtilities} for orb checking and aspect-phase classification.
 */
@Module({
  controllers: [],
  exports: [AspectsUtilities],
  imports: [MathModule],
  providers: [AspectsUtilities],
})
export class AspectsUtilitiesModule {}
