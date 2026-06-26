import { MathModule } from "@caelundas/src/modules/math/math.module";
import { Module } from "@nestjs/common";

import { AspectsUtilities } from "./aspects.utilities";
import { SimpleAspectsEventService } from "./simple-aspects-event.service";

/**
 * NestJS module providing core aspect detection utilities.
 * Exports {@link AspectsUtilities} for orb checking and aspect-phase classification.
 */
@Module({
  controllers: [],
  exports: [AspectsUtilities, SimpleAspectsEventService],
  imports: [MathModule],
  providers: [AspectsUtilities, SimpleAspectsEventService],
})
export class AspectsUtilitiesModule {}
