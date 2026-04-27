import { Injectable } from "@nestjs/common";

import { AnnualSolarCycleService } from "../events/annualSolarCycle/annual-solar-cycle.service";
import { AspectsService } from "../events/aspects/aspects.service";
import { EclipsesService } from "../events/eclipses/eclipses.service";
import { IngressesService } from "../events/ingresses/ingresses.service";
import { MonthlyLunarCycleService } from "../events/monthlyLunarCycle/monthly-lunar-cycle.service";
import { PhasesService } from "../events/phases/phases.service";
import { RetrogradesService } from "../events/retrogrades/retrogrades.service";
import { TwilightsService } from "../events/twilights/twilights.service";

import type { Event } from "../calendar/calendar.types";

/**
 *
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
