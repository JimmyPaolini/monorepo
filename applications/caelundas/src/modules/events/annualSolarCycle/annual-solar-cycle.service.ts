import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { pairProgressiveEvents } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Injectable } from "@nestjs/common";

import {
  isAutumnalEquinox,
  isBeltane,
  isEleventhHexadecan,
  isFifteenthHexadecan,
  isFifthHexadecan,
  isFirstHexadecan,
  isImbolc,
  isLammas,
  isNinthHexadecan,
  isSamhain,
  isSeventhHexadecan,
  isSummerSolstice,
  isThirdHexadecan,
  isThirteenthHexadecan,
  isVernalEquinox,
  isWinterSolstice,
} from "./annualSolarCycle.utilities";

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type {
  CoordinateEphemeris,
  DistanceEphemeris,
} from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

// #region 📏 Annual Solar Cycle

// #region 🌞 Solar Apsis

// #region 🕰️ Solstices, Equinoxes, Quarter days, Hexadecans

// #region 🕑 Progressive Events

/**
 *
 */
@Injectable()
export class AnnualSolarCycleService {
  private static readonly categories = [
    "Astronomy",
    "Astrology",
    "Annual Solar Cycle",
    "Solar",
  ];
  constructor(
    private readonly ephemerisService: EphemerisService,
    private readonly mathService: MathService,
  ) {}

  /**
   * Detects annual solar cycle events at a specific minute.
   *
   * Identifies key solar positions throughout the year: solstices (longest/shortest
   * days), equinoxes (equal day/night), cross-quarter days (Celtic festivals), and
   * hexadecans (16-part division of the ecliptic). Uses the Sun's ecliptic longitude
   * to determine precise crossing times.
   *
   * @param args - Configuration object
   * @param sunCoordinateEphemeris - Pre-computed Sun position data
   * @param currentMinute - The specific minute to analyze
   * @returns Array of detected annual cycle events (0-1 events per minute)
   * @see {@link getCoordinateFromEphemeris} for position retrieval
   * @see {@link isVernalEquinox} for equinox detection algorithms
   *
   * @remarks
   * Solar longitude markers:
   * - 0° = Vernal Equinox
   * - 90° = Summer Solstice
   * - 180° = Autumnal Equinox
   * - 270° = Winter Solstice
   * - Cross-quarters at 45° increments (Beltane, Lammas, Samhain, Imbolc)
   * - Hexadecans at 22.5° increments
   *
   * @example
   * ```typescript
   * const events = getAnnualSolarCycleEvents({
   *   sunCoordinateEphemeris,
   *   currentMinute: moment('2025-03-20T09:01')
   * });
   * Returns [vernalEquinoxEvent] when Sun crosses 0° longitude
   * ```
   */
  detect(args: {
    minute: Moment;
    sunCoordinateEphemeris: CoordinateEphemeris;
    sunDistanceEphemeris: DistanceEphemeris;
  }): Event[] {
    return [
      ...this.getAnnualSolarCycleEvents(args),
      ...this.getSolarApsisEvents(args),
    ];
  }

