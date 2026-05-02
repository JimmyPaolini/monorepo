import { Module } from "@nestjs/common";

import { AnnualSolarCycleModule } from "@caelundas/src/events/annualSolarCycle/annual-solar-cycle.module";
import { AspectsModule } from "@caelundas/src/events/aspects/aspects.module";
import { EclipsesModule } from "@caelundas/src/events/eclipses/eclipses.module";
import { IngressesModule } from "@caelundas/src/events/ingresses/ingresses.module";
import { MonthlyLunarCycleModule } from "@caelundas/src/events/monthlyLunarCycle/monthly-lunar-cycle.module";
import { PhasesModule } from "@caelundas/src/events/phases/phases.module";
import { RetrogradesModule } from "@caelundas/src/events/retrogrades/retrogrades.module";
import { TwilightsModule } from "@caelundas/src/events/twilights/twilights.module";
import { ProgressiveEventsService } from "./progressive-events.service";

/**
 *
 */
@Module({
  imports: [
    AnnualSolarCycleModule,
    AspectsModule,
    EclipsesModule,
    IngressesModule,
    MonthlyLunarCycleModule,
    PhasesModule,
    RetrogradesModule,
    TwilightsModule,
  ],
  providers: [ProgressiveEventsService],
  exports: [ProgressiveEventsService],
})
export class ProgressiveEventsModule {}
