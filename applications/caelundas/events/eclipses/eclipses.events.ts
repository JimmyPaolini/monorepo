import moment from "npm:moment-timezone";
import type { Moment } from "npm:moment";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types.ts";
import type { DiameterEphemeris } from "../../ephemeris/ephemeris.types.ts";
import type { Event } from "../../calendar.utilities.ts";
import { isSolarEclipse, isLunarEclipse } from "./eclipses.utilities.ts";
import { incrementEventsCount, print } from "../../logs/logs.service.tsx";

export function getEclipseEvents(args: {
  currentMinute: Moment;
  moonCoordinateEphemeris: CoordinateEphemeris;
  moonDiameterEphemeris: DiameterEphemeris;
  sunCoordinateEphemeris: CoordinateEphemeris;
  sunDiameterEphemeris: DiameterEphemeris;
}) {
  const {
    currentMinute,
    moonCoordinateEphemeris,
    moonDiameterEphemeris,
    sunCoordinateEphemeris,
    sunDiameterEphemeris,
  } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const monthlyLunarCycleEvents: Event[] = [];

  const { longitude: currentLongitudeMoon, latitude: currentLatitudeMoon } =
    moonCoordinateEphemeris[currentMinute.toISOString()];
  const { longitude: currentLongitudeSun, latitude: currentLatitudeSun } =
    sunCoordinateEphemeris[currentMinute.toISOString()];

  const { longitude: nextLongitudeMoon } =
    moonCoordinateEphemeris[nextMinute.toISOString()];
  const { longitude: nextLongitudeSun } =
    sunCoordinateEphemeris[nextMinute.toISOString()];

  const { longitude: previousLongitudeMoon } =
    moonCoordinateEphemeris[previousMinute.toISOString()];
  const { longitude: previousLongitudeSun } =
    sunCoordinateEphemeris[previousMinute.toISOString()];

  const { diameter: currentDiameterMoon } =
    moonDiameterEphemeris[currentMinute.toISOString()];
  const { diameter: currentDiameterSun } =
    sunDiameterEphemeris[currentMinute.toISOString()];

  const params = {
    currentDiameterMoon,
    currentDiameterSun,
    currentLatitudeMoon,
    currentLatitudeSun,
    currentLongitudeMoon,
    currentLongitudeSun,
    nextLongitudeMoon,
    nextLongitudeSun,
    previousLongitudeMoon,
    previousLongitudeSun,
  };

  if (isSolarEclipse({ ...params })) {
    monthlyLunarCycleEvents.push(
      getSolarEclipseEvent({ date: currentMinute.toDate() })
    );
  }
  if (isLunarEclipse({ ...params })) {
    monthlyLunarCycleEvents.push(
      getLunarEclipseEvent({ date: currentMinute.toDate() })
    );
  }

  return monthlyLunarCycleEvents;
}

export function getSolarEclipseEvent(args: {
  date: Date;
  // type: "partial" | "total" | "annular";
}) {
  const { date } = args;

  const description = `Solar Eclipse`;
  const summary = `☀️🐉 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const solarEclipseEvent = { start: date, summary, description };
  return solarEclipseEvent;
}

export function getLunarEclipseEvent(args: {
  date: Date;
  // type: "partial" | "total" | "penumbral";
}) {
  const { date } = args;

  const description = `Lunar Eclipse`;
  const summary = `🌙🐉 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const lunarEclipseEvent = { start: date, summary, description };
  return lunarEclipseEvent;
}
