import fs from "fs";

import _ from "lodash";
import moment from "moment-timezone";

import { getCalendar } from "../../calendar.utilities";
import { getAzimuthElevationFromEphemeris } from "../../ephemeris/ephemeris.service";
import { isMaximum, isMinimum } from "../../math.utilities";
import { getOutputPath } from "../../output.utilities";

import { isRise, isSet } from "./dailyCycle.utilities";

import type { Event } from "../../calendar.utilities";
import type { AzimuthElevationEphemeris } from "../../ephemeris/ephemeris.types";
import type { Moment } from "moment";

const categories = ["Astronomy", "Astrology", "Daily Lunar Cycle", "Lunar"];

export function getDailyLunarCycleEvents(args: {
  currentMinute: Moment;
  moonAzimuthElevationEphemeris: AzimuthElevationEphemeris;
}): Event[] {
  const { currentMinute, moonAzimuthElevationEphemeris } = args;

  const dailyLunarCycleEvents: Event[] = [];

  const previousMinute = currentMinute.clone().subtract(1, "minutes");
  const nextMinute = currentMinute.clone().add(1, "minutes");

  const currentElevation = getAzimuthElevationFromEphemeris(
    moonAzimuthElevationEphemeris,
    currentMinute.toISOString(),
    "elevation",
  );
  const previousElevation = getAzimuthElevationFromEphemeris(
    moonAzimuthElevationEphemeris,
    previousMinute.toISOString(),
    "elevation",
  );
  const nextElevation = getAzimuthElevationFromEphemeris(
    moonAzimuthElevationEphemeris,
    nextMinute.toISOString(),
    "elevation",
  );

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
  console.log(`${summary} at ${dateString}`);

  const moonriseEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return moonriseEvent;
}

export function getLunarZenithEvent(date: Date): Event {
  const description = "Lunar Zenith";
  const summary = `🌙 ⏫ ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const lunarZenithEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return lunarZenithEvent;
}

export function getMoonsetEvent(date: Date): Event {
  const description = "Moonset";
  const summary = `🌙 🔽 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const moonsetEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return moonsetEvent;
}

export function getLunarNadirEvent(date: Date): Event {
  const description = "Lunar Nadir";
  const summary = `🌙 ⏬ ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const lunarNadirEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return lunarNadirEvent;
}

export function writeDailyLunarCycleEvents(args: {
  dailyLunarCycleEvents: Event[];
  start: Date;
  end: Date;
}): void {
  const { dailyLunarCycleEvents, start, end } = args;
  if (_.isEmpty(dailyLunarCycleEvents)) {
    return;
  }
  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${dailyLunarCycleEvents.length} daily lunar cycle events from ${timespan}`;
  console.log(`🌙 Writing ${message}`);

  const ingressCalendar = getCalendar({
    events: dailyLunarCycleEvents,
    name: "Daily Lunar Cycle 🌙",
  });
  fs.writeFileSync(
    getOutputPath(`daily-lunar-cycle_${timespan}.ics`),
    new TextEncoder().encode(ingressCalendar),
  );

  console.log(`🌙 Wrote ${message}`);
}
