import fs from "fs";
import _ from "lodash";
import type { Moment } from "moment";
import type { EventTemplate } from "../../calendar.utilities";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import {
  Body,
  SpecialtyAspect,
  BodySymbol,
  SpecialtyAspectSymbol,
  symbolByBody,
  symbolBySpecialtyAspect,
  SPECIALTY_ASPECT_BODIES,
  specialtyAspects,
} from "../../constants";
import { type Event, getCalendar } from "../../calendar.utilities";
import {
  getSpecialtyAspect,
  getSpecialtyAspectPhase,
  type AspectPhase,
} from "./aspects.utilities";
import { upsertEvents } from "../../database.utilities";
import { getOutputPath } from "../../output.utilities";
import { pairDurationEvents } from "../../duration.utilities";

type SpecialtyAspectDescription =
  | `${Capitalize<Body>} exact ${SpecialtyAspect} ${Capitalize<Body>}`
  | `${Capitalize<Body>} applying ${SpecialtyAspect} ${Capitalize<Body>}`
  | `${Capitalize<Body>} separating ${SpecialtyAspect} ${Capitalize<Body>}`;
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
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  currentMinute: Moment;
}) {
  const { coordinateEphemerisByBody, currentMinute } = args;
  const specialtyAspectBodies = SPECIALTY_ASPECT_BODIES;

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

      const phase = getSpecialtyAspectPhase({
        currentLongitudeBody1,
        currentLongitudeBody2,
        previousLongitudeBody1,
        previousLongitudeBody2,
        nextLongitudeBody1,
        nextLongitudeBody2,
      });

      if (phase) {
        specialtyAspectEvents.push(
          getSpecialtyAspectEvent({
            timestamp: currentMinute.toDate(),
            longitudeBody1: currentLongitudeBody1,
            longitudeBody2: currentLongitudeBody2,
            body1,
            body2,
            phase,
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
  phase: AspectPhase;
}) {
  const { longitudeBody1, longitudeBody2, timestamp, body1, body2, phase } =
    args;
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

  let description: SpecialtyAspectDescription;
  let phaseEmoji: string;
  let categories: string[];

  const baseCategories = [
    "Astronomy",
    "Astrology",
    "Specialty Aspect",
    body1Capitalized,
    body2Capitalized,
    _.startCase(specialtyAspect),
  ];

  if (phase === "exact") {
    description =
      `${body1Capitalized} exact ${specialtyAspect} ${body2Capitalized}` as SpecialtyAspectDescription;
    phaseEmoji = "🎯";
    categories = [...baseCategories, "Exact"];
  } else if (phase === "applying") {
    description =
      `${body1Capitalized} applying ${specialtyAspect} ${body2Capitalized}` as SpecialtyAspectDescription;
    phaseEmoji = "➡️";
    categories = [...baseCategories, "Applying"];
  } else {
    description =
      `${body1Capitalized} separating ${specialtyAspect} ${body2Capitalized}` as SpecialtyAspectDescription;
    phaseEmoji = "⬅️";
    categories = [...baseCategories, "Separating"];
  }

  const summary = `${phaseEmoji} ${body1Symbol} ${specialtyAspectSymbol} ${body2Symbol} ${description}`;

  console.log(`${summary} at ${timestamp.toISOString()}`);

  const specialtyAspectEvent: SpecialtyAspectEvent = {
    start: timestamp,
    description,
    summary: summary as SpecialtyAspectSummary,
    categories,
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
  console.log(`🧮 Writing ${message}`);

  upsertEvents(specialtyAspectEvents);

  const specialtyAspectBodiesString = specialtyAspectBodies.join(",");
  const specialtyAspectsCalendar = getCalendar({
    events: specialtyAspectEvents,
    name: "Specialty Aspect 🧮",
  });
  fs.writeFileSync(
    getOutputPath(
      `specialty-aspects_${specialtyAspectBodiesString}_${timespan}.ics`
    ),
    new TextEncoder().encode(specialtyAspectsCalendar)
  );

  console.log(`🧮 Wrote ${message}`);
}

export function getSpecialtyAspectDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to specialty aspect events only
  const specialtyAspectEvents = events.filter((event) =>
    event.categories.includes("Specialty Aspect")
  ) as SpecialtyAspectEvent[];

  // Group by body pair and aspect type using categories
  const groupedEvents = _.groupBy(specialtyAspectEvents, (event) => {
    const planets = event.categories
      .filter((category) =>
        SPECIALTY_ASPECT_BODIES.map(_.startCase).includes(category)
      )
      .sort();

    const aspect = event.categories.find((category) =>
      specialtyAspects.map(_.startCase).includes(category)
    );

    if (planets.length === 2 && aspect) {
      return `${planets[0]}-${aspect}-${planets[1]}`;
    }
    return "";
  });

  // Process each group
  for (const [key, groupEvents] of Object.entries(groupedEvents)) {
    if (!key) continue;

    const applyingEvents = groupEvents.filter((event) =>
      event.categories.includes("Applying")
    );
    const separatingEvents = groupEvents.filter((event) =>
      event.categories.includes("Separating")
    );

    const pairs = pairDurationEvents(
      applyingEvents,
      separatingEvents,
      `specialty aspect ${key}`
    );

    durationEvents.push(
      ...pairs.map(([beginning, ending]) =>
        getSpecialtyAspectDurationEvent(beginning, ending)
      )
    );
  }

  return durationEvents;
}

function getSpecialtyAspectDurationEvent(
  beginning: SpecialtyAspectEvent,
  ending: SpecialtyAspectEvent
): Event {
  const categories = beginning.categories || [];

  const bodiesCapitalized = categories
    .filter((category) =>
      SPECIALTY_ASPECT_BODIES.map(_.startCase).includes(category)
    )
    .sort();

  const aspectCapitalized = categories.find((category) =>
    specialtyAspects.map(_.startCase).includes(category)
  );

  if (bodiesCapitalized.length !== 2 || !aspectCapitalized) {
    throw new Error(
      `Could not extract aspect info from categories: ${categories.join(", ")}`
    );
  }

  const body1Capitalized = bodiesCapitalized[0];
  const body2Capitalized = bodiesCapitalized[1];
  const aspect = aspectCapitalized.toLowerCase() as SpecialtyAspect;

  const body1 = body1Capitalized.toLowerCase() as Body;
  const body2 = body2Capitalized.toLowerCase() as Body;

  const body1Symbol = symbolByBody[body1] as BodySymbol;
  const body2Symbol = symbolByBody[body2] as BodySymbol;
  const aspectSymbol = symbolBySpecialtyAspect[aspect] as SpecialtyAspectSymbol;

  return {
    start: beginning.start,
    end: ending.start,
    summary: `${body1Symbol}${aspectSymbol}${body2Symbol} ${body1Capitalized} ${aspect} ${body2Capitalized}`,
    description: `${body1Capitalized} ${aspect} ${body2Capitalized}`,
    categories: [
      "Astronomy",
      "Astrology",
      "Specialty Aspect",
      body1Capitalized,
      body2Capitalized,
      aspectCapitalized,
    ],
  };
}
