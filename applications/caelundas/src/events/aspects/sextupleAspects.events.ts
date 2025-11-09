import fs from "fs";
import _ from "lodash";
import type { Moment } from "moment";
import type { EventTemplate } from "../../calendar.utilities";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type {
  Body,
  BodySymbol,
  SextupleAspect,
  SextupleAspectSymbol,
  AspectPhase,
} from "../../types";
import {
  symbolByBody,
  symbolBySextupleAspect,
  sextupleAspectBodies,
} from "../../constants";
import { type Event, getCalendar } from "../../calendar.utilities";
import { isAspect } from "./aspects.utilities";
import { getAngle, getCombinations } from "../../math.utilities";
import { upsertEvents } from "../../database.utilities";
import { getOutputPath } from "../../output.utilities";
import { couldBeHexagram } from "./aspects.cache";

type SextupleAspectDescription =
  /* @ts-ignore - Expression produces a union type that is too complex to represent */
  `${Capitalize<Body>}, ${Capitalize<Body>}, ${Capitalize<Body>}, ${Capitalize<Body>}, ${Capitalize<Body>}, ${Capitalize<Body>} ${SextupleAspect} ${AspectPhase}`;

type SextupleAspectSummary =
  /* @ts-ignore - Expression produces a union type that is too complex to represent */
  `${string}${SextupleAspectSymbol} ${BodySymbol}-${BodySymbol}-${BodySymbol}-${BodySymbol}-${BodySymbol}-${BodySymbol} ${SextupleAspectDescription}`;

export interface SextupleAspectEventTemplate extends EventTemplate {
  description: SextupleAspectDescription;
  summary: SextupleAspectSummary;
}

export interface SextupleAspectEvent extends Event {
  description: SextupleAspectDescription;
  summary: SextupleAspectSummary;
}

// #region Hexagram / Grand Sextile

function calculateHexagramTightness(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
  longitude5: number;
  longitude6: number;
}): number {
  const {
    longitude1,
    longitude2,
    longitude3,
    longitude4,
    longitude5,
    longitude6,
  } = args;

  // Hexagram/Grand Sextile: 6 planets evenly spaced at 60° intervals
  // This creates two interlocking Grand Trines (one at 0°-120°-240°, another at 60°-180°-300°)
  // All planets should be in sextile (60°) to their neighbors and trine (120°) to alternating planets

  // For a perfect hexagram, planets alternate between sextile (60°) and trine (120°)
  // The 6 planets form a hexagon with alternating angles of 60° and 120°
  // We need to find the configuration that minimizes total deviation

  // Try all possible orderings and find the one with minimum deviation
  const planets = [
    longitude1,
    longitude2,
    longitude3,
    longitude4,
    longitude5,
    longitude6,
  ];
  let minTotalDeviation = Infinity;

  // For each possible starting planet and direction
  for (let start = 0; start < 6; start++) {
    // Sort planets by angle from the starting planet
    const sortedByAngle = planets
      .map((longitude, index) => ({
        longitude,
        index,
        angle: getAngle(planets[start], longitude),
      }))
      .sort((a, b) => a.angle - b.angle);

    // Check if this ordering creates a valid hexagram
    let totalDeviation = 0;
    for (let i = 0; i < 6; i++) {
      const current = sortedByAngle[i].longitude;
      const next = sortedByAngle[(i + 1) % 6].longitude;
      const angle = getAngle(current, next);

      // Each consecutive pair should be ~60° apart
      totalDeviation += Math.abs(angle - 60);
    }

    minTotalDeviation = Math.min(minTotalDeviation, totalDeviation);
  }

  return minTotalDeviation;
}

