import fs from "fs";

import _ from "lodash";
import moment from "moment-timezone";

import { getCalendar } from "../../calendar.utilities";
import { getAzimuthElevationFromEphemeris } from "../../ephemeris/ephemeris.service";
import { isMaximum, isMinimum } from "../../math.utilities";
import { getOutputPath } from "../../output.utilities";

import { isRise, isSet } from "./dailyCycle.utilities";

import type { Event } from "../../calendar.utilities";
import type { AzimuthElevationEphemeris } from "../../ephemeris/ephemeris.types";
import type { Moment } from "moment";

const categories = ["Astronomy", "Astrology", "Daily Lunar Cycle", "Lunar"];

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
export function getDailyLunarCycleEvents(args: {
  currentMinute: Moment;
  moonAzimuthElevationEphemeris: AzimuthElevationEphemeris;
}): Event[] {
  const { currentMinute, moonAzimuthElevationEphemeris } = args;

  const dailyLunarCycleEvents: Event[] = [];

  const previousMinute = currentMinute.clone().subtract(1, "minutes");
  const nextMinute = currentMinute.clone().add(1, "minutes");

  const currentElevation = getAzimuthElevationFromEphemeris(
    moonAzimuthElevationEphemeris,
    currentMinute.toISOString(),
    "elevation",
  );
  const previousElevation = getAzimuthElevationFromEphemeris(
    moonAzimuthElevationEphemeris,
    previousMinute.toISOString(),
    "elevation",
  );
  const nextElevation = getAzimuthElevationFromEphemeris(
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
  const date = currentMinute.toDate();

  if (isRise({ ...elevations })) {
    dailyLunarCycleEvents.push(getMoonriseEvent(date));
  }
  if (isMaximum({ ...elevations })) {
    dailyLunarCycleEvents.push(getLunarZenithEvent(date));
  }
  if (isSet({ ...elevations })) {
    dailyLunarCycleEvents.push(getMoonsetEvent(date));
  }
  if (isMinimum({ ...elevations })) {
    dailyLunarCycleEvents.push(getLunarNadirEvent(date));
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
export function getMoonriseEvent(date: Date): Event {
  const description = "Moonrise";
  const summary = `🌙 🔼 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const moonriseEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
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
export function getLunarZenithEvent(date: Date): Event {
  const description = "Lunar Zenith";
  const summary = `🌙 ⏫ ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const lunarZenithEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
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
export function getMoonsetEvent(date: Date): Event {
  const description = "Moonset";
  const summary = `🌙 🔽 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const moonsetEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
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
export function getLunarNadirEvent(date: Date): Event {
  const description = "Lunar Nadir";
  const summary = `🌙 ⏬ ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const lunarNadirEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return lunarNadirEvent;
}

/**
 * Writes daily lunar cycle events to an iCalendar file.
 *
 * Generates a calendar file containing all moonrise, moonset, zenith, and nadir
 * events for the specified date range. The output file is named with the timespan
 * and written to the configured output directory.
 *
 * @param args - Configuration object
 * @param dailyLunarCycleEvents - Array of lunar cycle events to write
 * @param start - Start date of the event range
 * @param end - End date of the event range
 * @returns void - Writes to filesystem
 * @see {@link getCalendar} for iCal generation
 * @see {@link getOutputPath} for output directory resolution
 *
 * @example
 * ```typescript
 * writeDailyLunarCycleEvents({
 *   dailyLunarCycleEvents: events,
 *   start: new Date('2025-01-01'),
 *   end: new Date('2025-12-31')
 * });
 * // Writes: daily-lunar-cycle_2025-01-01T00:00:00.000Z-2025-12-31T23:59:59.999Z.ics
 * ```
 */
export function writeDailyLunarCycleEvents(args: {
  dailyLunarCycleEvents: Event[];
  start: Date;
  end: Date;
}): void {
  const { dailyLunarCycleEvents, start, end } = args;
  if (_.isEmpty(dailyLunarCycleEvents)) {
    return;
  }
  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${dailyLunarCycleEvents.length} daily lunar cycle events from ${timespan}`;
  console.log(`🌙 Writing ${message}`);

  const ingressCalendar = getCalendar({
    events: dailyLunarCycleEvents,
    name: "Daily Lunar Cycle 🌙",
  });
  fs.writeFileSync(
    getOutputPath(`daily-lunar-cycle_${timespan}.ics`),
    new TextEncoder().encode(ingressCalendar),
  );

  console.log(`🌙 Wrote ${message}`);
}
