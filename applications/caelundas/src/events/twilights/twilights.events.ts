import fs from "fs";

import _ from "lodash";
import moment from "moment-timezone";

import { getCalendar } from "../../calendar.utilities";
import { upsertEvents } from "../../database.utilities";
import { pairDurationEvents } from "../../duration.utilities";
import { getOutputPath } from "../../output.utilities";

import {
  isAstronomicalDawn,
  isAstronomicalDusk,
  isCivilDawn,
  isCivilDusk,
  isNauticalDawn,
  isNauticalDusk,
} from "./twilights.utilities";

import type { Event } from "../../calendar.utilities";
import type { AzimuthElevationEphemeris } from "../../ephemeris/ephemeris.types";
import type { Moment } from "moment";

const categories = ["Astronomy", "Astrology", "Twilight"];

export function getTwilightEvents(args: {
  currentMinute: Moment;
  sunAzimuthElevationEphemeris: AzimuthElevationEphemeris;
}) {
  const { currentMinute, sunAzimuthElevationEphemeris } = args;

  const twilightEvents: Event[] = [];

  const previousMinute = currentMinute.clone().subtract(1, "minutes");

  const { elevation: currentElevation } =
    sunAzimuthElevationEphemeris[currentMinute.toISOString()];
  const { elevation: previousElevation } =
    sunAzimuthElevationEphemeris[previousMinute.toISOString()];

  const elevations = { currentElevation, previousElevation };
  const date = currentMinute.toDate();

  if (isAstronomicalDawn({ ...elevations })) {
    twilightEvents.push(getAstronomicalDawnEvent(date));
  }
  if (isNauticalDawn({ ...elevations })) {
    twilightEvents.push(getNauticalDawnEvent(date));
  }
  if (isCivilDawn({ ...elevations })) {
    twilightEvents.push(getCivilDawnEvent(date));
  }
  if (isCivilDusk({ ...elevations })) {
    twilightEvents.push(getCivilDuskEvent(date));
  }
  if (isNauticalDusk({ ...elevations })) {
    twilightEvents.push(getNauticalDuskEvent(date));
  }
  if (isAstronomicalDusk({ ...elevations })) {
    twilightEvents.push(getAstronomicalDuskEvent(date));
  }

  return twilightEvents;
}

export function getAstronomicalDawnEvent(date: Date): Event {
  const description = "Astronomical Dawn";
  const summary = `🌠 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const astronomicalDawnEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories: [...categories, "Astronomical Dawn"],
  };
  return astronomicalDawnEvent;
}

export function getNauticalDawnEvent(date: Date): Event {
  const description = "Nautical Dawn";
  const summary = `🌅 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const nauticalDawnEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories: [...categories, "Nautical Dawn"],
  };
  return nauticalDawnEvent;
}

export function getCivilDawnEvent(date: Date): Event {
  const description = "Civil Dawn";
  const summary = `🌄 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const civilDawnEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories: [...categories, "Civil Dawn"],
  };
  return civilDawnEvent;
}

export function getCivilDuskEvent(date: Date): Event {
  const description = "Civil Dusk";
  const summary = `🌇 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const civilDuskEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories: [...categories, "Civil Dusk"],
  };
  return civilDuskEvent;
}

export function getNauticalDuskEvent(date: Date): Event {
  const description = "Nautical Dusk";
  const summary = `🌉 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const nauticalDuskEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories: [...categories, "Nautical Dusk"],
  };
  return nauticalDuskEvent;
}

export function getAstronomicalDuskEvent(date: Date): Event {
  const description = "Astronomical Dusk";
  const summary = `🌌 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const astronomicalDuskEvent: Event = {
    start: date,
    end: date,
    summary,
    description,
    categories: [...categories, "Astronomical Dusk"],
  };
  return astronomicalDuskEvent;
}

