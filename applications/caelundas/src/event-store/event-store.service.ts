import { Injectable } from "@nestjs/common";

import type { Event } from "@caelundas/src/calendar/calendar.types";

/**
 * In-memory accumulator for all calendar events produced during a single run.
 *
 * Perfective and progressive event services each emit their events in separate
 * passes. This store collects them so the calendar writer can sort and output
 * the full set in a single operation.
 */
@Injectable()
export class EventStoreService {
  private events: Event[] = [];

  /**
   * Appends a batch of events to the store.
   *
   * @param events - Calendar events to append
   */
  add(events: Event[]): void {
    this.events = [...this.events, ...events];
  }

  /**
   * Returns all accumulated events in insertion order.
   *
   * @returns Unordered array of all stored events
   */
  getAll(): Event[] {
    return this.events;
  }
}