function detectHexagram(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
  longitude5: number;
  longitude6: number;
}): boolean {
  const {
    longitude1,
    longitude2,
    longitude3,
    longitude4,
    longitude5,
    longitude6,
  } = args;

  // A Hexagram/Grand Sextile requires:
  // - 6 planets evenly spaced around the zodiac
  // - Each planet in sextile (60°) to its 2 neighbors
  // - Each planet in trine (120°) to the 2 planets two positions away
  // - Each planet in opposition (180°) to the planet directly across

  // Sort planets by longitude to establish order
  const planets = [
    { longitude: longitude1, index: 1 },
    { longitude: longitude2, index: 2 },
    { longitude: longitude3, index: 3 },
    { longitude: longitude4, index: 4 },
    { longitude: longitude5, index: 5 },
    { longitude: longitude6, index: 6 },
  ].sort((a, b) => a.longitude - b.longitude);

  // Check if consecutive planets are in sextile (60°)
  for (let i = 0; i < 6; i++) {
    const longitudeBody1 = planets[i].longitude;
    const longitudeBody2 = planets[(i + 1) % 6].longitude;

    if (!isAspect({ longitudeBody1, longitudeBody2, aspect: "sextile" })) {
      return false;
    }
  }

  // Additionally check that opposite planets are in opposition (180°)
  for (let i = 0; i < 3; i++) {
    const longitudeBody1 = planets[i].longitude;
    const longitudeBody2 = planets[(i + 3) % 6].longitude;

    if (!isAspect({ longitudeBody1, longitudeBody2, aspect: "opposite" })) {
      return false;
    }
  }

  return true;
}

// #endregion Hexagram / Grand Sextile

function calculatePatternTightness(args: {
  patternType: SextupleAspect;
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
  longitude5: number;
  longitude6: number;
}): number {
  const {
    patternType,
    longitude1,
    longitude2,
    longitude3,
    longitude4,
    longitude5,
    longitude6,
  } = args;

  switch (patternType) {
    case "hexagram":
      return calculateHexagramTightness({
        longitude1,
        longitude2,
        longitude3,
        longitude4,
        longitude5,
        longitude6,
      });
    default:
      throw new Error(`Unknown pattern type: ${patternType}`);
  }
}

