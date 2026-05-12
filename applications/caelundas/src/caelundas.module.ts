import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { CaelundasCommand } from "./caelundas.command";
import { CalendarModule } from "./modules/calendar/calendar.module";
import { EphemerisModule } from "./modules/ephemeris/ephemeris.module";
import { AnnualSolarCycleModule } from "./modules/events/annualSolarCycle/annualSolarCycle.module";
import { AspectsModule } from "./modules/events/aspects/aspects.module";
import { DailyCyclesModule } from "./modules/events/dailyCycles/dailyCycles.module";
import { EclipsesModule } from "./modules/events/eclipses/eclipses.module";
import { IngressesModule } from "./modules/events/ingresses/ingresses.module";
import { MonthlyLunarCycleModule } from "./modules/events/monthlyLunarCycle/monthlyLunarCycle.module";
import { PhasesModule } from "./modules/events/phases/phases.module";
import { RetrogradesModule } from "./modules/events/retrogrades/retrogrades.module";
import { TwilightsModule } from "./modules/events/twilights/twilights.module";
import { environmentSchema } from "./modules/input/input.constants";
import { InputModule } from "./modules/input/input.module";
import { MathModule } from "./modules/math/math.module";
import { PerfectiveModule } from "./modules/perfective/perfective.module";
import { ProgressiveModule } from "./modules/progressive/progressive.module";

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
