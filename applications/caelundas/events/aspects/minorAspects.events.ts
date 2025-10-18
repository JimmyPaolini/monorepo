import _ from "npm:lodash";
import type { Moment } from "npm:moment";
import type { EventTemplate } from "../../calendar.utilities.ts";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types.ts";
import {
  type MinorAspect,
  type Body,
  type BodySymbol,
  type MinorAspectSymbol,
  symbolByBody,
  symbolByMinorAspect,
} from "../../symbols.constants.ts";
import { type Event, getCalendar } from "../../calendar.utilities.ts";
import { getMinorAspect, isMinorAspect } from "./aspects.utilities.ts";
import { upsertEvents } from "../../database.utilities.ts";
import { incrementEventsCount, print } from "../../logs/logs.service.tsx";

type MinorAspectDescription =
  `${Capitalize<Body>} ${MinorAspect} ${Capitalize<Body>}`;
type MinorAspectSummary =
  `${BodySymbol}${MinorAspectSymbol}${BodySymbol} ${string}`;

export interface MinorAspectEventTemplate extends EventTemplate {
  description: MinorAspectDescription;
  summary: MinorAspectSummary;
}

export interface MinorAspectEvent extends Event {
  description: MinorAspectDescription;
  summary: MinorAspectSummary;
}

export function getMinorAspectEvents(args: {
  minorAspectBodies: Body[];
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  currentMinute: Moment;
}) {
  const { minorAspectBodies, coordinateEphemerisByBody, currentMinute } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const minorAspectEvents: MinorAspectEvent[] = [];

  for (const body1 of minorAspectBodies) {
    const index = minorAspectBodies.indexOf(body1);
    for (const body2 of minorAspectBodies.slice(index + 1)) {
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
        isMinorAspect({
          currentLongitudeBody1,
          currentLongitudeBody2,
          previousLongitudeBody1,
          previousLongitudeBody2,
          nextLongitudeBody1,
          nextLongitudeBody2,
        })
      ) {
        minorAspectEvents.push(
          getMinorAspectEvent({
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

  return minorAspectEvents;
}

export function getMinorAspectEvent(args: {
  longitudeBody1: number;
  longitudeBody2: number;
  timestamp: Date;
  body1: Body;
  body2: Body;
}) {
  const { longitudeBody1, longitudeBody2, timestamp, body1, body2 } = args;
  const minorAspect = getMinorAspect({ longitudeBody1, longitudeBody2 });
  if (!minorAspect) {
    console.error(
      `No minor aspect found between ${body1} and ${body2} at ${timestamp.toISOString()}: ${longitudeBody1} and ${longitudeBody2}`
    );
    throw new Error("No minor aspect found");
  }

  const body1Capitalized = _.startCase(body1) as Capitalize<Body>;
  const body2Capitalized = _.startCase(body2) as Capitalize<Body>;

  const body1Symbol = symbolByBody[body1] as BodySymbol;
  const body2Symbol = symbolByBody[body2] as BodySymbol;
  const minorAspectSymbol = symbolByMinorAspect[
    minorAspect
  ] as MinorAspectSymbol;

  const description: MinorAspectDescription = `${body1Capitalized} ${minorAspect} ${body2Capitalized}`;
  const summary =
    // @ts-ignore: it's ok that the type is complicated
    `${body1Symbol} ${minorAspectSymbol} ${body2Symbol} ${description}` as MinorAspectSummary;

  print(`${summary} at ${timestamp.toISOString()}`);
  incrementEventsCount();

  const minorAspectEvent: MinorAspectEvent = {
    start: timestamp,
    description,
    summary,
  };
  return minorAspectEvent;
}

export function writeMinorAspectEvents(args: {
  end: Date;
  minorAspectBodies: Body[];
  minorAspectEvents: MinorAspectEvent[];
  start: Date;
}) {
  const { end, minorAspectEvents, minorAspectBodies, start } = args;
  if (_.isEmpty(minorAspectEvents)) return;

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${minorAspectEvents.length} minor aspect events from ${timespan}`;
  print(`🖇️ Writing ${message}`);

  upsertEvents(minorAspectEvents);

  const minorAspectBodiesString = minorAspectBodies.join(",");
  const minorAspectsCalendar = getCalendar(
    minorAspectEvents,
    "Minor Aspects 🖇️"
  );
  Deno.writeFileSync(
    `./calendars/minor-aspects_${minorAspectBodiesString}_${timespan}.ics`,
    new TextEncoder().encode(minorAspectsCalendar)
  );

  print(`🖇️ Wrote ${message}`);
}