export function getSextupleAspectEvents(args: {
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  currentMinute: Moment;
}) {
  const { coordinateEphemerisByBody, currentMinute } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const sextupleAspectEvents: SextupleAspectEvent[] = [];

  // Check all combinations of 6 bodies: C(10,6) = 210 combinations
  const combinations = getCombinations(sextupleAspectBodies, 6);

  for (const [body1, body2, body3, body4, body5, body6] of combinations) {
    const ephemerisBody1 = coordinateEphemerisByBody[body1];
    const ephemerisBody2 = coordinateEphemerisByBody[body2];
    const ephemerisBody3 = coordinateEphemerisByBody[body3];
    const ephemerisBody4 = coordinateEphemerisByBody[body4];
    const ephemerisBody5 = coordinateEphemerisByBody[body5];
    const ephemerisBody6 = coordinateEphemerisByBody[body6];

    const { longitude: currentLongitude1 } =
      ephemerisBody1[currentMinute.toISOString()];
    const { longitude: currentLongitude2 } =
      ephemerisBody2[currentMinute.toISOString()];
    const { longitude: currentLongitude3 } =
      ephemerisBody3[currentMinute.toISOString()];
    const { longitude: currentLongitude4 } =
      ephemerisBody4[currentMinute.toISOString()];
    const { longitude: currentLongitude5 } =
      ephemerisBody5[currentMinute.toISOString()];
    const { longitude: currentLongitude6 } =
      ephemerisBody6[currentMinute.toISOString()];

    // Quick pre-filter: skip this combination if it can't possibly form a hexagram
    const currentLongitudes: [number, number, number, number, number, number] =
      [
        currentLongitude1,
        currentLongitude2,
        currentLongitude3,
        currentLongitude4,
        currentLongitude5,
        currentLongitude6,
      ];

    if (!couldBeHexagram(currentLongitudes)) {
      continue;
    }

    const { longitude: previousLongitude1 } =
      ephemerisBody1[previousMinute.toISOString()];
    const { longitude: previousLongitude2 } =
      ephemerisBody2[previousMinute.toISOString()];
    const { longitude: previousLongitude3 } =
      ephemerisBody3[previousMinute.toISOString()];
    const { longitude: previousLongitude4 } =
      ephemerisBody4[previousMinute.toISOString()];
    const { longitude: previousLongitude5 } =
      ephemerisBody5[previousMinute.toISOString()];
    const { longitude: previousLongitude6 } =
      ephemerisBody6[previousMinute.toISOString()];

    const { longitude: nextLongitude1 } =
      ephemerisBody1[nextMinute.toISOString()];
    const { longitude: nextLongitude2 } =
      ephemerisBody2[nextMinute.toISOString()];
    const { longitude: nextLongitude3 } =
      ephemerisBody3[nextMinute.toISOString()];
    const { longitude: nextLongitude4 } =
      ephemerisBody4[nextMinute.toISOString()];
    const { longitude: nextLongitude5 } =
      ephemerisBody5[nextMinute.toISOString()];
    const { longitude: nextLongitude6 } =
      ephemerisBody6[nextMinute.toISOString()];

    // Check for Hexagram (only if pre-filter passed)
    const currentHexagram = detectHexagram({
      longitude1: currentLongitude1,
      longitude2: currentLongitude2,
      longitude3: currentLongitude3,
      longitude4: currentLongitude4,
      longitude5: currentLongitude5,
      longitude6: currentLongitude6,
    });

    if (currentHexagram) {
      const previousHexagram = detectHexagram({
        longitude1: previousLongitude1,
        longitude2: previousLongitude2,
        longitude3: previousLongitude3,
        longitude4: previousLongitude4,
        longitude5: previousLongitude5,
        longitude6: previousLongitude6,
      });

      const nextHexagram = detectHexagram({
        longitude1: nextLongitude1,
        longitude2: nextLongitude2,
        longitude3: nextLongitude3,
        longitude4: nextLongitude4,
        longitude5: nextLongitude5,
        longitude6: nextLongitude6,
      });

      const phase = getSextupleAspectPhase({
        pattern: "hexagram",
        previousLongitude1,
        previousLongitude2,
        previousLongitude3,
        previousLongitude4,
        previousLongitude5,
        previousLongitude6,
        currentLongitude1,
        currentLongitude2,
        currentLongitude3,
        currentLongitude4,
        currentLongitude5,
        currentLongitude6,
        nextLongitude1,
        nextLongitude2,
        nextLongitude3,
        nextLongitude4,
        nextLongitude5,
        nextLongitude6,
        previousExists: previousHexagram,
        currentExists: currentHexagram,
        nextExists: nextHexagram,
      });

      if (phase) {
        sextupleAspectEvents.push(
          getSextupleAspectEvent({
            timestamp: currentMinute.toDate(),
            body1,
            body2,
            body3,
            body4,
            body5,
            body6,
            sextupleAspect: "hexagram",
            phase,
          })
        );
      }
    }
  }

  return sextupleAspectEvents;
}

