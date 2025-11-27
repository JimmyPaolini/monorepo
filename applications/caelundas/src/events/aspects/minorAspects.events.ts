import fs from "fs";

import _ from "lodash";

import { type Event, EventTemplate , getCalendar } from "../../calendar.utilities";
import { minorAspects } from "../../constants";
import { upsertEvents } from "../../database.utilities";
import { pairDurationEvents } from "../../duration.utilities";
import { getOutputPath } from "../../output.utilities";
import { symbolByBody, symbolByMinorAspect } from "../../symbols";
import { minorAspectBodies } from "../../types";

import { getMinorAspect, getMinorAspectPhase } from "./aspects.utilities";

import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type {
  AspectPhase,
  Body,
  BodySymbol,
  MinorAspect,
  MinorAspectSymbol,
} from "../../types";
import type { Moment } from "moment";

export function getMinorAspectEvents(args: {
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  currentMinute: Moment;
}) {
  const { coordinateEphemerisByBody, currentMinute } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const minorAspectEvents: Event[] = [];

  for (const body1 of minorAspectBodies) {
    const index = minorAspectBodies.indexOf(body1);
    for (const body2 of minorAspectBodies.slice(index + 1)) {
      if (body1 === body2) {continue;}

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

      const phase = getMinorAspectPhase({
        currentLongitudeBody1,
        currentLongitudeBody2,
        previousLongitudeBody1,
        previousLongitudeBody2,
        nextLongitudeBody1,
        nextLongitudeBody2,
      });

      if (phase) {
        minorAspectEvents.push(
          getMinorAspectEvent({
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

  return minorAspectEvents;
}

export function getMinorAspectEvent(args: {
  longitudeBody1: number;
  longitudeBody2: number;
  timestamp: Date;
  body1: Body;
  body2: Body;
  phase: AspectPhase;
}) {
  const { longitudeBody1, longitudeBody2, timestamp, body1, body2, phase } =
    args;
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

  let description: string;
  let phaseEmoji: string;
  let categories: string[];

  const baseCategories = [
    "Astronomy",
    "Astrology",
    "Minor Aspect",
    body1Capitalized,
    body2Capitalized,
    _.startCase(minorAspect),
  ];

  if (phase === "exact") {
    description = `${body1Capitalized} exact ${minorAspect} ${body2Capitalized}`;
    phaseEmoji = "🎯";
    categories = [...baseCategories, "Exact"];
  } else if (phase === "forming") {
    description = `${body1Capitalized} forming ${minorAspect} ${body2Capitalized}`;
    phaseEmoji = "➡️";
    categories = [...baseCategories, "Forming"];
  } else {
    description = `${body1Capitalized} dissolving ${minorAspect} ${body2Capitalized}`;
    phaseEmoji = "⬅️";
    categories = [...baseCategories, "Dissolving"];
  }

  const summary = `${phaseEmoji} ${body1Symbol} ${minorAspectSymbol} ${body2Symbol} ${description}`;

  console.log(`${summary} at ${timestamp.toISOString()}`);

  const minorAspectEvent: Event = {
    start: timestamp,
    end: timestamp,
    description,
    summary,
    categories,
  };
  return minorAspectEvent;
}

export function writeMinorAspectEvents(args: {
  end: Date;
  minorAspectBodies: Body[];
  minorAspectEvents: Event[];
  start: Date;
}) {
  const { end, minorAspectEvents, minorAspectBodies, start } = args;
  if (_.isEmpty(minorAspectEvents)) {return;}

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${minorAspectEvents.length} minor aspect events from ${timespan}`;
  console.log(`🖇️ Writing ${message}`);

  upsertEvents(minorAspectEvents);

  const minorAspectBodiesString = minorAspectBodies.join(",");
  const minorAspectsCalendar = getCalendar({
    events: minorAspectEvents,
    name: "Minor Aspect 🖇️",
  });
  fs.writeFileSync(
    getOutputPath(`minor-aspects_${minorAspectBodiesString}_${timespan}.ics`),
    new TextEncoder().encode(minorAspectsCalendar)
  );

  console.log(`🖇️ Wrote ${message}`);
}

export function getMinorAspectDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to minor aspect events only
  const minorAspectEvents = events.filter((event) =>
    event.categories.includes("Minor Aspect")
  );

  // Group by body pair and aspect type using categories
  const groupedEvents = _.groupBy(minorAspectEvents, (event) => {
    const planets = event.categories
      .filter((category) =>
        minorAspectBodies.map(_.startCase).includes(category)
      )
      .sort();

    const aspect = event.categories.find((category) =>
      minorAspects.map(_.startCase).includes(category)
    );

    if (planets.length === 2 && aspect) {
      return `${planets[0]}-${aspect}-${planets[1]}`;
    }
    return "";
  });

  // Process each group
  for (const [key, groupEvents] of Object.entries(groupedEvents)) {
    if (!key) {continue;}

    const formingEvents = groupEvents.filter((event) =>
      event.categories.includes("Forming")
    );
    const dissolvingEvents = groupEvents.filter((event) =>
      event.categories.includes("Dissolving")
    );

    const pairs = pairDurationEvents(
      formingEvents,
      dissolvingEvents,
      `minor aspect ${key}`
    );

    durationEvents.push(
      ...pairs.map(([beginning, ending]) =>
        getMinorAspectDurationEvent(beginning, ending)
      )
    );
  }

  return durationEvents;
}

function getMinorAspectDurationEvent(beginning: Event, ending: Event): Event {
  const categories = beginning.categories || [];

  const bodiesCapitalized = categories
    .filter((category) => minorAspectBodies.map(_.startCase).includes(category))
    .sort();

  const aspectCapitalized = categories.find((category) =>
    minorAspects.map(_.startCase).includes(category)
  );

  if (bodiesCapitalized.length !== 2 || !aspectCapitalized) {
    throw new Error(
      `Could not extract aspect info from categories: ${categories.join(", ")}`
    );
  }

  const body1Capitalized = bodiesCapitalized[0];
  const body2Capitalized = bodiesCapitalized[1];
  const aspect = aspectCapitalized.toLowerCase() as MinorAspect;

  const body1 = body1Capitalized.toLowerCase() as Body;
  const body2 = body2Capitalized.toLowerCase() as Body;

  const body1Symbol = symbolByBody[body1] as BodySymbol;
  const body2Symbol = symbolByBody[body2] as BodySymbol;
  const aspectSymbol = symbolByMinorAspect[aspect] as MinorAspectSymbol;

  return {
    start: beginning.start,
    end: ending.start,
    summary: `${body1Symbol}${aspectSymbol}${body2Symbol} ${body1Capitalized} ${aspect} ${body2Capitalized}`,
    description: `${body1Capitalized} ${aspect} ${body2Capitalized}`,
    categories: [
      "Astronomy",
      "Astrology",
      "Simple Aspect",
      "Minor Aspect",
      body1Capitalized,
      body2Capitalized,
      aspectCapitalized,
    ],
  };
}
