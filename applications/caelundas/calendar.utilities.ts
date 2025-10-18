import moment from "npm:moment-timezone";

export interface Event {
  start: Date;
  end?: Date;
  summary: string;
  description: string;
}

export interface EventTemplate extends Omit<Event, "start" | "end"> {}

export function getCalendar(events: Event[], name = "Astronomy 🔭") {
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:${name}
${events.map(getEvent).join("\n")}
END:VCALENDAR
`;
}

export function getEvent(event: Event) {
  const createdAt = moment().format("YYYYMMDDTHHmmss");
  const start = moment(event.start).format("YYYYMMDDTHHmmss");
  const end = event.end && moment(event.end).format("YYYYMMDDTHHmmss");

  const { summary, description } = event;
  let id = `${summary}::${description}::${start}`;
  if (end) id += `::${end}`;

  return `BEGIN:VEVENT
UID:${id}
DTSTAMP:${createdAt}Z
DTSTART:${start}Z${end ? `\nDTEND:${end}Z` : ""}
SUMMARY:${summary}
DESCRIPTION:${description}
END:VEVENT`;
}

export const icsTimezoneEST = `BEGIN:VTIMEZONE
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
TZOFFSETFROM:-0400`;
