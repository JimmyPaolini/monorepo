import { AnnualSolarCycleService } from "@caelundas/src/modules/annualSolarCycle/annualSolarCycle.service";
import { AspectsService } from "@caelundas/src/modules/aspects/aspects.service";
import { EclipsesService } from "@caelundas/src/modules/eclipses/eclipses.service";
import { IngressesService } from "@caelundas/src/modules/ingresses/ingresses.service";
import { MonthlyLunarCycleService } from "@caelundas/src/modules/monthlyLunarCycle/monthlyLunarCycle.service";
import { PhasesService } from "@caelundas/src/modules/phases/phases.service";
import { RetrogradesService } from "@caelundas/src/modules/retrogrades/retrogrades.service";
import { TwilightsService } from "@caelundas/src/modules/twilights/twilights.service";
import { Injectable } from "@nestjs/common";

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

/**
 * Aggregates progressive event detection from all sub-services.
 *
 * Progressive events (aspects, retrogrades, ingresses, phases, eclipses, etc.)
 * depend on perfective event data produced in the preceding pass. This service
 * fans out to each domain service and merges their results into a single array.
 */
@Injectable()
export class ProgressiveService {
  // 🏗️ Dependency Injection
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

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   * Runs progressive event detection across all domain services and merges the results.
   *
   * @param perfectiveEvents - Instantaneous events produced by the preceding perfective pass
   * @returns All progressive (duration-spanning) events from every domain service, combined
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
