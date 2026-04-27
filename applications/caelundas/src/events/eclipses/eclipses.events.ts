import {
    getAzimuthElevationFromEphemeris,
    getCoordinateFromEphemeris,
    getDiameterFromEphemeris,
} from "../../ephemeris/ephemeris.service";
import { pairProgressiveEvents } from "../../progressive.utilities";

import {
    isLunarEclipse,
    isLunarEclipseActive,
    isSolarEclipse,
    isSolarEclipseActive,
} from "./eclipses.utilities";

import type { Event } from "../../calendar.utilities";
import type {
    AzimuthElevationEphemeris,
    CoordinateEphemeris,
    DiameterEphemeris,
} from "../../ephemeris/ephemeris.types";
import type { EclipsePhase } from "../../types";
import type { Moment } from "moment-timezone";

const categories = ["Astronomy", "Astrology", "Eclipse"];
type EclipseFrame = "geocentric" | "topocentric";

function formatTimeZoneIso(date: Moment, timezone: string): string {
  return date.clone().tz(timezone).toISOString(true);
}

/**
 * Detects solar and lunar eclipse events at a specific minute.
 *
 * Identifies eclipse phases (beginning, maximum, ending) by analyzing the alignment
 * of Sun, Earth, and Moon, accounting for angular diameters and ecliptic latitudes.
 * Solar eclipses occur at new moon (conjunction), lunar eclipses at full moon (opposition).
 *
 * @param args - Configuration object
 * @param minute - The specific minute to analyze
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
  minute: Moment;
  moonAzimuthElevationEphemeris?: AzimuthElevationEphemeris;
  moonCoordinateEphemeris: CoordinateEphemeris;
  moonDiameterEphemeris: DiameterEphemeris;
  sunAzimuthElevationEphemeris?: AzimuthElevationEphemeris;
  sunCoordinateEphemeris: CoordinateEphemeris;
  sunDiameterEphemeris: DiameterEphemeris;
}): Event[] {
  const {
    minute,
    moonAzimuthElevationEphemeris,
    moonCoordinateEphemeris,
    moonDiameterEphemeris,
    sunAzimuthElevationEphemeris,
    sunCoordinateEphemeris,
    sunDiameterEphemeris,
  } = args;

  const previousMinute = minute.clone().subtract(1, "minute");
  const nextMinute = minute.clone().add(1, "minute");

  const currentLongitudeMoon = getCoordinateFromEphemeris(
    moonCoordinateEphemeris,
    minute.toISOString(),
    "longitude",
  );
  const currentLatitudeMoon = getCoordinateFromEphemeris(
    moonCoordinateEphemeris,
    minute.toISOString(),
    "latitude",
  );
  const currentLongitudeSun = getCoordinateFromEphemeris(
    sunCoordinateEphemeris,
    minute.toISOString(),
    "longitude",
  );
  const currentLatitudeSun = getCoordinateFromEphemeris(
    sunCoordinateEphemeris,
    minute.toISOString(),
    "latitude",
  );

  const nextLongitudeMoon = getCoordinateFromEphemeris(
    moonCoordinateEphemeris,
    nextMinute.toISOString(),
    "longitude",
  );
  const nextLatitudeMoon = getCoordinateFromEphemeris(
    moonCoordinateEphemeris,
    nextMinute.toISOString(),
    "latitude",
  );
  const nextLongitudeSun = getCoordinateFromEphemeris(
    sunCoordinateEphemeris,
    nextMinute.toISOString(),
    "longitude",
  );
  const nextLatitudeSun = getCoordinateFromEphemeris(
    sunCoordinateEphemeris,
    nextMinute.toISOString(),
    "latitude",
  );

  const previousLongitudeMoon = getCoordinateFromEphemeris(
    moonCoordinateEphemeris,
    previousMinute.toISOString(),
    "longitude",
  );
  const previousLatitudeMoon = getCoordinateFromEphemeris(
    moonCoordinateEphemeris,
    previousMinute.toISOString(),
    "latitude",
  );
  const previousLongitudeSun = getCoordinateFromEphemeris(
    sunCoordinateEphemeris,
    previousMinute.toISOString(),
    "longitude",
  );
  const previousLatitudeSun = getCoordinateFromEphemeris(
    sunCoordinateEphemeris,
    previousMinute.toISOString(),
    "latitude",
  );

  const currentDiameterMoon = getDiameterFromEphemeris(
    moonDiameterEphemeris,
    minute.toISOString(),
    "currentDiameterMoon",
  );
  const currentDiameterSun = getDiameterFromEphemeris(
    sunDiameterEphemeris,
    minute.toISOString(),
    "currentDiameterSun",
  );
  const nextDiameterMoon = getDiameterFromEphemeris(
    moonDiameterEphemeris,
    nextMinute.toISOString(),
    "nextDiameterMoon",
  );
  const nextDiameterSun = getDiameterFromEphemeris(
    sunDiameterEphemeris,
    nextMinute.toISOString(),
    "nextDiameterSun",
  );
  const previousDiameterMoon = getDiameterFromEphemeris(
    moonDiameterEphemeris,
    previousMinute.toISOString(),
    "previousDiameterMoon",
  );
  const previousDiameterSun = getDiameterFromEphemeris(
    sunDiameterEphemeris,
    previousMinute.toISOString(),
    "previousDiameterSun",
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

  const eclipseEvents: Event[] = [];

  if (solarEclipsePhase) {
    eclipseEvents.push(
      buildSolarEclipseEvent({
        date: minute,
        frame: "geocentric",
        phase: solarEclipsePhase,
      }),
    );
  }

  if (lunarEclipsePhase) {
    eclipseEvents.push(
      buildLunarEclipseEvent({
        date: minute,
        frame: "geocentric",
        phase: lunarEclipsePhase,
      }),
    );
  }

  const hasTopocentricEphemeris =
    moonAzimuthElevationEphemeris !== undefined &&
    sunAzimuthElevationEphemeris !== undefined;

  if (hasTopocentricEphemeris) {
    const currentMoonElevation = getAzimuthElevationFromEphemeris(
      moonAzimuthElevationEphemeris,
      minute.toISOString(),
      "elevation",
    );
    const previousMoonElevation = getAzimuthElevationFromEphemeris(
      moonAzimuthElevationEphemeris,
      previousMinute.toISOString(),
      "elevation",
    );
    const nextMoonElevation = getAzimuthElevationFromEphemeris(
      moonAzimuthElevationEphemeris,
      nextMinute.toISOString(),
      "elevation",
    );

    const currentSunElevation = getAzimuthElevationFromEphemeris(
      sunAzimuthElevationEphemeris,
      minute.toISOString(),
      "elevation",
    );
    const previousSunElevation = getAzimuthElevationFromEphemeris(
      sunAzimuthElevationEphemeris,
      previousMinute.toISOString(),
      "elevation",
    );
    const nextSunElevation = getAzimuthElevationFromEphemeris(
      sunAzimuthElevationEphemeris,
      nextMinute.toISOString(),
      "elevation",
    );

    const currentSolarGeocentricActive = isSolarEclipseActive({
      currentDiameterMoon,
      currentDiameterSun,
      currentLatitudeMoon,
      currentLatitudeSun,
      currentLongitudeMoon,
      currentLongitudeSun,
    });
    const previousSolarGeocentricActive = isSolarEclipseActive({
      currentDiameterMoon: previousDiameterMoon,
      currentDiameterSun: previousDiameterSun,
      currentLatitudeMoon: previousLatitudeMoon,
      currentLatitudeSun: previousLatitudeSun,
      currentLongitudeMoon: previousLongitudeMoon,
      currentLongitudeSun: previousLongitudeSun,
    });
    const nextSolarGeocentricActive = isSolarEclipseActive({
      currentDiameterMoon: nextDiameterMoon,
      currentDiameterSun: nextDiameterSun,
      currentLatitudeMoon: nextLatitudeMoon,
      currentLatitudeSun: nextLatitudeSun,
      currentLongitudeMoon: nextLongitudeMoon,
      currentLongitudeSun: nextLongitudeSun,
    });

    const isCurrentSolarVisible =
      currentSunElevation > 0 && currentMoonElevation > 0;
    const isPreviousSolarVisible =
      previousSunElevation > 0 && previousMoonElevation > 0;
    const isNextSolarVisible = nextSunElevation > 0 && nextMoonElevation > 0;

    const currentSolarTopocentricActive =
      currentSolarGeocentricActive && isCurrentSolarVisible;
    const previousSolarTopocentricActive =
      previousSolarGeocentricActive && isPreviousSolarVisible;
    const nextSolarTopocentricActive =
      nextSolarGeocentricActive && isNextSolarVisible;

    const solarTopocentricPhase = getTopocentricPhase({
      currentActive: currentSolarTopocentricActive,
      geocentricPhase: solarEclipsePhase,
      nextActive: nextSolarTopocentricActive,
      previousActive: previousSolarTopocentricActive,
    });

    if (solarTopocentricPhase) {
      eclipseEvents.push(
        buildSolarEclipseEvent({
          date: minute,
          frame: "topocentric",
          phase: solarTopocentricPhase,
        }),
      );
    }

    const currentLunarGeocentricActive = isLunarEclipseActive({
      currentDiameterMoon,
      currentDiameterSun,
      currentLatitudeMoon,
      currentLatitudeSun,
      currentLongitudeMoon,
      currentLongitudeSun,
    });
    const previousLunarGeocentricActive = isLunarEclipseActive({
      currentDiameterMoon: previousDiameterMoon,
      currentDiameterSun: previousDiameterSun,
      currentLatitudeMoon: previousLatitudeMoon,
      currentLatitudeSun: previousLatitudeSun,
      currentLongitudeMoon: previousLongitudeMoon,
      currentLongitudeSun: previousLongitudeSun,
    });
    const nextLunarGeocentricActive = isLunarEclipseActive({
      currentDiameterMoon: nextDiameterMoon,
      currentDiameterSun: nextDiameterSun,
      currentLatitudeMoon: nextLatitudeMoon,
      currentLatitudeSun: nextLatitudeSun,
      currentLongitudeMoon: nextLongitudeMoon,
      currentLongitudeSun: nextLongitudeSun,
    });

    const isCurrentLunarVisible = currentMoonElevation > 0;
    const isPreviousLunarVisible = previousMoonElevation > 0;
    const isNextLunarVisible = nextMoonElevation > 0;

    const currentLunarTopocentricActive =
      currentLunarGeocentricActive && isCurrentLunarVisible;
    const previousLunarTopocentricActive =
      previousLunarGeocentricActive && isPreviousLunarVisible;
    const nextLunarTopocentricActive =
      nextLunarGeocentricActive && isNextLunarVisible;

    const lunarTopocentricPhase = getTopocentricPhase({
      currentActive: currentLunarTopocentricActive,
      geocentricPhase: lunarEclipsePhase,
      nextActive: nextLunarTopocentricActive,
      previousActive: previousLunarTopocentricActive,
    });

    if (lunarTopocentricPhase) {
      eclipseEvents.push(
        buildLunarEclipseEvent({
          date: minute,
          frame: "topocentric",
          phase: lunarTopocentricPhase,
        }),
      );
    }
  }

  return eclipseEvents;
}

function getTopocentricPhase(args: {
  currentActive: boolean;
  geocentricPhase: EclipsePhase | null;
  nextActive: boolean;
  previousActive: boolean;
}): EclipsePhase | null {
  const { currentActive, geocentricPhase, nextActive, previousActive } = args;

  if (!currentActive) {
    return null;
  }
  if (!previousActive) {
    return "beginning";
  }
  if (!nextActive) {
    return "ending";
  }
  if (geocentricPhase === "maximum") {
    return "maximum";
  }

  return null;
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
export function buildSolarEclipseEvent(args: {
  date: Moment;
  frame: EclipseFrame;
  phase: EclipsePhase;
  // type: "partial" | "total" | "annular";
}): Event {
  const { date, frame, phase } = args;

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

  const frameLabel =
    frame === "geocentric" ? "Geocentric" : "Topocentric Visibility";
  const frameSymbol = frame === "geocentric" ? "🌐" : "📍";
  const framedDescription = `${description} (${frameLabel})`;
  const framedSummary = `${frameSymbol} ${summary}`;

  const dateString = formatTimeZoneIso(date, "America/New_York");
  console.log(`${framedSummary} at ${dateString}`);

  const solarEclipseEvent: Event = {
    start: date,
    end: date,
    summary: framedSummary,
    description: framedDescription,
    categories: [...categories, "Solar", frameLabel],
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
export function buildLunarEclipseEvent(args: {
  date: Moment;
  frame: EclipseFrame;
  phase: EclipsePhase;
  // type: "partial" | "total" | "penumbral";
}): Event {
  const { date, frame, phase } = args;

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

  const frameLabel =
    frame === "geocentric" ? "Geocentric" : "Topocentric Visibility";
  const frameSymbol = frame === "geocentric" ? "🌐" : "📍";
  const framedDescription = `${description} (${frameLabel})`;
  const framedSummary = `${frameSymbol} ${summary}`;

  const dateString = formatTimeZoneIso(date, "America/New_York");
  console.log(`${framedSummary} at ${dateString}`);

  const lunarEclipseEvent: Event = {
    start: date,
    end: date,
    summary: framedSummary,
    description: framedDescription,
    categories: [...categories, "Lunar", frameLabel],
  };
  return lunarEclipseEvent;
}

/**
 *
 */
