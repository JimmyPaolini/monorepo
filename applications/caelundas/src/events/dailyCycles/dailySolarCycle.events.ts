/**
 * Daily solar cycle event detection for Sun's daily motion.
 *
 * This module identifies the four key points in Sun's daily apparent motion across
 * the sky: sunrise (horizon crossing upward), solar zenith/noon (highest elevation),
 * sunset (horizon crossing downward), and solar nadir/midnight (lowest elevation).
 * Events are detected by analyzing Sun's altitude/elevation angle over time.
 */

import { getAzimuthElevationFromEphemeris } from "../../ephemeris/ephemeris.service";
import { isMaximum, isMinimum } from "../../math.utilities";

import { isRise, isSet } from "./dailyCycle.utilities";

import type { Event } from "../../calendar.utilities";
import type { AzimuthElevationEphemeris } from "../../ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

/**
 * Standard categories for all daily solar cycle events.
 *
 * Base categories applied to sunrise, solar zenith, sunset, and solar nadir events.
 */
const categories = ["Astronomy", "Astrology", "Daily Solar Cycle", "Solar"];

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
export function getDailySolarCycleEvents(args: {
  minute: Moment;
  sunAzimuthElevationEphemeris: AzimuthElevationEphemeris;
}): Event[] {
  const { minute, sunAzimuthElevationEphemeris } = args;

  const dailySolarCycleEvents: Event[] = [];

  const previousMinute = minute.clone().subtract(1, "minute");
  const nextMinute = minute.clone().add(1, "minute");

  const currentElevation = getAzimuthElevationFromEphemeris(
    sunAzimuthElevationEphemeris,
    minute.toISOString(),
    "elevation",
  );
  const previousElevation = getAzimuthElevationFromEphemeris(
    sunAzimuthElevationEphemeris,
    previousMinute.toISOString(),
    "elevation",
  );
  const nextElevation = getAzimuthElevationFromEphemeris(
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

  if (isRise({ ...elevations })) {
    dailySolarCycleEvents.push(buildSunriseEvent(date));
  }
  if (isMaximum({ ...elevations })) {
    dailySolarCycleEvents.push(buildSolarZenithEvent(date));
  }
  if (isSet({ ...elevations })) {
    dailySolarCycleEvents.push(buildSunsetEvent(date));
  }
  if (isMinimum({ ...elevations })) {
    dailySolarCycleEvents.push(buildSolarNadirEvent(date));
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
export function buildSunriseEvent(date: Moment): Event {
  const description = "Sunrise";
  const summary = `☀️ 🔼 ${description}`;

  const dateString = date.clone().tz("America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const sunriseEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
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
export function buildSolarZenithEvent(date: Moment): Event {
  const description = "Solar Zenith";
  const summary = `☀️ ⏫ ${description}`;

  const dateString = date.clone().tz("America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const solarZenithEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
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
export function buildSunsetEvent(date: Moment): Event {
  const description = "Sunset";
  const summary = `☀️ 🔽 ${description}`;

  const dateString = date.clone().tz("America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const sunsetEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
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
export function buildSolarNadirEvent(date: Moment): Event {
  const description = "Solar Nadir";
  const summary = `☀️ ⏬ ${description}`;

  const dateString = date.clone().tz("America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const solarNadirEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return solarNadirEvent;
}
