import type { Event } from "./calendar.utilities";

let events: Event[] = [];

/**
 *
 */
export function getAllEvents(): Event[] {
  return events;
}

/**
 *
 */
export function addEvents(newEvents: Event[]): void {
  events = [...events, ...newEvents];
}