export function getEclipseProgressiveEvents(events: Event[]): Event[] {
  const progressiveEvents: Event[] = [];

  const eclipseEvents = events.filter((event) =>
    event.categories.includes("Eclipse"),
  );

  const frames = ["Geocentric", "Topocentric Visibility"] as const;

  for (const frameLabel of frames) {
    // Process solar eclipses
    const solarEvents = eclipseEvents.filter(
      (event) =>
        event.categories.includes("Solar") &&
        event.categories.includes(frameLabel),
    );
    const solarBeginnings = solarEvents.filter((event) =>
      event.description.includes("begins"),
    );
    const solarEndings = solarEvents.filter((event) =>
      event.description.includes("ends"),
    );

    const solarPairs = pairProgressiveEvents(
      solarBeginnings,
      solarEndings,
      `solar eclipse (${frameLabel.toLowerCase()})`,
    );

    progressiveEvents.push(
      ...solarPairs.map(([beginning, ending]) =>
        getSolarEclipseDurationEvent(beginning, ending, frameLabel),
      ),
    );

    // Process lunar eclipses
    const lunarEvents = eclipseEvents.filter(
      (event) =>
        event.categories.includes("Lunar") &&
        event.categories.includes(frameLabel),
    );
    const lunarBeginnings = lunarEvents.filter((event) =>
      event.description.includes("begins"),
    );
    const lunarEndings = lunarEvents.filter((event) =>
      event.description.includes("ends"),
    );

    const lunarPairs = pairProgressiveEvents(
      lunarBeginnings,
      lunarEndings,
      `lunar eclipse (${frameLabel.toLowerCase()})`,
    );

    progressiveEvents.push(
      ...lunarPairs.map(([beginning, ending]) =>
        getLunarEclipseDurationEvent(beginning, ending, frameLabel),
      ),
    );
  }

  return progressiveEvents;
}

function getSolarEclipseDurationEvent(
  beginning: Event,
  ending: Event,
  frameLabel: "Geocentric" | "Topocentric Visibility",
): Event {
  const frameSymbol = frameLabel === "Geocentric" ? "🌐" : "📍";
  return {
    start: beginning.start,
    end: ending.start,
    summary: `${frameSymbol} ☀️🐉 Solar Eclipse (${frameLabel})`,
    description: `Solar Eclipse (${frameLabel})`,
    categories: [...categories, "Solar", frameLabel],
  };
}

function getLunarEclipseDurationEvent(
  beginning: Event,
  ending: Event,
  frameLabel: "Geocentric" | "Topocentric Visibility",
): Event {
  const frameSymbol = frameLabel === "Geocentric" ? "🌐" : "📍";
  return {
    start: beginning.start,
    end: ending.start,
    summary: `${frameSymbol} 🌙🐉 Lunar Eclipse (${frameLabel})`,
    description: `Lunar Eclipse (${frameLabel})`,
    categories: [...categories, "Lunar", frameLabel],
  };
}
