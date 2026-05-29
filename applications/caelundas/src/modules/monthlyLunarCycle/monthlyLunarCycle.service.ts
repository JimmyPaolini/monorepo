import {
  lunarPhases,
  MARGIN_MINUTES,
  symbolByLunarPhase,
} from "@caelundas/src/caelundas.constants";
import { isLunarPhase } from "@caelundas/src/caelundas.types";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import type { LunarPhase } from "@caelundas/src/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { IlluminationEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

// #region 🕑 Progressive Events

/**
 * Detects monthly lunar cycle phase events using Moon illumination data.
 *
 * Identifies the four primary lunar phases (new moon, first quarter, full moon,
 * third quarter) by analyzing Moon illumination extrema and midpoint crossings
 * from NASA JPL ephemeris data.
 */
@Injectable()
export class MonthlyLunarCycleService {
  static readonly illuminationByPhase: Record<LunarPhase, number> = {
    new: 0,
    "waxing crescent": 0.25,
    "first quarter": 0.5,
    "waxing gibbous": 0.75,
    full: 1,
    "waning gibbous": 0.75,
    "last quarter": 0.5,
    "waning crescent": 0.25,
  };

  /**
   * Lunar phases during which Moon's illumination is increasing.
   * Used to classify quarter-crossing detections as waxing events.
   */
  static readonly waxingPhases: ReadonlySet<LunarPhase> = new Set([
    "waxing crescent",
    "first quarter",
    "waxing gibbous",
  ]);

  /**
   * Lunar phases during which Moon's illumination is decreasing.
   * Used to classify quarter-crossing detections as waning events.
   */
  static readonly waningPhases: ReadonlySet<LunarPhase> = new Set([
    "waning gibbous",
    "last quarter",
    "waning crescent",
  ]);

