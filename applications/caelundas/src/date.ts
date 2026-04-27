import { MARGIN_MINUTES } from "./calendar.utilities";
import { generateDays } from "./date.utilities";
import { getEphemerides } from "./ephemeris/ephemeris.aggregates";
import { resetAspectBodiesStore } from "./events/aspects/aspects.store";
import { detectPerfectiveEventsByMinute } from "./minute";

import type { Event } from "./calendar.utilities";
import type { Coordinates } from "./ephemeris/ephemeris.types";
import type { AspectBodies } from "./events/aspects/aspects.store";
import type { Moment } from "moment-timezone";

/**
 * Detects all perfective astronomical events across a date range using a two-level loop.
 *
 * The outer loop iterates day by day in the observer's timezone, fetching ephemeris
 * data scoped to that day (with a margin on both ends). The inner minute loop processes
 * each minute within the day, carrying active-aspect state across day boundaries so
 * multi-day aspect windows are detected correctly.
 *
 * @param args.end - Last minute of the range to process (inclusive)
 * @param args.latitude - Observer latitude in degrees
 * @param args.longitude - Observer longitude in degrees
 * @param args.start - First minute of the range to process (inclusive)
 * @param args.timezone - IANA timezone identifier for the observer
 * @returns All detected events in chronological order
 */
export function detectPerfectiveEventsByDate(args: {
  end: Moment;
  latitude: number;
  longitude: number;
  start: Moment;
  timezone: string;
}): Event[] {
  const { end, latitude, longitude, start, timezone } = args;
  const coordinates: Coordinates = [longitude, latitude];

  resetAspectBodiesStore();
  let previousAspectBodies: AspectBodies[] = [];
  const allEvents: Event[] = [];

  for (const day of generateDays(start, end, timezone)) {
    const dayStart = day.clone().startOf("day");
    const dayEnd = day.clone().endOf("day");

    const minuteStart = start.isAfter(dayStart) ? start.clone() : dayStart;
    const minuteEnd = end.isBefore(dayEnd) ? end.clone() : dayEnd;

    const ephemerides = getEphemerides({
      coordinates,
      end: minuteEnd.clone().add(MARGIN_MINUTES, "minutes"),
      start: minuteStart.clone().subtract(MARGIN_MINUTES, "minutes"),
      timezone,
    });

    const { events, finalAspectBodies } = detectPerfectiveEventsByMinute({
      ephemerides,
      end: minuteEnd,
      previousAspectBodies,
      start: minuteStart,
    });

    previousAspectBodies = finalAspectBodies;
    allEvents.push(...events);
  }

  return allEvents;
}
