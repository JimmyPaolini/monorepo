import fs from "fs";
import _ from "lodash";
import type { Moment } from "moment";
import type { Event } from "../../calendar.utilities";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import { type EventTemplate, getCalendar } from "../../calendar.utilities";
import {
  Body,
  BodySymbol,
  MajorAspect,
  MajorAspectSymbol,
  symbolByBody,
  symbolByMajorAspect,
  MAJOR_ASPECT_BODIES,
  majorAspects,
} from "../../constants";
import { upsertEvents } from "../../database.utilities";
import {
  getMajorAspect,
  getMajorAspectPhase,
  type AspectPhase,
} from "./aspects.utilities";
import { getOutputPath } from "../../output.utilities";
import { pairDurationEvents } from "../../duration.utilities";

type MajorAspectDescription =
  | `${Capitalize<Body>} exact ${MajorAspect} ${Capitalize<Body>}`
  | `${Capitalize<Body>} applying ${MajorAspect} ${Capitalize<Body>}`
  | `${Capitalize<Body>} separating ${MajorAspect} ${Capitalize<Body>}`;
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
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  currentMinute: Moment;
}) {
  const { coordinateEphemerisByBody, currentMinute } = args;
  const majorAspectBodies = MAJOR_ASPECT_BODIES;

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

      const phase = getMajorAspectPhase({
        currentLongitudeBody1,
        currentLongitudeBody2,
        previousLongitudeBody1,
        previousLongitudeBody2,
        nextLongitudeBody1,
        nextLongitudeBody2,
      });

      if (phase) {
        majorAspectEvents.push(
          getMajorAspectEvent({
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
  return majorAspectEvents;
}

export function getMajorAspectEvent(args: {
  longitudeBody1: number;
  longitudeBody2: number;
  timestamp: Date;
  body1: Body;
  body2: Body;
  phase: AspectPhase;
}) {
  const { longitudeBody1, longitudeBody2, timestamp, body1, body2, phase } =
    args;
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

  let description: MajorAspectDescription;
  let phaseEmoji: string;
  let categories: string[];

  const baseCategories = [
    "Astronomy",
    "Astrology",
    "Major Aspect",
    body1Capitalized,
    body2Capitalized,
    _.startCase(majorAspect),
  ];

  if (phase === "exact") {
    description =
      `${body1Capitalized} exact ${majorAspect} ${body2Capitalized}` as MajorAspectDescription;
    phaseEmoji = "🎯";
    categories = [...baseCategories, "Exact"];
  } else if (phase === "applying") {
    description =
      `${body1Capitalized} applying ${majorAspect} ${body2Capitalized}` as MajorAspectDescription;
    phaseEmoji = "➡️";
    categories = [...baseCategories, "Applying"];
  } else {
    description =
      `${body1Capitalized} separating ${majorAspect} ${body2Capitalized}` as MajorAspectDescription;
    phaseEmoji = "⬅️";
    categories = [...baseCategories, "Separating"];
  }

  const summary = `${phaseEmoji} ${body1Symbol} ${majorAspectSymbol} ${body2Symbol} ${description}`;

  console.log(`${summary} at ${timestamp.toISOString()}`);

  const majorAspectEvent: MajorAspectEvent = {
    start: timestamp,
    description,
    summary: summary as MajorAspectSummary,
    categories,
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
  console.log(`📐 Writing ${message}`);

  upsertEvents(majorAspectEvents);

  const majorAspectBodiesString = majorAspectBodies.join(",");
  const majorAspectsCalendar = getCalendar({
    events: majorAspectEvents,
    name: "Major Aspect 📐",
  });
  fs.writeFileSync(
    getOutputPath(`major-aspects_${majorAspectBodiesString}_${timespan}.ics`),
    new TextEncoder().encode(majorAspectsCalendar)
  );

  console.log(`📐 Wrote ${message}`);
}

export function getMajorAspectDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to major aspect events only
  const majorAspectEvents = events.filter((event) =>
    event.categories.includes("Major Aspect")
  ) as MajorAspectEvent[];

  // Group by body pair and aspect type using categories
  const groupedEvents = _.groupBy(majorAspectEvents, (event) => {
    const planets = event.categories
      .filter((category) =>
        MAJOR_ASPECT_BODIES.map(_.startCase).includes(category)
      )
      .sort();

    const aspect = event.categories.find((category) =>
      majorAspects.map(_.startCase).includes(category)
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
      `major aspect ${key}`
    );

    durationEvents.push(
      ...pairs.map(([beginning, ending]) =>
        getMajorAspectDurationEvent(beginning, ending)
      )
    );
  }

  return durationEvents;
}

function getMajorAspectDurationEvent(
  beginning: MajorAspectEvent,
  ending: MajorAspectEvent
): Event {
  const categories = beginning.categories || [];

  const bodiesCapitalized = categories
    .filter((category) =>
      MAJOR_ASPECT_BODIES.map(_.startCase).includes(category)
    )
    .sort();

  const aspectCapitalized = categories.find((category) =>
    majorAspects.map(_.startCase).includes(category)
  );

  if (bodiesCapitalized.length !== 2 || !aspectCapitalized) {
    throw new Error(
      `Could not extract aspect info from categories: ${categories.join(", ")}`
    );
  }

  const body1Capitalized = bodiesCapitalized[0];
  const body2Capitalized = bodiesCapitalized[1];
  const aspect = aspectCapitalized.toLowerCase() as MajorAspect;

  const body1 = body1Capitalized.toLowerCase() as Body;
  const body2 = body2Capitalized.toLowerCase() as Body;

  const body1Symbol = symbolByBody[body1] as BodySymbol;
  const body2Symbol = symbolByBody[body2] as BodySymbol;
  const aspectSymbol = symbolByMajorAspect[aspect] as MajorAspectSymbol;

  return {
    start: beginning.start,
    end: ending.start,
    summary: `${body1Symbol}${aspectSymbol}${body2Symbol} ${body1Capitalized} ${aspect} ${body2Capitalized}`,
    description: `${body1Capitalized} ${aspect} ${body2Capitalized}`,
    categories: [
      "Astronomy",
      "Astrology",
      "Major Aspect",
      body1Capitalized,
      body2Capitalized,
      aspectCapitalized,
    ],
  };
}
