import { writeFile } from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import moment from "moment-timezone";

import type {
  BuildCalendarFileContentParameters,
  Event,
} from "./calendar.types";
import type { Environment, Input } from "@caelundas/src/input/input.types";

/**
 *
 */
@Injectable()
export class CalendarService {
  constructor(private readonly configService: ConfigService<Environment>) {}
  /**
   *
   */
  async write(events: Event[], input: Input): Promise<void> {
    const timespan = `${input.start.toISOString(true)} to ${input.end.toISOString(true)}`;
    const calendarFilename = `caelundas_${timespan}.ics`;
    const calendarFileContent = this.buildFileContent({
      events,
      name: "Caelundas 🔭",
      description: "Astronomical events and celestial phenomena",
      timezone: input.timezone,
    });
    const outputDir =
      this.configService.get<string>("OUTPUT_DIRECTORY") ?? "./output";
    await writeFile(
      path.join(outputDir, calendarFilename),
      new TextEncoder().encode(calendarFileContent),
    );
    console.log(
      `✏️ Wrote ${events.length} events to file "${calendarFilename}"`,
    );
  }

  /**
   * Generates a complete iCalendar (ICS) file from an array of events.
   *
   * Creates an RFC 5545-compliant VCALENDAR container with VTIMEZONE and VEVENT components.
   *
   * @param parameters - Calendar generation configuration
   * @returns Complete iCalendar file content as a string
   *
   * @see {@link buildEventContent} for individual VEVENT generation
   *
   * @example
   * ```typescript
   * const service = new CalendarService();
   * const calendar = service.buildFileContent({
   *   events: [{
   *     start: moment.utc('2026-01-21T14:23:00'),
   *     end: moment.utc('2026-01-21T14:23:00'),
   *     summary: '☽ ☌ ♃ Moon Conjunction Jupiter',
   *     description: 'Exact: 2026-01-21 14:23 EST',
   *     categories: ['aspects', 'major', 'moon'],
   *   }],
   *   name: 'Astronomical Events',
   *   description: 'Caelundas astronomical calendar',
   *   timezone: 'America/New_York',
   * });
   * ```
   */
  buildFileContent(parameters: BuildCalendarFileContentParameters): string {
    const { events, name, description, timezone } = parameters;

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
      vcalendar += `\nX-WR-TIMEZONE:${timezone}\n${this.buildTimezoneContent(timezone)}`;
    }

    vcalendar += `\n${events.map((event) => this.buildEventContent(event, timezone)).join("\n")}
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
   * @see {@link buildFileContent} for VCALENDAR container generation
   */
  buildEventContent(event: Event, timezone = "America/New_York"): string {
    const createdAt = moment().format("YYYYMMDDTHHmmss");
    const start = moment.tz(event.start, timezone).format("YYYYMMDDTHHmmss");
    const end = moment.tz(event.end, timezone).format("YYYYMMDDTHHmmss");

    // Generate UID
    let id = `${event.summary}::${event.description}::${event.start.toISOString()}`;
    if (!event.end.isSame(event.start)) {
      id += `::${event.end.toISOString()}`;
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
  private buildTimezoneContent(timezone: string): string {
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
}
