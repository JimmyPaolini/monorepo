import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Injectable } from "@nestjs/common";

import { LoggerService } from "../logger/logger.service";

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
 * Detects key annual solar cycle events based on the Sun's ecliptic longitude and distance.
 *
 * Identifies solstices, equinoxes, Celtic cross-quarter days, hexadecans (16-part ecliptic
 * divisions), and solar apsis events (perihelion and aphelion).
 */
@Injectable()
export class AnnualSolarCycleService {
  // 🏗 Dependency Injection

  constructor(
    private readonly logger: LoggerService,
    private readonly ephemerisService: EphemerisService,
    private readonly mathService: MathService,
    private readonly progressiveUtilitiesService: ProgressiveUtilities,
  ) {
    this.logger.setContext(AnnualSolarCycleService.name);
  }

  // 🔐 Private Fields

  private static readonly categories = [
    "Astronomy",
    "Astrology",
    "Annual Solar Cycle",
    "Solar",
  ];

  // 🔑 Public Fields

  // 🔏 Private Methods

  private getSolarAdvancingDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      categories: [...AnnualSolarCycleService.categories, "Advancing"],
      description: "Solar Advancing (Aphelion to Perihelion)",
      end: ending.start,
      start: beginning.start,
      summary: "☀️ 🔥 Solar Advancing",
    };
  }

  private getSolarRetreatingDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      categories: [...AnnualSolarCycleService.categories, "Retreating"],
      description: "Solar Retreating (Perihelion to Aphelion)",
      end: ending.start,
      start: beginning.start,
      summary: "☀️ ❄️ Solar Retreating",
    };
  }

  // 🌎 Public Methods

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
    this.logger.log(`${summary} at ${dateString}`);

    const aphelionEvent: Event = {
      categories: [...AnnualSolarCycleService.categories, "Aphelion"],
      description,
      end: date,
      start: date,
      summary,
    };
    return aphelionEvent;
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
    this.logger.log(`${summary} at ${dateString}`);

    const autumnalEquinoxEvent: Event = {
      categories: AnnualSolarCycleService.categories,
      description,
      end: date,
      start: date,
      summary,
    };
    return autumnalEquinoxEvent;
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
    this.logger.log(`${summary} at ${dateString}`);

    const beltaneEvent: Event = {
      categories: AnnualSolarCycleService.categories,
      description,
      end: date,
      start: date,
      summary,
    };
    return beltaneEvent;
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
    this.logger.log(`${summary} at ${dateString}`);
    const eleventhHexadecanEvent: Event = {
      categories: AnnualSolarCycleService.categories,
      description,
      end: date,
      start: date,
      summary,
    };
    return eleventhHexadecanEvent;
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
    this.logger.log(`${summary} at ${dateString}`);

    const fifteenthHexadecanEvent: Event = {
      categories: AnnualSolarCycleService.categories,
      description,
      end: date,
      start: date,
      summary,
    };
    return fifteenthHexadecanEvent;
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
    this.logger.log(`${summary} at ${dateString}`);

    const fifthHexadecanEvent: Event = {
      categories: AnnualSolarCycleService.categories,
      description,
      end: date,
      start: date,
      summary,
    };
    return fifthHexadecanEvent;
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
    this.logger.log(`${summary} at ${dateString}`);
    const firstHexadecanEvent: Event = {
      categories: AnnualSolarCycleService.categories,
      description,
      end: date,
      start: date,
      summary,
    };
    return firstHexadecanEvent;
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
    this.logger.log(`${summary} at ${dateString}`);

    const imbolcEvent: Event = {
      categories: AnnualSolarCycleService.categories,
      description,
      end: date,
      start: date,
      summary,
    };
    return imbolcEvent;
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
    this.logger.log(`${summary} at ${dateString}`);

    const lammasEvent: Event = {
      categories: AnnualSolarCycleService.categories,
      description,
      end: date,
      start: date,
      summary,
    };
    return lammasEvent;
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
    this.logger.log(`${summary} at ${dateString}`);
    const ninthHexadecanEvent: Event = {
      categories: AnnualSolarCycleService.categories,
      description,
      end: date,
      start: date,
      summary,
    };
    return ninthHexadecanEvent;
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
    this.logger.log(`${summary} at ${dateString}`);

    const perihelionEvent: Event = {
      categories: [...AnnualSolarCycleService.categories, "Perihelion"],
      description,
      end: date,
      start: date,
      summary,
    };
    return perihelionEvent;
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
    this.logger.log(`${summary} at ${dateString}`);

    const samhainEvent: Event = {
      categories: AnnualSolarCycleService.categories,
      description,
      end: date,
      start: date,
      summary,
    };
    return samhainEvent;
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
    this.logger.log(`${summary} at ${dateString}`);
    const seventhHexadecanEvent: Event = {
      categories: AnnualSolarCycleService.categories,
      description,
      end: date,
      start: date,
      summary,
    };
    return seventhHexadecanEvent;
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
    this.logger.log(`${summary} at ${dateString}`);

    const summerSolsticeEvent: Event = {
      categories: AnnualSolarCycleService.categories,
      description,
      end: date,
      start: date,
      summary,
    };
    return summerSolsticeEvent;
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
    this.logger.log(`${summary} at ${dateString}`);

    const thirdHexadecanEvent: Event = {
      categories: AnnualSolarCycleService.categories,
      description,
      end: date,
      start: date,
      summary,
    };
    return thirdHexadecanEvent;
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
    this.logger.log(`${summary} at ${dateString}`);
    const thirteenthHexadecanEvent: Event = {
      categories: AnnualSolarCycleService.categories,
      description,
      end: date,
      start: date,
      summary,
    };
    return thirteenthHexadecanEvent;
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
    this.logger.log(`${summary} at ${dateString}`);

    const vernalEquinoxEvent: Event = {
      categories: AnnualSolarCycleService.categories,
      description,
      end: date,
      start: date,
      summary,
    };
    return vernalEquinoxEvent;
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
    this.logger.log(`${summary} at ${dateString}`);

    const winterSolsticeEvent: Event = {
      categories: AnnualSolarCycleService.categories,
      description,
      end: date,
      start: date,
      summary,
    };
    return winterSolsticeEvent;
  }

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
    const advancingPairs =
      this.progressiveUtilitiesService.pairProgressiveEvents(
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
    const retreatingPairs =
      this.progressiveUtilitiesService.pairProgressiveEvents(
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

  /**
   * Detects solstice, equinox, cross-quarter, and hexadecan events at a specific minute.
   *
   * Compares the Sun's ecliptic longitude against threshold values for all annual solar
   * cycle markers: the 4 seasonal turning points, 4 Celtic cross-quarter days,
   * and 8 hexadecan midpoints (22.5° increments).
   *
   * @param args - Sun coordinate ephemeris and the current minute to analyze
   * @returns Array of detected annual solar cycle events (0-1 events per minute)
   */
  getAnnualSolarCycleEvents(args: {
    minute: Moment;
    sunCoordinateEphemeris: CoordinateEphemeris;
  }): Event[] {
    const { minute, sunCoordinateEphemeris: ephemeris } = args;

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

    if (this.isVernalEquinox({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildVernalEquinoxEvent(date));
    }
    if (this.isFirstHexadecan({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildFirstHexadecanEvent(date));
    }
    if (this.isBeltane({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildBeltaneEvent(date));
    }
    if (this.isThirdHexadecan({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildThirdHexadecanEvent(date));
    }
    if (this.isSummerSolstice({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildSummerSolsticeEvent(date));
    }
    if (this.isFifthHexadecan({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildFifthHexadecanEvent(date));
    }
    if (this.isLammas({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildLammasEvent(date));
    }
    if (this.isSeventhHexadecan({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildSeventhHexadecanEvent(date));
    }
    if (this.isAutumnalEquinox({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildAutumnalEquinoxEvent(date));
    }
    if (this.isNinthHexadecan({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildNinthHexadecanEvent(date));
    }
    if (this.isSamhain({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildSamhainEvent(date));
    }
    if (this.isEleventhHexadecan({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildEleventhHexadecanEvent(date));
    }
    if (this.isWinterSolstice({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildWinterSolsticeEvent(date));
    }
    if (this.isThirteenthHexadecan({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildThirteenthHexadecanEvent(date));
    }
    if (this.isImbolc({ ...longitudes })) {
      annualSolarCycleEvents.push(this.buildImbolcEvent(date));
    }
    if (this.isFifteenthHexadecan({ ...longitudes })) {
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
      next: nextDistance,
      previous: previousDistance,
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

  // #region 📏 Annual Solar Cycle

  /**
   * Determines if the Sun is crossing the autumnal equinox point (180°).
   * Marks equal day and night, beginning of astronomical autumn.
   * @param args - Configuration object
   * @returns True if crossing 180° longitude
   */
  isAutumnalEquinox(args: {
    currentLongitude: number;
    previousLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;
    return currentLongitude >= 180 && previousLongitude < 180;
  }

  /**
   * Determines if the Sun is crossing the Beltane point (45°).
   * Celtic cross-quarter day between spring equinox and summer solstice.
   * @param args - Configuration object
   * @param currentLongitude - Current solar longitude in degrees
   * @param previousLongitude - Previous minute's solar longitude in degrees
   * @returns True if crossing 45° longitude
   */
  isBeltane(args: {
    currentLongitude: number;
    previousLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;
    return currentLongitude >= 45 && previousLongitude < 45;
  }

  /**
   * Determines if the Sun is crossing the eleventh hexadecan point (247.5°).
   * @param args - Configuration object
   * @returns True if crossing 247.5° longitude
   */
  isEleventhHexadecan(args: {
    currentLongitude: number;
    previousLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;
    return currentLongitude >= 247.5 && previousLongitude < 247.5;
  }

  /**
   * Determines if the Sun is crossing the fifteenth hexadecan point (337.5°).
   * @param args - Configuration object
   * @returns True if crossing 337.5° longitude
   */
  isFifteenthHexadecan(args: {
    currentLongitude: number;
    previousLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;
    return currentLongitude >= 337.5 && previousLongitude < 337.5;
  }

  /**
   * Determines if the Sun is crossing the fifth hexadecan point (112.5°).
   * @param args - Configuration object
   * @returns True if crossing 112.5° longitude
   */
  isFifthHexadecan(args: {
    currentLongitude: number;
    previousLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;
    return currentLongitude >= 112.5 && previousLongitude < 112.5;
  }

  /**
   * Determines if the Sun is crossing the first hexadecan point (22.5°).
   * @param args - Configuration object
   * @param currentLongitude - Current solar longitude in degrees
   * @param previousLongitude - Previous minute's solar longitude in degrees
   * @returns True if crossing 22.5° longitude
   */
  isFirstHexadecan(args: {
    currentLongitude: number;
    previousLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;
    return currentLongitude >= 22.5 && previousLongitude < 22.5;
  }

  /**
   * Determines if the Sun is crossing the Imbolc point (315°).
   * Celtic cross-quarter day between winter solstice and spring equinox.
   * @param args - Configuration object
   * @returns True if crossing 315° longitude
   */
  isImbolc(args: {
    currentLongitude: number;
    previousLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;
    return currentLongitude >= 315 && previousLongitude < 315;
  }

  /**
   * Determines if the Sun is crossing the Lammas point (135°).
   * Celtic cross-quarter day between summer solstice and autumn equinox.
   * @param args - Configuration object
   * @returns True if crossing 135° longitude
   */
  isLammas(args: {
    currentLongitude: number;
    previousLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;
    return currentLongitude >= 135 && previousLongitude < 135;
  }

  /**
   * Determines if the Sun is crossing the ninth hexadecan point (202.5°).
   * @param args - Configuration object
   * @returns True if crossing 202.5° longitude
   */
  isNinthHexadecan(args: {
    currentLongitude: number;
    previousLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;
    return currentLongitude >= 202.5 && previousLongitude < 202.5;
  }

  /**
   * Determines if the Sun is crossing the Samhain point (225°).
   * Celtic cross-quarter day between autumn equinox and winter solstice.
   * @param args - Configuration object
   * @returns True if crossing 225° longitude
   */
  isSamhain(args: {
    currentLongitude: number;
    previousLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;
    return currentLongitude >= 225 && previousLongitude < 225;
  }

  /**
   * Determines if the Sun is crossing the seventh hexadecan point (157.5°).
   * @param args - Configuration object
   * @returns True if crossing 157.5° longitude
   */
  isSeventhHexadecan(args: {
    currentLongitude: number;
    previousLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;
    return currentLongitude >= 157.5 && previousLongitude < 157.5;
  }

  /**
   * Determines if the Sun is crossing the summer solstice point (90°).
   * Marks the longest day in the Northern Hemisphere.
   * @param args - Configuration object
   * @returns True if crossing 90° longitude
   */
  isSummerSolstice(args: {
    currentLongitude: number;
    previousLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;
    return currentLongitude >= 90 && previousLongitude < 90;
  }

  /**
   * Determines if the Sun is crossing the third hexadecan point (67.5°).
   * @param args - Configuration object
   * @returns True if crossing 67.5° longitude
   */
  isThirdHexadecan(args: {
    currentLongitude: number;
    previousLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;
    return currentLongitude >= 67.5 && previousLongitude < 67.5;
  }

  /**
   * Determines if the Sun is crossing the thirteenth hexadecan point (292.5°).
   * @param args - Configuration object
   * @returns True if crossing 292.5° longitude
   */
  isThirteenthHexadecan(args: {
    currentLongitude: number;
    previousLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;
    return currentLongitude >= 292.5 && previousLongitude < 292.5;
  }

  /**
   * Determines if the Sun is crossing the vernal equinox point.
   *
   * The vernal equinox occurs when the Sun's ecliptic longitude crosses 0° (or 360°),
   * transitioning from Pisces to Aries. This marks the beginning of astronomical spring.
   *
   * @param args - Configuration object
   * @param currentLongitude - Current solar longitude in degrees (0-360)
   * @param previousLongitude - Previous minute's solar longitude in degrees
   * @returns True if crossing the vernal equinox point
   *
   * @remarks
   * Uses wraparound detection: current \< 180 && previous \> 180 indicates
   * a crossing from ~360° to ~0° (Pisces to Aries boundary)
   */
  isVernalEquinox(args: {
    currentLongitude: number;
    previousLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;
    return currentLongitude < 180 && previousLongitude > 180;
  }

  /**
   * Determines if the Sun is crossing the winter solstice point (270°).
   * Marks the shortest day in the Northern Hemisphere.
   * @param args - Configuration object
   * @returns True if crossing 270° longitude
   */
  isWinterSolstice(args: {
    currentLongitude: number;
    previousLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;
    return currentLongitude >= 270 && previousLongitude < 270;
  }
}
