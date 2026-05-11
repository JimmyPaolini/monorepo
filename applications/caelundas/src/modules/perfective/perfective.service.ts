import { MARGIN_MINUTES } from "@caelundas/src/caelundas.constants";
import { DatetimeService } from "@caelundas/src/modules/datetime/datetime.service";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { AnnualSolarCycleService } from "@caelundas/src/modules/events/annualSolarCycle/annualSolarCycle.service";
import { AspectsService } from "@caelundas/src/modules/events/aspects/aspects.service";
import { DailyCyclesService } from "@caelundas/src/modules/events/dailyCycles/dailyCycles.service";
import { EclipsesService } from "@caelundas/src/modules/events/eclipses/eclipses.service";
import { IngressesService } from "@caelundas/src/modules/events/ingresses/ingresses.service";
import { MonthlyLunarCycleService } from "@caelundas/src/modules/events/monthlyLunarCycle/monthlyLunarCycle.service";
import { PhasesService } from "@caelundas/src/modules/events/phases/phases.service";
import { RetrogradesService } from "@caelundas/src/modules/events/retrogrades/retrogrades.service";
import { TwilightsService } from "@caelundas/src/modules/events/twilights/twilights.service";
import { Injectable } from "@nestjs/common";

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { Coordinates } from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { AspectBodies } from "@caelundas/src/modules/events/aspects/aspects.service";
import type { Input } from "@caelundas/src/modules/input/input.types";

/**
 *
 */
@Injectable()
export class PerfectiveService {
  constructor(
    private readonly datetimeService: DatetimeService,
    private readonly ephemerisService: EphemerisService,
    private readonly aspectsService: AspectsService,
    private readonly eclipsesService: EclipsesService,
    private readonly retrogradesService: RetrogradesService,
    private readonly ingressesService: IngressesService,
    private readonly dailyCyclesService: DailyCyclesService,
    private readonly monthlyLunarCycleService: MonthlyLunarCycleService,
    private readonly annualSolarCycleService: AnnualSolarCycleService,
    private readonly twilightsService: TwilightsService,
    private readonly phasesService: PhasesService,
  ) {}

  /**
   *
   */
  detect(input: Input): Event[] {
    const { end, latitude, longitude, start, timezone } = input;
    const coordinates: Coordinates = [longitude, latitude];

    let previousAspectBodies: AspectBodies[] = [];
    const perfectiveEvents: Event[] = [];

    for (const date of this.datetimeService.generateDates(
      start,
      end,
      timezone,
    )) {
      const startOfDay = date.clone().startOf("day");
      const endOfDay = date.clone().endOf("day");

      const ephemerides = this.ephemerisService.getEphemerides({
        coordinates,
        end: endOfDay.clone().add(MARGIN_MINUTES, "minutes"),
        start: startOfDay.clone().subtract(MARGIN_MINUTES, "minutes"),
        timezone,
      });

      const {
        azimuthElevationEphemerisByBody,
        coordinateEphemerisByBody,
        diameterEphemerisByBody,
        distanceEphemerisByBody,
        illuminationEphemerisByBody,
      } = ephemerides;

      const events: Event[] = [];

      for (const minute of this.datetimeService.generateMinutes(
        startOfDay,
        endOfDay,
      )) {
        const { events: aspectEvents, aspectBodies: currentAspectBodies } =
          this.aspectsService.detect({
            coordinateEphemerisByBody,
            minute,
            previousAspectBodies,
          });

        const minuteEvents: Event[] = [
          ...aspectEvents,
          ...this.eclipsesService.detect({
            minute,
            moonAzimuthElevationEphemeris: azimuthElevationEphemerisByBody.moon,
            moonCoordinateEphemeris: coordinateEphemerisByBody.moon,
            moonDiameterEphemeris: diameterEphemerisByBody.moon,
            sunAzimuthElevationEphemeris: azimuthElevationEphemerisByBody.sun,
            sunCoordinateEphemeris: coordinateEphemerisByBody.sun,
            sunDiameterEphemeris: diameterEphemerisByBody.sun,
          }),
          ...this.retrogradesService.detect({
            coordinateEphemerisByBody,
            minute,
          }),
          ...this.ingressesService.detect({
            coordinateEphemerisByBody,
            minute,
          }),
          ...this.dailyCyclesService.detect({
            minute,
            sunAzimuthElevationEphemeris: azimuthElevationEphemerisByBody.sun,
            moonAzimuthElevationEphemeris: azimuthElevationEphemerisByBody.moon,
          }),
          ...this.monthlyLunarCycleService.detect({
            minute,
            moonIlluminationEphemeris: illuminationEphemerisByBody.moon,
          }),
          ...this.annualSolarCycleService.detect({
            minute,
            sunCoordinateEphemeris: coordinateEphemerisByBody.sun,
            sunDistanceEphemeris: distanceEphemerisByBody.sun,
          }),
          ...this.twilightsService.detect({
            minute,
            sunAzimuthElevationEphemeris: azimuthElevationEphemerisByBody.sun,
          }),
          ...this.phasesService.detect({
            minute,
            coordinateEphemerisByBody,
            distanceEphemerisByBody,
            illuminationEphemerisByBody,
          }),
        ];

        previousAspectBodies = currentAspectBodies;
        events.push(...minuteEvents);
      }

      perfectiveEvents.push(...events);
    }

    return perfectiveEvents;
  }
}
