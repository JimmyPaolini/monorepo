import { DatetimeModule } from "@caelundas/src/modules/datetime/datetime.module";
import { EphemerisModule } from "@caelundas/src/modules/ephemeris/ephemeris.module";
import { AnnualSolarCycleModule } from "@caelundas/src/modules/events/annualSolarCycle/annualSolarCycle.module";
import { AspectsModule } from "@caelundas/src/modules/events/aspects/aspects.module";
import { DailyCyclesModule } from "@caelundas/src/modules/events/dailyCycles/dailyCycles.module";
import { EclipsesModule } from "@caelundas/src/modules/events/eclipses/eclipses.module";
import { IngressesModule } from "@caelundas/src/modules/events/ingresses/ingresses.module";
import { MonthlyLunarCycleModule } from "@caelundas/src/modules/events/monthlyLunarCycle/monthlyLunarCycle.module";
import { PhasesModule } from "@caelundas/src/modules/events/phases/phases.module";
import { RetrogradesModule } from "@caelundas/src/modules/events/retrogrades/retrogrades.module";
import { TwilightsModule } from "@caelundas/src/modules/events/twilights/twilights.module";
import { Module } from "@nestjs/common";

import { PerfectiveService } from "./perfective.service";

/**
 *
 */
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
  providers: [PerfectiveService],
  exports: [PerfectiveService],
})
export class PerfectiveModule {}
