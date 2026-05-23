// 🏷️ Types
import type { Moment } from "moment-timezone";

/**
 * Represents a calendar event with timing, description, and metadata.
 *
 * Defines the structure for astronomical events converted to VEVENT components in iCalendar.
 *
 * @see {@link CalendarService.buildEventContent} for conversion to VEVENT format
 */
export interface Event {
  /** Event start time (local timezone). */
  start: Moment;

  /** Event end time (local timezone). For instantaneous events, set equal to start. */
  end: Moment;

  /**
   * Brief event title displayed in calendar views.
   * @example "☽ ☌ ♃ Moon Conjunction Jupiter"
   */
  summary: string;

  /**
   * Detailed event description with additional context.
   * @example "Exact: 2026-01-21 14:23 EST"
   */
  description: string;

  /**
   * Category tags for filtering and organization.
   * @example ["aspects", "major", "moon", "jupiter"]
   */
  categories: string[];

  /** Human-readable location string (optional). */
  location?: string | undefined;

  /** Geographic coordinates for map integration (optional). */
  geography?: { latitude: number; longitude: number } | undefined;

  /** External URL with related information (optional). */
  url?: string | undefined;

  /**
   * Event priority from 0 (undefined) to 9 (highest) (optional).
   * @remarks Use 1 for high, 5 for medium, 9 for low priority.
   */
  priority?: number | undefined;

  /** Color hint for calendar display (optional). */
  color?: string | undefined;
}

/**
 * Parameters for generating a complete iCalendar file.
 */
export interface BuildCalendarFileContentParameters {
  /** Array of events to include in the calendar. */
  events: Event[];

  /**
   * Calendar name displayed in calendar applications.
   * @example "Caelundas Astronomical Calendar"
   */
  name: string;

  /** Calendar description (optional). */
  description: string;

  /**
   * IANA timezone identifier for event times (optional).
   * @remarks Defaults to "America/New_York". Must match timezone used for ephemeris calculations.
   */
  timezone: string;
}
