import { Module } from "@nestjs/common";

import { AnnualSolarCycleModule } from "../events/annualSolarCycle/annual-solar-cycle.module";
import { AspectsModule } from "../events/aspects/aspects.module";
import { EclipsesModule } from "../events/eclipses/eclipses.module";
import { IngressesModule } from "../events/ingresses/ingresses.module";
import { MonthlyLunarCycleModule } from "../events/monthlyLunarCycle/monthly-lunar-cycle.module";
import { PhasesModule } from "../events/phases/phases.module";
import { RetrogradesModule } from "../events/retrogrades/retrogrades.module";
import { TwilightsModule } from "../events/twilights/twilights.module";
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
