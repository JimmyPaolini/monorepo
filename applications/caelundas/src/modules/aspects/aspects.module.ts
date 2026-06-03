import { MajorAspectsModule } from "@caelundas/src/modules/major-aspects/major-aspects.module";
import { MinorAspectsModule } from "@caelundas/src/modules/minor-aspects/minor-aspects.module";
import { QuadrupleAspectsModule } from "@caelundas/src/modules/quadruple-aspects/quadruple-aspects.module";
import { QuintupleAspectsModule } from "@caelundas/src/modules/quintuple-aspects/quintuple-aspects.module";
import { SextupleAspectsModule } from "@caelundas/src/modules/sextuple-aspects/sextuple-aspects.module";
import { SpecialtyAspectsModule } from "@caelundas/src/modules/specialty-aspects/specialty-aspects.module";
import { StelliumModule } from "@caelundas/src/modules/stellium/stellium.module";
import { TripleAspectsModule } from "@caelundas/src/modules/triple-aspects/triple-aspects.module";
import { Module } from "@nestjs/common";

import { AspectsService } from "./aspects.service";

/**
 * NestJS module for astronomical aspect detection.
 * Orchestrates all aspect-type sub-modules and exports {@link AspectsService} which
 * composes 2-body and multi-body pattern detection across the full aspect taxonomy.
 */
@Module({
  controllers: [],
  exports: [AspectsService],
  imports: [
    MajorAspectsModule,
    MinorAspectsModule,
    TripleAspectsModule,
    QuadrupleAspectsModule,
    QuintupleAspectsModule,
    SextupleAspectsModule,
    SpecialtyAspectsModule,
    StelliumModule,
  ],
  providers: [AspectsService],
})
export class AspectsModule {}
