import { Injectable } from "@nestjs/common";

import type { Event } from "../calendar.utilities";

/**
 *
 */
/**
 *
 */
@Injectable()
export class EventStoreService {
  private events: Event[/**
   *
   */
  ] = [];

  /**
   *
   */
  add(events: Event[]): void {
    this.events = [...this/**
   *
   */
  .events, ...events];
  }

  /**
   *
   */
  getAll(): Event[] {
    return this.events;
  }
}
