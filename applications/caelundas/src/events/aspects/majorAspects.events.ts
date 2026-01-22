/**
 * Major aspect event detection for the five primary angular relationships.
 *
 * This module generates calendar events for major aspects between celestial bodies:
 * conjunction (0°), sextile (60°), square (90°), trine (120°), and opposition (180°).
 * Major aspects are the most significant angular relationships in astrology and use
 * an 8° orb tolerance for detection.
 */

import fs from "fs";

import _ from "lodash";

import { type Event, getCalendar } from "../../calendar.utilities";
import { majorAspects } from "../../constants";
import { pairDurationEvents } from "../../duration.utilities";
import { getCoordinateFromEphemeris } from "../../ephemeris/ephemeris.service";
import { getOutputPath } from "../../output.utilities";
import { symbolByBody, symbolByMajorAspect } from "../../symbols";
import { majorAspectBodies } from "../../types";

import { getMajorAspect, getMajorAspectPhase } from "./aspects.utilities";

import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type {
  AspectPhase,
  Body,
  BodySymbol,
  MajorAspect,
  MajorAspectSymbol,
} from "../../types";
import type { Moment } from "moment";

/**
 * Detects major aspect phase transitions at a specific time point.
 *
 * Checks all pairs of bodies from {@link majorAspectBodies} for major aspect formations
 * (conjunction, sextile, square, trine, opposition) by analyzing positions at three
 * consecutive minutes (previous, current, next). Generates calendar events when aspects
 * are forming, exact, or dissolving.
 *
 * @param args - Ephemeris data and current time
 * @param coordinateEphemerisByBody - Pre-computed ephemeris data for all bodies
 * @param currentMinute - Time point to check for aspect events (minute precision)
 * @returns Array of calendar events for detected aspect phase transitions
 *
 * @remarks
 * - Checks all unique body pairs (avoiding duplicates like Sun-Moon and Moon-Sun)
 * - Skips identical body pairs (body cannot aspect itself)
 * - Uses ±1 minute window for phase transition detection
 * - Returns empty array if no aspects are detected at this time
 * - Typically called once per minute in main ephemeris loop
 *
 * @see {@link getMajorAspectPhase} for phase detection algorithm
 * @see {@link getMajorAspectEvent} for event formatting
 * @see {@link majorAspectBodies} for list of bodies checked
 * @see {@link getCoordinateFromEphemeris} for position interpolation
 *
 * @example
 * ```typescript
 * const events = getMajorAspectEvents({
 *   coordinateEphemerisByBody: ephemerides,
 *   currentMinute: moment('2026-01-21T12:00:00Z')
 * });
 * // Returns: [{ summary: "☉ □ ♃ Sun exact square Jupiter", start: ..., ... }]
 * ```
 */
export function getMajorAspectEvents(args: {
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  currentMinute: Moment;
}): Event[] {
  const { coordinateEphemerisByBody, currentMinute } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const majorAspectEvents: Event[] = [];

  for (const body1 of majorAspectBodies) {
    const index = majorAspectBodies.indexOf(body1);
    for (const body2 of majorAspectBodies.slice(index + 1)) {
      if (body1 === body2) {
        continue;
      }

      const ephemerisBody1 = coordinateEphemerisByBody[body1];
      const ephemerisBody2 = coordinateEphemerisByBody[body2];

      const currentLongitudeBody1 = getCoordinateFromEphemeris(
        ephemerisBody1,
        currentMinute.toISOString(),
        "longitude",
      );
      const currentLongitudeBody2 = getCoordinateFromEphemeris(
        ephemerisBody2,
        currentMinute.toISOString(),
        "longitude",
      );
      const previousLongitudeBody1 = getCoordinateFromEphemeris(
        ephemerisBody1,
        previousMinute.toISOString(),
        "longitude",
      );
      const previousLongitudeBody2 = getCoordinateFromEphemeris(
        ephemerisBody2,
        previousMinute.toISOString(),
        "longitude",
      );
      const nextLongitudeBody1 = getCoordinateFromEphemeris(
        ephemerisBody1,
        nextMinute.toISOString(),
        "longitude",
      );
      const nextLongitudeBody2 = getCoordinateFromEphemeris(
        ephemerisBody2,
        nextMinute.toISOString(),
        "longitude",
      );

      const phase = getMajorAspectPhase({
        currentLongitudeBody1,
        currentLongitudeBody2,
        previousLongitudeBody1,
        previousLongitudeBody2,
        nextLongitudeBody1,
        nextLongitudeBody2,
      });

      if (phase) {
        majorAspectEvents.push(
          getMajorAspectEvent({
            timestamp: currentMinute.toDate(),
            longitudeBody1: currentLongitudeBody1,
            longitudeBody2: currentLongitudeBody2,
            body1,
            body2,
            phase,
          }),
        );
      }
    }
  }
  return majorAspectEvents;
}

