import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Injectable } from "@nestjs/common";

import { LoggerService } from "../logger/logger.service";

import type { Twilight } from "./twilights.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { AzimuthElevationEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

export type { Twilight } from "./twilights.types";

/**
 * Detects solar twilight transition events based on the Sun's elevation angle.
 *
 * Identifies the six daily twilight thresholds (astronomical/nautical/civil dawn and dusk)
 * by comparing the Sun's elevation across consecutive minutes. Also provides progressive
 * event detection for twilight period spans.
 */
@Injectable()
export class TwilightsService {
  // 🏗 Dependency Injection

  constructor(
    private readonly logger: LoggerService,
    private readonly ephemerisService: EphemerisService,
    private readonly progressiveUtilitiesService: ProgressiveUtilities,
  ) {
    this.logger.setContext(TwilightsService.name);
  }

  // 🔐 Private Fields

  private static readonly categories = ["Astronomy", "Astrology", "Twilight"];

  // 🔑 Public Fields

  static readonly degreesByTwilight: Record<Twilight, number> = {
    astronomical: 18,
    civil: 6,
    nautical: 12,
  };
  static readonly sunRadiusDegrees = 16 / MathService.arcminutesPerDegree;

  static readonly twilights = [
    "civil",
    "nautical",
    "astronomical",
  ] as const satisfies readonly Twilight[];

  // 🔏 Private Methods

  private buildDawnProgressiveEvents(
    astronomicalDawnEvents: Event[],
    nauticalDawnEvents: Event[],
    civilDawnEvents: Event[],
  ): Event[] {
    return [
      ...this.pairAndBuild(
        astronomicalDawnEvents,
        nauticalDawnEvents,
        "Astronomical Twilight (Morning)",
        (beginning, ending) =>
          this.getAstronomicalTwilightMorningDurationEvent(beginning, ending),
      ),
      ...this.pairAndBuild(
        nauticalDawnEvents,
        civilDawnEvents,
        "Nautical Twilight (Morning)",
        (beginning, ending) =>
          this.getNauticalTwilightMorningDurationEvent(beginning, ending),
      ),
    ];
  }

  private buildDuskProgressiveEvents(
    civilDawnEvents: Event[],
    civilDuskEvents: Event[],
    nauticalDuskEvents: Event[],
    astronomicalDuskEvents: Event[],
  ): Event[] {
    return [
      ...this.pairAndBuild(
        civilDawnEvents,
        civilDuskEvents,
        "Daylight",
        (beginning, ending) => this.getDaylightDurationEvent(beginning, ending),
      ),
      ...this.pairAndBuild(
        civilDuskEvents,
        nauticalDuskEvents,
        "Nautical Twilight (Evening)",
        (beginning, ending) =>
          this.getNauticalTwilightEveningDurationEvent(beginning, ending),
      ),
      ...this.pairAndBuild(
        nauticalDuskEvents,
        astronomicalDuskEvents,
        "Astronomical Twilight (Evening)",
        (beginning, ending) =>
          this.getAstronomicalTwilightEveningDurationEvent(beginning, ending),
      ),
    ];
  }

  private buildTwilightTransitionEvents(
    elevations: { currentElevation: number; previousElevation: number },
    date: Moment,
  ): Event[] {
    const events: Event[] = [];
    if (this.isAstronomicalDawn({ ...elevations })) {
      events.push(this.buildAstronomicalDawnEvent(date));
    }
    if (this.isNauticalDawn({ ...elevations })) {
      events.push(this.buildNauticalDawnEvent(date));
    }
    if (this.isCivilDawn({ ...elevations })) {
      events.push(this.buildCivilDawnEvent(date));
    }
    if (this.isCivilDusk({ ...elevations })) {
      events.push(this.buildCivilDuskEvent(date));
    }
    if (this.isNauticalDusk({ ...elevations })) {
      events.push(this.buildNauticalDuskEvent(date));
    }
    if (this.isAstronomicalDusk({ ...elevations })) {
      events.push(this.buildAstronomicalDuskEvent(date));
    }
    return events;
  }

  private getAstronomicalTwilightEveningDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      categories: [
        ...TwilightsService.categories,
        "Astronomical Twilight",
        "Evening",
      ],
      description: "Astronomical Twilight (Evening)",
      end: ending.start,
      start: beginning.start,
      summary: "🌌 Astronomical Twilight (Evening)",
    };
  }

  private getAstronomicalTwilightMorningDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      categories: [
        ...TwilightsService.categories,
        "Astronomical Twilight",
        "Morning",
      ],
      description: "Astronomical Twilight (Morning)",
      end: ending.start,
      start: beginning.start,
      summary: "🌠 Astronomical Twilight (Morning)",
    };
  }

  private getDaylightDurationEvent(beginning: Event, ending: Event): Event {
    return {
      categories: [...TwilightsService.categories, "Daylight"],
      description: "Daylight",
      end: ending.start,
      start: beginning.start,
      summary: "☀️ Daylight",
    };
  }

  private getNauticalTwilightEveningDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      categories: [
        ...TwilightsService.categories,
        "Nautical Twilight",
        "Evening",
      ],
      description: "Nautical Twilight (Evening)",
      end: ending.start,
      start: beginning.start,
      summary: "🌉 Nautical Twilight (Evening)",
    };
  }

  private getNauticalTwilightMorningDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      categories: [
        ...TwilightsService.categories,
        "Nautical Twilight",
        "Morning",
      ],
      description: "Nautical Twilight (Morning)",
      end: ending.start,
      start: beginning.start,
      summary: "🌅 Nautical Twilight (Morning)",
    };
  }

  private getNightDurationEvent(beginning: Event, ending: Event): Event {
    return {
      categories: [...TwilightsService.categories, "Night"],
      description: "Night",
      end: ending.start,
      start: beginning.start,
      summary: "🌃 Night",
    };
  }

  private getSunElevations(
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

  private isDawn(args: {
    currentElevation: number;
    previousElevation: number;
    twilight: Twilight;
  }): boolean {
    const { currentElevation, previousElevation, twilight } = args;
    const degrees = TwilightsService.degreesByTwilight[twilight];
    return currentElevation > -degrees && previousElevation < -degrees;
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

  private pairAndBuild(
    beginnings: Event[],
    endings: Event[],
    label: string,
    builder: (beginning: Event, ending: Event) => Event,
  ): Event[] {
    const pairs = this.progressiveUtilitiesService.pairProgressiveEvents(
      beginnings,
      endings,
      label,
    );
    return pairs.map(([beginning, ending]) => builder(beginning, ending));
  }

  // 🌎 Public Methods

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
    this.logger.log(`${summary} at ${dateString}`);

    const astronomicalDawnEvent: Event = {
      categories: [...TwilightsService.categories, "Astronomical Dawn"],
      description,
      end: date,
      start: date,
      summary,
    };
    return astronomicalDawnEvent;
  }

  /**
   * Creates an astronomical dusk calendar event.
   *
   * Marks when the sky is dark enough for astronomical observation (Sun at −18° elevation).
   *
   * @param date - Precise UTC time of astronomical dusk
   * @returns Calendar event for astronomical dusk
   */
  buildAstronomicalDuskEvent(date: Moment): Event {
    const description = "Astronomical Dusk";
    const summary = `🌌 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    this.logger.log(`${summary} at ${dateString}`);

    const astronomicalDuskEvent: Event = {
      categories: [...TwilightsService.categories, "Astronomical Dusk"],
      description,
      end: date,
      start: date,
      summary,
    };
    return astronomicalDuskEvent;
  }

  /**
   * Creates a civil dawn calendar event.
   *
   * Marks when outdoor activities are possible without artificial light (Sun at −6° elevation).
   *
   * @param date - Precise UTC time of civil dawn
   * @returns Calendar event for civil dawn
   */
  buildCivilDawnEvent(date: Moment): Event {
    const description = "Civil Dawn";
    const summary = `🌄 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    this.logger.log(`${summary} at ${dateString}`);

    const civilDawnEvent: Event = {
      categories: [...TwilightsService.categories, "Civil Dawn"],
      description,
      end: date,
      start: date,
      summary,
    };
    return civilDawnEvent;
  }

  /**
   * Creates a civil dusk calendar event.
   *
   * Marks when artificial light becomes necessary for outdoor activities (Sun at −6° elevation).
   *
   * @param date - Precise UTC time of civil dusk
   * @returns Calendar event for civil dusk
   */
  buildCivilDuskEvent(date: Moment): Event {
    const description = "Civil Dusk";
    const summary = `🌇 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    this.logger.log(`${summary} at ${dateString}`);

    const civilDuskEvent: Event = {
      categories: [...TwilightsService.categories, "Civil Dusk"],
      description,
      end: date,
      start: date,
      summary,
    };
    return civilDuskEvent;
  }

  /**
   * Creates a nautical dawn calendar event.
   *
   * Marks when the horizon becomes visible at sea (Sun at −12° elevation).
   *
   * @param date - Precise UTC time of nautical dawn
   * @returns Calendar event for nautical dawn
   */
  buildNauticalDawnEvent(date: Moment): Event {
    const description = "Nautical Dawn";
    const summary = `🌅 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    this.logger.log(`${summary} at ${dateString}`);

    const nauticalDawnEvent: Event = {
      categories: [...TwilightsService.categories, "Nautical Dawn"],
      description,
      end: date,
      start: date,
      summary,
    };
    return nauticalDawnEvent;
  }

  /**
   * Creates a nautical dusk calendar event.
   *
   * Marks when the sea horizon becomes indistinguishable (Sun at −12° elevation).
   *
   * @param date - Precise UTC time of nautical dusk
   * @returns Calendar event for nautical dusk
   */
  buildNauticalDuskEvent(date: Moment): Event {
    const description = "Nautical Dusk";
    const summary = `🌉 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    this.logger.log(`${summary} at ${dateString}`);

    const nauticalDuskEvent: Event = {
      categories: [...TwilightsService.categories, "Nautical Dusk"],
      description,
      end: date,
      start: date,
      summary,
    };
    return nauticalDuskEvent;
  }

  /**
   * Detects twilight transition events at a specific minute.
   *
   * Identifies six daily twilight transitions based on solar depression angles:
   * - Astronomical dawn/dusk (18° below horizon)
   * - Nautical dawn/dusk (12° below horizon)
   * - Civil dawn/dusk (6° below horizon)
   *
   * @param args - Configuration object with minute and sunAzimuthElevationEphemeris
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
    const elevations = this.getSunElevations(sunAzimuthElevationEphemeris, minute);
    return this.buildTwilightTransitionEvents(elevations, minute);
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
   * @see {@link pairProgressiveEvents} for pairing logic
   */
  detectProgressive(events: Event[]): Event[] {
    const twilightEvents = events.filter((event) =>
      event.categories.includes("Twilight"),
    );
    const byCategory = (category: string): Event[] =>
      twilightEvents.filter((event) => event.categories.includes(category));

    const astronomicalDawnEvents = byCategory("Astronomical Dawn");
    const nauticalDawnEvents = byCategory("Nautical Dawn");
    const civilDawnEvents = byCategory("Civil Dawn");
    const civilDuskEvents = byCategory("Civil Dusk");
    const nauticalDuskEvents = byCategory("Nautical Dusk");
    const astronomicalDuskEvents = byCategory("Astronomical Dusk");

    return [
      ...this.buildDawnProgressiveEvents(
        astronomicalDawnEvents,
        nauticalDawnEvents,
        civilDawnEvents,
      ),
      ...this.buildDuskProgressiveEvents(
        civilDawnEvents,
        civilDuskEvents,
        nauticalDuskEvents,
        astronomicalDuskEvents,
      ),
      ...this.pairAndBuild(
        astronomicalDuskEvents,
        astronomicalDawnEvents,
        "Night",
        (beginning, ending) => this.getNightDurationEvent(beginning, ending),
      ),
    ];
  }
}