function getSextupleAspectPhase(args: {
  pattern: SextupleAspect;
  previousLongitude1: number;
  previousLongitude2: number;
  previousLongitude3: number;
  previousLongitude4: number;
  previousLongitude5: number;
  previousLongitude6: number;
  currentLongitude1: number;
  currentLongitude2: number;
  currentLongitude3: number;
  currentLongitude4: number;
  currentLongitude5: number;
  currentLongitude6: number;
  nextLongitude1: number;
  nextLongitude2: number;
  nextLongitude3: number;
  nextLongitude4: number;
  nextLongitude5: number;
  nextLongitude6: number;
  previousExists: boolean;
  currentExists: boolean;
  nextExists: boolean;
}): AspectPhase | null {
  const {
    pattern,
    previousLongitude1,
    previousLongitude2,
    previousLongitude3,
    previousLongitude4,
    previousLongitude5,
    previousLongitude6,
    currentLongitude1,
    currentLongitude2,
    currentLongitude3,
    currentLongitude4,
    currentLongitude5,
    currentLongitude6,
    nextLongitude1,
    nextLongitude2,
    nextLongitude3,
    nextLongitude4,
    nextLongitude5,
    nextLongitude6,
    previousExists,
    currentExists,
    nextExists,
  } = args;

  if (!currentExists) return null;

  const previousTightness = previousExists
    ? calculatePatternTightness({
        patternType: pattern,
        longitude1: previousLongitude1,
        longitude2: previousLongitude2,
        longitude3: previousLongitude3,
        longitude4: previousLongitude4,
        longitude5: previousLongitude5,
        longitude6: previousLongitude6,
      })
    : Infinity;

  const currentTightness = calculatePatternTightness({
    patternType: pattern,
    longitude1: currentLongitude1,
    longitude2: currentLongitude2,
    longitude3: currentLongitude3,
    longitude4: currentLongitude4,
    longitude5: currentLongitude5,
    longitude6: currentLongitude6,
  });

  const nextTightness = nextExists
    ? calculatePatternTightness({
        patternType: pattern,
        longitude1: nextLongitude1,
        longitude2: nextLongitude2,
        longitude3: nextLongitude3,
        longitude4: nextLongitude4,
        longitude5: nextLongitude5,
        longitude6: nextLongitude6,
      })
    : Infinity;

  if (
    currentTightness < previousTightness &&
    currentTightness < nextTightness
  ) {
    return "exact";
  }

  if (!previousExists && currentExists) {
    return "forming";
  }

  if (currentExists && !nextExists) {
    return "dissolving";
  }

  return null;
}

// #region Events

function getSextupleAspectEvent(args: {
  timestamp: Date;
  body1: Body;
  body2: Body;
  body3: Body;
  body4: Body;
  body5: Body;
  body6: Body;
  sextupleAspect: SextupleAspect;
  phase: AspectPhase;
}): SextupleAspectEvent {
  const {
    timestamp,
    body1,
    body2,
    body3,
    body4,
    body5,
    body6,
    sextupleAspect,
    phase,
  } = args;

  const body1Capitalized = _.startCase(body1) as Capitalize<Body>;
  const body2Capitalized = _.startCase(body2) as Capitalize<Body>;
  const body3Capitalized = _.startCase(body3) as Capitalize<Body>;
  const body4Capitalized = _.startCase(body4) as Capitalize<Body>;
  const body5Capitalized = _.startCase(body5) as Capitalize<Body>;
  const body6Capitalized = _.startCase(body6) as Capitalize<Body>;

  const body1Symbol = symbolByBody[body1] as BodySymbol;
  const body2Symbol = symbolByBody[body2] as BodySymbol;
  const body3Symbol = symbolByBody[body3] as BodySymbol;
  const body4Symbol = symbolByBody[body4] as BodySymbol;
  const body5Symbol = symbolByBody[body5] as BodySymbol;
  const body6Symbol = symbolByBody[body6] as BodySymbol;
  const sextupleAspectSymbol = symbolBySextupleAspect[
    sextupleAspect
  ] as SextupleAspectSymbol;

  // Sort bodies alphabetically for consistent event naming
  const bodiesSorted = [
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
    body4Capitalized,
    body5Capitalized,
    body6Capitalized,
  ].sort();

  const description =
    `${bodiesSorted[0]}, ${bodiesSorted[1]}, ${bodiesSorted[2]}, ${bodiesSorted[3]}, ${bodiesSorted[4]}, ${bodiesSorted[5]} ${sextupleAspect} ${phase}` as SextupleAspectDescription;

  // Add phase emoji
  let phaseEmoji = "";
  if (phase === "forming") {
    phaseEmoji = "➡️ ";
  } else if (phase === "exact") {
    phaseEmoji = "🎯 ";
  } else if (phase === "dissolving") {
    phaseEmoji = "⬅️ ";
  }

  const summary = `${phaseEmoji}${sextupleAspectSymbol} ${body1Symbol}-${body2Symbol}-${body3Symbol}-${body4Symbol}-${body5Symbol}-${body6Symbol} ${description}`;

  console.log(`${summary} at ${timestamp.toISOString()}`);

  const categories = [
    "Astronomy",
    "Astrology",
    "Sextuple Aspect",
    _.startCase(sextupleAspect),
    _.startCase(phase),
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
    body4Capitalized,
    body5Capitalized,
    body6Capitalized,
  ];

  const sextupleAspectEvent: SextupleAspectEvent = {
    start: timestamp,
    end: timestamp,
    description,
    summary,
    categories,
  };

  return sextupleAspectEvent;
}

