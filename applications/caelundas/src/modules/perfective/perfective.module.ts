import { AnnualSolarCycleModule } from "@caelundas/src/modules/annualSolarCycle/annualSolarCycle.module";
import { AspectsModule } from "@caelundas/src/modules/aspects/aspects.module";
import { DailyCyclesModule } from "@caelundas/src/modules/dailyCycles/dailyCycles.module";
import { DatetimeModule } from "@caelundas/src/modules/datetime/datetime.module";
import { EclipsesModule } from "@caelundas/src/modules/eclipses/eclipses.module";
import { EphemerisModule } from "@caelundas/src/modules/ephemeris/ephemeris.module";
import { IngressesModule } from "@caelundas/src/modules/ingresses/ingresses.module";
import { MonthlyLunarCycleModule } from "@caelundas/src/modules/monthlyLunarCycle/monthlyLunarCycle.module";
import { PhasesModule } from "@caelundas/src/modules/phases/phases.module";
import { RetrogradesModule } from "@caelundas/src/modules/retrogrades/retrogrades.module";
import { TwilightsModule } from "@caelundas/src/modules/twilights/twilights.module";
import { Module } from "@nestjs/common";

import { PerfectiveService } from "./perfective.service";

/**
 * NestJS module orchestrating per-minute astronomical event detection.
 * Imports all event sub-modules and exposes {@link PerfectiveService} which iterates
 * minute-by-minute over a date range to detect all perfective (instantaneous) events.
 */
@Module({
  controllers: [],
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
