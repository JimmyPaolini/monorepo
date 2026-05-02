import { Module } from "@nestjs/common";

import { DatetimeModule } from "@caelundas/src/datetime/datetime.module";
import { EphemerisModule } from "@caelundas/src/ephemeris/ephemeris.module";
import { AnnualSolarCycleModule } from "@caelundas/src/events/annualSolarCycle/annual-solar-cycle.module";
import { AspectsModule } from "@caelundas/src/events/aspects/aspects.module";
import { DailyCyclesModule } from "@caelundas/src/events/dailyCycles/daily-cycles.module";
import { EclipsesModule } from "@caelundas/src/events/eclipses/eclipses.module";
import { IngressesModule } from "@caelundas/src/events/ingresses/ingresses.module";
import { MonthlyLunarCycleModule } from "@caelundas/src/events/monthlyLunarCycle/monthly-lunar-cycle.module";
import { PhasesModule } from "@caelundas/src/events/phases/phases.module";
import { RetrogradesModule } from "@caelundas/src/events/retrogrades/retrogrades.module";
import { TwilightsModule } from "@caelundas/src/events/twilights/twilights.module";

import { PerfectiveEventsService } from "./perfective-events.service";

@Module({
  imports: [
    DatetimeModule,
    EphemerisModule,
    AspectsModule,
    EclipsesModule,
    RetrogradesModule,
    IngressesModule,
    DailyCyclesModule,
    MonthlyLunarCycleModule,
    AnnualSolarCycleModule,
    TwilightsModule,
    PhasesModule,
  ],
  providers: [PerfectiveEventsService],
  exports: [PerfectiveEventsService],
})
export class PerfectiveEventsModule {}
