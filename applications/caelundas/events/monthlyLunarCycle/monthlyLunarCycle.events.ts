import _ from "npm:lodash";
import moment from "npm:moment-timezone";
import type { Moment } from "npm:moment";
import type { Event } from "../../calendar.utilities.ts";
import type { IlluminationEphemeris } from "../../ephemeris/ephemeris.types.ts";
import type { LunarPhase } from "../../symbols.constants.ts";
import { getCalendar } from "../../calendar.utilities.ts";
import { upsertEvents } from "../../database.utilities.ts";
import { MARGIN_MINUTES } from "../../main.ts";
import { lunarPhases } from "../../symbols.constants.ts";
import { isLunarPhase } from "./monthlyLunarCycle.utilities.ts";
import { symbolByLunarPhase } from "../../symbols.constants.ts";
import { incrementEventsCount, print } from "../../logs/logs.service.tsx";

export function getMonthlyLunarCycleEvents(args: {
  currentMinute: Moment;
  moonIlluminationEphemeris: IlluminationEphemeris;
}) {
  const { currentMinute, moonIlluminationEphemeris } = args;

  const monthlyLunarCycleEvents: Event[] = [];

  const { illumination: currentIllumination } =
    moonIlluminationEphemeris[currentMinute.toISOString()];

  const previousIlluminations = new Array(MARGIN_MINUTES)
    .fill(null)
    .map((_, marginIndex) => {
      const minute = currentMinute.clone().subtract(marginIndex + 1, "minutes");
      const { illumination: previousIllumination } =
        moonIlluminationEphemeris[minute.toISOString()];
      return previousIllumination;
    });

  const nextIlluminations = new Array(MARGIN_MINUTES)
    .fill(null)
    .map((_, marginIndex) => {
      const minute = currentMinute.clone().add(marginIndex + 1, "minutes");
      const { illumination: nextIllumination } =
        moonIlluminationEphemeris[minute.toISOString()];
      return nextIllumination;
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
}) {
  const { date, lunarPhase } = args;

  const description = `${_.startCase(lunarPhase)} Moon`;
  const summary = `🌙 ${symbolByLunarPhase[lunarPhase]} ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const monthlyLunarCycleEvent = { start: date, summary, description };
  return monthlyLunarCycleEvent;
}

export function writeMonthlyLunarCycleEvents(args: {
  monthlyLunarCycleEvents: Event[];
  start: Date;
  end: Date;
}) {
  const { monthlyLunarCycleEvents, start, end } = args;
  if (_.isEmpty(monthlyLunarCycleEvents)) return;

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${monthlyLunarCycleEvents.length} monthly lunar cycle events from ${timespan}`;
  print(`🌒 Writing ${message}`);

  upsertEvents(monthlyLunarCycleEvents);

  const ingressCalendar = getCalendar(
    monthlyLunarCycleEvents,
    "Monthly Lunar Cycle 🌒"
  );
  Deno.writeFileSync(
    `./calendars/monthly-lunar-cycle_${timespan}.ics`,
    new TextEncoder().encode(ingressCalendar)
  );

  print(`🌒 Wrote ${message}`);
}
