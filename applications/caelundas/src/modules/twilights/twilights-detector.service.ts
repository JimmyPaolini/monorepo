import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { Injectable } from "@nestjs/common";

import { TwilightsBuilderService } from "./twilights-builder.service.js";

import type { Twilight } from "./twilights.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { AzimuthElevationEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

/**
 *
 */
@Injectable()
export class TwilightsDetectorService {
  constructor(
    private readonly twilightsBuilderService: TwilightsBuilderService,
    private readonly ephemerisService: EphemerisService,
  ) {}

  private static readonly degreesByTwilight: Record<Twilight, number> = {
    astronomical: 18,
    civil: 6,
    nautical: 12,
  };

  /**
   *
   */
  buildTwilightTransitionEvents(
    elevations: { currentElevation: number; previousElevation: number },
    date: Moment,
  ): Event[] {
    const detectedTransitionEvents: Event[] = [];

    if (this.isAstronomicalDawn({ ...elevations })) {
      detectedTransitionEvents.push(
        this.twilightsBuilderService.buildAstronomicalDawnEvent(date),
      );
    }
    if (this.isNauticalDawn({ ...elevations })) {
      detectedTransitionEvents.push(
        this.twilightsBuilderService.buildNauticalDawnEvent(date),
      );
    }
    if (this.isCivilDawn({ ...elevations })) {
      detectedTransitionEvents.push(
        this.twilightsBuilderService.buildCivilDawnEvent(date),
      );
    }
    if (this.isCivilDusk({ ...elevations })) {
      detectedTransitionEvents.push(
        this.twilightsBuilderService.buildCivilDuskEvent(date),
      );
    }
    if (this.isNauticalDusk({ ...elevations })) {
      detectedTransitionEvents.push(
        this.twilightsBuilderService.buildNauticalDuskEvent(date),
      );
    }
    if (this.isAstronomicalDusk({ ...elevations })) {
      detectedTransitionEvents.push(
        this.twilightsBuilderService.buildAstronomicalDuskEvent(date),
      );
    }

    return detectedTransitionEvents;
  }

  /**
   *
   */
  getSunElevations(
    sunAzimuthElevationEphemeris: AzimuthElevationEphemeris,
    minute: Moment,
  ): { currentElevation: number; previousElevation: number } {
    const previousMinute = minute.clone().subtract(1, "minute");
    const currentElevation =
      this.ephemerisService.getAzimuthElevationFromEphemeris(
        sunAzimuthElevationEphemeris,
        minute.toISOString(),
        "elevation",
      );
    const previousElevation =
      this.ephemerisService.getAzimuthElevationFromEphemeris(
        sunAzimuthElevationEphemeris,
        previousMinute.toISOString(),
        "elevation",
      );
    return { currentElevation, previousElevation };
  }

  /**
   *
   */
  isAstronomicalDawn(args: {
    currentElevation: number;
    previousElevation: number;
  }): boolean {
    return this.isDawn({ ...args, twilight: "astronomical" });
  }

  /**
   *
   */
  isAstronomicalDusk(args: {
    currentElevation: number;
    previousElevation: number;
  }): boolean {
    return this.isDusk({ ...args, twilight: "astronomical" });
  }

  /**
   *
   */
  isCivilDawn(args: {
    currentElevation: number;
    previousElevation: number;
  }): boolean {
    return this.isDawn({ ...args, twilight: "civil" });
  }

  /**
   *
   */
  isCivilDusk(args: {
    currentElevation: number;
    previousElevation: number;
  }): boolean {
    return this.isDusk({ ...args, twilight: "civil" });
  }

  /**
   *
   */
  isDawn(args: {
    currentElevation: number;
    previousElevation: number;
    twilight: Twilight;
  }): boolean {
    const { currentElevation, previousElevation, twilight } = args;
    const degrees = TwilightsDetectorService.degreesByTwilight[twilight];
    return currentElevation > -degrees && previousElevation < -degrees;
  }

  /**
   *
   */
  isDusk(args: {
    currentElevation: number;
    previousElevation: number;
    twilight: Twilight;
  }): boolean {
    const { currentElevation, previousElevation, twilight } = args;
    const degrees = TwilightsDetectorService.degreesByTwilight[twilight];
    return currentElevation < -degrees && previousElevation > -degrees;
  }

  /**
   *
   */
  isNauticalDawn(args: {
    currentElevation: number;
    previousElevation: number;
  }): boolean {
    return this.isDawn({ ...args, twilight: "nautical" });
  }

  /**
   *
   */
  isNauticalDusk(args: {
    currentElevation: number;
    previousElevation: number;
  }): boolean {
    return this.isDusk({ ...args, twilight: "nautical" });
  }
}