/**
 * Creates a formatted calendar event for a major aspect at a specific phase.
 *
 * Generates a calendar event with Unicode symbols, descriptive text, and categorization
 * for a major aspect between two bodies. Includes phase-specific emoji and categories
 * to distinguish forming, exact, and dissolving aspects.
 *
 * @param args - Aspect event parameters
 * @param longitudeBody1 - Ecliptic longitude of first body in degrees (0-360)
 * @param longitudeBody2 - Ecliptic longitude of second body in degrees (0-360)
 * @param timestamp - Exact time of the aspect phase event
 * @param body1 - First celestial body (e.g., "sun", "moon", "mercury")
 * @param body2 - Second celestial body
 * @param phase - Aspect phase: "forming", "exact", or "dissolving"
 * @returns Calendar event with summary, description, categories, and timing
 * @throws When no major aspect is found at the given longitudes
 *
 * @remarks
 * - **Exact phase**: Uses 🎯 emoji, adds "Exact" category
 * - **Forming phase**: Uses ➡️ emoji, adds "Forming" category
 * - **Dissolving phase**: Uses ⬅️ emoji, adds "Dissolving" category
 * - Summary format: `[phaseEmoji] [body1Symbol] [aspectSymbol] [body2Symbol] [description]`
 * - Example: "🎯 ☉ ☌ ☽ Sun exact conjunct Moon"
 * - Logs event to console with ISO timestamp
 *
 * @see {@link getMajorAspect} for aspect type detection
 * @see {@link symbolByBody} for body Unicode symbols
 * @see {@link symbolByMajorAspect} for aspect Unicode symbols
 * @see {@link Event} for calendar event structure
 *
 * @example
 * ```typescript
 * const event = getMajorAspectEvent({
 *   longitudeBody1: 120.5,
 *   longitudeBody2: 240.3,
 *   timestamp: new Date('2026-01-21T12:00:00Z'),
 *   body1: "venus",
 *   body2: "mars",
 *   phase: "exact"
 * });
 * // Returns: { summary: "🎯 ♀ △ ♂ Venus exact trine Mars", ... }
 * ```
 */
export function getMajorAspectEvent(args: {
  longitudeBody1: number;
  longitudeBody2: number;
  timestamp: Date;
  body1: Body;
  body2: Body;
  phase: AspectPhase;
}): Event {
  const { longitudeBody1, longitudeBody2, timestamp, body1, body2, phase } =
    args;
  const majorAspect = getMajorAspect({ longitudeBody1, longitudeBody2 });
  if (!majorAspect) {
    console.error(
      `No major aspect found between ${body1} and ${body2} at ${timestamp.toISOString()}: ${longitudeBody1} and ${longitudeBody2}`,
    );
    throw new Error("No major aspect found");
  }

  const body1Capitalized = _.startCase(body1) as Capitalize<Body>;
  const body2Capitalized = _.startCase(body2) as Capitalize<Body>;

  const body1Symbol = symbolByBody[body1] as BodySymbol;
  const body2Symbol = symbolByBody[body2] as BodySymbol;
  const majorAspectSymbol = symbolByMajorAspect[majorAspect as MajorAspect];

  let description: string;
  let phaseEmoji: string;
  let categories: string[];

  const baseCategories = [
    "Astronomy",
    "Astrology",
    "Major Aspect",
    body1Capitalized,
    body2Capitalized,
    _.startCase(majorAspect),
  ];

  if (phase === "exact") {
    description = `${body1Capitalized} exact ${majorAspect} ${body2Capitalized}`;
    phaseEmoji = "🎯";
    categories = [...baseCategories, "Exact"];
  } else if (phase === "forming") {
    description = `${body1Capitalized} forming ${majorAspect} ${body2Capitalized}`;
    phaseEmoji = "➡️";
    categories = [...baseCategories, "Forming"];
  } else {
    description = `${body1Capitalized} dissolving ${majorAspect} ${body2Capitalized}`;
    phaseEmoji = "⬅️";
    categories = [...baseCategories, "Dissolving"];
  }

  const summary = `${phaseEmoji} ${body1Symbol} ${majorAspectSymbol} ${body2Symbol} ${description}`;

  console.log(`${summary} at ${timestamp.toISOString()}`);

  const majorAspectEvent: Event = {
    start: timestamp,
    end: timestamp,
    description,
    summary,
    categories,
  };
  return majorAspectEvent;
}

