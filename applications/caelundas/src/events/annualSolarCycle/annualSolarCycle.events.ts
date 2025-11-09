import fs from "fs";
import _ from "lodash";
import moment from "moment-timezone";
import type { Moment } from "moment";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type { DistanceEphemeris } from "../../ephemeris/ephemeris.types";
import { type Event, getCalendar } from "../../calendar.utilities";
import { upsertEvents } from "../../database.utilities";
import { pairDurationEvents } from "../../duration.utilities";
import {
  isAutumnalEquinox,
  isBeltane,
  isEleventhHexadecan,
  isFifteenthHexadecan,
  isFifthHexadecan,
  isFirstHexadecan,
  isImbolc,
  isLammas,
  isNinthHexadecan,
  isSamhain,
  isSeventhHexadecan,
  isSummerSolstice,
  isThirdHexadecan,
  isThirteenthHexadecan,
  isVernalEquinox,
  isWinterSolstice,
} from "./annualSolarCycle.utilities";
import { isMaximum, isMinimum } from "../../math.utilities";
import { getOutputPath } from "../../output.utilities";

const categories = ["Astronomy", "Astrology", "Annual Solar Cycle", "Solar"];

// #region 📏 Annual Solar Cycle

export function getAnnualSolarCycleEvents(args: {
  sunCoordinateEphemeris: CoordinateEphemeris;
  currentMinute: Moment;
}): Event[] {
  const { sunCoordinateEphemeris: ephemeris, currentMinute } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");

  const annualSolarCycleEvents: Event[] = [];

  const { longitude: currentLongitude } =
    ephemeris[currentMinute.toISOString()];
  const { longitude: previousLongitude } =
    ephemeris[previousMinute.toISOString()];

  const longitudes = { currentLongitude, previousLongitude };
  const date = currentMinute.toDate();

  if (isVernalEquinox({ ...longitudes })) {
    annualSolarCycleEvents.push(getVernalEquinoxEvent(date));
  }
  if (isFirstHexadecan({ ...longitudes })) {
    annualSolarCycleEvents.push(getFirstHexadecanEvent(date));
  }
  if (isBeltane({ ...longitudes })) {
    annualSolarCycleEvents.push(getBeltaneEvent(date));
  }
  if (isThirdHexadecan({ ...longitudes })) {
    annualSolarCycleEvents.push(getThirdHexadecanEvent(date));
  }
  if (isSummerSolstice({ ...longitudes })) {
    annualSolarCycleEvents.push(getSummerSolsticeEvent(date));
  }
  if (isFifthHexadecan({ ...longitudes })) {
    annualSolarCycleEvents.push(getFifthHexadecanEvent(date));
  }
  if (isLammas({ ...longitudes })) {
    annualSolarCycleEvents.push(getLammasEvent(date));
  }
  if (isSeventhHexadecan({ ...longitudes })) {
    annualSolarCycleEvents.push(getSeventhHexadecanEvent(date));
  }
  if (isAutumnalEquinox({ ...longitudes })) {
    annualSolarCycleEvents.push(getAutumnalEquinoxEvent(date));
  }
  if (isNinthHexadecan({ ...longitudes })) {
    annualSolarCycleEvents.push(getNinthHexadecanEvent(date));
  }
  if (isSamhain({ ...longitudes })) {
    annualSolarCycleEvents.push(getSamhainEvent(date));
  }
  if (isEleventhHexadecan({ ...longitudes })) {
    annualSolarCycleEvents.push(getEleventhHexadecanEvent(date));
  }
  if (isWinterSolstice({ ...longitudes })) {
    annualSolarCycleEvents.push(getWinterSolsticeEvent(date));
  }
  if (isThirteenthHexadecan({ ...longitudes })) {
    annualSolarCycleEvents.push(getThirteenthHexadecanEvent(date));
  }
  if (isImbolc({ ...longitudes })) {
    annualSolarCycleEvents.push(getImbolcEvent(date));
  }
  if (isFifteenthHexadecan({ ...longitudes })) {
    annualSolarCycleEvents.push(getFifteenthHexadecanEvent(date));
  }

  return annualSolarCycleEvents;
}

// #region 🌞 Solar Apsis

export function getSolarApsisEvents(args: {
  currentMinute: Moment;
  sunDistanceEphemeris: DistanceEphemeris;
}) {
  const { currentMinute, sunDistanceEphemeris } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const solarApsisEvents: Event[] = [];

  const { distance: currentDistance } =
    sunDistanceEphemeris[currentMinute.toISOString()];
  const { distance: previousDistance } =
    sunDistanceEphemeris[previousMinute.toISOString()];
  const { distance: nextDistance } =
    sunDistanceEphemeris[nextMinute.toISOString()];

  const distances = {
    current: currentDistance,
    previous: previousDistance,
    next: nextDistance,
  };

  const date = currentMinute.toDate();

  if (isMaximum({ ...distances })) {
    solarApsisEvents.push(getAphelionEvent(date));
  }

  if (isMinimum({ ...distances })) {
    solarApsisEvents.push(getPerihelionEvent(date));
  }

  return solarApsisEvents;
}

export function getAphelionEvent(date: Date): Event {
  const description = "Solar Aphelion";
  const summary = `☀️ ❄️ ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const aphelionEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories: [...categories, "Aphelion"],
  };
  return aphelionEvent;
}

export function getPerihelionEvent(date: Date): Event {
  const description = "Solar Perihelion";
  const summary = `☀️ 🔥 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const perihelionEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories: [...categories, "Perihelion"],
  };
  return perihelionEvent;
}

// #region 🕰️ Solstices, Equinoxes, Quarter days, Hexadecans

