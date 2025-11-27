import fs from "fs";

import _ from "lodash";

import { type Event, getCalendar } from "../../calendar.utilities";
import { majorAspects } from "../../constants";
import { pairDurationEvents } from "../../duration.utilities";
import { getCoordinateFromEphemeris } from "../../ephemeris/ephemeris.service";
import { getOutputPath } from "../../output.utilities";
import { symbolByBody, symbolByMajorAspect } from "../../symbols";
import { majorAspectBodies } from "../../types";

import { getMajorAspect, getMajorAspectPhase } from "./aspects.utilities";

import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type {
  AspectPhase,
  Body,
  BodySymbol,
  MajorAspect,
  MajorAspectSymbol,
} from "../../types";
import type { Moment } from "moment";

export function getMajorAspectEvents(args: {
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  currentMinute: Moment;
}): Event[] {
  const { coordinateEphemerisByBody, currentMinute } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const majorAspectEvents: Event[] = [];

  for (const body1 of majorAspectBodies) {
    const index = majorAspectBodies.indexOf(body1);
    for (const body2 of majorAspectBodies.slice(index + 1)) {
      if (body1 === body2) {
        continue;
      }

      const ephemerisBody1 = coordinateEphemerisByBody[body1];
      const ephemerisBody2 = coordinateEphemerisByBody[body2];

      const currentLongitudeBody1 = getCoordinateFromEphemeris(
        ephemerisBody1,
        currentMinute.toISOString(),
        "longitude",
      );
      const currentLongitudeBody2 = getCoordinateFromEphemeris(
        ephemerisBody2,
        currentMinute.toISOString(),
        "longitude",
      );
      const previousLongitudeBody1 = getCoordinateFromEphemeris(
        ephemerisBody1,
        previousMinute.toISOString(),
        "longitude",
      );
      const previousLongitudeBody2 = getCoordinateFromEphemeris(
        ephemerisBody2,
        previousMinute.toISOString(),
        "longitude",
      );
      const nextLongitudeBody1 = getCoordinateFromEphemeris(
        ephemerisBody1,
        nextMinute.toISOString(),
        "longitude",
      );
      const nextLongitudeBody2 = getCoordinateFromEphemeris(
        ephemerisBody2,
        nextMinute.toISOString(),
        "longitude",
      );

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
          }),
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
}): Event {
  const { longitudeBody1, longitudeBody2, timestamp, body1, body2, phase } =
    args;
  const majorAspect = getMajorAspect({ longitudeBody1, longitudeBody2 });
  if (!majorAspect) {
    console.error(
      `No major aspect found between ${body1} and ${body2} at ${timestamp.toISOString()}: ${longitudeBody1} and ${longitudeBody2}`,
    );
    throw new Error("No major aspect found");
  }

  const body1Capitalized = _.startCase(body1) as Capitalize<Body>;
  const body2Capitalized = _.startCase(body2) as Capitalize<Body>;

  const body1Symbol = symbolByBody[body1] as BodySymbol;
  const body2Symbol = symbolByBody[body2] as BodySymbol;
  const majorAspectSymbol = symbolByMajorAspect[majorAspect as MajorAspect];

  let description: string;
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
    description = `${body1Capitalized} exact ${majorAspect} ${body2Capitalized}`;
    phaseEmoji = "🎯";
    categories = [...baseCategories, "Exact"];
  } else if (phase === "forming") {
    description = `${body1Capitalized} forming ${majorAspect} ${body2Capitalized}`;
    phaseEmoji = "➡️";
    categories = [...baseCategories, "Forming"];
  } else {
    description = `${body1Capitalized} dissolving ${majorAspect} ${body2Capitalized}`;
    phaseEmoji = "⬅️";
    categories = [...baseCategories, "Dissolving"];
  }

  const summary = `${phaseEmoji} ${body1Symbol} ${majorAspectSymbol} ${body2Symbol} ${description}`;

  console.log(`${summary} at ${timestamp.toISOString()}`);

  const majorAspectEvent: Event = {
    start: timestamp,
    end: timestamp,
    description,
    summary,
    categories,
  };
  return majorAspectEvent;
}

export function writeMajorAspectEvents(args: {
  end: Date;
  majorAspectBodies: Body[];
  majorAspectEvents: Event[];
  start: Date;
}): void {
  const { end, majorAspectEvents, majorAspectBodies, start } = args;
  if (_.isEmpty(majorAspectEvents)) {
    return;
  }

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${majorAspectEvents.length} major aspect events from ${timespan}`;
  console.log(`📐 Writing ${message}`);

  const majorAspectBodiesString = majorAspectBodies.join(",");
  const majorAspectsCalendar = getCalendar({
    events: majorAspectEvents,
    name: "Major Aspect 📐",
  });
  fs.writeFileSync(
    getOutputPath(`major-aspects_${majorAspectBodiesString}_${timespan}.ics`),
    new TextEncoder().encode(majorAspectsCalendar),
  );

  console.log(`📐 Wrote ${message}`);
}

export function getMajorAspectDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to major aspect events only
  const majorAspectEvents = events.filter((event) =>
    event.categories.includes("Major Aspect"),
  );

  // Group by body pair and aspect type using categories
  const groupedEvents = _.groupBy(majorAspectEvents, (event) => {
    const planets = event.categories
      .filter((category) =>
        majorAspectBodies
          .map((majorAspectBody) => _.startCase(majorAspectBody))
          .includes(category),
      )
      .sort();

    const aspect = event.categories.find((category) =>
      majorAspects
        .map((majorAspect) => _.startCase(majorAspect))
        .includes(category),
    );

    if (planets.length === 2 && aspect) {
      return `${planets[0]}-${aspect}-${planets[1]}`;
    }
    return "";
  });

  // Process each group
  for (const [key, groupEvents] of Object.entries(groupedEvents)) {
    if (!key) {
      continue;
    }

    const formingEvents = groupEvents.filter((event) =>
      event.categories.includes("Forming"),
    );
    const dissolvingEvents = groupEvents.filter((event) =>
      event.categories.includes("Dissolving"),
    );

    const pairs = pairDurationEvents(
      formingEvents,
      dissolvingEvents,
      `major aspect ${key}`,
    );

    durationEvents.push(
      ...pairs.map(([beginning, ending]) =>
        getMajorAspectDurationEvent(beginning, ending),
      ),
    );
  }

  return durationEvents;
}

function getMajorAspectDurationEvent(beginning: Event, ending: Event): Event {
  const bodiesCapitalized = beginning.categories
    .filter((category) =>
      majorAspectBodies
        .map((majorAspectBody) => _.startCase(majorAspectBody))
        .includes(category),
    )
    .sort();

  const aspectCapitalized = beginning.categories.find((category) =>
    majorAspects
      .map((majorAspect) => _.startCase(majorAspect))
      .includes(category),
  );

  if (bodiesCapitalized.length !== 2 || !aspectCapitalized) {
    throw new Error(
      `Could not extract aspect info from categories: ${beginning.categories.join(
        ", ",
      )}`,
    );
  }

  const body1Capitalized = bodiesCapitalized[0] ?? "";
  const body2Capitalized = bodiesCapitalized[1] ?? "";
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
      "Simple Aspect",
      "Major Aspect",
      body1Capitalized,
      body2Capitalized,
      aspectCapitalized,
    ],
  };
}
