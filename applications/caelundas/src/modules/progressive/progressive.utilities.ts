import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

/**
 * Pairs beginning and ending events into tuples.
 *
 * @param beginnings - Array of events marking the start of a progressive event
 * @param endings - Array of events marking the end of a progressive event
 * @param label - Descriptive label used in warning messages when counts differ
 * @returns Array of [beginning, ending] tuples
 */
export function pairProgressiveEvents(
  beginnings: Event[],
  endings: Event[],
  label: string,
): [Event, Event][] {
  const pairCount = Math.min(beginnings.length, endings.length);

  if (beginnings.length !== endings.length) {
    console.warn(
      `pairProgressiveEvents: unequal counts for "${label}": ${beginnings.length} beginnings, ${endings.length} endings`,
    );
  }

  const pairs: [Event, Event][] = [];

  for (let i = 0; i < pairCount; i++) {
    const beginning = beginnings[i];
    const ending = endings[i];
    if (beginning !== undefined && ending !== undefined) {
      pairs.push([beginning, ending]);
    }
  }

  return pairs;
}
