/**
 * Monthly lunar cycle event detection for Moon phases.
 *
 * This module identifies the four primary lunar phases as Moon orbits Earth:
 * New Moon (0% illumination), First Quarter (50% waxing), Full Moon (100%),
 * and Third Quarter (50% waning). Phases are detected by analyzing Moon's
 * illumination percentage from NASA JPL ephemeris data.
 */

import fs from "node:fs";

import _ from "lodash";
import moment from "moment-timezone";

import { getCalendar, MARGIN_MINUTES } from "../../calendar.utilities";
import { lunarPhases } from "../../constants";
import { getIlluminationFromEphemeris } from "../../ephemeris/ephemeris.service";
import { getOutputPath } from "../../output.utilities";
import { symbolByLunarPhase } from "../../symbols";

import { isLunarPhase } from "./monthlyLunarCycle.utilities";

import type { Event } from "../../calendar.utilities";
import type { IlluminationEphemeris } from "../../ephemeris/ephemeris.types";
import type { LunarPhase } from "../../types";
import type { Moment } from "moment";

/**
 * Detects lunar phase events at a specific time point.
 *
 * Analyzes Moon illumination percentage over a sliding window to identify exact
 * moments when Moon reaches the four primary phases: new (0%), first quarter (50%
 * waxing), full (100%), and third quarter (50% waning). Uses {@link MARGIN_MINUTES}
 * window for robust extrema detection.
 *
 * @param args - Ephemeris data and current time
 * @param currentMinute - Time point to check for phase events (minute precision)
 * @param moonIlluminationEphemeris - Pre-computed Moon illumination data
 * @returns Array of calendar events for detected lunar phases (0-1 events per call)
 *
 * @remarks
 * - Checks all four {@link lunarPhases}: new, first, full, third
 * - Uses ±{@link MARGIN_MINUTES} window to detect local extrema (minima/maxima)
 * - **New Moon**: Local minimum in illumination (syzygy with Sun)
 * - **First Quarter**: Rising through 50% illumination (90° elongation from Sun)
 * - **Full Moon**: Local maximum in illumination (opposition to Sun)
 * - **Third Quarter**: Falling through 50% illumination (270° elongation from Sun)
 * - Returns empty array if no phase transition detected at this time
 * - Typically called once per minute in main ephemeris loop
 *
 * @see {@link isLunarPhase} for phase detection algorithm
 * @see {@link getMonthlyLunarCycleEvent} for event formatting
 * @see {@link getIlluminationFromEphemeris} for illumination interpolation
 *
 * @example
 * ```typescript
 * const events = getMonthlyLunarCycleEvents({
 *   currentMinute: moment('2026-01-28T20:15:00Z'),
 *   moonIlluminationEphemeris: illuminationData
 * });
 * // Returns: [{ summary: "🌕 🌕 Full Moon", start: ..., ... }]
 * ```
 */
export function getMonthlyLunarCycleEvents(args: {
  currentMinute: Moment;
  moonIlluminationEphemeris: IlluminationEphemeris;
}): Event[] {
  const { currentMinute, moonIlluminationEphemeris } = args;

  const monthlyLunarCycleEvents: Event[] = [];

  const currentIllumination = getIlluminationFromEphemeris(
    moonIlluminationEphemeris,
    currentMinute.toISOString(),
    "currentIllumination",
  );

  const previousIlluminations = Array.from({length: MARGIN_MINUTES}, (_, marginIndex) => {
      const minute = currentMinute.clone().subtract(marginIndex + 1, "minutes");
      return getIlluminationFromEphemeris(
        moonIlluminationEphemeris,
        minute.toISOString(),
        "previousIllumination",
      );
    });

  const nextIlluminations = Array.from({length: MARGIN_MINUTES}, (_, marginIndex) => {
      const minute = currentMinute.clone().add(marginIndex + 1, "minutes");
      return getIlluminationFromEphemeris(
        moonIlluminationEphemeris,
        minute.toISOString(),
        "nextIllumination",
      );
    });

  const illuminations = {
    currentIllumination,
    previousIlluminations,
    nextIlluminations,
  };
  const date = currentMinute.toDate();

  for (const lunarPhase of lunarPhases) {
    if (isLunarPhase({ ...illuminations, lunarPhase })) {
      monthlyLunarCycleEvents.push(
        getMonthlyLunarCycleEvent({ date, lunarPhase }),
      );
    }
  }

  return monthlyLunarCycleEvents;
}