export function getVernalEquinoxEvent(date: Date): Event {
  const description = "Vernal Equinox";
  const summary = `🌸 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const vernalEquinoxEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return vernalEquinoxEvent;
}

export function getFirstHexadecanEvent(date: Date): Event {
  const description = "First Hexadecan";
  const summary = `🌳 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);
  const firstHexadecanEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return firstHexadecanEvent;
}

export function getBeltaneEvent(date: Date): Event {
  const description = "Beltane";
  const summary = `🐦‍🔥 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const beltaneEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return beltaneEvent;
}

export function getThirdHexadecanEvent(date: Date): Event {
  const description = "Third Hexadecan";
  const summary = `🌻 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const thirdHexadecanEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return thirdHexadecanEvent;
}

export function getSummerSolsticeEvent(date: Date): Event {
  const description = "Summer Solstice";
  const summary = `🌞 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const summerSolsticeEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return summerSolsticeEvent;
}

export function getFifthHexadecanEvent(date: Date): Event {
  const description = "Fifth Hexadecan";
  const summary = `⛱️ ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const fifthHexadecanEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return fifthHexadecanEvent;
}

export function getLammasEvent(date: Date): Event {
  const description = "Lammas";
  const summary = `🌾 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const lammasEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return lammasEvent;
}

export function getSeventhHexadecanEvent(date: Date): Event {
  const description = "Seventh Hexadecan";
  const summary = `🎑 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);
  const seventhHexadecanEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return seventhHexadecanEvent;
}

export function getAutumnalEquinoxEvent(date: Date): Event {
  const description = "Autumnal Equinox";
  const summary = `🍂 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const autumnalEquinoxEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return autumnalEquinoxEvent;
}

export function getNinthHexadecanEvent(date: Date): Event {
  const description = "Ninth Hexadecan";
  const summary = `🍁 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);
  const ninthHexadecanEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return ninthHexadecanEvent;
}

export function getSamhainEvent(date: Date): Event {
  const description = "Samhain";
  const summary = `🎃 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const samhainEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return samhainEvent;
}

export function getEleventhHexadecanEvent(date: Date): Event {
  const description = "Eleventh Hexadecan";
  const summary = `🧤 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);
  const eleventhHexadecanEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return eleventhHexadecanEvent;
}

export function getWinterSolsticeEvent(date: Date): Event {
  const description = "Winter Solstice";
  const summary = `☃️ ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const winterSolsticeEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return winterSolsticeEvent;
}

export function getThirteenthHexadecanEvent(date: Date): Event {
  const description = "Thirteenth Hexadecan";
  const summary = `❄️ ${description}`;
  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);
  const thirteenthHexadecanEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return thirteenthHexadecanEvent;
}

export function getImbolcEvent(date: Date): Event {
  const description = "Imbolc";
  const summary = `🐑 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const imbolcEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return imbolcEvent;
}

export function getFifteenthHexadecanEvent(date: Date): Event {
  const description = "Fifteenth Hexadecan";
  const summary = `🌨️ ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const fifteenthHexadecanEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories,
  };
  return fifteenthHexadecanEvent;
}

export function writeAnnualSolarCycleEvents(args: {
  annualSolarCycleEvents: Event[];
  start: Date;
  end: Date;
}) {
  const { annualSolarCycleEvents, start, end } = args;
  if (_.isEmpty(annualSolarCycleEvents)) return;

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${annualSolarCycleEvents.length} annual solar cycle events from ${timespan}`;
  console.log(`📏 Writing ${message}`);

  upsertEvents(annualSolarCycleEvents);

  const ingressCalendar = getCalendar({
    events: annualSolarCycleEvents,
    name: "Annual Solar Cycle 📏",
  });
  fs.writeFileSync(
    getOutputPath(`annual-solar-cycle_${timespan}.ics`),
    new TextEncoder().encode(ingressCalendar)
  );

  console.log(`📏 Wrote ${message}`);
}

// #region 🕑 Duration Events

export function getSolarApsisDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to solar apsis events only
  const solarApsisEvents = events.filter((event) =>
    event.categories?.includes("Annual Solar Cycle")
  );

  // Perihelion (closest to sun, moving fastest)
  const perihelionEvents = solarApsisEvents.filter((event) =>
    event.categories?.includes("Perihelion")
  );

  // Aphelion (farthest from sun, moving slowest)
  const aphelionEvents = solarApsisEvents.filter((event) =>
    event.categories?.includes("Aphelion")
  );

  // Advancing: Aphelion → Perihelion (Earth moving closer to sun, speeding up)
  const advancingPairs = pairDurationEvents(
    aphelionEvents,
    perihelionEvents,
    "Solar Advancing"
  );
  for (const [beginning, ending] of advancingPairs) {
    durationEvents.push(getSolarAdvancingDurationEvent(beginning, ending));
  }

  // Retreating: Perihelion → Aphelion (Earth moving away from sun, slowing down)
  const retreatingPairs = pairDurationEvents(
    perihelionEvents,
    aphelionEvents,
    "Solar Retreating"
  );
  for (const [beginning, ending] of retreatingPairs) {
    durationEvents.push(getSolarRetreatingDurationEvent(beginning, ending));
  }

  return durationEvents;
}

function getSolarAdvancingDurationEvent(
  beginning: Event,
  ending: Event
): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "☀️ 🔥 Solar Advancing",
    description: "Solar Advancing (Aphelion to Perihelion)",
    categories: [...categories, "Advancing"],
  };
}

function getSolarRetreatingDurationEvent(
  beginning: Event,
  ending: Event
): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "☀️ ❄️ Solar Retreating",
    description: "Solar Retreating (Perihelion to Aphelion)",
    categories: [...categories, "Retreating"],
  };
}
