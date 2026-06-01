import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AnnualSolarCycleModule } from "../annualSolarCycle/annualSolarCycle.module";
import { AspectsModule } from "../aspects/aspects.module";
import { CalendarModule } from "../calendar/calendar.module";
import { DailyCyclesModule } from "../dailyCycles/dailyCycles.module";
import { EclipsesModule } from "../eclipses/eclipses.module";
import { EphemerisModule } from "../ephemeris/ephemeris.module";
import { IngressesModule } from "../ingresses/ingresses.module";
import { environmentSchema } from "../input/input.constants";
import { InputModule } from "../input/input.module";
import { LoggerModule } from "../logger/logger.module";
import { MajorAspectsModule } from "../majorAspects/majorAspects.module";
import { MathModule } from "../math/math.module";
import { MinorAspectsModule } from "../minorAspects/minorAspects.module";
import { MonthlyLunarCycleModule } from "../monthlyLunarCycle/monthlyLunarCycle.module";
import { PerfectiveModule } from "../perfective/perfective.module";
import { PhasesModule } from "../phases/phases.module";
import { ProgressiveModule } from "../progressive/progressive.module";
import { QuadrupleAspectsModule } from "../quadrupleAspects/quadrupleAspects.module";
import { QuintupleAspectsModule } from "../quintupleAspects/quintupleAspects.module";
import { RetrogradesModule } from "../retrogrades/retrogrades.module";
import { SextupleAspectsModule } from "../sextupleAspects/sextupleAspects.module";
import { SpecialtyAspectsModule } from "../specialtyAspects/specialtyAspects.module";
import { StelliumModule } from "../stellium/stellium.module";
import { TripleAspectsModule } from "../tripleAspects/tripleAspects.module";
import { TwilightsModule } from "../twilights/twilights.module";

import { CaelundasCommand } from "./caelundas.command";
import { CaelundasService } from "./caelundas.service";

/**
 * Root NestJS application module.
 *
 * Imports all domain modules and the global config module so that every
 * service can read environment variables via {@link ConfigService}.
 */
@Module({
  controllers: [],
  exports: [CaelundasService],
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
      validate: (config: Record<string, unknown>) =>
        environmentSchema.parse(config),
    }),
    LoggerModule,
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
  providers: [CaelundasCommand, CaelundasService],
})
export class CaelundasModule {}
