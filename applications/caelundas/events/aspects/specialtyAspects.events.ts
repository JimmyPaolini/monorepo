import _ from "npm:lodash";
import type { Moment } from "npm:moment";
import type { EventTemplate } from "../../calendar.utilities.ts";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types.ts";
import {
  type Body,
  type SpecialtyAspect,
  type BodySymbol,
  type SpecialtyAspectSymbol,
  symbolByBody,
  symbolBySpecialtyAspect,
} from "../../symbols.constants.ts";
import { type Event, getCalendar } from "../../calendar.utilities.ts";
import { getSpecialtyAspect, isSpecialtyAspect } from "./aspects.utilities.ts";
import { upsertEvents } from "../../database.utilities.ts";
import { incrementEventsCount, print } from "../../logs/logs.service.tsx";

type SpecialtyAspectDescription =
  `${Capitalize<Body>} ${SpecialtyAspect} ${Capitalize<Body>}`;
type SpecialtyAspectSummary =
  `${BodySymbol}${SpecialtyAspectSymbol}${BodySymbol} ${string}`;

export interface SpecialtyAspectEventTemplate extends EventTemplate {
  description: SpecialtyAspectDescription;
  summary: SpecialtyAspectSummary;
}

export interface SpecialtyAspectEvent extends Event {
  description: SpecialtyAspectDescription;
  summary: SpecialtyAspectSummary;
}

export function getSpecialtyAspectEvents(args: {
  specialtyAspectBodies: Body[];
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  currentMinute: Moment;
}) {
  const { specialtyAspectBodies, coordinateEphemerisByBody, currentMinute } =
    args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const specialtyAspectEvents: SpecialtyAspectEvent[] = [];

  for (const body1 of specialtyAspectBodies) {
    const index = specialtyAspectBodies.indexOf(body1);
    for (const body2 of specialtyAspectBodies.slice(index + 1)) {
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
        isSpecialtyAspect({
          currentLongitudeBody1,
          currentLongitudeBody2,
          previousLongitudeBody1,
          previousLongitudeBody2,
          nextLongitudeBody1,
          nextLongitudeBody2,
        })
      ) {
        specialtyAspectEvents.push(
          getSpecialtyAspectEvent({
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

  return specialtyAspectEvents;
}

export function getSpecialtyAspectEvent(args: {
  longitudeBody1: number;
  longitudeBody2: number;
  timestamp: Date;
  body1: Body;
  body2: Body;
}) {
  const { longitudeBody1, longitudeBody2, timestamp, body1, body2 } = args;
  const specialtyAspect = getSpecialtyAspect({
    longitudeBody1,
    longitudeBody2,
  });
  if (!specialtyAspect) {
    console.error(
      `No specialty aspect found between ${body1} and ${body2} at ${timestamp.toISOString()}: ${longitudeBody1} and ${longitudeBody2}`
    );
    throw new Error("No specialty aspect found");
  }

  const body1Capitalized = _.startCase(body1) as Capitalize<Body>;
  const body2Capitalized = _.startCase(body2) as Capitalize<Body>;

  const body1Symbol = symbolByBody[body1] as BodySymbol;
  const body2Symbol = symbolByBody[body2] as BodySymbol;
  const specialtyAspectSymbol = symbolBySpecialtyAspect[
    specialtyAspect
  ] as SpecialtyAspectSymbol;

  const description: SpecialtyAspectDescription = `${body1Capitalized} ${specialtyAspect} ${body2Capitalized}`;
  const summary =
    // @ts-ignore: it's ok that the type is complicated
    `${body1Symbol} ${specialtyAspectSymbol} ${body2Symbol} ${description}` as SpecialtyAspectSummary;

  print(`${summary} at ${timestamp.toISOString()}`);
  incrementEventsCount();

  const specialtyAspectEvent: SpecialtyAspectEvent = {
    start: timestamp,
    description,
    summary,
  };
  return specialtyAspectEvent;
}

export function writeSpecialtyAspectEvents(args: {
  end: Date;
  specialtyAspectBodies: Body[];
  specialtyAspectEvents: SpecialtyAspectEvent[];
  start: Date;
}) {
  const { end, specialtyAspectEvents, specialtyAspectBodies, start } = args;
  if (_.isEmpty(specialtyAspectEvents)) return;

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${specialtyAspectEvents.length} specialty aspect events from ${timespan}`;
  print(`🧮 Writing ${message}`);

  upsertEvents(specialtyAspectEvents);

  const specialtyAspectBodiesString = specialtyAspectBodies.join(",");
  const specialtyAspectsCalendar = getCalendar(
    specialtyAspectEvents,
    "Specialty Aspects 🧮"
  );
  Deno.writeFileSync(
    `./calendars/specialty-aspects_${specialtyAspectBodiesString}_${timespan}.ics`,
    new TextEncoder().encode(specialtyAspectsCalendar)
  );

  print(`🧮 Wrote ${message}`);
}
