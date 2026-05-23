import { MajorAspectsModule } from "@caelundas/src/modules/majorAspects/majorAspects.module";
import { MinorAspectsModule } from "@caelundas/src/modules/minorAspects/minorAspects.module";
import { QuadrupleAspectsModule } from "@caelundas/src/modules/quadrupleAspects/quadrupleAspects.module";
import { QuintupleAspectsModule } from "@caelundas/src/modules/quintupleAspects/quintupleAspects.module";
import { SextupleAspectsModule } from "@caelundas/src/modules/sextupleAspects/sextupleAspects.module";
import { SpecialtyAspectsModule } from "@caelundas/src/modules/specialtyAspects/specialtyAspects.module";
import { StelliumModule } from "@caelundas/src/modules/stellium/stellium.module";
import { TripleAspectsModule } from "@caelundas/src/modules/tripleAspects/tripleAspects.module";
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
