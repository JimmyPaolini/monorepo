import { Module } from "@nestjs/common";

import { DatetimeModule } from "../datetime/datetime.module";
import { EphemerisModule } from "../ephemeris/ephemeris.module";
import { AnnualSolarCycleModule } from "../events/annualSolarCycle/annual-solar-cycle.module";
import { AspectsModule } from "../events/aspects/aspects.module";
import { DailyCyclesModule } from "../events/dailyCycles/daily-cycles.module";
import { EclipsesModule } from "../events/eclipses/eclipses.module";
import { IngressesModule } from "../events/ingresses/ingresses.module";
import { MonthlyLunarCycleModule } from "../events/monthlyLunarCycle/monthly-lunar-cycle.module";
import { PhasesModule } from "../events/phases/phases.module";
import { RetrogradesModule } from "../events/retrogrades/retrogrades.module";
import { TwilightsModule } from "../events/twilights/twilights.module";

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
