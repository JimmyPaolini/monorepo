import fs from "fs";

import _ from "lodash";
import moment from "moment-timezone";

import { getCalendar, MARGIN_MINUTES } from "../../calendar.utilities";
import { lunarPhases } from "../../constants";
import { getIlluminationFromEphemeris } from "../../ephemeris/ephemeris.service";
import { getOutputPath } from "../../output.utilities";
import { symbolByLunarPhase } from "../../symbols";

import { isLunarPhase } from "./monthlyLunarCycle.utilities";

import type { Event } from "../../calendar.utilities";
import type { IlluminationEphemeris } from "../../ephemeris/ephemeris.types";
import type { LunarPhase } from "../../types";
import type { Moment } from "moment";

export function getMonthlyLunarCycleEvents(args: {
  currentMinute: Moment;
  moonIlluminationEphemeris: IlluminationEphemeris;
}): Event[] {
  const { currentMinute, moonIlluminationEphemeris } = args;

  const monthlyLunarCycleEvents: Event[] = [];

  const currentIllumination = getIlluminationFromEphemeris(
    moonIlluminationEphemeris,
    currentMinute.toISOString(),
    "currentIllumination"
  );

  const previousIlluminations = new Array(MARGIN_MINUTES)
    .fill(null)
    .map((_, marginIndex) => {
      const minute = currentMinute.clone().subtract(marginIndex + 1, "minutes");
      return getIlluminationFromEphemeris(
        moonIlluminationEphemeris,
        minute.toISOString(),
        "previousIllumination"
      );
    });

  const nextIlluminations = new Array(MARGIN_MINUTES)
    .fill(null)
    .map((_, marginIndex) => {
      const minute = currentMinute.clone().add(marginIndex + 1, "minutes");
      return getIlluminationFromEphemeris(
        moonIlluminationEphemeris,
        minute.toISOString(),
        "nextIllumination"
      );
    });

  const illuminations = {
    currentIllumination,
    previousIlluminations,
    nextIlluminations,
  };
  const date = currentMinute.toDate();

  for (const lunarPhase of lunarPhases) {
    if (isLunarPhase({ ...illuminations, lunarPhase })) {
      monthlyLunarCycleEvents.push(
        getMonthlyLunarCycleEvent({ date, lunarPhase })
      );
    }
  }

  return monthlyLunarCycleEvents;
}

export function getMonthlyLunarCycleEvent(args: {
  date: Date;
  lunarPhase: LunarPhase;
}): Event {
  const { date, lunarPhase } = args;

  const lunarPhaseCapitalized = _.startCase(
    lunarPhase
  ) as Capitalize<LunarPhase>;
  const description = `${lunarPhaseCapitalized} Moon`;
  const summary = `🌙 ${symbolByLunarPhase[lunarPhase]} ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.log(`${summary} at ${dateString}`);

  const monthlyLunarCycleEvent = {
    start: date,
    end: date,
    summary,
    description,
    categories: [
      "Astronomy",
      "Astrology",
      "Monthly Lunar Cycle",
      "Lunar",
      lunarPhaseCapitalized,
    ],
  };
  return monthlyLunarCycleEvent;
}

export function writeMonthlyLunarCycleEvents(args: {
  monthlyLunarCycleEvents: Event[];
  start: Date;
  end: Date;
}): void {
  const { monthlyLunarCycleEvents, start, end } = args;
  if (_.isEmpty(monthlyLunarCycleEvents)) {
    return;
  }

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${monthlyLunarCycleEvents.length} monthly lunar cycle events from ${timespan}`;
  console.log(`🌒 Writing ${message}`);

  const ingressCalendar = getCalendar({
    events: monthlyLunarCycleEvents,
    name: "Monthly Lunar Cycle 🌒",
  });
  fs.writeFileSync(
    getOutputPath(`monthly-lunar-cycle_${timespan}.ics`),
    new TextEncoder().encode(ingressCalendar)
  );

  console.log(`🌒 Wrote ${message}`);
}

// #region 🕑 Duration Events

export function getMonthlyLunarCycleDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to monthly lunar cycle events only
  const lunarCycleEvents = events.filter((event) =>
    event.categories.includes("Monthly Lunar Cycle")
  );

  // Sort by time
  const sortedEvents = _.sortBy(lunarCycleEvents, (event) =>
    event.start.getTime()
  );

  // Pair consecutive lunar phases to create duration events
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const entering = sortedEvents[i];
    const exiting = sortedEvents[i + 1];
    if (!entering || !exiting) {
      continue;
    }

    const durationEvent = getMonthlyLunarCycleDurationEvent(entering, exiting);
    if (!durationEvent) {
      continue;
    }

    durationEvents.push(durationEvent);
  }

  return durationEvents;
}

function getMonthlyLunarCycleDurationEvent(
  entering: Event,
  exiting: Event
): Event | null {
  const categories = entering.categories;

  // Extract the lunar phase
  const lunarPhaseCapitalized = categories.find((category) =>
    lunarPhases.map((lunarPhase) => _.startCase(lunarPhase)).includes(category)
  );

  if (!lunarPhaseCapitalized) {
    console.warn(
      `⚠️ Could not extract lunar phase from categories: ${categories.join(
        ", "
      )} - skipping duration event for ${entering.summary}`
    );
    return null; // Skip this invalid event
  }

  const lunarPhase = lunarPhaseCapitalized.toLowerCase() as LunarPhase;
  const lunarPhaseSymbol = symbolByLunarPhase[lunarPhase];

  return {
    start: entering.start,
    end: exiting.start,
    summary: `🌙 ${lunarPhaseSymbol} ${lunarPhaseCapitalized} Moon`,
    description: `${lunarPhaseCapitalized} Moon`,
    categories: [
      "Astronomy",
      "Astrology",
      "Monthly Lunar Cycle",
      "Lunar",
      lunarPhaseCapitalized,
    ],
  };
}
