import moment from "moment-timezone";

import { pairDurationEvents } from "../../duration.utilities";
import {
  getCoordinateFromEphemeris,
  getDiameterFromEphemeris,
} from "../../ephemeris/ephemeris.service";

import { isLunarEclipse, isSolarEclipse } from "./eclipses.utilities";

import type { Event } from "../../calendar.utilities";
import type {
  CoordinateEphemeris,
  DiameterEphemeris,
} from "../../ephemeris/ephemeris.types";
import type { EclipsePhase } from "../../types";
import type { Moment } from "moment";

const categories = ["Astronomy", "Astrology", "Eclipse"];

/**
 * Detects solar and lunar eclipse events at a specific minute.
 *
 * Identifies eclipse phases (beginning, maximum, ending) by analyzing the alignment
 * of Sun, Earth, and Moon, accounting for angular diameters and ecliptic latitudes.
 * Solar eclipses occur at new moon (conjunction), lunar eclipses at full moon (opposition).
 *
 * @param args - Configuration object
 * @param currentMinute - The specific minute to analyze
 * @param moonCoordinateEphemeris - Moon position data
 * @param moonDiameterEphemeris - Moon apparent diameter data
 * @param sunCoordinateEphemeris - Sun position data
 * @param sunDiameterEphemeris - Sun apparent diameter data
 * @returns Array of detected eclipse events (0-1 events per minute)
 * @see {@link isSolarEclipse} for solar eclipse detection
 * @see {@link isLunarEclipse} for lunar eclipse detection
 *
 * @remarks
 * Eclipse types:
 * - Solar: Partial, total, or annular (depends on Moon's distance)
 * - Lunar: Penumbral, partial, or total (depends on Earth's shadow depth)
 */
export function getEclipseEvents(args: {
  currentMinute: Moment;
  moonCoordinateEphemeris: CoordinateEphemeris;
  moonDiameterEphemeris: DiameterEphemeris;
  sunCoordinateEphemeris: CoordinateEphemeris;
  sunDiameterEphemeris: DiameterEphemeris;
}): Event[] {
  const {
    currentMinute,
    moonCoordinateEphemeris,
    moonDiameterEphemeris,
    sunCoordinateEphemeris,
    sunDiameterEphemeris,
  } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const currentLongitudeMoon = getCoordinateFromEphemeris(
    moonCoordinateEphemeris,
    currentMinute.toISOString(),
    "longitude",
  );
  const currentLatitudeMoon = getCoordinateFromEphemeris(
    moonCoordinateEphemeris,
    currentMinute.toISOString(),
    "latitude",
  );
  const currentLongitudeSun = getCoordinateFromEphemeris(
    sunCoordinateEphemeris,
    currentMinute.toISOString(),
    "longitude",
  );
  const currentLatitudeSun = getCoordinateFromEphemeris(
    sunCoordinateEphemeris,
    currentMinute.toISOString(),
    "latitude",
  );

  const nextLongitudeMoon = getCoordinateFromEphemeris(
    moonCoordinateEphemeris,
    nextMinute.toISOString(),
    "longitude",
  );
  const nextLongitudeSun = getCoordinateFromEphemeris(
    sunCoordinateEphemeris,
    nextMinute.toISOString(),
    "longitude",
  );

  const previousLongitudeMoon = getCoordinateFromEphemeris(
    moonCoordinateEphemeris,
    previousMinute.toISOString(),
    "longitude",
  );
  const previousLongitudeSun = getCoordinateFromEphemeris(
    sunCoordinateEphemeris,
    previousMinute.toISOString(),
    "longitude",
  );

  const currentDiameterMoon = getDiameterFromEphemeris(
    moonDiameterEphemeris,
    currentMinute.toISOString(),
    "currentDiameterMoon",
  );
  const currentDiameterSun = getDiameterFromEphemeris(
    sunDiameterEphemeris,
    currentMinute.toISOString(),
    "currentDiameterSun",
  );

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

  const solarEclipsePhase = isSolarEclipse({ ...params });
  const lunarEclipsePhase = isLunarEclipse({ ...params });

  if (solarEclipsePhase) {
    return [
      getSolarEclipseEvent({
        date: currentMinute.toDate(),
        phase: solarEclipsePhase,
      }),
    ];
  }

  if (lunarEclipsePhase) {
    return [
      getLunarEclipseEvent({
        date: currentMinute.toDate(),
        phase: lunarEclipsePhase,
      }),
    ];
  }

  return [];
}

