import { AnnualSolarCycleModule } from "@caelundas/src/modules/annualSolarCycle/annualSolarCycle.module";
import { AspectsModule } from "@caelundas/src/modules/aspects/aspects.module";
import { EclipsesModule } from "@caelundas/src/modules/eclipses/eclipses.module";
import { IngressesModule } from "@caelundas/src/modules/ingresses/ingresses.module";
import { MonthlyLunarCycleModule } from "@caelundas/src/modules/monthlyLunarCycle/monthlyLunarCycle.module";
import { PhasesModule } from "@caelundas/src/modules/phases/phases.module";
import { RetrogradesModule } from "@caelundas/src/modules/retrogrades/retrogrades.module";
import { TwilightsModule } from "@caelundas/src/modules/twilights/twilights.module";
import { Module } from "@nestjs/common";

import { ProgressiveService } from "./progressive.service";

/**
 * NestJS module orchestrating progressive (span) event detection.
 * Imports all event sub-modules and exposes {@link ProgressiveService} which converts
 * instantaneous events into time-spanning progressive events.
 */
@Module({
  controllers: [],
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
