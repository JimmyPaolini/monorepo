import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { CaelundasCommand } from "./caelundas.command";
import { AnnualSolarCycleModule } from "./modules/annualSolarCycle/annualSolarCycle.module";
import { AspectsModule } from "./modules/aspects/aspects.module";
import { CalendarModule } from "./modules/calendar/calendar.module";
import { DailyCyclesModule } from "./modules/dailyCycles/dailyCycles.module";
import { EclipsesModule } from "./modules/eclipses/eclipses.module";
import { EphemerisModule } from "./modules/ephemeris/ephemeris.module";
import { IngressesModule } from "./modules/ingresses/ingresses.module";
import { environmentSchema } from "./modules/input/input.constants";
import { InputModule } from "./modules/input/input.module";
import { MajorAspectsModule } from "./modules/majorAspects/majorAspects.module";
import { MathModule } from "./modules/math/math.module";
import { MinorAspectsModule } from "./modules/minorAspects/minorAspects.module";
import { MonthlyLunarCycleModule } from "./modules/monthlyLunarCycle/monthlyLunarCycle.module";
import { PerfectiveModule } from "./modules/perfective/perfective.module";
import { PhasesModule } from "./modules/phases/phases.module";
import { ProgressiveModule } from "./modules/progressive/progressive.module";
import { QuadrupleAspectsModule } from "./modules/quadrupleAspects/quadrupleAspects.module";
import { QuintupleAspectsModule } from "./modules/quintupleAspects/quintupleAspects.module";
import { RetrogradesModule } from "./modules/retrogrades/retrogrades.module";
import { SextupleAspectsModule } from "./modules/sextupleAspects/sextupleAspects.module";
import { SpecialtyAspectsModule } from "./modules/specialtyAspects/specialtyAspects.module";
import { StelliumModule } from "./modules/stellium/stellium.module";
import { TripleAspectsModule } from "./modules/tripleAspects/tripleAspects.module";
import { TwilightsModule } from "./modules/twilights/twilights.module";

/**
 * Root NestJS application module.
 *
 * Imports all domain modules and the global config module so that every
 * service can read environment variables via {@link ConfigService}.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
      validate: (config: Record<string, unknown>) =>
        environmentSchema.parse(config),
    }),
    InputModule,
    MathModule,
    EphemerisModule,
    CalendarModule,
    AspectsModule,
    MajorAspectsModule,
    MinorAspectsModule,
    TripleAspectsModule,
    QuadrupleAspectsModule,
    QuintupleAspectsModule,
    SextupleAspectsModule,
    SpecialtyAspectsModule,
    StelliumModule,
    EclipsesModule,
    RetrogradesModule,
    IngressesModule,
    DailyCyclesModule,
    MonthlyLunarCycleModule,
    AnnualSolarCycleModule,
    TwilightsModule,
    PhasesModule,
    PerfectiveModule,
    ProgressiveModule,
  ],
  providers: [CaelundasCommand],
})
export class CaelundasModule {}
