import { Injectable } from "@nestjs/common";

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { AnnualSolarCycleService } from "@caelundas/src/modules/events/annualSolarCycle/annual-solar-cycle.service";
import type { AspectsService } from "@caelundas/src/modules/events/aspects/aspects.service";
import type { EclipsesService } from "@caelundas/src/modules/events/eclipses/eclipses.service";
import type { IngressesService } from "@caelundas/src/modules/events/ingresses/ingresses.service";
import type { MonthlyLunarCycleService } from "@caelundas/src/modules/events/monthlyLunarCycle/monthly-lunar-cycle.service";
import type { PhasesService } from "@caelundas/src/modules/events/phases/phases.service";
import type { RetrogradesService } from "@caelundas/src/modules/events/retrogrades/retrogrades.service";
import type { TwilightsService } from "@caelundas/src/modules/events/twilights/twilights.service";

/**
 * Aggregates progressive event detection from all sub-services.
 *
 * Progressive events (aspects, retrogrades, ingresses, phases, eclipses, etc.)
 * depend on perfective event data produced in the preceding pass. This service
 * fans out to each domain service and merges their results into a single array.
 */
@Injectable()
export class ProgressiveService {
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

  /**
   * Pairs beginning (forming/starting) events with their corresponding ending
   * (dissolving/ending) events to create progressive pairs.
   *
   * @param beginnings - Events that mark the start of a progressive event
   * @param endings - Events that mark the end of a progressive event
   * @param label - Descriptive label used in warning messages when counts differ
   * @returns Array of [beginning, ending] tuples
   */
  static pairProgressiveEvents(
    beginnings: Event[],
    endings: Event[],
    label: string,
  ): [Event, Event][] {
    const pairCount = Math.min(beginnings.length, endings.length);

    if (beginnings.length !== endings.length) {
      console.warn(
        `pairProgressiveEvents: unequal counts for "${label}": ${beginnings.length} beginnings, ${endings.length} endings`,
      );
    }

    const pairs: [Event, Event][] = [];

    for (let i = 0; i < pairCount; i++) {
      const beginning = beginnings[i];
      const ending = endings[i];
      if (beginning !== undefined && ending !== undefined) {
        pairs.push([beginning, ending]);
      }
    }

    return pairs;
  }
}
