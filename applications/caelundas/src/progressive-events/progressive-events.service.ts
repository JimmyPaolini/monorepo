import { Injectable } from "@nestjs/common";

import type { Event } from "@caelundas/src/calendar/calendar.types";
import type { AnnualSolarCycleService } from "@caelundas/src/events/annualSolarCycle/annual-solar-cycle.service";
import type { AspectsService } from "@caelundas/src/events/aspects/aspects.service";
import type { EclipsesService } from "@caelundas/src/events/eclipses/eclipses.service";
import type { IngressesService } from "@caelundas/src/events/ingresses/ingresses.service";
import type { MonthlyLunarCycleService } from "@caelundas/src/events/monthlyLunarCycle/monthly-lunar-cycle.service";
import type { PhasesService } from "@caelundas/src/events/phases/phases.service";
import type { RetrogradesService } from "@caelundas/src/events/retrogrades/retrogrades.service";
import type { TwilightsService } from "@caelundas/src/events/twilights/twilights.service";

/**
 * Aggregates progressive event detection from all sub-services.
 *
 * Progressive events (aspects, retrogrades, ingresses, phases, eclipses, etc.)
 * depend on perfective event data produced in the preceding pass. This service
 * fans out to each domain service and merges their results into a single array.
 */
@Injectable()
export class ProgressiveEventsService {
  constructor(
    private readonly annualSolarCycleService: AnnualSolarCycleService,
    private readonly aspectsService: AspectsService,
    private readonly eclipsesService: EclipsesService,
    private readonly ingressesService: IngressesService,
    private readonly monthlyLunarCycleService: MonthlyLunarCycleService,
    private readonly phasesService: PhasesService,
    private readonly retrogradesService: RetrogradesService,
    private readonly twilightsService: TwilightsService,
  ) {}

  /**
   *
   */
  detect(perfectiveEvents: Event[]): Event[] {
    return [
      ...this.aspectsService.detectProgressive(perfectiveEvents),
      ...this.retrogradesService.detectProgressive(perfectiveEvents),
      ...this.eclipsesService.detectProgressive(perfectiveEvents),
      ...this.ingressesService.detectProgressive(perfectiveEvents),
      ...this.monthlyLunarCycleService.detectProgressive(perfectiveEvents),
      ...this.twilightsService.detectProgressive(perfectiveEvents),
      ...this.phasesService.detectProgressive(perfectiveEvents),
      ...this.annualSolarCycleService.detectProgressive(perfectiveEvents),
    ];
  }
}