  // 🏗️ Dependency Injection
  constructor(private readonly ephemerisService: EphemerisService) {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

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
   * @see {@link buildMonthlyLunarCycleEvent} for event formatting
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
  detect(args: {
    minute: Moment;
    moonIlluminationEphemeris: IlluminationEphemeris;
  }): Event[] {
    const { minute, moonIlluminationEphemeris } = args;

    const monthlyLunarCycleEvents: Event[] = [];

    const currentIllumination =
      this.ephemerisService.getIlluminationFromEphemeris(
        moonIlluminationEphemeris,
        minute.toISOString(),
        "currentIllumination",
      );

    const previousIlluminations = Array.from(
      { length: MARGIN_MINUTES },
      (_, marginIndex) => {
        const m = minute.clone().subtract(marginIndex + 1, "minutes");
        return this.ephemerisService.getIlluminationFromEphemeris(
          moonIlluminationEphemeris,
          m.toISOString(),
          "previousIllumination",
        );
      },
    );

    const nextIlluminations = Array.from(
      { length: MARGIN_MINUTES },
      (_, marginIndex) => {
        const m = minute.clone().add(marginIndex + 1, "minutes");
        return this.ephemerisService.getIlluminationFromEphemeris(
          moonIlluminationEphemeris,
          m.toISOString(),
          "nextIllumination",
        );
      },
    );

    for (const lunarPhase of lunarPhases) {
      if (
        this.isLunarPhase({
          currentIllumination,
          previousIlluminations,
          nextIlluminations,
          lunarPhase,
        })
      ) {
        monthlyLunarCycleEvents.push(
          this.buildMonthlyLunarCycleEvent({ date: minute, lunarPhase }),
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
  buildMonthlyLunarCycleEvent(args: {
    date: Moment;
    lunarPhase: LunarPhase;
  }): Event {
    const { date, lunarPhase } = args;

    const lunarPhaseCapitalized = _.startCase(lunarPhase);
    const description = `${lunarPhaseCapitalized} Moon`;
    const summary = `🌙 ${symbolByLunarPhase[lunarPhase]} ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
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
   * Generates progressive events showing time spent in each lunar phase.
   *
   * Pairs consecutive lunar phase events to create progressive events spanning the
   * period between phases. This shows how long Moon remains in each phase state
   * (roughly 7.4 days per phase on average).
   *
   * @param events - Array of all calendar events (will be filtered to lunar cycles)
   * @returns Array of progressive events spanning lunar phase periods
   *
   * @remarks
   * - Filters to events with "Monthly Lunar Cycle" category
   * - Sorts events chronologically by start time
   * - Pairs consecutive phase events (new → first, first → full, full → third, third → new)
   * - Progressive event represents time spent **in** the entering phase
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
   * const durations = getMonthlyLunarCycleProgressiveEvents(allEvents);
   * // Returns: [
   * //   { summary: "🌕 🌑 New Moon", start: Jan 1, end: Jan 8, ... },
   * //   { summary: "🌕 🌓 First Quarter Moon", start: Jan 8, end: Jan 15, ... },
   * //   { summary: "🌕 🌕 Full Moon", start: Jan 15, end: Jan 22, ... }
   * // ]
   * ```
   */
  detectProgressive(events: Event[]): Event[] {
    const progressiveEvents: Event[] = [];

    // Filter to monthly lunar cycle events only
    const lunarCycleEvents = events.filter((event) =>
      event.categories.includes("Monthly Lunar Cycle"),
    );

    // Sort by time
    const sortedEvents = _.sortBy(lunarCycleEvents, (event) =>
      event.start.valueOf(),
    );

    // Pair consecutive lunar phases to create progressive events
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const entering = sortedEvents[i];
      const exiting = sortedEvents[i + 1];
      if (!entering || !exiting) {
        continue;
      }

      const durationEvent = this.getMonthlyLunarCycleProgressiveEvent(
        entering,
        exiting,
      );
      if (!durationEvent) {
        continue;
      }

      progressiveEvents.push(durationEvent);
    }

    return progressiveEvents;
  }

  /**
   * Creates a progressive event from consecutive lunar phase events.
   *
   * Extracts the lunar phase from the entering event categories and formats a
   * progressive event showing the span of time Moon remains in that phase.
   *
   * @param entering - Phase event marking the start of this phase period
   * @param exiting - Next phase event marking the end of this phase period
   * @returns Progressive event spanning the phase period, or null if phase cannot be extracted
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
   * const duration = getMonthlyLunarCycleProgressiveEvent(
   *   { summary: "🌕 🌑 New Moon", start: Jan 1, categories: [..., "New"] },
   *   { summary: "🌕 🌓 First Quarter Moon", start: Jan 8, categories: [..., "First"] }
   * );
   * // Returns: { summary: "🌕 🌑 New Moon", start: Jan 1, end: Jan 8, categories: [..., "New"] }
   * ```
   */
  private getMonthlyLunarCycleProgressiveEvent(
    entering: Event,
    exiting: Event,
  ): Event | null {
    const categories = entering.categories;

    // Extract the lunar phase
    const capitalizedLunarPhases = new Set(
      lunarPhases.map((phase) => _.startCase(phase)),
    );
    const lunarPhaseCapitalized = categories.find((category) =>
      capitalizedLunarPhases.has(category),
    );

    if (!lunarPhaseCapitalized) {
      console.warn(
        `⚠️ Could not extract lunar phase from categories: ${categories.join(
          ", ",
        )} - skipping progressive event for ${entering.summary}`,
      );
      return null; // Skip this invalid event
    }

    const lunarPhaseLower = lunarPhaseCapitalized.toLowerCase();
    if (!isLunarPhase(lunarPhaseLower)) {
      console.warn(`⚠️ Unknown lunar phase: ${lunarPhaseLower}`);
      return null;
    }
    const lunarPhase = lunarPhaseLower;
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

  private isNewMoon(args: {
    currentIllumination: number;
    previousIlluminations: number[];
    nextIlluminations: number[];
  }): boolean {
    const { currentIllumination, previousIlluminations, nextIlluminations } =
      args;
    return (
      currentIllumination < Math.min(...previousIlluminations) &&
      currentIllumination <= Math.min(...nextIlluminations) &&
      currentIllumination < 50
    );
  }

  private isFullMoon(args: {
    currentIllumination: number;
    previousIlluminations: number[];
    nextIlluminations: number[];
  }): boolean {
    const { currentIllumination, previousIlluminations, nextIlluminations } =
      args;
    return (
      currentIllumination > Math.max(...previousIlluminations) &&
      currentIllumination >= Math.max(...nextIlluminations) &&
      currentIllumination > 50
    );
  }

  private isLunarPhase(args: {
    currentIllumination: number;
    previousIlluminations: number[];
    nextIlluminations: number[];
    lunarPhase: LunarPhase;
  }): boolean {
    const { lunarPhase, ...illuminations } = args;

    if (lunarPhase === "new") {
      return this.isNewMoon({ ...illuminations });
    }
    if (lunarPhase === "full") {
      return this.isFullMoon({ ...illuminations });
    }

    const { currentIllumination, previousIlluminations } = illuminations;
    const previousIllumination = previousIlluminations[0];
    if (!previousIllumination) {
      return false;
    }

    const illumination =
      MonthlyLunarCycleService.illuminationByPhase[lunarPhase] * 100;

    const isWaxing = currentIllumination > previousIllumination;
    const isWaning = currentIllumination < previousIllumination;
    const isCrossingUp =
      currentIllumination > illumination &&
      previousIllumination <= illumination;
    const isCrossingDown =
      currentIllumination < illumination &&
      previousIllumination >= illumination;
    const isPhase = isCrossingUp || isCrossingDown;

    const isWaxingLunarPhase = isPhase && isWaxing;
    const isWaningLunarPhase = isPhase && isWaning;

    if (MonthlyLunarCycleService.waxingPhases.has(lunarPhase)) {
      return isWaxingLunarPhase;
    }
    if (MonthlyLunarCycleService.waningPhases.has(lunarPhase)) {
      return isWaningLunarPhase;
    }
    return false;
  }
}
