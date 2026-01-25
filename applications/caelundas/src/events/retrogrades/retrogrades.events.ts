/**
 * Retrograde motion event detection for planetary stationary points.
 *
 * This module identifies when planets appear to reverse direction in the sky
 * (retrograde motion) or resume normal eastward motion (direct motion). Retrograde
 * occurs when Earth's orbital motion makes a planet appear to move backward relative
 * to background stars. Only planets Mercury through Pluto can go retrograde; Sun and
 * Moon never do.
 */

import fs from "fs";

import _ from "lodash";

import { type Event, getCalendar } from "../../calendar.utilities";
import { MARGIN_MINUTES } from "../../calendar.utilities";
import { pairDurationEvents } from "../../duration.utilities";
import { getCoordinateFromEphemeris } from "../../ephemeris/ephemeris.service";
import { getOutputPath } from "../../output.utilities";
import { symbolByBody, symbolByOrbitalDirection } from "../../symbols";
import { retrogradeBodies } from "../../types";

import { isDirect, isRetrograde } from "./retrogrades.utilities";

import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type {
  OrbitalDirection,
  OrbitalDirectionSymbol,
  RetrogradeBody,
  RetrogradeBodySymbol,
} from "../../types";
import type { Moment } from "moment";

/**
 * Detects retrograde and direct station events at a specific time point.
 *
 * Analyzes planetary motion patterns to identify stationary points where planets
 * transition between direct and retrograde motion. Uses a sliding window of
 * {@link MARGIN_MINUTES} to detect direction reversals in ecliptic longitude.
 *
 * @param args - Ephemeris data and current time
 * @param coordinateEphemerisByBody - Pre-computed ephemeris for retrograde-capable bodies
 * @param currentMinute - Time point to check for station events (minute precision)
 * @returns Array of calendar events for detected stationary points (retrograde or direct)
 *
 * @remarks
 * - Checks only {@link retrogradeBodies} (Mercury through Pluto, excluding Sun/Moon)
 * - Uses ±{@link MARGIN_MINUTES} window for robust direction change detection
 * - **Stationary Retrograde**: Planet stops moving forward and begins backward motion
 * - **Stationary Direct**: Planet stops retrograde motion and resumes forward motion
 * - Detection looks for local extrema (turning points) in longitude time series
 * - Returns empty array if no stations detected at this time
 *
 * @see {@link isRetrograde} for retrograde station detection algorithm
 * @see {@link isDirect} for direct station detection algorithm
 * @see {@link getRetrogradeEvent} for event formatting
 * @see {@link retrogradeBodies} for list of bodies that can go retrograde
 *
 * @example
 * ```typescript
 * const events = getRetrogradeEvents({
 *   coordinateEphemerisByBody: ephemerides,
 *   currentMinute: moment('2026-03-15T08:30:00Z')
 * });
 * // Returns: [{ summary: "☿ ↩️ Mercury Stationary Retrograde", start: ..., ... }]
 * ```
 */
export function getRetrogradeEvents(args: {
  coordinateEphemerisByBody: Record<RetrogradeBody, CoordinateEphemeris>;
  currentMinute: Moment;
}): Event[] {
  const { coordinateEphemerisByBody, currentMinute } = args;
  const retrogradeEvents: Event[] = [];

  for (const body of retrogradeBodies) {
    const ephemeris = coordinateEphemerisByBody[body];

    const currentLongitude = getCoordinateFromEphemeris(
      ephemeris,
      currentMinute.toISOString(),
      "longitude",
    );

    const previousLongitudes = new Array(MARGIN_MINUTES)
      .fill(null)
      .map((_, index) => {
        const date = currentMinute
          .clone()
          .subtract(MARGIN_MINUTES - index, "minute");
        return getCoordinateFromEphemeris(
          ephemeris,
          date.toISOString(),
          "longitude",
        );
      });

    const nextLongitudes = new Array(MARGIN_MINUTES)
      .fill(null)
      .map((_, index) => {
        const date = currentMinute.clone().add(index + 1, "minute");
        return getCoordinateFromEphemeris(
          ephemeris,
          date.toISOString(),
          "longitude",
        );
      });

    const timestamp = currentMinute.toDate();
    const longitudes = {
      currentLongitude,
      previousLongitudes,
      nextLongitudes,
    };

    if (isRetrograde({ ...longitudes })) {
      retrogradeEvents.push(
        getRetrogradeEvent({ body, timestamp, direction: "retrograde" }),
      );
    }
    if (isDirect({ ...longitudes })) {
      retrogradeEvents.push(
        getRetrogradeEvent({ body, timestamp, direction: "direct" }),
      );
    }
  }

  return retrogradeEvents;
}

/**
 * Standard categories for retrograde/direct station events.
 *
 * Base categories applied to all station events before adding direction-specific
 * categories ("Retrograde" or "Direct").
 */
const categories = ["Astronomy", "Astrology", "Direction"];