/**
 * Writes major aspect events to an iCalendar file.
 *
 * Generates an `.ics` file containing all major aspect events for a date range.
 * File is named with body list and timespan for easy identification. Skips writing
 * if no events exist.
 *
 * @param args - Output parameters
 * @param end - End date of the event range (inclusive)
 * @param majorAspectBodies - List of bodies included in aspect calculations
 * @param majorAspectEvents - Array of calendar events to write
 * @param start - Start date of the event range (inclusive)
 *
 * @remarks
 * - Filename format: `major-aspects_[bodies]_[start]-[end].ics`
 * - Example: `major-aspects_sun,moon,mercury_2026-01-01T00:00:00Z-2026-02-01T00:00:00Z.ics`
 * - Uses UTF-8 encoding via TextEncoder
 * - Calendar name: "Major Aspect 📐"
 * - Logs write operation with event count and timespan
 * - Early return if event array is empty
 *
 * @see {@link getCalendar} for iCalendar generation
 * @see {@link getOutputPath} for output directory resolution
 *
 * @example
 * ```typescript
 * writeMajorAspectEvents({
 *   majorAspectEvents: events,
 *   majorAspectBodies: ["sun", "moon", "mercury"],
 *   start: new Date('2026-01-01'),
 *   end: new Date('2026-02-01')
 * }); // Writes major-aspects_sun,moon,mercury_2026-01-01T00:00:00Z-2026-02-01T00:00:00Z.ics
 * ```
 */
