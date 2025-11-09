import moment from "moment-timezone";
import type { Moment } from "moment";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type { DiameterEphemeris } from "../../ephemeris/ephemeris.types";
import type { Event } from "../../calendar.utilities";
import {
  isSolarEclipse,
  isLunarEclipse,
  EclipsePhase,
} from "./eclipses.utilities";
import { pairDurationEvents } from "../../duration.utilities";

const categories = ["Astronomy", "Astrology", "Eclipse"];

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

export function getSolarEclipseEvent(args: {
  date: Date;
  phase: EclipsePhase;
  // type: "partial" | "total" | "annular";
}) {
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
    summary,
    description,
    categories: categories.concat(["Solar"]),
  };
  return solarEclipseEvent;
}

export function getLunarEclipseEvent(args: {
  date: Date;
  phase: EclipsePhase;
  // type: "partial" | "total" | "penumbral";
}) {
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
    summary,
    description,
    categories: categories.concat(["Lunar"]),
  };
  return lunarEclipseEvent;
}

export function getEclipseDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  const eclipseEvents = events.filter((event) =>
    event.categories?.includes("Eclipse")
  );

  // Process solar eclipses
  const solarEvents = eclipseEvents.filter((event) =>
    event.categories?.includes("Solar")
  );
  const solarBeginnings = solarEvents.filter((event) =>
    event.description.includes("begins")
  );
  const solarEndings = solarEvents.filter((event) =>
    event.description.includes("ends")
  );

  const solarPairs = pairDurationEvents(
    solarBeginnings,
    solarEndings,
    "solar eclipse"
  );

  durationEvents.push(
    ...solarPairs.map(([beginning, ending]) =>
      getSolarEclipseDurationEvent(beginning, ending)
    )
  );

  // Process lunar eclipses
  const lunarEvents = eclipseEvents.filter((event) =>
    event.categories?.includes("Lunar")
  );
  const lunarBeginnings = lunarEvents.filter((event) =>
    event.description.includes("begins")
  );
  const lunarEndings = lunarEvents.filter((event) =>
    event.description.includes("ends")
  );

  const lunarPairs = pairDurationEvents(
    lunarBeginnings,
    lunarEndings,
    "lunar eclipse"
  );

  durationEvents.push(
    ...lunarPairs.map(([beginning, ending]) =>
      getLunarEclipseDurationEvent(beginning, ending)
    )
  );

  return durationEvents;
}

function getSolarEclipseDurationEvent(beginning: Event, ending: Event): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "☀️🐉 Solar Eclipse",
    description: "Solar Eclipse",
    categories: categories.concat(["Solar"]),
  };
}

function getLunarEclipseDurationEvent(beginning: Event, ending: Event): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "🌙🐉 Lunar Eclipse",
    description: "Lunar Eclipse",
    categories: categories.concat(["Lunar"]),
  };
}