/**
 * Creates a solar eclipse calendar event.
 *
 * Solar eclipses occur when the Moon passes between Earth and Sun,
 * casting a shadow on Earth's surface.
 *
 * @param args - Configuration object
 * @param date - Precise UTC time of eclipse phase
 * @param phase - Eclipse phase: beginning, maximum, or ending
 * @returns Calendar event for solar eclipse phase
 * @see {@link isSolarEclipse} for detection algorithm
 */
export function getSolarEclipseEvent(args: {
  date: Date;
  phase: EclipsePhase;
  // type: "partial" | "total" | "annular";
}): Event {
  const { date, phase } = args;

  let description: string;
  let summary: string;

  if (phase === "maximum") {
    description = `Solar Eclipse maximum`;
    summary = `☀️🐉🎯 ${description}`;
  } else if (phase === "beginning") {
    description = `Solar Eclipse begins`;
    summary = `☀️🐉▶️ ${description}`;
  } else {
    description = `Solar Eclipse ends`;
    summary = `☀️🐉◀️ ${description}`;
  }

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const solarEclipseEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories: [...categories, "Solar"],
  };
  return solarEclipseEvent;
}

/**
 * Creates a lunar eclipse calendar event.
 *
 * Lunar eclipses occur when Earth passes between Sun and Moon,
 * casting Earth's shadow on the Moon.
 *
 * @param args - Configuration object
 * @param date - Precise UTC time of eclipse phase
 * @param phase - Eclipse phase: beginning, maximum, or ending
 * @returns Calendar event for lunar eclipse phase
 * @see {@link isLunarEclipse} for detection algorithm
 */
export function getLunarEclipseEvent(args: {
  date: Date;
  phase: EclipsePhase;
  // type: "partial" | "total" | "penumbral";
}): Event {
  const { date, phase } = args;

  let description: string;
  let summary: string;

  if (phase === "maximum") {
    description = `Lunar Eclipse maximum`;
    summary = `🌙🐉🎯 ${description}`;
  } else if (phase === "beginning") {
    description = `Lunar Eclipse begins`;
    summary = `🌙🐉▶️ ${description}`;
  } else {
    description = `Lunar Eclipse ends`;
    summary = `🌙🐉◀️ ${description}`;
  }

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const lunarEclipseEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories: [...categories, "Lunar"],
  };
  return lunarEclipseEvent;
}

/**
 *
 */
export function getEclipseDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  const eclipseEvents = events.filter((event) =>
    event.categories.includes("Eclipse"),
  );

  // Process solar eclipses
  const solarEvents = eclipseEvents.filter((event) =>
    event.categories.includes("Solar"),
  );
  const solarBeginnings = solarEvents.filter((event) =>
    event.description.includes("begins"),
  );
  const solarEndings = solarEvents.filter((event) =>
    event.description.includes("ends"),
  );

  const solarPairs = pairDurationEvents(
    solarBeginnings,
    solarEndings,
    "solar eclipse",
  );

  durationEvents.push(
    ...solarPairs.map(([beginning, ending]) =>
      getSolarEclipseDurationEvent(beginning, ending),
    ),
  );

  // Process lunar eclipses
  const lunarEvents = eclipseEvents.filter((event) =>
    event.categories.includes("Lunar"),
  );
  const lunarBeginnings = lunarEvents.filter((event) =>
    event.description.includes("begins"),
  );
  const lunarEndings = lunarEvents.filter((event) =>
    event.description.includes("ends"),
  );

  const lunarPairs = pairDurationEvents(
    lunarBeginnings,
    lunarEndings,
    "lunar eclipse",
  );

  durationEvents.push(
    ...lunarPairs.map(([beginning, ending]) =>
      getLunarEclipseDurationEvent(beginning, ending),
    ),
  );

  return durationEvents;
}

function getSolarEclipseDurationEvent(beginning: Event, ending: Event): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "☀️🐉 Solar Eclipse",
    description: "Solar Eclipse",
    categories: [...categories, "Solar"],
  };
}

function getLunarEclipseDurationEvent(beginning: Event, ending: Event): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "🌙🐉 Lunar Eclipse",
    description: "Lunar Eclipse",
    categories: [...categories, "Lunar"],
  };
}