/**
 * Creates a formatted calendar event for a lunar phase.
 *
 * Generates a calendar event with Unicode Moon phase symbols and descriptive text.
 * Each phase has a unique symbol (🌑 new, 🌓 first, 🌕 full, 🌗 third) for visual
 * distinction in calendar applications.
 *
 * @param args - Lunar phase event parameters
 * @param date - Exact time of the lunar phase
 * @param lunarPhase - Phase type: "new", "first", "full", or "third"
 * @returns Calendar event with summary, description, and phase-specific categories
 *
 * @remarks
 * - Summary format: `🌕 [phaseSymbol] [Phase] Moon`
 * - Example new: "🌕 🌑 New Moon"
 * - Example full: "🌕 🌕 Full Moon"
 * - Phase symbols from {@link symbolByLunarPhase}: 🌑 (new), 🌓 (first), 🌕 (full), 🌗 (third)
 * - Categories include capitalized phase name for filtering (e.g., "New", "Full")
 * - Logs event to console with America/New_York timezone for readability
 * - Event timestamps use UTC but display shows local time in logs
 *
 * @see {@link symbolByLunarPhase} for Moon phase Unicode symbols
 * @see {@link Event} for calendar event structure
 *
 * @example
 * ```typescript
 * const event = getMonthlyLunarCycleEvent({
 *   date: new Date('2026-01-28T20:15:00Z'),
 *   lunarPhase: "full"
 * });
 * // Returns: { summary: "🌕 🌕 Full Moon", start: ..., categories: [..., "Full"], ... }
 * ```
 */
export function getMonthlyLunarCycleEvent(args: {
  date: Date;
  lunarPhase: LunarPhase;
}): Event {
  const { date, lunarPhase } = args;

  const lunarPhaseCapitalized = _.startCase(
    lunarPhase,
  ) as Capitalize<LunarPhase>;
  const description = `${lunarPhaseCapitalized} Moon`;
  const summary = `🌙 ${symbolByLunarPhase[lunarPhase]} ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const monthlyLunarCycleEvent = {
    start: date,
    end: date,
    summary,
    description,
    categories: [
      "Astronomy",
      "Astrology",
      "Monthly Lunar Cycle",
      "Lunar",
      lunarPhaseCapitalized,
    ],
  };
  return monthlyLunarCycleEvent;
}

/**
 * Writes monthly lunar cycle events to an iCalendar file.
 *
 * Generates an `.ics` file containing all lunar phase events for a date range.
 * File is named with timespan for easy identification. Skips writing if no
 * events exist.
 *
 * @param args - Output parameters
 * @param monthlyLunarCycleEvents - Array of lunar phase events to write
 * @param start - Start date of the event range (inclusive)
 * @param end - End date of the event range (inclusive)
 *
 * @remarks
 * - Filename format: `monthly-lunar-cycle_[start]-[end].ics`
 * - Example: `monthly-lunar-cycle_2026-01-01T00:00:00Z-2026-12-31T23:59:59Z.ics`
 * - Uses UTF-8 encoding via TextEncoder
 * - Calendar name: "Monthly Lunar Cycle 🌒"
 * - Logs write operation with event count and timespan
 * - Early return if event array is empty
 * - Typically contains 12-13 events per year (one phase every ~29.5 days)
 *
 * @see {@link getCalendar} for iCalendar generation
 * @see {@link getOutputPath} for output directory resolution
 *
 * @example
 * ```typescript
 * writeMonthlyLunarCycleEvents({
 *   monthlyLunarCycleEvents: events,
 *   start: new Date('2026-01-01'),
 *   end: new Date('2026-12-31')
 * }); // Writes monthly-lunar-cycle_2026-01-01T00:00:00Z-2026-12-31T23:59:59Z.ics
 * ```
 */
export function writeMonthlyLunarCycleEvents(args: {
  monthlyLunarCycleEvents: Event[];
  start: Date;
  end: Date;
}): void {
  const { monthlyLunarCycleEvents, start, end } = args;
  if (_.isEmpty(monthlyLunarCycleEvents)) {
    return;
  }

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${monthlyLunarCycleEvents.length} monthly lunar cycle events from ${timespan}`;
  console.log(`🌒 Writing ${message}`);

  const ingressCalendar = getCalendar({
    events: monthlyLunarCycleEvents,
    name: "Monthly Lunar Cycle 🌒",
  });
  fs.writeFileSync(
    getOutputPath(`monthly-lunar-cycle_${timespan}.ics`),
    new TextEncoder().encode(ingressCalendar),
  );

  console.log(`🌒 Wrote ${message}`);
}

// #region 🕑 Duration Events

