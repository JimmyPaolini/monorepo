import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { Injectable } from "@nestjs/common";

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { AzimuthElevationEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

/**
 * Detects daily solar and lunar cycle events based on azimuth and elevation data.
 *
 * Identifies the four key daily positions for both Sun and Moon: rise (horizon crossing
 * upward), zenith (highest point), set (horizon crossing downward), and nadir (lowest point).
 */
@Injectable()
export class DailyCyclesService {
  static readonly sunRadiusDegrees = 16 / MathService.arcminutesPerDegree;
  private static readonly solarCategories = [
    "Astronomy",
    "Astrology",
    "Daily Solar Cycle",
    "Solar",
  ];
  private static readonly lunarCategories = [
    "Astronomy",
    "Astrology",
    "Daily Lunar Cycle",
    "Lunar",
  ];

  constructor(
    private readonly ephemerisService: EphemerisService,
    private readonly mathService: MathService,
  ) {}

  /**
   * Detects daily solar cycle events at a specific time point.
   *
   * Analyzes Sun's elevation angle over three consecutive minutes to identify the
   * four key daily events: sunrise (elevation crosses 0° upward), solar zenith
   * (local maximum elevation), sunset (elevation crosses 0° downward), and solar
   * nadir (local minimum elevation).
   *
   * @param args - Ephemeris data and current time
   * @param currentMinute - Time point to check for solar events (minute precision)
   * @param sunAzimuthElevationEphemeris - Pre-computed Sun position data with azimuth/elevation
   * @returns Array of calendar events for detected solar cycle points (0-1 events per call)
   *
   * @remarks
   * - Uses ±1 minute window (previous, current, next) for event detection
   * - **Sunrise**: Elevation crosses 0° horizon moving upward (isRise)
   * - **Solar Zenith**: Local maximum elevation (typically near local noon)
   * - **Sunset**: Elevation crosses 0° horizon moving downward (isSet)
   * - **Solar Nadir**: Local minimum elevation (typically near local midnight)
   * - Returns empty array if no event detected at this time
   * - At most one event type detected per minute (events well-separated in time)
   * - Elevation is measured from horizon: 0° = horizon, 90° = directly overhead (zenith)
   * - Does not account for atmospheric refraction (uses geometric elevation)
   *
   * @see {@link isRise} for sunrise detection (horizon crossing upward)
   * @see {@link isSet} for sunset detection (horizon crossing downward)
   * @see {@link isMaximum} for solar zenith detection (elevation maximum)
   * @see {@link isMinimum} for solar nadir detection (elevation minimum)
   * @see {@link buildSunriseEvent} for sunrise event formatting
   * @see {@link buildSolarZenithEvent} for zenith event formatting
   * @see {@link buildSunsetEvent} for sunset event formatting
   * @see {@link buildSolarNadirEvent} for nadir event formatting
   *
   * @example
   * ```typescript
   * const events = getDailySolarCycleEvents({
   *   currentMinute: moment('2026-01-21T12:15:00Z'),
   *   sunAzimuthElevationEphemeris: ephemeris
   * });
   * // Returns: [{ summary: "☀️ ⬆️ Solar Zenith", start: ..., ... }]
   * ```
   */
  detect(args: {
    minute: Moment;
    sunAzimuthElevationEphemeris: AzimuthElevationEphemeris;
    moonAzimuthElevationEphemeris: AzimuthElevationEphemeris;
  }): Event[] {
    return [
      ...this.getDailySolarCycleEvents(args),
      ...this.getDailyLunarCycleEvents(args),
    ];
  }

  /**
   * Detects daily solar cycle events at a specific minute.
   *
   * Checks for sunrise (elevation crosses 0° upward), solar zenith (local maximum),
   * sunset (elevation crosses 0° downward), and solar nadir (local minimum) by comparing
   * elevation values at the previous, current, and next minute.
   *
   * @param args - Sun azimuth/elevation ephemeris and the current minute to analyze
   * @returns Array of detected solar cycle events (0-1 events per minute)
   */
  getDailySolarCycleEvents(args: {
    minute: Moment;
    sunAzimuthElevationEphemeris: AzimuthElevationEphemeris;
  }): Event[] {
    const { minute, sunAzimuthElevationEphemeris } = args;

    const dailySolarCycleEvents: Event[] = [];

    const previousMinute = minute.clone().subtract(1, "minute");
    const nextMinute = minute.clone().add(1, "minute");

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
    const nextElevation =
      this.ephemerisService.getAzimuthElevationFromEphemeris(
        sunAzimuthElevationEphemeris,
        nextMinute.toISOString(),
        "elevation",
      );

    const elevations = {
      currentElevation,
      previousElevation,
      nextElevation,
      current: currentElevation,
      previous: previousElevation,
      next: nextElevation,
    };

    const date = minute;

    if (this.isRise({ ...elevations })) {
      dailySolarCycleEvents.push(this.buildSunriseEvent(date));
    }
    if (this.mathService.isMaximum({ ...elevations })) {
      dailySolarCycleEvents.push(this.buildSolarZenithEvent(date));
    }
    if (this.isSet({ ...elevations })) {
      dailySolarCycleEvents.push(this.buildSunsetEvent(date));
    }
    if (this.mathService.isMinimum({ ...elevations })) {
      dailySolarCycleEvents.push(this.buildSolarNadirEvent(date));
    }

    return dailySolarCycleEvents;
  }

  /**
   * Creates a formatted calendar event for sunrise.
   *
   * Generates a calendar event marking the moment when Sun's center crosses the
   * horizon moving upward (geometric sunrise, not accounting for atmospheric refraction).
   *
   * @param date - Exact time of sunrise
   * @returns Calendar event with summary, description, and standard solar cycle categories
   *
   * @remarks
   * - Summary: "☀️ 🔼 Sunrise"
   * - Emoji: ☀️ (sun), 🔼 (upward arrow)
   * - Logs event to console with America/New_York timezone
   * - Uses geometric horizon (0° elevation), not visual horizon
   * - Does not account for atmospheric refraction (~34 arcminutes)
   * - Does not account for observer altitude above sea level
   *
   * @see {@link isRise} for sunrise detection algorithm
   * @see {@link categories} for event categorization
   *
   * @example
   * ```typescript
   * const event = getSunriseEvent(new Date('2026-01-21T12:15:00Z'));
   * // Returns: { summary: "☀️ 🔼 Sunrise", start: ..., end: ..., ... }
   * ```
   */
  buildSunriseEvent(date: Moment): Event {
    const description = "Sunrise";
    const summary = `☀️ 🔼 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const sunriseEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: DailyCyclesService.solarCategories,
    };
    return sunriseEvent;
  }

  /**
   * Creates a formatted calendar event for solar zenith (solar noon).
   *
   * Generates a calendar event marking the moment when Sun reaches its highest point
   * in the sky (local maximum elevation). This occurs near local solar noon, when
   * Sun crosses the meridian (north-south line through zenith and nadir).
   *
   * @param date - Exact time of solar zenith
   * @returns Calendar event with summary, description, and standard solar cycle categories
   *
   * @remarks
   * - Summary: "☀️ ⬆️ Solar Zenith"
   * - Emoji: ☀️ (sun), ⬆️ (double upward arrow)
   * - Also known as "solar noon" or "meridian transit"
   * - Logs event to console with America/New_York timezone
   * - Maximum elevation depends on observer latitude and Sun's declination
   * - At equator on equinox: zenith elevation = 90° (directly overhead)
   * - Solar zenith time differs from clock noon due to equation of time and longitude
   *
   * @see {@link isMaximum} for zenith detection algorithm
   * @see {@link categories} for event categorization
   *
   * @example
   * ```typescript
   * const event = getSolarZenithEvent(new Date('2026-01-21T17:30:00Z'));
   * // Returns: { summary: "☀️ ⬆️ Solar Zenith", start: ..., end: ..., ... }
   * ```
   */
  buildSolarZenithEvent(date: Moment): Event {
    const description = "Solar Zenith";
    const summary = `☀️ ⏫ ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const solarZenithEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: DailyCyclesService.solarCategories,
    };
    return solarZenithEvent;
  }

  /**
   * Creates a formatted calendar event for sunset.
   *
   * Generates a calendar event marking the moment when Sun's center crosses the
   * horizon moving downward (geometric sunset, not accounting for atmospheric refraction).
   *
   * @param date - Exact time of sunset
   * @returns Calendar event with summary, description, and standard solar cycle categories
   *
   * @remarks
   * - Summary: "☀️ 🔽 Sunset"
   * - Emoji: ☀️ (sun), 🔽 (downward arrow)
   * - Logs event to console with America/New_York timezone
   * - Uses geometric horizon (0° elevation), not visual horizon
   * - Does not account for atmospheric refraction (~34 arcminutes)
   * - Does not account for observer altitude above sea level
   * - Marks beginning of nautical/civil twilight period
   *
   * @see {@link isSet} for sunset detection algorithm
   * @see {@link categories} for event categorization
   *
   * @example
   * ```typescript
   * const event = getSunsetEvent(new Date('2026-01-22T00:45:00Z'));
   * // Returns: { summary: "☀️ 🔽 Sunset", start: ..., end: ..., ... }
   * ```
   */
  buildSunsetEvent(date: Moment): Event {
    const description = "Sunset";
    const summary = `☀️ 🔽 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const sunsetEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: DailyCyclesService.solarCategories,
    };
    return sunsetEvent;
  }

  /**
   * Creates a formatted calendar event for solar nadir (solar midnight).
   *
   * Generates a calendar event marking the moment when Sun reaches its lowest point
   * below the horizon (local minimum elevation). This occurs near local solar midnight,
   * when Sun crosses the anti-meridian (north-south line through nadir, opposite of zenith).
   *
   * @param date - Exact time of solar nadir
   * @returns Calendar event with summary, description, and standard solar cycle categories
   *
   * @remarks
   * - Summary: "☀️ ⬇️ Solar Nadir"
   * - Emoji: ☀️ (sun), ⬇️ (double downward arrow)
   * - Also known as "solar midnight" or "anti-transit"
   * - Logs event to console with America/New_York timezone
   * - Nadir elevation is negative (below horizon) and depends on latitude/declination
   * - At north pole on winter solstice: nadir elevation ≈ -23.5° (sun doesn't rise)
   * - Solar midnight time differs from clock midnight due to equation of time and longitude
   * - Opposite point to solar zenith (180° away on celestial sphere)
   *
   * @see {@link isMinimum} for nadir detection algorithm
   * @see {@link categories} for event categorization
   *
   * @example
   * ```typescript
   * const event = getSolarNadirEvent(new Date('2026-01-22T05:30:00Z'));
   * // Returns: { summary: "☀️ ⬇️ Solar Nadir", start: ..., end: ..., ... }
   * ```
   */
  buildSolarNadirEvent(date: Moment): Event {
    const description = "Solar Nadir";
    const summary = `☀️ ⏬ ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const solarNadirEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: DailyCyclesService.solarCategories,
    };
    return solarNadirEvent;
  }

  /**
   * Detects daily lunar cycle events at a specific minute.
   *
   * Analyzes the Moon's elevation at the current minute and surrounding minutes
   * to identify key daily events: moonrise (horizon crossing upward), lunar zenith
   * (culmination/highest point), moonset (horizon crossing downward), and lunar nadir
   * (lowest point below horizon). Uses elevation thresholds accounting for the Moon's
   * apparent diameter.
   *
   * @param args - Configuration object
   * @param currentMinute - The specific minute to analyze
   * @param moonAzimuthElevationEphemeris - Pre-computed Moon azimuth/elevation data
   * @returns Array of detected lunar cycle events (0-4 events per minute)
   * @see {@link getAzimuthElevationFromEphemeris} for ephemeris data retrieval
   * @see {@link isRise} for rise detection algorithm
   * @see {@link isSet} for set detection algorithm
   *
   * @example
   * ```typescript
   * const events = getDailyLunarCycleEvents({
   *   currentMinute: moment(),
   *   moonAzimuthElevationEphemeris
   * });
   * // Returns events like moonrise, zenith, moonset, nadir
   * ```
   */
  getDailyLunarCycleEvents(args: {
    minute: Moment;
    moonAzimuthElevationEphemeris: AzimuthElevationEphemeris;
  }): Event[] {
    const { minute, moonAzimuthElevationEphemeris } = args;

    const dailyLunarCycleEvents: Event[] = [];

    const previousMinute = minute.clone().subtract(1, "minute");
    const nextMinute = minute.clone().add(1, "minute");

    const currentElevation =
      this.ephemerisService.getAzimuthElevationFromEphemeris(
        moonAzimuthElevationEphemeris,
        minute.toISOString(),
        "elevation",
      );
    const previousElevation =
      this.ephemerisService.getAzimuthElevationFromEphemeris(
        moonAzimuthElevationEphemeris,
        previousMinute.toISOString(),
        "elevation",
      );
    const nextElevation =
      this.ephemerisService.getAzimuthElevationFromEphemeris(
        moonAzimuthElevationEphemeris,
        nextMinute.toISOString(),
        "elevation",
      );

    const elevations = {
      currentElevation,
      previousElevation,
      nextElevation,
      current: currentElevation,
      previous: previousElevation,
      next: nextElevation,
    };
    const date = minute;

    if (this.isRise({ ...elevations })) {
      dailyLunarCycleEvents.push(this.buildMoonriseEvent(date));
    }
    if (this.mathService.isMaximum({ ...elevations })) {
      dailyLunarCycleEvents.push(this.buildLunarZenithEvent(date));
    }
    if (this.isSet({ ...elevations })) {
      dailyLunarCycleEvents.push(this.buildMoonsetEvent(date));
    }
    if (this.mathService.isMinimum({ ...elevations })) {
      dailyLunarCycleEvents.push(this.buildLunarNadirEvent(date));
    }

    return dailyLunarCycleEvents;
  }

  /**
   * Creates a moonrise calendar event.
   *
   * Moonrise occurs when the Moon crosses the horizon from below, becoming
   * visible. The timing accounts for the Moon's apparent radius (~16 arcminutes)
   * to mark the moment the upper limb appears above the horizon.
   *
   * @param date - Precise UTC time of moonrise
   * @returns Calendar event for moonrise with emoji summary
   * @see {@link isRise} for rise detection criteria
   *
   * @example
   * ```typescript
   * const event = getMoonriseEvent(new Date('2025-01-21T12:30:00Z'));
   * // event.summary === '🌙 🔼 Moonrise'
   * ```
   */
  buildMoonriseEvent(date: Moment): Event {
    const description = "Moonrise";
    const summary = `🌙 🔼 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const moonriseEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: DailyCyclesService.lunarCategories,
    };
    return moonriseEvent;
  }

  /**
   * Creates a lunar zenith (culmination) calendar event.
   *
   * Lunar zenith is the moment when the Moon reaches its highest elevation
   * above the horizon (transit of the local meridian). This is when the Moon
   * appears most prominent in the sky from the observer's location.
   *
   * @param date - Precise UTC time of lunar zenith
   * @returns Calendar event for lunar zenith with emoji summary
   * @see {@link isMaximum} for maximum detection algorithm
   *
   * @example
   * ```typescript
   * const event = getLunarZenithEvent(new Date('2025-01-21T18:45:00Z'));
   * // event.summary === '🌙 ⏫ Lunar Zenith'
   * ```
   */
  buildLunarZenithEvent(date: Moment): Event {
    const description = "Lunar Zenith";
    const summary = `🌙 ⏫ ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const lunarZenithEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: DailyCyclesService.lunarCategories,
    };
    return lunarZenithEvent;
  }

  /**
   * Creates a moonset calendar event.
   *
   * Moonset occurs when the Moon crosses the horizon from above, disappearing
   * from view. The timing accounts for the Moon's apparent radius to mark when
   * the upper limb dips below the horizon.
   *
   * @param date - Precise UTC time of moonset
   * @returns Calendar event for moonset with emoji summary
   * @see {@link isSet} for set detection criteria
   *
   * @example
   * ```typescript
   * const event = getMoonsetEvent(new Date('2025-01-22T01:15:00Z'));
   * // event.summary === '🌙 🔽 Moonset'
   * ```
   */
  buildMoonsetEvent(date: Moment): Event {
    const description = "Moonset";
    const summary = `🌙 🔽 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const moonsetEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: DailyCyclesService.lunarCategories,
    };
    return moonsetEvent;
  }

  /**
   * Creates a lunar nadir calendar event.
   *
   * Lunar nadir is the moment when the Moon reaches its lowest point below
   * the horizon (anti-culmination). This is when the Moon is on the opposite
   * side of the celestial sphere from zenith.
   *
   * @param date - Precise UTC time of lunar nadir
   * @returns Calendar event for lunar nadir with emoji summary
   * @see {@link isMinimum} for minimum detection algorithm
   *
   * @example
   * ```typescript
   * const event = getLunarNadirEvent(new Date('2025-01-21T06:30:00Z'));
   * // event.summary === '🌙 ⏬ Lunar Nadir'
   * ```
   */
  buildLunarNadirEvent(date: Moment): Event {
    const description = "Lunar Nadir";
    const summary = `🌙 ⏬ ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const lunarNadirEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: DailyCyclesService.lunarCategories,
    };
    return lunarNadirEvent;
  }

  private isRise(args: {
    currentElevation: number;
    previousElevation: number;
  }): boolean {
    const { currentElevation, previousElevation } = args;
    return (
      currentElevation > -DailyCyclesService.sunRadiusDegrees &&
      previousElevation < -DailyCyclesService.sunRadiusDegrees
    );
  }

  private isSet(args: {
    previousElevation: number;
    currentElevation: number;
  }): boolean {
    const { previousElevation, currentElevation } = args;
    return (
      currentElevation < -DailyCyclesService.sunRadiusDegrees &&
      previousElevation > -DailyCyclesService.sunRadiusDegrees
    );
  }
}
