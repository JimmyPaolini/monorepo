import { EphemerisModule } from "@caelundas/src/modules/ephemeris/ephemeris.module";
import { MathModule } from "@caelundas/src/modules/math/math.module";
import { ProgressiveUtilitiesModule } from "@caelundas/src/modules/progressive/progressive.utilities.module";
import { Module } from "@nestjs/common";

import { AspectsService } from "./aspects.service";
import { AspectsUtilities } from "./aspects.utilities";
import { MajorAspectsService } from "./major/majorAspects.service";
import { MinorAspectsService } from "./minor/minorAspects.service";
import { QuadrupleAspectsService } from "./quadruple/quadrupleAspects.service";
import { QuintupleAspectsService } from "./quintuple/quintupleAspects.service";
import { SextupleAspectsService } from "./sextuple/sextupleAspects.service";
import { SpecialtyAspectsService } from "./specialty/specialtyAspects.service";
import { StelliumService } from "./stellium/stellium.service";
import { TripleAspectsService } from "./triple/tripleAspects.service";

/**
 * NestJS module for astronomical aspect detection.
 * Orchestrates all aspect sub-modules (major, minor, triple, quadruple, quintuple,
 * sextuple, stellium, and specialty) via {@link AspectsService}.
 */
@Module({
  imports: [EphemerisModule, MathModule, ProgressiveUtilitiesModule],
  providers: [
    AspectsService,
    AspectsUtilities,
    MajorAspectsService,
    MinorAspectsService,
    QuadrupleAspectsService,
    QuintupleAspectsService,
    SextupleAspectsService,
    SpecialtyAspectsService,
    StelliumService,
    TripleAspectsService,
  ],
  exports: [AspectsService],
})
export class AspectsModule {}
