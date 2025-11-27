import fs from "fs";

import _ from "lodash";

import { type Event, getCalendar } from "../../calendar.utilities";
import { specialtyAspects } from "../../constants";
import { pairDurationEvents } from "../../duration.utilities";
import { getCoordinateFromEphemeris } from "../../ephemeris/ephemeris.service";
import { getOutputPath } from "../../output.utilities";
import { symbolByBody, symbolBySpecialtyAspect } from "../../symbols";
import { specialtyAspectBodies } from "../../types";

import {
  getSpecialtyAspect,
  getSpecialtyAspectPhase,
} from "./aspects.utilities";

import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type {
  AspectPhase,
  Body,
  BodySymbol,
  SpecialtyAspect,
  SpecialtyAspectSymbol,
} from "../../types";
import type { Moment } from "moment";

export function getSpecialtyAspectEvents(args: {
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  currentMinute: Moment;
}): Event[] {
  const { coordinateEphemerisByBody, currentMinute } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const specialtyAspectEvents: Event[] = [];

  for (const body1 of specialtyAspectBodies) {
    const index = specialtyAspectBodies.indexOf(body1);
    for (const body2 of specialtyAspectBodies.slice(index + 1)) {
      if (body1 === body2) {
        continue;
      }

      const ephemerisBody1 = coordinateEphemerisByBody[body1];
      const ephemerisBody2 = coordinateEphemerisByBody[body2];

      const currentLongitudeBody1 = getCoordinateFromEphemeris(
        ephemerisBody1,
        currentMinute.toISOString(),
        "longitude"
      );
      const currentLongitudeBody2 = getCoordinateFromEphemeris(
        ephemerisBody2,
        currentMinute.toISOString(),
        "longitude"
      );
      const previousLongitudeBody1 = getCoordinateFromEphemeris(
        ephemerisBody1,
        previousMinute.toISOString(),
        "longitude"
      );
      const previousLongitudeBody2 = getCoordinateFromEphemeris(
        ephemerisBody2,
        previousMinute.toISOString(),
        "longitude"
      );
      const nextLongitudeBody1 = getCoordinateFromEphemeris(
        ephemerisBody1,
        nextMinute.toISOString(),
        "longitude"
      );
      const nextLongitudeBody2 = getCoordinateFromEphemeris(
        ephemerisBody2,
        nextMinute.toISOString(),
        "longitude"
      );

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
}): Event {
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
  const specialtyAspectSymbol: SpecialtyAspectSymbol =
    symbolBySpecialtyAspect[specialtyAspect as SpecialtyAspect];

  let description: string;
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
    description = `${body1Capitalized} exact ${specialtyAspect} ${body2Capitalized}`;
    phaseEmoji = "🎯";
    categories = [...baseCategories, "Exact"];
  } else if (phase === "forming") {
    description = `${body1Capitalized} forming ${specialtyAspect} ${body2Capitalized}`;
    phaseEmoji = "➡️";
    categories = [...baseCategories, "Forming"];
  } else {
    description = `${body1Capitalized} dissolving ${specialtyAspect} ${body2Capitalized}`;
    phaseEmoji = "⬅️";
    categories = [...baseCategories, "Dissolving"];
  }

  const summary = `${phaseEmoji} ${body1Symbol} ${specialtyAspectSymbol} ${body2Symbol} ${description}`;

  console.log(`${summary} at ${timestamp.toISOString()}`);

  const specialtyAspectEvent: Event = {
    start: timestamp,
    end: timestamp,
    description,
    summary,
    categories,
  };
  return specialtyAspectEvent;
}

export function writeSpecialtyAspectEvents(args: {
  end: Date;
  specialtyAspectBodies: Body[];
  specialtyAspectEvents: Event[];
  start: Date;
}): void {
  const { end, specialtyAspectEvents, specialtyAspectBodies, start } = args;
  if (_.isEmpty(specialtyAspectEvents)) {
    return;
  }

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${specialtyAspectEvents.length} specialty aspect events from ${timespan}`;
  console.log(`🧮 Writing ${message}`);

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
  );

  // Group by body pair and aspect type using categories
  const groupedEvents = _.groupBy(specialtyAspectEvents, (event) => {
    const planets = event.categories
      .filter((category) =>
        specialtyAspectBodies
          .map((specialtyAspectBody) => _.startCase(specialtyAspectBody))
          .includes(category)
      )
      .sort();

    const aspect = event.categories.find((category) =>
      specialtyAspects
        .map((specialtyAspect) => _.startCase(specialtyAspect))
        .includes(category)
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
      event.categories.includes("Forming")
    );
    const dissolvingEvents = groupEvents.filter((event) =>
      event.categories.includes("Dissolving")
    );

    const pairs = pairDurationEvents(
      formingEvents,
      dissolvingEvents,
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
  beginning: Event,
  ending: Event
): Event {
  const bodiesCapitalized = beginning.categories
    .filter((category) =>
      specialtyAspectBodies
        .map((specialtyAspectBody) => _.startCase(specialtyAspectBody))
        .includes(category)
    )
    .sort();

  const aspectCapitalized = beginning.categories.find((category) =>
    specialtyAspects
      .map((specialtyAspect) => _.startCase(specialtyAspect))
      .includes(category)
  );

  if (bodiesCapitalized.length !== 2 || !aspectCapitalized) {
    throw new Error(
      `Could not extract aspect info from categories: ${beginning.categories.join(
        ", "
      )}`
    );
  }

  const body1Capitalized = bodiesCapitalized[0] ?? "";
  const body2Capitalized = bodiesCapitalized[1] ?? "";
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
      "Simple Aspect",
      "Specialty Aspect",
      body1Capitalized,
      body2Capitalized,
      aspectCapitalized,
    ],
  };
}
