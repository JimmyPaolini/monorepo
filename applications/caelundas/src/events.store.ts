import type { Event } from "./calendar.utilities";

let events: Event[] = [];

/** Returns all astronomical events accumulated across pipeline stages. */
export function getAllEvents(): Event[] {
  return events;
}

/**
 * Appends events to the global store.
 *
 * Each pipeline stage (perfective, progressive) calls this after detection
 * so that {@link getAllEvents} always reflects the full accumulated output.
 *
 * @param newEvents - Events produced by a single pipeline stage
 */
export function addEvents(newEvents: Event[]): void {
  events = [...events, ...newEvents];
}