  /**
   *
   */
  getAnnualSolarCycleEvents(args: {
    sunCoordinateEphemeris: CoordinateEphemeris;
    minute: Moment;
  }): Event[] {
    const { sunCoordinateEphemeris: ephemeris, minute } = args;

    const previousMinute = minute.clone().subtract(1, "minute");

    const annualSolarCycleEvents: Event[] = [];

    const currentLongitude = this.ephemerisService.getCoordinateFromEphemeris(
      ephemeris,
      minute.toISOString(),
      "longitude",
    );
    const previousLongitude = this.ephemerisService.getCoordinateFromEphemeris(
      ephemeris,
      previousMinute.toISOString(),
      "longitude",
    );

    const longitudes = { currentLongitude, previousLongitude };
    const date = minute;

    if (isVernalEquinox({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildVernalEquinoxEvent(date));
    }
    if (isFirstHexadecan({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildFirstHexadecanEvent(date));
    }
    if (isBeltane({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildBeltaneEvent(date));
    }
    if (isThirdHexadecan({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildThirdHexadecanEvent(date));
    }
    if (isSummerSolstice({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildSummerSolsticeEvent(date));
    }
    if (isFifthHexadecan({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildFifthHexadecanEvent(date));
    }
    if (isLammas({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildLammasEvent(date));
    }
    if (isSeventhHexadecan({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildSeventhHexadecanEvent(date));
    }
    if (isAutumnalEquinox({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildAutumnalEquinoxEvent(date));
    }
    if (isNinthHexadecan({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildNinthHexadecanEvent(date));
    }
    if (isSamhain({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildSamhainEvent(date));
    }
    if (isEleventhHexadecan({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildEleventhHexadecanEvent(date));
    }
    if (isWinterSolstice({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildWinterSolsticeEvent(date));
    }
    if (isThirteenthHexadecan({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildThirteenthHexadecanEvent(date));
    }
    if (isImbolc({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildImbolcEvent(date));
    }
    if (isFifteenthHexadecan({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildFifteenthHexadecanEvent(date));
    }

    return annualSolarCycleEvents;
  }

  /**
   * Detects solar apsis events (perihelion and aphelion).
   *
   * Identifies when Earth reaches its closest (perihelion) and farthest (aphelion)
   * points from the Sun. These occur once per year and affect Earth's orbital speed
   * and apparent solar diameter. Perihelion typically occurs in early January,
   * aphelion in early July.
   *
   * @param args - Configuration object
   * @param currentMinute - The specific minute to analyze
   * @param sunDistanceEphemeris - Pre-computed Sun-Earth distance data
   * @returns Array of detected apsis events (0-1 events per minute)
   * @see {@link getDistanceFromEphemeris} for distance retrieval
   * @see {@link isMaximum} for aphelion detection
   * @see {@link isMinimum} for perihelion detection
   *
   * @remarks
   * Perihelion: ~147.1 million km (Earth moving fastest, ~30.3 km/s)
   * Aphelion: ~152.1 million km (Earth moving slowest, ~29.3 km/s)
   *
   * @example
   * ```typescript
   * const events = getSolarApsisEvents({
   *   currentMinute: moment('2025-01-04T12:00'),
   *   sunDistanceEphemeris
   * });
   * // Returns [perihelionEvent] when Earth is closest to Sun
   * ```
   */
  getSolarApsisEvents(args: {
    minute: Moment;
    sunDistanceEphemeris: DistanceEphemeris;
  }): Event[] {
    const { minute, sunDistanceEphemeris } = args;

    const previousMinute = minute.clone().subtract(1, "minute");
    const nextMinute = minute.clone().add(1, "minute");

    const solarApsisEvents: Event[] = [];

    const currentDistance = this.ephemerisService.getDistanceFromEphemeris(
      sunDistanceEphemeris,
      minute.toISOString(),
      "distance",
    );
    const previousDistance = this.ephemerisService.getDistanceFromEphemeris(
      sunDistanceEphemeris,
      previousMinute.toISOString(),
      "distance",
    );
    const nextDistance = this.ephemerisService.getDistanceFromEphemeris(
      sunDistanceEphemeris,
      nextMinute.toISOString(),
      "distance",
    );

    const distances = {
      current: currentDistance,
      previous: previousDistance,
      next: nextDistance,
    };

    const date = minute;

    if (this.mathService.isMaximum({ ...distances })) {
      solarApsisEvents.push(this.buildAphelionEvent(date));
    }

    if (this.mathService.isMinimum({ ...distances })) {
      solarApsisEvents.push(this.buildPerihelionEvent(date));
    }

    return solarApsisEvents;
  }

  /**
   * Creates an aphelion calendar event.
   *
   * Aphelion is Earth's farthest point from the Sun in its elliptical orbit.
   * Occurs around July 4th annually. Earth moves slowest at aphelion due to
   * Kepler's second law of planetary motion.
   *
   * @param date - Precise UTC time of aphelion
   * @returns Calendar event for aphelion
   * @see {@link isMaximum} for distance maximum detection
   */
  buildAphelionEvent(date: Moment): Event {
    const description = "Solar Aphelion";
    const summary = `☀️ ❄️ ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const aphelionEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: [...AnnualSolarCycleService.categories, "Aphelion"],
    };
    return aphelionEvent;
  }

  /**
   * Creates a perihelion calendar event.
   *
   * Perihelion is Earth's closest point to the Sun in its elliptical orbit.
   * Occurs around January 3rd annually. Earth moves fastest at perihelion due to
   * Kepler's second law of planetary motion.
   *
   * @param date - Precise UTC time of perihelion
   * @returns Calendar event for perihelion
   * @see {@link isMinimum} for distance minimum detection
   */
  buildPerihelionEvent(date: Moment): Event {
    const description = "Solar Perihelion";
    const summary = `☀️ 🔥 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const perihelionEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: [...AnnualSolarCycleService.categories, "Perihelion"],
    };
    return perihelionEvent;
  }

  /**
   * Creates a vernal (spring) equinox calendar event.
   *
   * The vernal equinox marks the beginning of astronomical spring when the Sun
   * crosses the celestial equator from south to north (ecliptic longitude 0°).
   * Day and night are approximately equal length worldwide.
   *
   * @param date - Precise UTC time of vernal equinox
   * @returns Calendar event for vernal equinox
   * @see {@link isVernalEquinox} for detection algorithm
   *
   * @remarks Occurs around March 20-21 annually
   */
  buildVernalEquinoxEvent(date: Moment): Event {
    const description = "Vernal Equinox";
    const summary = `🌸 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const vernalEquinoxEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: AnnualSolarCycleService.categories,
    };
    return vernalEquinoxEvent;
  }

  /**
   * Creates a first hexadecan calendar event.
   *
   * Hexadecans divide the ecliptic into 16 equal parts of 22.5° each.
   * The first hexadecan occurs at solar longitude 22.5°.
   *
   * @param date - Precise UTC time of first hexadecan
   * @returns Calendar event for first hexadecan
   * @remarks Occurs approximately April 10th
   */
  buildFirstHexadecanEvent(date: Moment): Event {
    const description = "First Hexadecan";
    const summary = `🌳 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);
    const firstHexadecanEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: AnnualSolarCycleService.categories,
    };
    return firstHexadecanEvent;
  }

  /**
   * Creates a Beltane calendar event.
   *
   * Beltane is a Celtic cross-quarter day marking the midpoint between spring
   * equinox and summer solstice (solar longitude 45°). Traditional May Day celebration.
   *
   * @param date - Precise UTC time of Beltane
   * @returns Calendar event for Beltane
   * @remarks Occurs around May 5th annually
   */
  buildBeltaneEvent(date: Moment): Event {
    const description = "Beltane";
    const summary = `🐦‍🔥 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const beltaneEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: AnnualSolarCycleService.categories,
    };
    return beltaneEvent;
  }

  /**
   * Creates a third hexadecan calendar event.
   *
   * The third hexadecan occurs at solar longitude 67.5°.
   *
   * @param date - Precise UTC time of third hexadecan
   * @returns Calendar event for third hexadecan
   * @remarks Occurs approximately June 1st
   */
  buildThirdHexadecanEvent(date: Moment): Event {
    const description = "Third Hexadecan";
    const summary = `🌻 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const thirdHexadecanEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: AnnualSolarCycleService.categories,
    };
    return thirdHexadecanEvent;
  }

  /**
   * Creates a summer solstice calendar event.
   *
   * The summer solstice marks the longest day of the year in the Northern Hemisphere
   * when the Sun reaches its highest declination at ecliptic longitude 90°.
   *
   * @param date - Precise UTC time of summer solstice
   * @returns Calendar event for summer solstice
   * @see {@link isSummerSolstice} for detection algorithm
   * @remarks Occurs around June 20-21 annually
   */
  buildSummerSolsticeEvent(date: Moment): Event {
    const description = "Summer Solstice";
    const summary = `🌞 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const summerSolsticeEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: AnnualSolarCycleService.categories,
    };
    return summerSolsticeEvent;
  }

  /**
   * Creates a fifth hexadecan calendar event at solar longitude 112.5°.
   * @param date - Precise UTC time of fifth hexadecan
   * @returns Calendar event for fifth hexadecan
   * @remarks Occurs approximately July 22nd
   */
  buildFifthHexadecanEvent(date: Moment): Event {
    const description = "Fifth Hexadecan";
    const summary = `⛱️ ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const fifthHexadecanEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: AnnualSolarCycleService.categories,
    };
    return fifthHexadecanEvent;
  }

  /**
   * Creates a Lammas calendar event.
   *
   * Lammas (Lughnasadh) is a Celtic cross-quarter day marking the midpoint between
   * summer solstice and autumn equinox (solar longitude 135°). Traditional harvest festival.
   *
   * @param date - Precise UTC time of Lammas
   * @returns Calendar event for Lammas
   * @remarks Occurs around August 7th annually
   */
  buildLammasEvent(date: Moment): Event {
    const description = "Lammas";
    const summary = `🌾 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const lammasEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: AnnualSolarCycleService.categories,
    };
    return lammasEvent;
  }

  /**
   * Creates a seventh hexadecan calendar event at solar longitude 157.5°.
   * @param date - Precise UTC time of seventh hexadecan
   * @returns Calendar event for seventh hexadecan
   * @remarks Occurs approximately September 12th
   */
  buildSeventhHexadecanEvent(date: Moment): Event {
    const description = "Seventh Hexadecan";
    const summary = `🎑 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);
    const seventhHexadecanEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: AnnualSolarCycleService.categories,
    };
    return seventhHexadecanEvent;
  }

  /**
   * Creates an autumnal equinox calendar event.
   *
   * The autumnal equinox marks the beginning of astronomical autumn when the Sun
   * crosses the celestial equator from north to south (ecliptic longitude 180°).
   * Day and night are approximately equal length worldwide.
   *
   * @param date - Precise UTC time of autumnal equinox
   * @returns Calendar event for autumnal equinox
   * @see {@link isAutumnalEquinox} for detection algorithm
   * @remarks Occurs around September 22-23 annually
   */
  buildAutumnalEquinoxEvent(date: Moment): Event {
    const description = "Autumnal Equinox";
    const summary = `🍂 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const autumnalEquinoxEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: AnnualSolarCycleService.categories,
    };
    return autumnalEquinoxEvent;
  }

  /**
   * Creates a ninth hexadecan calendar event at solar longitude 202.5°.
   * @param date - Precise UTC time
   * @returns Calendar event
   */
  buildNinthHexadecanEvent(date: Moment): Event {
    const description = "Ninth Hexadecan";
    const summary = `🍁 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);
    const ninthHexadecanEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: AnnualSolarCycleService.categories,
    };
    return ninthHexadecanEvent;
  }

  /**
   * Creates a Samhain calendar event.
   *
   * Celtic cross-quarter day at solar longitude 225°. Traditional Halloween/ancestor festival.
   * @param date - Precise UTC time
   * @returns Calendar event
   * @remarks Occurs around November 7th
   */
  buildSamhainEvent(date: Moment): Event {
    const description = "Samhain";
    const summary = `🎃 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const samhainEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: AnnualSolarCycleService.categories,
    };
    return samhainEvent;
  }

  /**
   * Creates an eleventh hexadecan calendar event at solar longitude 247.5°.
   * @param date - Precise UTC time
   * @returns Calendar event
   */
  buildEleventhHexadecanEvent(date: Moment): Event {
    const description = "Eleventh Hexadecan";
    const summary = `🧤 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);
    const eleventhHexadecanEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: AnnualSolarCycleService.categories,
    };
    return eleventhHexadecanEvent;
  }

  /**
   * Creates a winter solstice calendar event.
   *
   * The winter solstice marks the shortest day in the Northern Hemisphere
   * at ecliptic longitude 270°.
   *
   * @param date - Precise UTC time
   * @returns Calendar event
   * @see {@link isWinterSolstice}
   * @remarks Occurs around December 21-22
   */
  buildWinterSolsticeEvent(date: Moment): Event {
    const description = "Winter Solstice";
    const summary = `☃️ ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const winterSolsticeEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: AnnualSolarCycleService.categories,
    };
    return winterSolsticeEvent;
  }

  /**
   * Creates a thirteenth hexadecan calendar event at solar longitude 292.5°.
   * @param date - Precise UTC time
   * @returns Calendar event
   */
  buildThirteenthHexadecanEvent(date: Moment): Event {
    const description = "Thirteenth Hexadecan";
    const summary = `❄️ ${description}`;
    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);
    const thirteenthHexadecanEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: AnnualSolarCycleService.categories,
    };
    return thirteenthHexadecanEvent;
  }

  /**
   * Creates an Imbolc calendar event.
   *
   * Celtic cross-quarter day at solar longitude 315°. Traditional spring purification festival.
   * @param date - Precise UTC time
   * @returns Calendar event
   * @remarks Occurs around February 4th
   */
  buildImbolcEvent(date: Moment): Event {
    const description = "Imbolc";
    const summary = `🐑 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const imbolcEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: AnnualSolarCycleService.categories,
    };
    return imbolcEvent;
  }

  /**
   * Creates a fifteenth hexadecan calendar event at solar longitude 337.5°.
   * @param date - Precise UTC time
   * @returns Calendar event
   */
  buildFifteenthHexadecanEvent(date: Moment): Event {
    const description = "Fifteenth Hexadecan";
    const summary = `🌨️ ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const fifteenthHexadecanEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: AnnualSolarCycleService.categories,
    };
    return fifteenthHexadecanEvent;
  }

  /**
   * Generates progressive events for Earth's orbit between apsis points.
   *
   * Creates two types of progressive events based on Earth's orbital position:
   * - Advancing: Aphelion to Perihelion (Earth moving closer to Sun, speeding up)
   * - Retreating: Perihelion to Aphelion (Earth moving away from Sun, slowing down)
   *
   * @param events - Array of all solar events including apsis points
   * @returns Array of progressive events representing orbital segments
   * @see {@link pairProgressiveEvents} for event pairing logic
   *
   * @remarks
   * Based on Kepler's second law: planets sweep out equal areas in equal times,
   * so Earth moves faster when closer to the Sun (perihelion).
   */
  detectProgressive(events: Event[]): Event[] {
    const progressiveEvents: Event[] = [];

    // Filter to solar apsis events only
    const solarApsisEvents = events.filter((event) =>
      event.categories.includes("Annual Solar Cycle"),
    );

    // Perihelion (closest to sun, moving fastest)
    const perihelionEvents = solarApsisEvents.filter((event) =>
      event.categories.includes("Perihelion"),
    );

    // Aphelion (farthest from sun, moving slowest)
    const aphelionEvents = solarApsisEvents.filter((event) =>
      event.categories.includes("Aphelion"),
    );

    // Advancing: Aphelion → Perihelion (Earth moving closer to sun, speeding up)
    const advancingPairs = pairProgressiveEvents(
      aphelionEvents,
      perihelionEvents,
      "Solar Advancing",
    );
    for (const [beginning, ending] of advancingPairs) {
      progressiveEvents.push(
        this.getSolarAdvancingDurationEvent(beginning, ending),
      );
    }

    // Retreating: Perihelion → Aphelion (Earth moving away from sun, slowing down)
    const retreatingPairs = pairProgressiveEvents(
      perihelionEvents,
      aphelionEvents,
      "Solar Retreating",
    );
    for (const [beginning, ending] of retreatingPairs) {
      progressiveEvents.push(
        this.getSolarRetreatingDurationEvent(beginning, ending),
      );
    }

    return progressiveEvents;
  }

  private getSolarAdvancingDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      start: beginning.start,
      end: ending.start,
      summary: "☀️ 🔥 Solar Advancing",
      description: "Solar Advancing (Aphelion to Perihelion)",
      categories: [...AnnualSolarCycleService.categories, "Advancing"],
    };
  }

  private getSolarRetreatingDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      start: beginning.start,
      end: ending.start,
      summary: "☀️ ❄️ Solar Retreating",
      description: "Solar Retreating (Perihelion to Aphelion)",
      categories: [...AnnualSolarCycleService.categories, "Retreating"],
    };
  }
}
