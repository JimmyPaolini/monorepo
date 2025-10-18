import _ from "npm:lodash";
import moment from "npm:moment-timezone";
import type { Moment } from "npm:moment";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types.ts";
import type { DistanceEphemeris } from "../../ephemeris/ephemeris.types.ts";
import { type Event, getCalendar } from "../../calendar.utilities.ts";
import { upsertEvents } from "../../database.utilities.ts";
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
} from "./annualSolarCycle.utilities.ts";
import { isMaximum, isMinimum } from "../../math.utilities.ts";
import { incrementEventsCount, print } from "../../logs/logs.service.tsx";

// #region 📏 Annual Solar Cycle

export function getAnnualSolarCycleEvents(args: {
  ephemeris: CoordinateEphemeris;
  currentMinute: Moment;
}): Event[] {
  const { ephemeris, currentMinute } = args;

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
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const aphelionEvent: Event = { start: date, summary, description };
  return aphelionEvent;
}

export function getPerihelionEvent(date: Date): Event {
  const description = "Solar Perihelion";
  const summary = `☀️ 🔥 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const perihelionEvent: Event = { start: date, summary, description };
  return perihelionEvent;
}

// #region 🕰️ Solstices, Equinoxes, Quarter days, Hexadecans

export function getVernalEquinoxEvent(date: Date): Event {
  const description = "Vernal Equinox";
  const summary = `🌸 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const vernalEquinoxEvent: Event = { start: date, summary, description };
  return vernalEquinoxEvent;
}

export function getFirstHexadecanEvent(date: Date): Event {
  const description = "First Hexadecan";
  const summary = `🌳 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();
  const firstHexadecanEvent: Event = { start: date, summary, description };
  return firstHexadecanEvent;
}

export function getBeltaneEvent(date: Date): Event {
  const description = "Beltane";
  const summary = `🐦‍🔥 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const beltaneEvent: Event = { start: date, summary, description };
  return beltaneEvent;
}

export function getThirdHexadecanEvent(date: Date): Event {
  const description = "Third Hexadecan";
  const summary = `🌻 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const thirdHexadecanEvent: Event = { start: date, summary, description };
  return thirdHexadecanEvent;
}

export function getSummerSolsticeEvent(date: Date): Event {
  const description = "Summer Solstice";
  const summary = `🌞 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const summerSolsticeEvent: Event = { start: date, summary, description };
  return summerSolsticeEvent;
}

export function getFifthHexadecanEvent(date: Date): Event {
  const description = "Fifth Hexadecan";
  const summary = `⛱️ ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const fifthHexadecanEvent: Event = { start: date, summary, description };
  return fifthHexadecanEvent;
}

export function getLammasEvent(date: Date): Event {
  const description = "Lammas";
  const summary = `🌾 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const lammasEvent: Event = { start: date, summary, description };
  return lammasEvent;
}

export function getSeventhHexadecanEvent(date: Date): Event {
  const description = "Seventh Hexadecan";
  const summary = `🎑 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();
  const seventhHexadecanEvent: Event = { start: date, summary, description };
  return seventhHexadecanEvent;
}

export function getAutumnalEquinoxEvent(date: Date): Event {
  const description = "Autumnal Equinox";
  const summary = `🍂 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const autumnalEquinoxEvent: Event = { start: date, summary, description };
  return autumnalEquinoxEvent;
}

export function getNinthHexadecanEvent(date: Date): Event {
  const description = "Ninth Hexadecan";
  const summary = `🍁 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();
  const ninthHexadecanEvent: Event = { start: date, summary, description };
  return ninthHexadecanEvent;
}

export function getSamhainEvent(date: Date): Event {
  const description = "Samhain";
  const summary = `🎃 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const samhainEvent: Event = { start: date, summary, description };
  return samhainEvent;
}

export function getEleventhHexadecanEvent(date: Date): Event {
  const description = "Eleventh Hexadecan";
  const summary = `🧤 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();
  const eleventhHexadecanEvent: Event = { start: date, summary, description };
  return eleventhHexadecanEvent;
}

export function getWinterSolsticeEvent(date: Date): Event {
  const description = "Winter Solstice";
  const summary = `☃️ ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const winterSolsticeEvent: Event = { start: date, summary, description };
  return winterSolsticeEvent;
}

export function getThirteenthHexadecanEvent(date: Date): Event {
  const description = "Thirteenth Hexadecan";
  const summary = `❄️ ${description}`;
  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();
  const thirteenthHexadecanEvent: Event = {
    start: date,
    summary,
    description,
  };
  return thirteenthHexadecanEvent;
}

export function getImbolcEvent(date: Date): Event {
  const description = "Imbolc";
  const summary = `🐑 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const imbolcEvent: Event = { start: date, summary, description };
  return imbolcEvent;
}

export function getFifteenthHexadecanEvent(date: Date): Event {
  const description = "Fifteenth Hexadecan";
  const summary = `🌨️ ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const fifteenthHexadecanEvent: Event = { start: date, summary, description };
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
  print(`📏 Writing ${message}`);
  incrementEventsCount();

  upsertEvents(annualSolarCycleEvents);

  const ingressCalendar = getCalendar(
    annualSolarCycleEvents,
    "Annual Solar Cycle 📏"
  );
  Deno.writeFileSync(
    `./calendars/annual-solar-cycle_${timespan}.ics`,
    new TextEncoder().encode(ingressCalendar)
  );

  print(`📏 Wrote ${message}`);
  incrementEventsCount();
}
