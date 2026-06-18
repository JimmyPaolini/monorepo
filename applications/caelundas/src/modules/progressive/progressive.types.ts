// 🏷️ Types
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

/**
 * A tuple of two events representing the beginning and ending of a progressive
 * astronomical event (e.g. An aspect forming then separating)..
 *
 * @see {@link ProgressiveService.pairProgressiveEvents}
 */
export type ProgressiveEventPair = [beginning: Event, ending: Event];