/**
 * Generates duration events showing time spent in each lunar phase.
 *
 * Pairs consecutive lunar phase events to create duration events spanning the
 * period between phases. This shows how long Moon remains in each phase state
 * (roughly 7.4 days per phase on average).
 *
 * @param events - Array of all calendar events (will be filtered to lunar cycles)
 * @returns Array of duration events spanning lunar phase periods
 *
 * @remarks
 * - Filters to events with "Monthly Lunar Cycle" category
 * - Sorts events chronologically by start time
 * - Pairs consecutive phase events (new → first, first → full, full → third, third → new)
 * - Duration event represents time spent **in** the entering phase
 * - Skips invalid events that lack proper phase categorization
 * - Returns empty array for unpaired events (e.g., at date range boundaries)
 * - Average phase duration: ~7.4 days (29.5 day lunar month ÷ 4 phases)
 *
 * @see {@link getMonthlyLunarCycleDurationEvent} for event formatting
 * @see {@link lunarPhases} for phase ordering
 *
 * @example
 * ```typescript
 * const allEvents = [
 *   { summary: "🌕 🌑 New Moon", start: Jan 1, categories: [..., "New"] },
 *   { summary: "🌕 🌓 First Quarter Moon", start: Jan 8, categories: [..., "First"] },
 *   { summary: "🌕 🌕 Full Moon", start: Jan 15, categories: [..., "Full"] },
 *   { summary: "🌕 🌗 Third Quarter Moon", start: Jan 22, categories: [..., "Third"] }
 * ];
 * const durations = getMonthlyLunarCycleDurationEvents(allEvents);
 * // Returns: [
 * //   { summary: "🌕 🌑 New Moon", start: Jan 1, end: Jan 8, ... },
 * //   { summary: "🌕 🌓 First Quarter Moon", start: Jan 8, end: Jan 15, ... },
 * //   { summary: "🌕 🌕 Full Moon", start: Jan 15, end: Jan 22, ... }
 * // ]
 * ```
 */
export function getMonthlyLunarCycleDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to monthly lunar cycle events only
  const lunarCycleEvents = events.filter((event) =>
    event.categories.includes("Monthly Lunar Cycle"),
  );

  // Sort by time
  const sortedEvents = _.sortBy(lunarCycleEvents, (event) =>
    event.start.getTime(),
  );

  // Pair consecutive lunar phases to create duration events
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const entering = sortedEvents[i];
    const exiting = sortedEvents[i + 1];
    if (!entering || !exiting) {
      continue;
    }

    const durationEvent = getMonthlyLunarCycleDurationEvent(entering, exiting);
    if (!durationEvent) {
      continue;
    }

    durationEvents.push(durationEvent);
  }

  return durationEvents;
}

/**
 * Creates a duration event from consecutive lunar phase events.
 *
 * Extracts the lunar phase from the entering event categories and formats a
 * duration event showing the span of time Moon remains in that phase.
 *
 * @param entering - Phase event marking the start of this phase period
 * @param exiting - Next phase event marking the end of this phase period
 * @returns Duration event spanning the phase period, or null if phase cannot be extracted
 *
 * @remarks
 * - Duration spans from entering.start to exiting.start (not exiting.end)
 * - Extracts phase from categories by matching against {@link lunarPhases}
 * - Returns null and logs warning if phase category is missing or invalid
 * - Summary format: `🌕 [phaseSymbol] [Phase] Moon`
 * - Uses same format as instantaneous phase events for consistency
 * - Categories match entering event categories exactly
 *
 * @see {@link lunarPhases} for extracting phase category
 * @see {@link symbolByLunarPhase} for phase symbols
 *
 * @example
 * ```typescript
 * const duration = getMonthlyLunarCycleDurationEvent(
 *   { summary: "🌕 🌑 New Moon", start: Jan 1, categories: [..., "New"] },
 *   { summary: "🌕 🌓 First Quarter Moon", start: Jan 8, categories: [..., "First"] }
 * );
 * // Returns: { summary: "🌕 🌑 New Moon", start: Jan 1, end: Jan 8, categories: [..., "New"] }
 * ```
 */
function getMonthlyLunarCycleDurationEvent(
  entering: Event,
  exiting: Event,
): Event | null {
  const categories = entering.categories;

  // Extract the lunar phase
  const lunarPhaseCapitalized = categories.find((category) =>
    lunarPhases.map((lunarPhase) => _.startCase(lunarPhase)).includes(category),
  );

  if (!lunarPhaseCapitalized) {
    console.warn(
      `⚠️ Could not extract lunar phase from categories: ${categories.join(
        ", ",
      )} - skipping duration event for ${entering.summary}`,
    );
    return null; // Skip this invalid event
  }

  const lunarPhase = lunarPhaseCapitalized.toLowerCase() as LunarPhase;
  const lunarPhaseSymbol = symbolByLunarPhase[lunarPhase];

  return {
    start: entering.start,
    end: exiting.start,
    summary: `🌙 ${lunarPhaseSymbol} ${lunarPhaseCapitalized} Moon`,
    description: `${lunarPhaseCapitalized} Moon`,
    categories: [
      "Astronomy",
      "Astrology",
      "Monthly Lunar Cycle",
      "Lunar",
      lunarPhaseCapitalized,
    ],
  };
}
