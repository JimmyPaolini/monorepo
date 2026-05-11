import { AnnualSolarCycleModule } from "@caelundas/src/modules/events/annualSolarCycle/annual-solar-cycle.module";
import { AspectsModule } from "@caelundas/src/modules/events/aspects/aspects.module";
import { EclipsesModule } from "@caelundas/src/modules/events/eclipses/eclipses.module";
import { IngressesModule } from "@caelundas/src/modules/events/ingresses/ingresses.module";
import { MonthlyLunarCycleModule } from "@caelundas/src/modules/events/monthlyLunarCycle/monthly-lunar-cycle.module";
import { PhasesModule } from "@caelundas/src/modules/events/phases/phases.module";
import { RetrogradesModule } from "@caelundas/src/modules/events/retrogrades/retrogrades.module";
import { TwilightsModule } from "@caelundas/src/modules/events/twilights/twilights.module";
import { Module } from "@nestjs/common";

import { ProgressiveService } from "./progressive.service";

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
  providers: [ProgressiveService],
  exports: [ProgressiveService],
})
export class ProgressiveModule {}
