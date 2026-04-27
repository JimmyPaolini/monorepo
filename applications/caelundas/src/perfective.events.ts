import { detectPerfectiveEventsByDate } from "./date";
import { addEvents } from "./events.store";

import type { Event } from "./calendar.utilities";
import type { Moment } from "moment-timezone";

/**
 * Detects all perfective astronomical events for the given range and stores them.
 *
 * Delegates to {@link detectPerfectiveEventsByDate} for the two-level date/minute
 * loop, then persists results via {@link addEvents}.
 */
export function detectPerfectiveEvents(args: {
  end: Moment;
  latitude: number;
  longitude: number;
  start: Moment;
  timezone: string;
}): Event[] {
  const events = detectPerfectiveEventsByDate(args);
  addEvents(events);
  return events;
}
