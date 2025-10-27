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
import { getOutputPath } from "../../output.utilities";

export function getDailyLunarCycleEvents(args: {
  currentMinute: Moment;
  moonAzimuthElevationEphemeris: AzimuthElevationEphemeris;
}) {
  const { currentMinute, moonAzimuthElevationEphemeris } = args;

  const dailyLunarCycleEvents: Event[] = [];

  const previousMinute = currentMinute.clone().subtract(1, "minutes");
  const nextMinute = currentMinute.clone().add(1, "minutes");

  const { elevation: currentElevation } =
    moonAzimuthElevationEphemeris[currentMinute.toISOString()];
  const { elevation: previousElevation } =
    moonAzimuthElevationEphemeris[previousMinute.toISOString()];
  const { elevation: nextElevation } =
    moonAzimuthElevationEphemeris[nextMinute.toISOString()];

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
    dailyLunarCycleEvents.push(getMoonriseEvent(date));
  }
  if (isMaximum({ ...elevations })) {
    dailyLunarCycleEvents.push(getLunarZenithEvent(date));
  }
  if (isSet({ ...elevations })) {
    dailyLunarCycleEvents.push(getMoonsetEvent(date));
  }
  if (isMinimum({ ...elevations })) {
    dailyLunarCycleEvents.push(getLunarNadirEvent(date));
  }

  return dailyLunarCycleEvents;
}

export function getMoonriseEvent(date: Date): Event {
  const description = "Moonrise";
  const summary = `🌙 🔼 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const moonriseEvent: Event = { start: date, summary, description };
  return moonriseEvent;
}

export function getLunarZenithEvent(date: Date): Event {
  const description = "Lunar Zenith";
  const summary = `🌙 ⏫ ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const lunarZenithEvent: Event = { start: date, summary, description };
  return lunarZenithEvent;
}

export function getMoonsetEvent(date: Date): Event {
  const description = "Moonset";
  const summary = `🌙 🔽 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const moonsetEvent: Event = { start: date, summary, description };
  return moonsetEvent;
}

export function getLunarNadirEvent(date: Date): Event {
  const description = "Lunar Nadir";
  const summary = `🌙 ⏬ ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const lunarNadirEvent: Event = { start: date, summary, description };
  return lunarNadirEvent;
}

export function writeDailyLunarCycleEvents(args: {
  dailyLunarCycleEvents: Event[];
  start: Date;
  end: Date;
}) {
  const { dailyLunarCycleEvents, start, end } = args;
  if (_.isEmpty(dailyLunarCycleEvents)) return;
  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${dailyLunarCycleEvents.length} daily lunar cycle events from ${timespan}`;
  print(`🌙 Writing ${message}`);

  upsertEvents(dailyLunarCycleEvents);

  const ingressCalendar = getCalendar(
    dailyLunarCycleEvents,
    "Daily Lunar Cycle 🌙"
  );
  fs.writeFileSync(
    getOutputPath(`daily-lunar-cycle_${timespan}.ics`),
    new TextEncoder().encode(ingressCalendar)
  );

  print(`🌙 Wrote ${message}`);
}