/**
 * Creates a formatted calendar event for a retrograde or direct station.
 *
 * Generates a calendar event with Unicode symbols and descriptive text for a
 * planetary stationary point. Events are categorized by direction to distinguish
 * retrograde stations from direct stations.
 *
 * @param args - Station event parameters
 * @param body - Celestial body entering station (e.g., "mercury", "venus", "mars")
 * @param timestamp - Exact time of the stationary point
 * @param direction - Orbital direction: "retrograde" or "direct"
 * @returns Calendar event with summary, description, and direction-specific categories
 *
 * @remarks
 * - Summary format: `[bodySymbol] [directionSymbol] [Body] Stationary [Direction]`
 * - Example retrograde: "☿ ↩️ Mercury Stationary Retrograde"
 * - Example direct: "☿ ➡️ Mercury Stationary Direct"
 * - Adds "Retrograde" or "Direct" category based on direction
 * - Uses Unicode astronomical symbols: ☿ (Mercury), ♀ (Venus), ♂ (Mars), ♃ (Jupiter), etc.
 * - Direction symbols: ↩️ (retrograde), ➡️ (direct)
 * - Logs event to console with ISO timestamp
 *
 * @see {@link symbolByBody} for planetary Unicode symbols
 * @see {@link symbolByOrbitalDirection} for direction symbols
 * @see {@link Event} for calendar event structure
 *
 * @example
 * ```typescript
 * const event = getRetrogradeEvent({
 *   body: "mercury",
 *   timestamp: new Date('2026-03-15T08:30:00Z'),
 *   direction: "retrograde"
 * });
 * // Returns: { summary: "☿ ↩️ Mercury Stationary Retrograde", start: ..., ... }
 * ```
 */
export function getRetrogradeEvent(args: {
  body: RetrogradeBody;
  timestamp: Date;
  direction: OrbitalDirection;
}): Event {
  const { body, timestamp, direction } = args;

  const bodyCapitalized = _.startCase(body) as Capitalize<RetrogradeBody>;
  const orbitalDirectionCapitalized = _.startCase(
    direction,
  ) as Capitalize<OrbitalDirection>;

  const retrogradeBodySymbol = symbolByBody[body] as RetrogradeBodySymbol;
  const orbitalDirectionSymbol = symbolByOrbitalDirection[
    direction
  ] as OrbitalDirectionSymbol;

  const description = `${bodyCapitalized} Stationary ${orbitalDirectionCapitalized}`;
  const summary = `${retrogradeBodySymbol} ${orbitalDirectionSymbol} ${description}`;

  console.log(`${summary} at ${timestamp.toISOString()}`);

  const retrogradeEvent: Event = {
    start: timestamp,
    end: timestamp,
    categories: categories.concat(
      direction === "retrograde" ? ["Retrograde"] : ["Direct"],
    ),
    summary,
    description,
  };

  return retrogradeEvent;
}

/**
 * Writes retrograde station events to an iCalendar file.
 *
 * Generates an `.ics` file containing all retrograde and direct station events
 * for a date range. File is named with body list and timespan. Skips writing
 * if no events exist.
 *
 * @param args - Output parameters
 * @param end - End date of the event range (inclusive)
 * @param retrogradeBodies - List of bodies checked for retrograde motion
 * @param retrogradeEvents - Array of station events to write
 * @param start - Start date of the event range (inclusive)
 *
 * @remarks
 * - Filename format: `retrogrades_[bodies]_[start]-[end].ics`
 * - Example: `retrogrades_mercury, venus, mars_2026-01-01T00:00:00Z-2026-12-31T23:59:59Z.ics`
 * - Uses UTF-8 encoding via TextEncoder
 * - Calendar name: "Retrogrades ↩️"
 * - Logs write operation with event count and timespan
 * - Early return if event array is empty
 *
 * @see {@link getCalendar} for iCalendar generation
 * @see {@link getOutputPath} for output directory resolution
 *
 * @example
 * ```typescript
 * writeRetrogradeEvents({
 *   retrogradeEvents: events,
 *   retrogradeBodies: ["mercury", "venus", "mars"],
 *   start: new Date('2026-01-01'),
 *   end: new Date('2026-12-31')
 * }); // Writes retrogrades_mercury, venus, mars_2026-01-01T00:00:00Z-2026-12-31T23:59:59Z.ics
 * ```
 */