// #endregion Events

export function writeSextupleAspectEvents(args: {
  end: Date;
  sextupleAspectBodies: Body[];
  sextupleAspectEvents: SextupleAspectEvent[];
  start: Date;
}) {
  const { end, sextupleAspectEvents, sextupleAspectBodies, start } = args;
  if (_.isEmpty(sextupleAspectEvents)) return;

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${sextupleAspectEvents.length} sextuple aspect events from ${timespan}`;
  console.log(`🔯 Writing ${message}`);

  upsertEvents(sextupleAspectEvents);

  const sextupleAspectBodiesString = sextupleAspectBodies.join(",");
  const sextupleAspectsCalendar = getCalendar({
    events: sextupleAspectEvents,
    name: "Sextuple Aspect 🔯",
  });
  fs.writeFileSync(
    getOutputPath(
      `sextuple-aspects_${sextupleAspectBodiesString}_${timespan}.ics`
    ),
    new TextEncoder().encode(sextupleAspectsCalendar)
  );

  console.log(`🔯 Wrote ${message}`);
}

// #region Duration Events

export function getSextupleAspectDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to sextuple aspect events only
  const sextupleAspectEvents = events.filter((event) =>
    event.categories.includes("Sextuple Aspect")
  ) as SextupleAspectEvent[];

  // Group by body sextet and aspect type using categories
  const groupedEvents = _.groupBy(sextupleAspectEvents, (event) => {
    const planets = event.categories
      .filter((category) =>
        sextupleAspectBodies.map(_.startCase).includes(category)
      )
      .sort();

    const aspect = event.categories.find((category) =>
      ["Hexagram", "Grand Sextile"].includes(category)
    );

    return `${planets.join("-")}_${aspect}`;
  });

  // Process each group to find forming/dissolving pairs
  for (const group of Object.values(groupedEvents)) {
    const sortedEvents = _.sortBy(group, "start");

    for (let i = 0; i < sortedEvents.length; i++) {
      const currentEvent = sortedEvents[i];

      // Skip if not a forming event
      if (!currentEvent.categories.includes("Forming")) continue;

      // Look for the next dissolving event
      for (let j = i + 1; j < sortedEvents.length; j++) {
        const potentialDissolvingEvent = sortedEvents[j];

        if (potentialDissolvingEvent.categories.includes("Dissolving")) {
          // Create duration event
          durationEvents.push({
            start: currentEvent.start,
            end: potentialDissolvingEvent.start,
            summary: currentEvent.summary.replace(/^[➡️🎯⬅️]\s/, ""),
            description: currentEvent.description.replace(
              / (forming|exact|dissolving)$/,
              ""
            ),
            categories: currentEvent.categories.filter(
              (c) => c !== "Forming" && c !== "Exact" && c !== "Dissolving"
            ),
          });

          break; // Found the pair, move to next forming event
        }
      }
    }
  }

  return durationEvents;
}

// #endregion Duration Events
