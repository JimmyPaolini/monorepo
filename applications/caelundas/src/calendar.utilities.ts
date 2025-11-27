import moment from "moment-timezone";

export const MARGIN_MINUTES = 30;

export interface Event {
  start: Date;
  end: Date;
  summary: string;
  description: string;
  categories: string[];
  location?: string;
  geography?: { latitude: number; longitude: number };
  url?: string;
  priority?: number;
  color?: string;
}

export type EventTemplate = Omit<Event, "start" | "end">

export interface GetCalendarParameters {
  events: Event[];
  name: string;
  description?: string;
  timezone?: string;
}

export function getCalendar(parameters: GetCalendarParameters) {
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

  if (description) {vcalendar += `\nX-WR-CALDESC:${description}`;}

  if (timezone)
    {vcalendar += `\nX-WR-TIMEZONE:${timezone}\n${getTimezone(timezone)}`;}

  vcalendar += `\n${events.map((event) => getEvent(event, timezone)).join("\n")}
END:VCALENDAR
`;

  return vcalendar;
}

export function getEvent(event: Event, timezone = "America/New_York") {
  const createdAt = moment().format("YYYYMMDDTHHmmss");
  const start = moment.tz(event.start, timezone).format("YYYYMMDDTHHmmss");
  const end = moment.tz(event.end, timezone).format("YYYYMMDDTHHmmss");

  // Generate UID
  let id = `${event.summary}::${event.description}::${event.start}`;
  if (event.end.getTime() !== event.start.getTime()) {id += `::${event.end}`;}

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

  if (event.location) {vevent += `\nLOCATION:${event.location}`;}
  if (event.geography) {
    vevent += `\nGEO:${event.geography.latitude};${event.geography.longitude}`;
  }
  if (event.url) {vevent += `\nURL:${event.url}`;}
  if (event.priority !== undefined) {vevent += `\nPRIORITY:${event.priority}`;}
  if (event.color) {vevent += `\nCOLOR:${event.color}`;}

  vevent += `\nSEQUENCE:0
LAST-MODIFIED:${createdAt}Z
CREATED:${createdAt}Z
END:VEVENT`;

  return vevent;
}

/**
 * Get timezone definition for ICS file
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
