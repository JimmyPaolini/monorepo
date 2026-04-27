/**
 * Retrograde motion event detection for planetary stationary points.
 *
 * This module identifies when planets appear to reverse direction in the sky
 * (retrograde motion) or resume normal eastward motion (direct motion). Retrograde
 * occurs when Earth's orbital motion makes a planet appear to move backward relative
 * to background stars. Only planets Mercury through Pluto can go retrograde; Sun and
 * Moon never do.
 */
import { Injectable } from "@nestjs/common";

import _ from "lodash";

import {
  type Event,
  MARGIN_MINUTES
} from "../../calendar.utilities";
import { getCoordinateFromEphemeris } from "../../ephemeris/ephemeris.service";
import { pairProgressiveEvents } from "../../progressive.utilities";
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
import type { Moment } from "moment-timezone";

/**
 * Standard categories for retrograde/direct station events.
 *
 * Base categories applied to all station events before adding direction-specific
 * categories ("Retrograde" or "Direct").
 */
const categories = ["Astronomy", "Astrology", "Direction"];


@Injectable()
export class RetrogradesService {
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
   * @see {@link buildRetrogradeEvent} for event formatting
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
  detect(args: {
    coordinateEphemerisByBody: Record<RetrogradeBody, CoordinateEphemeris>;
    minute: Moment;
  }): Event[] {
    const { coordinateEphemerisByBody, minute } = args;
    const retrogradeEvents: Event[] = [];

    for (const body of retrogradeBodies) {
      const ephemeris = coordinateEphemerisByBody[body];

      const currentLongitude = getCoordinateFromEphemeris(
        ephemeris,
        minute.toISOString(),
        "longitude",
      );

      const previousLongitudes = Array.from(
        { length: MARGIN_MINUTES },
        (_, index) => {
          const date = minute
            .clone()
            .subtract(MARGIN_MINUTES - index, "minutes");
          return getCoordinateFromEphemeris(
            ephemeris,
            date.toISOString(),
            "longitude",
          );
        },
      );

      const nextLongitudes = Array.from(
        { length: MARGIN_MINUTES },
        (_, index) => {
          const date = minute.clone().add(index + 1, "minutes");
          return getCoordinateFromEphemeris(
            ephemeris,
            date.toISOString(),
            "longitude",
          );
        },
      );

      const timestamp = minute;
      const longitudes = {
        currentLongitude,
        previousLongitudes,
        nextLongitudes,
      };

      if (isRetrograde({ ...longitudes })) {
        retrogradeEvents.push(
          this.buildRetrogradeEvent({ body, timestamp, direction: "retrograde" }),
        );
      }
      if (isDirect({ ...longitudes })) {
        retrogradeEvents.push(
          this.buildRetrogradeEvent({ body, timestamp, direction: "direct" }),
        );
      }
    }

    return retrogradeEvents;
  }

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
  buildRetrogradeEvent(args: {
    body: RetrogradeBody;
    timestamp: Moment;
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
      categories: [
        ...categories,
        ...(direction === "retrograde" ? ["Retrograde"] : ["Direct"]),
      ],
      summary,
      description,
    };

    return retrogradeEvent;
  }

  /**
   * Generates progressive events showing retrograde periods for each planet.
   *
   * Pairs "Stationary Retrograde" and "Stationary Direct" events for each planet
   * to create progressive events spanning the retrograde period. This shows the full
   * span of time when a planet appears to move backward.
   *
   * @param events - Array of all calendar events (will be filtered to direction events)
   * @returns Array of progressive events spanning retrograde periods
   *
   * @remarks
   * - Filters to events with "Direction" category
   * - Processes each planet separately (retrograde periods don't overlap between planets)
   * - Pairs retrograde stations (beginnings) with direct stations (endings)
   * - Skips unpaired events (e.g., retrograde still active at end of range)
   * - Progressive events use "Retrogrades" category (plural) vs "Retrograde" for stations
   * - Summary format: `[bodySymbol] ↩️ [Body] Retrograde`
   *
   * @see {@link pairProgressiveEvents} for pairing algorithm
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
   * const durations = getRetrogradeProgressiveEvents(allEvents);
   * // Returns: [
   * //   { summary: "☿ ↩️ Mercury Retrograde", start: Mar 15, end: Apr 8, ... },
   * //   { summary: "♀ ↩️ Venus Retrograde", start: Jul 22, end: Sep 3, ... }
   * // ]
   * ```
   */
  detectProgressive(events: Event[]): Event[] {
    const progressiveEvents: Event[] = [];

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

      const pairs = pairProgressiveEvents(
        beginnings,
        endings,
        `${planet} retrograde`,
      );

      progressiveEvents.push(
        ...pairs.map(([beginning, ending]) =>
          this.getRetrogradeProgressiveEvent(beginning, ending, planet),
        ),
      );
    }

    return progressiveEvents;
  }

  /**
   * Creates a progressive event from paired retrograde and direct station events.
   *
   * Extracts the planet symbol from the beginning event summary and formats a
   * progressive event showing the span of the retrograde period.
   *
   * @param beginningEvent - Stationary retrograde event (marks start of retrograde)
   * @param endingEvent - Stationary direct event (marks end of retrograde)
   * @param planet - Planet that was retrograde
   * @returns Progressive event spanning the retrograde period
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
   * const duration = getRetrogradeProgressiveEvent(
   *   { summary: "☿ ↩️ Mercury Stationary Retrograde", start: Mar 15, ... },
   *   { summary: "☿ ➡️ Mercury Stationary Direct", start: Apr 8, ... },
   *   "mercury"
   * );
   * // Returns: { summary: "☿ ↩️ Mercury Retrograde", start: Mar 15, end: Apr 8, ... }
   * ```
   */
  private getRetrogradeProgressiveEvent(
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
}
