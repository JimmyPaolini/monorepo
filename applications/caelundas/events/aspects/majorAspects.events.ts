import _ from "npm:lodash";
import type { Moment } from "npm:moment";
import type { Event } from "../../calendar.utilities.ts";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types.ts";
import { type EventTemplate, getCalendar } from "../../calendar.utilities.ts";
import {
  type Body,
  type BodySymbol,
  type MajorAspect,
  type MajorAspectSymbol,
  symbolByBody,
  symbolByMajorAspect,
} from "../../symbols.constants.ts";
import { upsertEvents } from "../../database.utilities.ts";
import { getMajorAspect, isMajorAspect } from "./aspects.utilities.ts";
import { incrementEventsCount, print } from "../../logs/logs.service.tsx";

type MajorAspectDescription =
  `${Capitalize<Body>} ${MajorAspect} ${Capitalize<Body>}`;
type MajorAspectSummary =
  `${BodySymbol}${MajorAspectSymbol}${BodySymbol} ${string}`;

export interface MajorAspectEventTemplate extends EventTemplate {
  description: MajorAspectDescription;
  summary: MajorAspectSummary;
}

export interface MajorAspectEvent extends Event {
  description: MajorAspectDescription;
  summary: MajorAspectSummary;
}

export function getMajorAspectEvents(args: {
  majorAspectBodies: Body[];
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  currentMinute: Moment;
}) {
  const { majorAspectBodies, coordinateEphemerisByBody, currentMinute } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const majorAspectEvents: MajorAspectEvent[] = [];

  for (const body1 of majorAspectBodies) {
    const index = majorAspectBodies.indexOf(body1);
    for (const body2 of majorAspectBodies.slice(index + 1)) {
      if (body1 === body2) continue;

      const ephemerisBody1 = coordinateEphemerisByBody[body1];
      const ephemerisBody2 = coordinateEphemerisByBody[body2];

      const { longitude: currentLongitudeBody1 } =
        ephemerisBody1[currentMinute.toISOString()];
      const { longitude: currentLongitudeBody2 } =
        ephemerisBody2[currentMinute.toISOString()];
      const { longitude: previousLongitudeBody1 } =
        ephemerisBody1[previousMinute.toISOString()];
      const { longitude: previousLongitudeBody2 } =
        ephemerisBody2[previousMinute.toISOString()];
      const { longitude: nextLongitudeBody1 } =
        ephemerisBody1[nextMinute.toISOString()];
      const { longitude: nextLongitudeBody2 } =
        ephemerisBody2[nextMinute.toISOString()];

      if (
        isMajorAspect({
          currentLongitudeBody1,
          currentLongitudeBody2,
          previousLongitudeBody1,
          previousLongitudeBody2,
          nextLongitudeBody1,
          nextLongitudeBody2,
        })
      ) {
        majorAspectEvents.push(
          getMajorAspectEvent({
            timestamp: currentMinute.toDate(),
            longitudeBody1: currentLongitudeBody1,
            longitudeBody2: currentLongitudeBody2,
            body1,
            body2,
          })
        );
      }
    }
  }
  return majorAspectEvents;
}

export function getMajorAspectEvent(args: {
  longitudeBody1: number;
  longitudeBody2: number;
  timestamp: Date;
  body1: Body;
  body2: Body;
}) {
  const { longitudeBody1, longitudeBody2, timestamp, body1, body2 } = args;
  const majorAspect = getMajorAspect({ longitudeBody1, longitudeBody2 });
  if (!majorAspect) {
    console.error(
      `No major aspect found between ${body1} and ${body2} at ${timestamp.toISOString()}: ${longitudeBody1} and ${longitudeBody2}`
    );
    throw new Error("No major aspect found");
  }

  const body1Capitalized = _.startCase(body1) as Capitalize<Body>;
  const body2Capitalized = _.startCase(body2) as Capitalize<Body>;

  const body1Symbol = symbolByBody[body1] as BodySymbol;
  const body2Symbol = symbolByBody[body2] as BodySymbol;
  const majorAspectSymbol = symbolByMajorAspect[
    majorAspect
  ] as MajorAspectSymbol;

  const description: MajorAspectDescription = `${body1Capitalized} ${majorAspect} ${body2Capitalized}`;
  const summary =
    // @ts-ignore: it's ok that the type is complicated
    `${body1Symbol} ${majorAspectSymbol} ${body2Symbol} ${description}` as MajorAspectSummary;

  print(`${summary} at ${timestamp.toISOString()}`);
  incrementEventsCount();

  const majorAspectEvent: MajorAspectEvent = {
    start: timestamp,
    description,
    summary,
  };
  return majorAspectEvent;
}

export function writeMajorAspectEvents(args: {
  end: Date;
  majorAspectBodies: Body[];
  majorAspectEvents: MajorAspectEvent[];
  start: Date;
}) {
  const { end, majorAspectEvents, majorAspectBodies, start } = args;
  if (_.isEmpty(majorAspectEvents)) return;

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${majorAspectEvents.length} major aspect events from ${timespan}`;
  print(`📐 Writing ${message}`);

  upsertEvents(majorAspectEvents);

  const majorAspectBodiesString = majorAspectBodies.join(",");
  const majorAspectsCalendar = getCalendar(
    majorAspectEvents,
    "Major Aspects 📐"
  );
  Deno.writeFileSync(
    `./calendars/major-aspects_${majorAspectBodiesString}_${timespan}.ics`,
    new TextEncoder().encode(majorAspectsCalendar)
  );

  print(`📐 Wrote ${message}`);
}
