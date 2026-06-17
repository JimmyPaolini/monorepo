import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Injectable } from "@nestjs/common";

import { LoggerService } from "../logger/logger.service";

import type { Twilight } from "./twilights.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { AzimuthElevationEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

/** Event building and twilight detection helpers for {@link TwilightsService}. */
@Injectable()
export class TwilightsHelperService {
  // 🏗 Dependency Injection

  constructor(
    private readonly logger: LoggerService,
    private readonly ephemerisService: EphemerisService,
    private readonly progressiveUtilitiesService: ProgressiveUtilities,
  ) {
    this.logger.setContext(TwilightsHelperService.name);
  }

  // 🔐 Private Fields

  private static readonly categories = ["Astronomy", "Astrology", "Twilight"];
  private static readonly degreesByTwilight: Record<Twilight, number> = {
    astronomical: 18,
    civil: 6,
    nautical: 12,
  };

  // 🔏 Private Methods

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
      categories: [...TwilightsHelperService.categories, "Astronomical Dawn"],
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
      categories: [...TwilightsHelperService.categories, "Astronomical Dusk"],
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
      categories: [...TwilightsHelperService.categories, "Civil Dawn"],
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
      categories: [...TwilightsHelperService.categories, "Civil Dusk"],
      description,
      end: date,
      start: date,
      summary,
    };
    return civilDuskEvent;
  }

  /**
   *
   */
  buildDawnProgressiveEvents(
    astronomicalDawnEvents: Event[],
    nauticalDawnEvents: Event[],
    civilDawnEvents: Event[],
  ): Event[] {
    return [
      ...this.pairAndBuild({
        beginnings: astronomicalDawnEvents,
        builder: (beginning, ending) =>
          this.getAstronomicalTwilightMorningDurationEvent(beginning, ending),
        endings: nauticalDawnEvents,
        label: "Astronomical Twilight (Morning)",
      }),
      ...this.pairAndBuild({
        beginnings: nauticalDawnEvents,
        builder: (beginning, ending) =>
          this.getNauticalTwilightMorningDurationEvent(beginning, ending),
        endings: civilDawnEvents,
        label: "Nautical Twilight (Morning)",
      }),
    ];
  }

  /**
   *
   */
  buildDuskProgressiveEvents(args: {
    astronomicalDuskEvents: Event[];
    civilDawnEvents: Event[];
    civilDuskEvents: Event[];
    nauticalDuskEvents: Event[];
  }): Event[] {
    const {
      astronomicalDuskEvents,
      civilDawnEvents,
      civilDuskEvents,
      nauticalDuskEvents,
    } = args;
    return [
      ...this.pairAndBuild({
        beginnings: civilDawnEvents,
        builder: (beginning, ending) =>
          this.getDaylightDurationEvent(beginning, ending),
        endings: civilDuskEvents,
        label: "Daylight",
      }),
      ...this.pairAndBuild({
        beginnings: civilDuskEvents,
        builder: (beginning, ending) =>
          this.getNauticalTwilightEveningDurationEvent(beginning, ending),
        endings: nauticalDuskEvents,
        label: "Nautical Twilight (Evening)",
      }),
      ...this.pairAndBuild({
        beginnings: nauticalDuskEvents,
        builder: (beginning, ending) =>
          this.getAstronomicalTwilightEveningDurationEvent(beginning, ending),
        endings: astronomicalDuskEvents,
        label: "Astronomical Twilight (Evening)",
      }),
    ];
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
      categories: [...TwilightsHelperService.categories, "Nautical Dawn"],
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
      categories: [...TwilightsHelperService.categories, "Nautical Dusk"],
      description,
      end: date,
      start: date,
      summary,
    };
    return nauticalDuskEvent;
  }

  /**
   *
   */
  buildTwilightTransitionEvents(
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

  /**
   *
   */
  getAstronomicalTwilightEveningDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      categories: [
        ...TwilightsHelperService.categories,
        "Astronomical Twilight",
        "Evening",
      ],
      description: "Astronomical Twilight (Evening)",
      end: ending.start,
      start: beginning.start,
      summary: "🌌 Astronomical Twilight (Evening)",
    };
  }

  /**
   *
   */
  getAstronomicalTwilightMorningDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      categories: [
        ...TwilightsHelperService.categories,
        "Astronomical Twilight",
        "Morning",
      ],
      description: "Astronomical Twilight (Morning)",
      end: ending.start,
      start: beginning.start,
      summary: "🌠 Astronomical Twilight (Morning)",
    };
  }

  /**
   *
   */
  getDaylightDurationEvent(beginning: Event, ending: Event): Event {
    return {
      categories: [...TwilightsHelperService.categories, "Daylight"],
      description: "Daylight",
      end: ending.start,
      start: beginning.start,
      summary: "☀️ Daylight",
    };
  }

  /**
   *
   */
  getNauticalTwilightEveningDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      categories: [
        ...TwilightsHelperService.categories,
        "Nautical Twilight",
        "Evening",
      ],
      description: "Nautical Twilight (Evening)",
      end: ending.start,
      start: beginning.start,
      summary: "🌉 Nautical Twilight (Evening)",
    };
  }

  /**
   *
   */
  getNauticalTwilightMorningDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      categories: [
        ...TwilightsHelperService.categories,
        "Nautical Twilight",
        "Morning",
      ],
      description: "Nautical Twilight (Morning)",
      end: ending.start,
      start: beginning.start,
      summary: "🌅 Nautical Twilight (Morning)",
    };
  }

  /**
   *
   */
  getNightDurationEvent(beginning: Event, ending: Event): Event {
    return {
      categories: [...TwilightsHelperService.categories, "Night"],
      description: "Night",
      end: ending.start,
      start: beginning.start,
      summary: "🌃 Night",
    };
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
    const { currentElevation, previousElevation } = args;
    return this.isDawn({
      currentElevation,
      previousElevation,
      twilight: "astronomical",
    });
  }

  /**
   *
   */
  isAstronomicalDusk(args: {
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

  /**
   *
   */
  isCivilDawn(args: {
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

  /**
   *
   */
  isCivilDusk(args: {
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

  /**
   *
   */
  isDawn(args: {
    currentElevation: number;
    previousElevation: number;
    twilight: Twilight;
  }): boolean {
    const { currentElevation, previousElevation, twilight } = args;
    const degrees = TwilightsHelperService.degreesByTwilight[twilight];
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
    const degrees = TwilightsHelperService.degreesByTwilight[twilight];
    return currentElevation < -degrees && previousElevation > -degrees;
  }

  /**
   *
   */
  isNauticalDawn(args: {
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

  /**
   *
   */
  isNauticalDusk(args: {
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

  /**
   *
   */
  pairAndBuild(args: {
    beginnings: Event[];
    builder: (beginning: Event, ending: Event) => Event;
    endings: Event[];
    label: string;
  }): Event[] {
    const { beginnings, builder, endings, label } = args;
    const pairs = this.progressiveUtilitiesService.pairProgressiveEvents(
      beginnings,
      endings,
      label,
    );
    return pairs.map(([beginning, ending]) => builder(beginning, ending));
  }
}
