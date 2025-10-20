import fs from "fs";
import _ from "lodash";
import moment from "moment-timezone";
import type { Moment } from "moment";
import type { Event } from "../../calendar.utilities";
import type { AzimuthElevationEphemeris } from "../../ephemeris/ephemeris.types";
import { getCalendar } from "../../calendar.utilities";
import { upsertEvents } from "../../database.utilities";
import { isRise, isSet } from "./dailyCycle.utilities";
import { isMaximum, isMinimum } from "../../math.utilities";
import { incrementEventsCount, print } from "../../logs/logs.service";

export function getDailySolarCycleEvents(args: {
  currentMinute: Moment;
  sunAzimuthElevationEphemeris: AzimuthElevationEphemeris;
}) {
  const { currentMinute, sunAzimuthElevationEphemeris } = args;

  const dailySolarCycleEvents: Event[] = [];

  const previousMinute = currentMinute.clone().subtract(1, "minutes");
  const nextMinute = currentMinute.clone().add(1, "minutes");

  const { elevation: currentElevation } =
    sunAzimuthElevationEphemeris[currentMinute.toISOString()];
  const { elevation: previousElevation } =
    sunAzimuthElevationEphemeris[previousMinute.toISOString()];
  const { elevation: nextElevation } =
    sunAzimuthElevationEphemeris[nextMinute.toISOString()];

  const elevations = {
    currentElevation,
    previousElevation,
    nextElevation,
    current: currentElevation,
    previous: previousElevation,
    next: nextElevation,
  };

  const date = currentMinute.toDate();

  if (isRise({ ...elevations })) {
    dailySolarCycleEvents.push(getSunriseEvent(date));
  }
  if (isMaximum({ ...elevations })) {
    dailySolarCycleEvents.push(getSolarZenithEvent(date));
  }
  if (isSet({ ...elevations })) {
    dailySolarCycleEvents.push(getSunsetEvent(date));
  }
  if (isMinimum({ ...elevations })) {
    dailySolarCycleEvents.push(getSolarNadirEvent(date));
  }

  return dailySolarCycleEvents;
}

export function getSunriseEvent(date: Date): Event {
  const description = "Sunrise";
  const summary = `☀️ 🔼 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const sunriseEvent: Event = { start: date, summary, description };
  return sunriseEvent;
}

export function getSolarZenithEvent(date: Date): Event {
  const description = "Solar Zenith";
  const summary = `☀️ ⏫ ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const solarZenithEvent: Event = { start: date, summary, description };
  return solarZenithEvent;
}

export function getSunsetEvent(date: Date): Event {
  const description = "Sunset";
  const summary = `☀️ 🔽 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const sunsetEvent: Event = { start: date, summary, description };
  return sunsetEvent;
}

export function getSolarNadirEvent(date: Date): Event {
  const description = "Solar Nadir";
  const summary = `☀️ ⏬ ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const solarNadirEvent: Event = { start: date, summary, description };
  return solarNadirEvent;
}

export function writeDailySolarCycleEvents(args: {
  dailySolarCycleEvents: Event[];
  start: Date;
  end: Date;
}) {
  const { dailySolarCycleEvents, start, end } = args;
  if (_.isEmpty(dailySolarCycleEvents)) return;

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${dailySolarCycleEvents.length} daily sun cycle events from ${timespan}`;
  print(`☀️ Writing ${message}`);

  upsertEvents(dailySolarCycleEvents);

  const ingressCalendar = getCalendar(
    dailySolarCycleEvents,
    "Daily Sun Cycle ☀️"
  );
  fs.writeFileSync(
    `./calendars/daily-solar-cycle_${timespan}.ics`,
    new TextEncoder().encode(ingressCalendar)
  );

  print(`☀️ Wrote ${message}`);
}