export function writeMajorAspectEvents(args: {
  end: Date;
  majorAspectBodies: Body[];
  majorAspectEvents: Event[];
  start: Date;
}): void {
  const { end, majorAspectEvents, majorAspectBodies, start } = args;
  if (_.isEmpty(majorAspectEvents)) {
    return;
  }

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${majorAspectEvents.length} major aspect events from ${timespan}`;
  console.log(`📐 Writing ${message}`);

  const majorAspectBodiesString = majorAspectBodies.join(",");
  const majorAspectsCalendar = getCalendar({
    events: majorAspectEvents,
    name: "Major Aspect 📐",
  });
  fs.writeFileSync(
    getOutputPath(`major-aspects_${majorAspectBodiesString}_${timespan}.ics`),
    new TextEncoder().encode(majorAspectsCalendar),
  );

  console.log(`📐 Wrote ${message}`);
}

/**
 * Generates duration events showing how long aspects remain in orb.
 *
 * Pairs "forming" and "dissolving" events for the same body pair and aspect type
 * to create duration events spanning the period when the aspect is within orb.
 * This shows the active window of aspect influence.
 *
 * @param events - Array of all calendar events (will be filtered to major aspects)
 * @returns Array of duration events with start (forming) and end (dissolving) times
 *
 * @remarks
 * - Filters to events with "Major Aspect" category
 * - Groups by body pair and aspect type (e.g., "Sun-Square-Mars")
 * - Pairs consecutive forming/dissolving events using {@link pairDurationEvents}
 * - Skips unpaired events (e.g., aspect still active at end of range)
 * - Duration events use simplified categories without "Forming"/"Dissolving"/"Exact"
 * - Event summary format: `[body1Symbol][aspectSymbol][body2Symbol] [Body1] [aspect] [Body2]`
 *
 * @see {@link pairDurationEvents} for pairing algorithm
 * @see {@link getMajorAspectDurationEvent} for event formatting
 * @see {@link majorAspectBodies} for valid bodies
 * @see {@link majorAspects} for valid aspects
 *
 * @example
 * ```typescript
 * const allEvents = [
 *   { summary: "➡️ ☉ □ ♃ Sun forming square Jupiter", start: Jan 1, ... },
 *   { summary: "🎯 ☉ □ ♃ Sun exact square Jupiter", start: Jan 5, ... },
 *   { summary: "⬅️ ☉ □ ♃ Sun dissolving square Jupiter", start: Jan 10, ... }
 * ];
 * const durations = getMajorAspectDurationEvents(allEvents);
 * // Returns: [{ summary: "☉□♃ Sun square Jupiter", start: Jan 1, end: Jan 10, ... }]
 * ```
 */
export function getMajorAspectDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to major aspect events only
  const majorAspectEvents = events.filter((event) =>
    event.categories.includes("Major Aspect"),
  );

  // Group by body pair and aspect type using categories
  const groupedEvents = _.groupBy(majorAspectEvents, (event) => {
    const planets = event.categories
      .filter((category) =>
        majorAspectBodies
          .map((majorAspectBody) => _.startCase(majorAspectBody))
          .includes(category),
      )
      .sort();

    const aspect = event.categories.find((category) =>
      majorAspects
        .map((majorAspect) => _.startCase(majorAspect))
        .includes(category),
    );

    if (planets.length === 2 && aspect) {
      return `${planets[0]}-${aspect}-${planets[1]}`;
    }
    return "";
  });

  // Process each group
  for (const [key, groupEvents] of Object.entries(groupedEvents)) {
    if (!key) {
      continue;
    }

    const formingEvents = groupEvents.filter((event) =>
      event.categories.includes("Forming"),
    );
    const dissolvingEvents = groupEvents.filter((event) =>
      event.categories.includes("Dissolving"),
    );

    const pairs = pairDurationEvents(
      formingEvents,
      dissolvingEvents,
      `major aspect ${key}`,
    );

    durationEvents.push(
      ...pairs.map(([beginning, ending]) =>
        getMajorAspectDurationEvent(beginning, ending),
      ),
    );
  }

  return durationEvents;
}

/**
 * Creates a duration event from paired forming and dissolving aspect events.
 *
 * Extracts body names and aspect type from event categories, then formats a duration
 * event showing the span of time when the aspect remained within orb.
 *
 * @param beginning - Forming aspect event (marks entry into orb)
 * @param ending - Dissolving aspect event (marks exit from orb)
 * @returns Duration event spanning from forming to dissolving
 * @throws When categories don't contain exactly 2 bodies and 1 aspect type
 *
 * @remarks
 * - Assumes beginning and ending events have matching body pairs and aspect type
 * - Uses alphabetically sorted body names for consistency
 * - Summary format: `[body1Symbol][aspectSymbol][body2Symbol] [Body1] [aspect] [Body2]`
 * - Categories: Astronomy, Astrology, Simple Aspect, Major Aspect, [Body1], [Body2], [Aspect]
 * - Duration spans from beginning.start to ending.start (not ending.end)
 *
 * @see {@link majorAspectBodies} for extracting body categories
 * @see {@link majorAspects} for extracting aspect category
 *
 * @example
 * ```typescript
 * const duration = getMajorAspectDurationEvent(
 *   { summary: "➡️ ☉ □ ♃ ...", start: Jan 1, categories: ["Sun", "Jupiter", "Square", ...] },
 *   { summary: "⬅️ ☉ □ ♃ ...", start: Jan 10, categories: ["Sun", "Jupiter", "Square", ...] }
 * );
 * // Returns: { summary: "☉□♃ Sun square Jupiter", start: Jan 1, end: Jan 10, ... }
 * ```
 */
function getMajorAspectDurationEvent(beginning: Event, ending: Event): Event {
  const bodiesCapitalized = beginning.categories
    .filter((category) =>
      majorAspectBodies
        .map((majorAspectBody) => _.startCase(majorAspectBody))
        .includes(category),
    )
    .sort();

  const aspectCapitalized = beginning.categories.find((category) =>
    majorAspects
      .map((majorAspect) => _.startCase(majorAspect))
      .includes(category),
  );

  if (bodiesCapitalized.length !== 2 || !aspectCapitalized) {
    throw new Error(
      `Could not extract aspect info from categories: ${beginning.categories.join(
        ", ",
      )}`,
    );
  }

  const body1Capitalized = bodiesCapitalized[0] ?? "";
  const body2Capitalized = bodiesCapitalized[1] ?? "";
  const aspect = aspectCapitalized.toLowerCase() as MajorAspect;

  const body1 = body1Capitalized.toLowerCase() as Body;
  const body2 = body2Capitalized.toLowerCase() as Body;

  const body1Symbol = symbolByBody[body1] as BodySymbol;
  const body2Symbol = symbolByBody[body2] as BodySymbol;
  const aspectSymbol = symbolByMajorAspect[aspect] as MajorAspectSymbol;

  return {
    start: beginning.start,
    end: ending.start,
    summary: `${body1Symbol}${aspectSymbol}${body2Symbol} ${body1Capitalized} ${aspect} ${body2Capitalized}`,
    description: `${body1Capitalized} ${aspect} ${body2Capitalized}`,
    categories: [
      "Astronomy",
      "Astrology",
      "Simple Aspect",
      "Major Aspect",
      body1Capitalized,
      body2Capitalized,
      aspectCapitalized,
    ],
  };
}
