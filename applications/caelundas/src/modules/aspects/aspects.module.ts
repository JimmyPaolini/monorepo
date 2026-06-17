import { MajorAspectsModule } from "@caelundas/src/modules/major-aspects/major-aspects.module";
import { MinorAspectsModule } from "@caelundas/src/modules/minor-aspects/minor-aspects.module";
import { QuadrupleAspectsModule } from "@caelundas/src/modules/quadruple-aspects/quadruple-aspects.module";
import { QuintupleAspectsModule } from "@caelundas/src/modules/quintuple-aspects/quintuple-aspects.module";
import { SextupleAspectsModule } from "@caelundas/src/modules/sextuple-aspects/sextuple-aspects.module";
import { SextupleAspectsService } from "@caelundas/src/modules/sextuple-aspects/sextuple-aspects.service";
import { SpecialtyAspectsModule } from "@caelundas/src/modules/specialty-aspects/specialty-aspects.module";
import { SpecialtyAspectsService } from "@caelundas/src/modules/specialty-aspects/specialty-aspects.service";
import { StelliumModule } from "@caelundas/src/modules/stellium/stellium.module";
import { StelliumService } from "@caelundas/src/modules/stellium/stellium.service";
import { TripleAspectsModule } from "@caelundas/src/modules/triple-aspects/triple-aspects.module";
import { TripleAspectsService } from "@caelundas/src/modules/triple-aspects/triple-aspects.service";
import { Module } from "@nestjs/common";

import { MajorAspectsService } from "../major-aspects/major-aspects.service";
import { MinorAspectsService } from "../minor-aspects/minor-aspects.service";
import { QuadrupleAspectsService } from "../quadruple-aspects/quadruple-aspects.service";
import { QuintupleAspectsService } from "../quintuple-aspects/quintuple-aspects.service";

import {
  COMPOSITE_ASPECT_DETECTORS_TOKEN,
  PROGRESSIVE_ASPECT_DETECTORS_TOKEN,
  SIMPLE_ASPECT_DETECTORS_TOKEN,
} from "./aspects.constants";
import { AspectsService } from "./aspects.service";

import type {
  CompositeAspectDetector,
  ProgressiveAspectDetector,
  SimpleAspectDetector,
} from "./aspects.types";

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
  providers: [
    AspectsService,
    {
      inject: [
        MajorAspectsService,
        MinorAspectsService,
        SpecialtyAspectsService,
      ],
      provide: SIMPLE_ASPECT_DETECTORS_TOKEN,
      useFactory: (
        majorAspectsService: MajorAspectsService,
        minorAspectsService: MinorAspectsService,
        specialtyAspectsService: SpecialtyAspectsService,
      ): SimpleAspectDetector[] => [
        majorAspectsService,
        minorAspectsService,
        specialtyAspectsService,
      ],
    },
    {
      inject: [
        TripleAspectsService,
        QuadrupleAspectsService,
        QuintupleAspectsService,
        SextupleAspectsService,
        StelliumService,
      ],
      provide: COMPOSITE_ASPECT_DETECTORS_TOKEN,
      useFactory: (
        tripleAspectsService: TripleAspectsService,
        quadrupleAspectsService: QuadrupleAspectsService,
        quintupleAspectsService: QuintupleAspectsService,
        sextupleAspectsService: SextupleAspectsService,
        stelliumService: StelliumService,
      ): CompositeAspectDetector[] => [
        tripleAspectsService,
        quadrupleAspectsService,
        quintupleAspectsService,
        sextupleAspectsService,
        stelliumService,
      ],
    },
    {
      inject: [
        MajorAspectsService,
        MinorAspectsService,
        SpecialtyAspectsService,
        TripleAspectsService,
        QuadrupleAspectsService,
        QuintupleAspectsService,
        SextupleAspectsService,
        StelliumService,
      ],
      provide: PROGRESSIVE_ASPECT_DETECTORS_TOKEN,
      useFactory: (
        majorAspectsService: MajorAspectsService,
        minorAspectsService: MinorAspectsService,
        specialtyAspectsService: SpecialtyAspectsService,
        tripleAspectsService: TripleAspectsService,
        quadrupleAspectsService: QuadrupleAspectsService,
        quintupleAspectsService: QuintupleAspectsService,
        sextupleAspectsService: SextupleAspectsService,
        stelliumService: StelliumService,
      ): ProgressiveAspectDetector[] => [
        majorAspectsService,
        minorAspectsService,
        specialtyAspectsService,
        tripleAspectsService,
        quadrupleAspectsService,
        quintupleAspectsService,
        sextupleAspectsService,
        stelliumService,
      ],
    },
  ],
})
export class AspectsModule {}
