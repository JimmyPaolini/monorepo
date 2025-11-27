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

const categories = ["Astronomy", "Astrology", "Daily Solar Cycle", "Solar"];

export function getDailySolarCycleEvents(args: {
  currentMinute: Moment;
  sunAzimuthElevationEphemeris: AzimuthElevationEphemeris;
}): Event[] {
  const { currentMinute, sunAzimuthElevationEphemeris } = args;

  const dailySolarCycleEvents: Event[] = [];

  const previousMinute = currentMinute.clone().subtract(1, "minutes");
  const nextMinute = currentMinute.clone().add(1, "minutes");

  const currentElevation = getAzimuthElevationFromEphemeris(
    sunAzimuthElevationEphemeris,
    currentMinute.toISOString(),
    "elevation"
  );
  const previousElevation = getAzimuthElevationFromEphemeris(
    sunAzimuthElevationEphemeris,
    previousMinute.toISOString(),
    "elevation"
  );
  const nextElevation = getAzimuthElevationFromEphemeris(
    sunAzimuthElevationEphemeris,
    nextMinute.toISOString(),
    "elevation"
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
  console.log(`${summary} at ${dateString}`);

  const sunriseEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return sunriseEvent;
}

export function getSolarZenithEvent(date: Date): Event {
  const description = "Solar Zenith";
  const summary = `☀️ ⏫ ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const solarZenithEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return solarZenithEvent;
}

export function getSunsetEvent(date: Date): Event {
  const description = "Sunset";
  const summary = `☀️ 🔽 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const sunsetEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return sunsetEvent;
}

export function getSolarNadirEvent(date: Date): Event {
  const description = "Solar Nadir";
  const summary = `☀️ ⏬ ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const solarNadirEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return solarNadirEvent;
}

export function writeDailySolarCycleEvents(args: {
  dailySolarCycleEvents: Event[];
  start: Date;
  end: Date;
}): void {
  const { dailySolarCycleEvents, start, end } = args;
  if (_.isEmpty(dailySolarCycleEvents)) {
    return;
  }

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${dailySolarCycleEvents.length} daily sun cycle events from ${timespan}`;
  console.log(`☀️ Writing ${message}`);

  const ingressCalendar = getCalendar({
    events: dailySolarCycleEvents,
    name: "Daily Solar Cycle ☀️",
  });
  fs.writeFileSync(
    getOutputPath(`daily-solar-cycle_${timespan}.ics`),
    new TextEncoder().encode(ingressCalendar)
  );

  console.log(`☀️ Wrote ${message}`);
}
