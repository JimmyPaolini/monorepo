import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { ProgressiveService } from "@caelundas/src/modules/progressive/progressive.service";
import { Injectable } from "@nestjs/common";

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { AzimuthElevationEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

/**
 *
 */
export type Twilight = "civil" | "nautical" | "astronomical";

// #region 🕑 Progressive Events

/**
 *
 */
@Injectable()
export class TwilightsService {
  static readonly twilights = [
    "civil",
    "nautical",
    "astronomical",
  ] as const satisfies readonly Twilight[];
  static readonly sunRadiusDegrees = 16 / MathService.arcminutesPerDegree;
  static readonly degreesByTwilight: Record<Twilight, number> = {
    civil: 6,
    nautical: 12,
    astronomical: 18,
  };
  private static readonly categories = ["Astronomy", "Astrology", "Twilight"];

  constructor(private readonly ephemerisService: EphemerisService) {}

  /**
   * Detects twilight transition events at a specific minute.
   *
   * Identifies six daily twilight transitions based on solar depression angles:
   * - Astronomical dawn/dusk (18° below horizon)
   * - Nautical dawn/dusk (12° below horizon)
   * - Civil dawn/dusk (6° below horizon)
   *
   * @param args - Configuration object
   * @param currentMinute - The specific minute to analyze
   * @param sunAzimuthElevationEphemeris - Pre-computed Sun position data
   * @returns Array of detected twilight events (0-1 events per minute)
   * @see {@link isAstronomicalDawn} and related functions for detection
   * @see {@link degreesByTwilight} for threshold definitions
   *
   * @remarks
   * Twilight periods are important for:
   * - Photography (golden hour, blue hour)
   * - Astronomy (observing windows)
   * - Navigation (marine twilight)
   * - Daily rhythm (circadian cycles)
   */
  detect(args: {
    minute: Moment;
    sunAzimuthElevationEphemeris: AzimuthElevationEphemeris;
  }): Event[] {
    const { minute, sunAzimuthElevationEphemeris } = args;

    const twilightEvents: Event[] = [];

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

    const elevations = { currentElevation, previousElevation };
    const date = minute;

    if (this.isAstronomicalDawn({ ...elevations })) {
      twilightEvents.push(this.buildAstronomicalDawnEvent(date));
    }
    if (this.isNauticalDawn({ ...elevations })) {
      twilightEvents.push(this.buildNauticalDawnEvent(date));
    }
    if (this.isCivilDawn({ ...elevations })) {
      twilightEvents.push(this.buildCivilDawnEvent(date));
    }
    if (this.isCivilDusk({ ...elevations })) {
      twilightEvents.push(this.buildCivilDuskEvent(date));
    }
    if (this.isNauticalDusk({ ...elevations })) {
      twilightEvents.push(this.buildNauticalDuskEvent(date));
    }
    if (this.isAstronomicalDusk({ ...elevations })) {
      twilightEvents.push(this.buildAstronomicalDuskEvent(date));
    }

    return twilightEvents;
  }

  /**
   * Creates an astronomical dawn calendar event.
   * Marks when the sky begins to lighten (Sun at -18° elevation).
   * @param date - Precise UTC time
   * @returns Calendar event for astronomical dawn
   */
  buildAstronomicalDawnEvent(date: Moment): Event {
    const description = "Astronomical Dawn";
    const summary = `🌠 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const astronomicalDawnEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: [...TwilightsService.categories, "Astronomical Dawn"],
    };
    return astronomicalDawnEvent;
  }

  /**
   *
   */
  buildNauticalDawnEvent(date: Moment): Event {
    const description = "Nautical Dawn";
    const summary = `🌅 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const nauticalDawnEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: [...TwilightsService.categories, "Nautical Dawn"],
    };
    return nauticalDawnEvent;
  }

  /**
   *
   */
  buildCivilDawnEvent(date: Moment): Event {
    const description = "Civil Dawn";
    const summary = `🌄 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const civilDawnEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: [...TwilightsService.categories, "Civil Dawn"],
    };
    return civilDawnEvent;
  }

  /**
   *
   */
  buildCivilDuskEvent(date: Moment): Event {
    const description = "Civil Dusk";
    const summary = `🌇 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const civilDuskEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: [...TwilightsService.categories, "Civil Dusk"],
    };
    return civilDuskEvent;
  }

  /**
   *
   */
  buildNauticalDuskEvent(date: Moment): Event {
    const description = "Nautical Dusk";
    const summary = `🌉 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const nauticalDuskEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: [...TwilightsService.categories, "Nautical Dusk"],
    };
    return nauticalDuskEvent;
  }

  /**
   *
   */
  buildAstronomicalDuskEvent(date: Moment): Event {
    const description = "Astronomical Dusk";
    const summary = `🌌 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const astronomicalDuskEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: [...TwilightsService.categories, "Astronomical Dusk"],
    };
    return astronomicalDuskEvent;
  }

  /**
   * Generates progressive events for twilight periods.
   *
   * Creates span events for six twilight periods plus full night and daylight:
   * - Astronomical twilight (morning/evening)
   * - Nautical twilight (morning/evening)
   * - Daylight (civil dawn to civil dusk)
   * - Night (astronomical dusk to astronomical dawn)
   *
   * @param events - Array of all twilight events
   * @returns Array of progressive events representing twilight spans
   * @see {@link ProgressiveService.pairProgressiveEvents} for pairing logic
   */
  detectProgressive(events: Event[]): Event[] {
    const progressiveEvents: Event[] = [];

    // Filter to twilight events only
    const twilightEvents = events.filter((event) =>
      event.categories.includes("Twilight"),
    );

    // Astronomical Twilight (morning): Astronomical Dawn → Nautical Dawn
    const astronomicalDawnEvents = twilightEvents.filter((event) =>
      event.categories.includes("Astronomical Dawn"),
    );
    const nauticalDawnEvents = twilightEvents.filter((event) =>
      event.categories.includes("Nautical Dawn"),
    );
    const astronomicalTwilightMorningPairs =
      ProgressiveService.pairProgressiveEvents(
        astronomicalDawnEvents,
        nauticalDawnEvents,
        "Astronomical Twilight (Morning)",
      );
    for (const [beginning, ending] of astronomicalTwilightMorningPairs) {
      progressiveEvents.push(
        this.getAstronomicalTwilightMorningDurationEvent(beginning, ending),
      );
    }

    // Nautical Twilight (morning): Nautical Dawn → Civil Dawn
    const civilDawnEvents = twilightEvents.filter((event) =>
      event.categories.includes("Civil Dawn"),
    );
    const nauticalTwilightMorningPairs =
      ProgressiveService.pairProgressiveEvents(
        nauticalDawnEvents,
        civilDawnEvents,
        "Nautical Twilight (Morning)",
      );
    for (const [beginning, ending] of nauticalTwilightMorningPairs) {
      progressiveEvents.push(
        this.getNauticalTwilightMorningDurationEvent(beginning, ending),
      );
    }

    // Daylight: Civil Dawn → Civil Dusk
    const civilDuskEvents = twilightEvents.filter((event) =>
      event.categories.includes("Civil Dusk"),
    );
    const daylightPairs = ProgressiveService.pairProgressiveEvents(
      civilDawnEvents,
      civilDuskEvents,
      "Daylight",
    );
    for (const [beginning, ending] of daylightPairs) {
      progressiveEvents.push(this.getDaylightDurationEvent(beginning, ending));
    }

    // Nautical Twilight (evening): Civil Dusk → Nautical Dusk
    const nauticalDuskEvents = twilightEvents.filter((event) =>
      event.categories.includes("Nautical Dusk"),
    );
    const nauticalTwilightEveningPairs =
      ProgressiveService.pairProgressiveEvents(
        civilDuskEvents,
        nauticalDuskEvents,
        "Nautical Twilight (Evening)",
      );
    for (const [beginning, ending] of nauticalTwilightEveningPairs) {
      progressiveEvents.push(
        this.getNauticalTwilightEveningDurationEvent(beginning, ending),
      );
    }

    // Astronomical Twilight (evening): Nautical Dusk → Astronomical Dusk
    const astronomicalDuskEvents = twilightEvents.filter((event) =>
      event.categories.includes("Astronomical Dusk"),
    );
    const astronomicalTwilightEveningPairs =
      ProgressiveService.pairProgressiveEvents(
        nauticalDuskEvents,
        astronomicalDuskEvents,
        "Astronomical Twilight (Evening)",
      );
    for (const [beginning, ending] of astronomicalTwilightEveningPairs) {
      progressiveEvents.push(
        this.getAstronomicalTwilightEveningDurationEvent(beginning, ending),
      );
    }

    // Night: Astronomical Dusk → Astronomical Dawn (next day)
    const nightPairs = ProgressiveService.pairProgressiveEvents(
      astronomicalDuskEvents,
      astronomicalDawnEvents,
      "Night",
    );
    for (const [beginning, ending] of nightPairs) {
      progressiveEvents.push(this.getNightDurationEvent(beginning, ending));
    }

    return progressiveEvents;
  }

  private getAstronomicalTwilightMorningDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      start: beginning.start,
      end: ending.start,
      summary: "🌠 Astronomical Twilight (Morning)",
      description: "Astronomical Twilight (Morning)",
      categories: [
        ...TwilightsService.categories,
        "Astronomical Twilight",
        "Morning",
      ],
    };
  }

  private getNauticalTwilightMorningDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      start: beginning.start,
      end: ending.start,
      summary: "🌅 Nautical Twilight (Morning)",
      description: "Nautical Twilight (Morning)",
      categories: [
        ...TwilightsService.categories,
        "Nautical Twilight",
        "Morning",
      ],
    };
  }

  private getDaylightDurationEvent(beginning: Event, ending: Event): Event {
    return {
      start: beginning.start,
      end: ending.start,
      summary: "☀️ Daylight",
      description: "Daylight",
      categories: [...TwilightsService.categories, "Daylight"],
    };
  }

  private getNauticalTwilightEveningDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      start: beginning.start,
      end: ending.start,
      summary: "🌉 Nautical Twilight (Evening)",
      description: "Nautical Twilight (Evening)",
      categories: [
        ...TwilightsService.categories,
        "Nautical Twilight",
        "Evening",
      ],
    };
  }

  private getAstronomicalTwilightEveningDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      start: beginning.start,
      end: ending.start,
      summary: "🌌 Astronomical Twilight (Evening)",
      description: "Astronomical Twilight (Evening)",
      categories: [
        ...TwilightsService.categories,
        "Astronomical Twilight",
        "Evening",
      ],
    };
  }

  private getNightDurationEvent(beginning: Event, ending: Event): Event {
    return {
      start: beginning.start,
      end: ending.start,
      summary: "🌃 Night",
      description: "Night",
      categories: [...TwilightsService.categories, "Night"],
    };
  }

  private isDawn(args: {
    currentElevation: number;
    previousElevation: number;
    twilight: Twilight;
  }): boolean {
    const { currentElevation, previousElevation, twilight } = args;
    const degrees = TwilightsService.degreesByTwilight[twilight];
    return currentElevation > -degrees && previousElevation < -degrees;
  }

  private isAstronomicalDawn(args: {
    currentElevation: number;
    previousElevation: number;
  }): boolean {
    const { currentElevation, previousElevation } = args;
    return this.isDawn({
      currentElevation,
      previousElevation,
      twilight: "astronomical",
    });
  }

  private isNauticalDawn(args: {
    currentElevation: number;
    previousElevation: number;
  }): boolean {
    const { currentElevation, previousElevation } = args;
    return this.isDawn({
      currentElevation,
      previousElevation,
      twilight: "nautical",
    });
  }

  private isCivilDawn(args: {
    currentElevation: number;
    previousElevation: number;
  }): boolean {
    const { currentElevation, previousElevation } = args;
    return this.isDawn({
      currentElevation,
      previousElevation,
      twilight: "civil",
    });
  }

  private isDusk(args: {
    currentElevation: number;
    previousElevation: number;
    twilight: Twilight;
  }): boolean {
    const { currentElevation, previousElevation, twilight } = args;
    const degrees = TwilightsService.degreesByTwilight[twilight];
    return currentElevation < -degrees && previousElevation > -degrees;
  }

  private isCivilDusk(args: {
    currentElevation: number;
    previousElevation: number;
  }): boolean {
    const { currentElevation, previousElevation } = args;
    return this.isDusk({
      currentElevation,
      previousElevation,
      twilight: "civil",
    });
  }

  private isNauticalDusk(args: {
    currentElevation: number;
    previousElevation: number;
  }): boolean {
    const { currentElevation, previousElevation } = args;
    return this.isDusk({
      currentElevation,
      previousElevation,
      twilight: "nautical",
    });
  }

  private isAstronomicalDusk(args: {
    currentElevation: number;
    previousElevation: number;
  }): boolean {
    const { currentElevation, previousElevation } = args;
    return this.isDusk({
      currentElevation,
      previousElevation,
      twilight: "astronomical",
    });
  }
}