export function writeTwilightEvents(args: {
  twilightEvents: Event[];
  start: Date;
  end: Date;
}) {
  const { twilightEvents, start, end } = args;
  if (_.isEmpty(twilightEvents)) {return;}

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${twilightEvents.length} twilight events from ${timespan}`;
  console.log(`🌠 Writing ${message}`);

  upsertEvents(twilightEvents);

  const ingressCalendar = getCalendar({
    events: twilightEvents,
    name: "Twilights 🌠",
  });
  fs.writeFileSync(
    getOutputPath(`twilight_${timespan}.ics`),
    new TextEncoder().encode(ingressCalendar)
  );

  console.log(`🌠 Wrote ${message}`);
}

// #region 🕑 Duration Events

export function getTwilightDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to twilight events only
  const twilightEvents = events.filter((event) =>
    event.categories.includes("Twilight")
  );

  // Astronomical Twilight (morning): Astronomical Dawn → Nautical Dawn
  const astronomicalDawnEvents = twilightEvents.filter((event) =>
    event.categories.includes("Astronomical Dawn")
  );
  const nauticalDawnEvents = twilightEvents.filter((event) =>
    event.categories.includes("Nautical Dawn")
  );
  const astronomicalTwilightMorningPairs = pairDurationEvents(
    astronomicalDawnEvents,
    nauticalDawnEvents,
    "Astronomical Twilight (Morning)"
  );
  for (const [beginning, ending] of astronomicalTwilightMorningPairs) {
    durationEvents.push(
      getAstronomicalTwilightMorningDurationEvent(beginning, ending)
    );
  }

  // Nautical Twilight (morning): Nautical Dawn → Civil Dawn
  const civilDawnEvents = twilightEvents.filter((event) =>
    event.categories.includes("Civil Dawn")
  );
  const nauticalTwilightMorningPairs = pairDurationEvents(
    nauticalDawnEvents,
    civilDawnEvents,
    "Nautical Twilight (Morning)"
  );
  for (const [beginning, ending] of nauticalTwilightMorningPairs) {
    durationEvents.push(
      getNauticalTwilightMorningDurationEvent(beginning, ending)
    );
  }

  // Daylight: Civil Dawn → Civil Dusk
  const civilDuskEvents = twilightEvents.filter((event) =>
    event.categories.includes("Civil Dusk")
  );
  const daylightPairs = pairDurationEvents(
    civilDawnEvents,
    civilDuskEvents,
    "Daylight"
  );
  for (const [beginning, ending] of daylightPairs) {
    durationEvents.push(getDaylightDurationEvent(beginning, ending));
  }

  // Nautical Twilight (evening): Civil Dusk → Nautical Dusk
  const nauticalDuskEvents = twilightEvents.filter((event) =>
    event.categories.includes("Nautical Dusk")
  );
  const nauticalTwilightEveningPairs = pairDurationEvents(
    civilDuskEvents,
    nauticalDuskEvents,
    "Nautical Twilight (Evening)"
  );
  for (const [beginning, ending] of nauticalTwilightEveningPairs) {
    durationEvents.push(
      getNauticalTwilightEveningDurationEvent(beginning, ending)
    );
  }

  // Astronomical Twilight (evening): Nautical Dusk → Astronomical Dusk
  const astronomicalDuskEvents = twilightEvents.filter((event) =>
    event.categories.includes("Astronomical Dusk")
  );
  const astronomicalTwilightEveningPairs = pairDurationEvents(
    nauticalDuskEvents,
    astronomicalDuskEvents,
    "Astronomical Twilight (Evening)"
  );
  for (const [beginning, ending] of astronomicalTwilightEveningPairs) {
    durationEvents.push(
      getAstronomicalTwilightEveningDurationEvent(beginning, ending)
    );
  }

  // Night: Astronomical Dusk → Astronomical Dawn (next day)
  const nightPairs = pairDurationEvents(
    astronomicalDuskEvents,
    astronomicalDawnEvents,
    "Night"
  );
  for (const [beginning, ending] of nightPairs) {
    durationEvents.push(getNightDurationEvent(beginning, ending));
  }

  return durationEvents;
}

function getAstronomicalTwilightMorningDurationEvent(
  beginning: Event,
  ending: Event
): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "🌠 Astronomical Twilight (Morning)",
    description: "Astronomical Twilight (Morning)",
    categories: [...categories, "Astronomical Twilight", "Morning"],
  };
}

function getNauticalTwilightMorningDurationEvent(
  beginning: Event,
  ending: Event
): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "🌅 Nautical Twilight (Morning)",
    description: "Nautical Twilight (Morning)",
    categories: [...categories, "Nautical Twilight", "Morning"],
  };
}

function getDaylightDurationEvent(beginning: Event, ending: Event): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "☀️ Daylight",
    description: "Daylight",
    categories: [...categories, "Daylight"],
  };
}

function getNauticalTwilightEveningDurationEvent(
  beginning: Event,
  ending: Event
): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "🌉 Nautical Twilight (Evening)",
    description: "Nautical Twilight (Evening)",
    categories: [...categories, "Nautical Twilight", "Evening"],
  };
}

function getAstronomicalTwilightEveningDurationEvent(
  beginning: Event,
  ending: Event
): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "🌌 Astronomical Twilight (Evening)",
    description: "Astronomical Twilight (Evening)",
    categories: [...categories, "Astronomical Twilight", "Evening"],
  };
}

function getNightDurationEvent(beginning: Event, ending: Event): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "🌃 Night",
    description: "Night",
    categories: [...categories, "Night"],
  };
}
