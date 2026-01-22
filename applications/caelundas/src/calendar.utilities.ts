/**
 * Calendar generation utilities for converting astronomical events to iCalendar (ICS) format.
 *
 * Generates RFC 5545-compliant iCalendar files from caelundas event data.
 *
 * @see {@link https://tools.ietf.org/html/rfc5545} for iCalendar specification
 * @see {@link getCalendar} for main calendar generation function
 */

import moment from "moment-timezone";

/**
 * Margin in minutes added before/after date ranges for ephemeris queries (30).
 */
export const MARGIN_MINUTES = 30;

/**
 * Represents a calendar event with timing, description, and metadata.
 *
 * Defines the structure for astronomical events converted to VEVENT components in iCalendar.
 *
 * @see {@link getEvent} for conversion to VEVENT format
 */
export interface Event {
  /** Event start time (local timezone). */
  start: Date;

  /** Event end time (local timezone). For instantaneous events, set equal to start. */
  end: Date;

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

// export type EventTemplate = Omit<Event, "start" | "end">;

/**
 * Parameters for generating a complete iCalendar file.
 */
export interface GetCalendarParameters {
  /** Array of events to include in the calendar. */
  events: Event[];

  /**
   * Calendar name displayed in calendar applications.
   * @example "Caelundas Astronomical Calendar"
   */
  name: string;

  /** Calendar description (optional). */
  description?: string;

  /**
   * IANA timezone identifier for event times (optional).
   * @remarks Defaults to "America/New_York". Must match timezone used for ephemeris calculations.
   */
  timezone?: string;
}

/**
 * Generates a complete iCalendar (ICS) file from an array of events.
 *
 * Creates an RFC 5545-compliant VCALENDAR container with VTIMEZONE and VEVENT components.
 *
 * @param parameters - Calendar generation configuration
 * @returns Complete iCalendar file content as a string
 *
 * @see {@link getEvent} for individual VEVENT generation
 *
 * @example
 * ```typescript
 * const calendar = getCalendar({
 *   events: [{
 *     start: new Date('2026-01-21T14:23:00'),
 *     end: new Date('2026-01-21T14:23:00'),
 *     summary: '☽ ☌ ♃ Moon Conjunction Jupiter',
 *     description: 'Exact: 2026-01-21 14:23 EST',
 *     categories: ['aspects', 'major', 'moon'],
 *   }],
 *   name: 'Astronomical Events',
 *   timezone: 'America/New_York',
 * });
 * ```
 */
export function getCalendar(parameters: GetCalendarParameters): string {
  const {
    events,
    name,
    description = "Astronomical events and celestial phenomena",
    timezone = "America/New_York",
  } = parameters;

  let vcalendar = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Caelundas//Astronomical Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${name}`;

  if (description) {
    vcalendar += `\nX-WR-CALDESC:${description}`;
  }

  if (timezone) {
    vcalendar += `\nX-WR-TIMEZONE:${timezone}\n${getTimezone(timezone)}`;
  }

  vcalendar += `\n${events.map((event) => getEvent(event, timezone)).join("\n")}
END:VCALENDAR
`;

  return vcalendar;
}

/**
 * Converts a single Event to VEVENT format for iCalendar inclusion.
 *
 * Generates an RFC 5545-compliant VEVENT component. UIDs are deterministic based on
 * event content to ensure idempotent imports.
 *
 * @param event - Event to convert
 * @param timezone - IANA timezone identifier (defaults to "America/New_York")
 * @returns VEVENT component as a string
 *
 * @see {@link getCalendar} for VCALENDAR container generation
 */
export function getEvent(event: Event, timezone = "America/New_York"): string {
  const createdAt = moment().format("YYYYMMDDTHHmmss");
  const start = moment.tz(event.start, timezone).format("YYYYMMDDTHHmmss");
  const end = moment.tz(event.end, timezone).format("YYYYMMDDTHHmmss");

  // Generate UID
  let id = `${event.summary}::${event.description}::${event.start}`;
  if (event.end.getTime() !== event.start.getTime()) {
    id += `::${event.end}`;
  }

  // Build VEVENT
  let vevent = `BEGIN:VEVENT
UID:${id}
DTSTAMP:${createdAt}Z
DTSTART;TZID=${timezone}:${start}`;

  vevent += `\nDTEND;TZID=${timezone}:${end}`;

  vevent += `
SUMMARY:${event.summary}
DESCRIPTION:${event.description}
STATUS:CONFIRMED
CLASS:PUBLIC
TRANSP:TRANSPARENT
CATEGORIES:${event.categories.join(",")}`;

  if (event.location) {
    vevent += `\nLOCATION:${event.location}`;
  }
  if (event.geography) {
    vevent += `\nGEO:${event.geography.latitude};${event.geography.longitude}`;
  }
  if (event.url) {
    vevent += `\nURL:${event.url}`;
  }
  if (event.priority !== undefined) {
    vevent += `\nPRIORITY:${event.priority}`;
  }
  if (event.color) {
    vevent += `\nCOLOR:${event.color}`;
  }

  vevent += `\nSEQUENCE:0
LAST-MODIFIED:${createdAt}Z
CREATED:${createdAt}Z
END:VEVENT`;

  return vevent;
}

/**
 * Generates VTIMEZONE definition for iCalendar timezone support.
 *
 * @param timezone - IANA timezone identifier
 * @returns VTIMEZONE component as a string
 *
 * @remarks Only America/New_York has complete DST rules; others return minimal VTIMEZONE.
 */
function getTimezone(timezone: string): string {
  if (timezone === "America/New_York") {
    return `BEGIN:VTIMEZONE
TZID:America/New_York
X-LIC-LOCATION:America/New_York
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
TZNAME:EDT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
TZNAME:EST
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE`;
  }

  // For other timezones, return a basic VTIMEZONE
  // In production, you'd want a more comprehensive timezone database
  return `BEGIN:VTIMEZONE
TZID:${timezone}
END:VTIMEZONE`;
}