export function writeRetrogradeEvents(args: {
  end: Date;
  retrogradeBodies: RetrogradeBody[];
  retrogradeEvents: Event[];
  start: Date;
}): void {
  const { retrogradeBodies, retrogradeEvents, start, end } = args;
  if (_.isEmpty(retrogradeEvents)) {
    return;
  }

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${retrogradeEvents.length} retrograde events from ${timespan}`;
  console.log(`↩️ Writing ${message}`);

  const retrogradeBodiesString = retrogradeBodies.join(", ");
  const retrogradesCalendar = getCalendar({
    events: retrogradeEvents,
    name: "Retrogrades ↩️",
  });
  fs.writeFileSync(
    getOutputPath(`retrogrades_${retrogradeBodiesString}_${timespan}.ics`),
    new TextEncoder().encode(retrogradesCalendar),
  );

  console.log(`↩️ Wrote ${message}`);
}

/**
 * Generates duration events showing retrograde periods for each planet.
 *
 * Pairs "Stationary Retrograde" and "Stationary Direct" events for each planet
 * to create duration events spanning the retrograde period. This shows the full
 * span of time when a planet appears to move backward.
 *
 * @param events - Array of all calendar events (will be filtered to direction events)
 * @returns Array of duration events spanning retrograde periods
 *
 * @remarks
 * - Filters to events with "Direction" category
 * - Processes each planet separately (retrograde periods don't overlap between planets)
 * - Pairs retrograde stations (beginnings) with direct stations (endings)
 * - Skips unpaired events (e.g., retrograde still active at end of range)
 * - Duration events use "Retrogrades" category (plural) vs "Retrograde" for stations
 * - Summary format: `[bodySymbol] ↩️ [Body] Retrograde`
 *
 * @see {@link pairDurationEvents} for pairing algorithm
 * @see {@link getRetrogradeDurationEvent} for event formatting
 * @see {@link retrogradeBodies} for planets that can go retrograde
 *
 * @example
 * ```typescript
 * const allEvents = [
 *   { description: "Mercury Stationary Retrograde", start: Mar 15, ... },
 *   { description: "Mercury Stationary Direct", start: Apr 8, ... },
 *   { description: "Venus Stationary Retrograde", start: Jul 22, ... },
 *   { description: "Venus Stationary Direct", start: Sep 3, ... }
 * ];
 * const durations = getRetrogradeDurationEvents(allEvents);
 * // Returns: [
 * //   { summary: "☿ ↩️ Mercury Retrograde", start: Mar 15, end: Apr 8, ... },
 * //   { summary: "♀ ↩️ Venus Retrograde", start: Jul 22, end: Sep 3, ... }
 * // ]
 * ```
 */
export function getRetrogradeDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  const retrogradeEvents = events.filter((event) =>
    event.categories.includes("Direction"),
  );

  // Process each planet separately
  for (const planet of retrogradeBodies) {
    const beginnings = retrogradeEvents.filter((event) =>
      event.description.includes(`Retrograde`),
    );
    const endings = retrogradeEvents.filter((event) =>
      event.description.includes(`Direct`),
    );

    const pairs = pairDurationEvents(
      beginnings,
      endings,
      `${planet} retrograde`,
    );

    durationEvents.push(
      ...pairs.map(([beginning, ending]) =>
        getRetrogradeDurationEvent(beginning, ending, planet),
      ),
    );
  }

  return durationEvents;
}

/**
 * Creates a duration event from paired retrograde and direct station events.
 *
 * Extracts the planet symbol from the beginning event summary and formats a
 * duration event showing the span of the retrograde period.
 *
 * @param beginningEvent - Stationary retrograde event (marks start of retrograde)
 * @param endingEvent - Stationary direct event (marks end of retrograde)
 * @param planet - Planet that was retrograde
 * @returns Duration event spanning the retrograde period
 *
 * @remarks
 * - Duration spans from beginningEvent.start to endingEvent.start (not endingEvent.end)
 * - Capitalizes planet name for display
 * - Extracts symbol from beginning event summary (assumes first non-whitespace sequence)
 * - Summary format: `[symbol] ↩️ [Planet] Retrograde`
 * - Uses singular category "Retrogrades" (not "Retrograde" or "Direct")
 * - Categories: Astronomy, Astrology, Retrogrades
 *
 * @example
 * ```typescript
 * const duration = getRetrogradeDurationEvent(
 *   { summary: "☿ ↩️ Mercury Stationary Retrograde", start: Mar 15, ... },
 *   { summary: "☿ ➡️ Mercury Stationary Direct", start: Apr 8, ... },
 *   "mercury"
 * );
 * // Returns: { summary: "☿ ↩️ Mercury Retrograde", start: Mar 15, end: Apr 8, ... }
 * ```
 */
function getRetrogradeDurationEvent(
  beginningEvent: Event,
  endingEvent: Event,
  planet: RetrogradeBody,
): Event {
  const start = beginningEvent.start;
  const end = endingEvent.start;

  const planetCapitalized = planet.charAt(0).toUpperCase() + planet.slice(1);

  // Extract planet symbol from beginning event summary (first non-whitespace character sequence)
  const symbolMatch = /^(\S+)/.exec(beginningEvent.summary);
  const symbol = symbolMatch ? symbolMatch[1] : "";

  return {
    start,
    end,
    summary: `${symbol} ↩️ ${planetCapitalized} Retrograde`,
    description: `${planetCapitalized} Retrograde`,
    categories: ["Astronomy", "Astrology", "Retrogrades"],
  };
}
