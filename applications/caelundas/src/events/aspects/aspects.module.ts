import { EphemerisModule } from "@caelundas/src/ephemeris/ephemeris.module";
import { Module } from "@nestjs/common";

import { AspectsService } from "./aspects.service";
import { AspectsUtilitiesService } from "./aspects.utilities";
import { MajorAspectsService } from "./major/major-aspects.service";
import { MinorAspectsService } from "./minor/minor-aspects.service";
import { QuadrupleAspectsService } from "./quadruple/quadruple-aspects.service";
import { QuintupleAspectsService } from "./quintuple/quintuple-aspects.service";
import { SextupleAspectsService } from "./sextuple/sextuple-aspects.service";
import { SpecialtyAspectsService } from "./specialty/specialty-aspects.service";
import { StelliumService } from "./stellium/stellium.service";
import { TripleAspectsService } from "./triple/triple-aspects.service";

/**
 *
 */
@Module({
  imports: [EphemerisModule],
  providers: [
    AspectsService,
    AspectsUtilitiesService,
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
