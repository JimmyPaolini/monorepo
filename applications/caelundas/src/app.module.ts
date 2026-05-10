import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { CaelundasCommand } from "./caelundas.command";
import { CalendarModule } from "./calendar/calendar.module";
import { EphemerisModule } from "./ephemeris/ephemeris.module";
import { AnnualSolarCycleModule } from "./events/annualSolarCycle/annual-solar-cycle.module";
import { AspectsModule } from "./events/aspects/aspects.module";
import { DailyCyclesModule } from "./events/dailyCycles/daily-cycles.module";
import { EclipsesModule } from "./events/eclipses/eclipses.module";
import { IngressesModule } from "./events/ingresses/ingresses.module";
import { MonthlyLunarCycleModule } from "./events/monthlyLunarCycle/monthly-lunar-cycle.module";
import { PhasesModule } from "./events/phases/phases.module";
import { RetrogradesModule } from "./events/retrogrades/retrogrades.module";
import { TwilightsModule } from "./events/twilights/twilights.module";
import { MathModule } from "./math/math.module";
import { PerfectiveEventsModule } from "./perfective-events/perfective-events.module";
import { ProgressiveEventsModule } from "./progressive-events/progressive-events.module";

/**
 * Root NestJS application module.
 *
 * Imports all domain modules and the global config module so that every
 * service can read environment variables via {@link ConfigService}.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    PerfectiveEventsModule,
    ProgressiveEventsModule,
  ],
  providers: [CaelundasCommand],
})
export class AppModule {}
