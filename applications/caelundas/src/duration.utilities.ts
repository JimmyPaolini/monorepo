import _ from "lodash";

import type { Event } from "./calendar.utilities";

/**
 * Pairs beginning and ending phase events chronologically to create duration events.
 *
 * This function matches start and end markers for astronomical phenomena that
 * have duration (e.g., retrograde periods, aspect orb windows, eclipse seasons).
 * It performs chronological pairing with validation and warns about unpaired or
 * invalid events.
 *
 * @param beginningEvents - Array of events marking the start of periods
 * @param endingEvents - Array of events marking the end of periods
 * @param eventName - Name of the event type (used in warning messages)
 * @returns Array of paired events as tuples [beginning, ending]
 *
 * @typeParam E - Event type (extends {@link Event})
 *
 * @remarks
 * **Pairing algorithm:**
 * 1. Sort both arrays chronologically by start time
 * 2. Iterate through beginnings and endings in parallel
 * 3. Pair each beginning with the next chronologically valid ending
 * 4. Skip invalid pairs where ending precedes or equals beginning
 * 5. Warn about unpaired events (extend beyond date range)
 *
 * **Validation rules:**
 * - Ending must occur strictly after beginning (not equal)
 * - Invalid pairs are skipped with warning
 * - Unpaired beginnings suggest continuation beyond end date
 * - Unpaired endings suggest start before begin date
 *
 * **Edge cases:**
 * - If an ending precedes its beginning, the beginning is retried with the next ending
 * - Overlapping periods are allowed (not validated against)
 * - Empty arrays return empty result without warnings
 *
 * **Common use cases:**
 * - Pairing retrograde station events (direct → retrograde, retrograde → direct)
 * - Creating aspect duration windows (applying → exact → separating)
 * - Tracking eclipse seasons (season begins → season ends)
 * - Measuring twilight periods (begins → ends)
 *
 * @example
 * ```typescript
 * const retrogradeBegins = [
 *   { summary: 'Mercury stations retrograde', start: new Date('2026-01-15'), ... },
 *   { summary: 'Venus stations retrograde', start: new Date('2026-02-10'), ... },
 * ];
 * const retrogradeEnds = [
 *   { summary: 'Mercury stations direct', start: new Date('2026-02-05'), ... },
 *   { summary: 'Venus stations direct', start: new Date('2026-03-20'), ... },
 * ];
 *
 * const retrogradePeriods = pairDurationEvents(
 *   retrogradeBegins,
 *   retrogradeEnds,
 *   'retrograde period'
 * );
 * // Returns: [[Mercury begin, Mercury end], [Venus begin, Venus end]]
 * ```
 *
 * @example
 * ```typescript
 * // Handling unpaired events (period extends beyond range)
 * const begins = [{ start: new Date('2026-01-15'), ... }];
 * const ends: Event[] = []; // No endings in range
 *
 * const pairs = pairDurationEvents(begins, ends, 'aspect');
 * // Returns: []
 * // Console: "⚠️ 1 unpaired aspect beginning(s) (likely extends beyond date range)"
 * ```
 */
export function pairDurationEvents<E extends Event>(
  beginningEvents: E[],
  endingEvents: E[],
  eventName: string,
): [E, E][] {
  const beginnings = _.sortBy(beginningEvents, (e) => e.start.getTime());
  const endings = _.sortBy(endingEvents, (e) => e.start.getTime());
  const pairs: [E, E][] = [];

  // Pair each beginning with the next valid ending
  for (
    let beginningIndex = 0, endingIndex = 0;
    beginningIndex < beginnings.length && endingIndex < endings.length;
    beginningIndex++, endingIndex++
  ) {
    const beginning = beginnings[beginningIndex];
    const ending = endings[endingIndex];
    if (!beginning || !ending) {
      continue;
    }

    if (ending.start <= beginning.start) {
      console.warn(
        `⚠️ Skipping invalid ${eventName} ending: ` +
          `ending (${ending.start.toISOString()}) is before or equal to ` +
          `beginning (${beginning.start.toISOString()})`,
      );
      beginningIndex--;
      continue;
    }

    pairs.push([beginning, ending]);
  }

  const unpairedBeginnings = beginnings.length - pairs.length;
  const unpairedEndings = endings.length - pairs.length;

  if (unpairedBeginnings > 0) {
    console.warn(
      `⚠️ ${unpairedBeginnings} unpaired ${eventName} beginning(s) ` +
        `(likely extends beyond date range)`,
    );
  }

  if (unpairedEndings > 0) {
    console.warn(
      `⚠️ ${unpairedEndings} unpaired ${eventName} ending(s) ` +
        `(likely started before date range)`,
    );
  }

  return pairs;
}
