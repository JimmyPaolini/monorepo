import fs from "fs";
import _ from "lodash";
import type { Moment } from "moment";
import type { EventTemplate } from "../../calendar.utilities";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type {
  Body,
  BodySymbol,
  QuintupleAspect,
  QuintupleAspectSymbol,
  AspectPhase,
} from "../../types";
import {
  symbolByBody,
  symbolByQuintupleAspect,
  quintupleAspectBodies,
} from "../../constants";
import { type Event, getCalendar } from "../../calendar.utilities";
import { isAspect } from "./aspects.utilities";
import { getAngle, getCombinations } from "../../math.utilities";
import { upsertEvents } from "../../database.utilities";
import { getOutputPath } from "../../output.utilities";
import { couldBePentagram } from "./aspects.cache";

type QuintupleAspectDescription =
  /* @ts-ignore - Expression produces a union type that is too complex to represent */
  `${Capitalize<Body>}, ${Capitalize<Body>}, ${Capitalize<Body>}, ${Capitalize<Body>}, ${Capitalize<Body>} ${QuintupleAspect} ${AspectPhase}`;

type QuintupleAspectSummary =
  /* @ts-ignore - Expression produces a union type that is too complex to represent */
  `${string}${QuintupleAspectSymbol} ${BodySymbol}-${BodySymbol}-${BodySymbol}-${BodySymbol}-${BodySymbol} ${QuintupleAspectDescription}`;

export interface QuintupleAspectEventTemplate extends EventTemplate {
  description: QuintupleAspectDescription;
  summary: QuintupleAspectSummary;
}

export interface QuintupleAspectEvent extends Event {
  description: QuintupleAspectDescription;
  summary: QuintupleAspectSummary;
}

// #region Pentagram

function calculatePentagramTightness(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
  longitude5: number;
}): number {
  const { longitude1, longitude2, longitude3, longitude4, longitude5 } = args;

  // Pentagram: All 10 pairs of planets should be in quintile (72°) or biquintile (144°) aspects
  // forming a pentagonal star shape
  // The 5 planets form a pentagon when spaced 72° apart
  // Each planet makes quintile aspects (72° or 144°) with all other planets

  // Calculate all 10 pairwise angles
  const angles = [
    getAngle(longitude1, longitude2),
    getAngle(longitude1, longitude3),
    getAngle(longitude1, longitude4),
    getAngle(longitude1, longitude5),
    getAngle(longitude2, longitude3),
    getAngle(longitude2, longitude4),
    getAngle(longitude2, longitude5),
    getAngle(longitude3, longitude4),
    getAngle(longitude3, longitude5),
    getAngle(longitude4, longitude5),
  ];

  // For a perfect pentagram, each angle should be either 72° (quintile) or 144° (biquintile)
  // Calculate total deviation from these ideal angles
  let totalDeviation = 0;
  for (const angle of angles) {
    // Find the closest ideal angle (72° or 144°)
    const deviationFrom72 = Math.abs(angle - 72);
    const deviationFrom144 = Math.abs(angle - 144);
    totalDeviation += Math.min(deviationFrom72, deviationFrom144);
  }

  return totalDeviation;
}

function detectPentagram(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
  longitude5: number;
}): boolean {
  const { longitude1, longitude2, longitude3, longitude4, longitude5 } = args;

  // A Pentagram requires all 10 pairs to be in quintile (72°) or biquintile (144°) aspects
  const pairs = [
    [longitude1, longitude2],
    [longitude1, longitude3],
    [longitude1, longitude4],
    [longitude1, longitude5],
    [longitude2, longitude3],
    [longitude2, longitude4],
    [longitude2, longitude5],
    [longitude3, longitude4],
    [longitude3, longitude5],
    [longitude4, longitude5],
  ] as const;

  // Check if all pairs have quintile or biquintile aspects
  return pairs.every(
    ([longitudeBody1, longitudeBody2]) =>
      isAspect({ longitudeBody1, longitudeBody2, aspect: "quintile" }) ||
      isAspect({ longitudeBody1, longitudeBody2, aspect: "biquintile" })
  );
}

// #endregion Pentagram

function calculatePatternTightness(args: {
  patternType: QuintupleAspect;
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
  longitude5: number;
}): number {
  const {
    patternType,
    longitude1,
    longitude2,
    longitude3,
    longitude4,
    longitude5,
  } = args;

  switch (patternType) {
    case "pentagram":
      return calculatePentagramTightness({
        longitude1,
        longitude2,
        longitude3,
        longitude4,
        longitude5,
      });
    default:
      throw new Error(`Unknown pattern type: ${patternType}`);
  }
}

export function getQuintupleAspectEvents(args: {
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  currentMinute: Moment;
}) {
  const { coordinateEphemerisByBody, currentMinute } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const quintupleAspectEvents: QuintupleAspectEvent[] = [];

  // Check all combinations of 5 bodies: C(10,5) = 252 combinations
  const combinations = getCombinations(quintupleAspectBodies, 5);

  for (const [body1, body2, body3, body4, body5] of combinations) {
    const ephemerisBody1 = coordinateEphemerisByBody[body1];
    const ephemerisBody2 = coordinateEphemerisByBody[body2];
    const ephemerisBody3 = coordinateEphemerisByBody[body3];
    const ephemerisBody4 = coordinateEphemerisByBody[body4];
    const ephemerisBody5 = coordinateEphemerisByBody[body5];

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

    // Quick pre-filter: skip this combination if it can't possibly form a pentagram
    const currentLongitudes: [number, number, number, number, number] = [
      currentLongitude1,
      currentLongitude2,
      currentLongitude3,
      currentLongitude4,
      currentLongitude5,
    ];

    if (!couldBePentagram(currentLongitudes)) {
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

    // Check for Pentagram (only if pre-filter passed)
    const currentPentagram = detectPentagram({
      longitude1: currentLongitude1,
      longitude2: currentLongitude2,
      longitude3: currentLongitude3,
      longitude4: currentLongitude4,
      longitude5: currentLongitude5,
    });

    if (currentPentagram) {
      const previousPentagram = detectPentagram({
        longitude1: previousLongitude1,
        longitude2: previousLongitude2,
        longitude3: previousLongitude3,
        longitude4: previousLongitude4,
        longitude5: previousLongitude5,
      });

      const nextPentagram = detectPentagram({
        longitude1: nextLongitude1,
        longitude2: nextLongitude2,
        longitude3: nextLongitude3,
        longitude4: nextLongitude4,
        longitude5: nextLongitude5,
      });

      const phase = getQuintupleAspectPhase({
        pattern: "pentagram",
        previousLongitude1,
        previousLongitude2,
        previousLongitude3,
        previousLongitude4,
        previousLongitude5,
        currentLongitude1,
        currentLongitude2,
        currentLongitude3,
        currentLongitude4,
        currentLongitude5,
        nextLongitude1,
        nextLongitude2,
        nextLongitude3,
        nextLongitude4,
        nextLongitude5,
        previousExists: previousPentagram,
        currentExists: currentPentagram,
        nextExists: nextPentagram,
      });

      if (phase) {
        quintupleAspectEvents.push(
          getQuintupleAspectEvent({
            timestamp: currentMinute.toDate(),
            body1,
            body2,
            body3,
            body4,
            body5,
            quintupleAspect: "pentagram",
            phase,
          })
        );
      }
    }
  }

  return quintupleAspectEvents;
}

function getQuintupleAspectPhase(args: {
  pattern: QuintupleAspect;
  previousLongitude1: number;
  previousLongitude2: number;
  previousLongitude3: number;
  previousLongitude4: number;
  previousLongitude5: number;
  currentLongitude1: number;
  currentLongitude2: number;
  currentLongitude3: number;
  currentLongitude4: number;
  currentLongitude5: number;
  nextLongitude1: number;
  nextLongitude2: number;
  nextLongitude3: number;
  nextLongitude4: number;
  nextLongitude5: number;
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
    currentLongitude1,
    currentLongitude2,
    currentLongitude3,
    currentLongitude4,
    currentLongitude5,
    nextLongitude1,
    nextLongitude2,
    nextLongitude3,
    nextLongitude4,
    nextLongitude5,
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
      })
    : Infinity;

  const currentTightness = calculatePatternTightness({
    patternType: pattern,
    longitude1: currentLongitude1,
    longitude2: currentLongitude2,
    longitude3: currentLongitude3,
    longitude4: currentLongitude4,
    longitude5: currentLongitude5,
  });

  const nextTightness = nextExists
    ? calculatePatternTightness({
        patternType: pattern,
        longitude1: nextLongitude1,
        longitude2: nextLongitude2,
        longitude3: nextLongitude3,
        longitude4: nextLongitude4,
        longitude5: nextLongitude5,
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

function getQuintupleAspectEvent(args: {
  timestamp: Date;
  body1: Body;
  body2: Body;
  body3: Body;
  body4: Body;
  body5: Body;
  quintupleAspect: QuintupleAspect;
  phase: AspectPhase;
}): QuintupleAspectEvent {
  const {
    timestamp,
    body1,
    body2,
    body3,
    body4,
    body5,
    quintupleAspect,
    phase,
  } = args;

  const body1Capitalized = _.startCase(body1) as Capitalize<Body>;
  const body2Capitalized = _.startCase(body2) as Capitalize<Body>;
  const body3Capitalized = _.startCase(body3) as Capitalize<Body>;
  const body4Capitalized = _.startCase(body4) as Capitalize<Body>;
  const body5Capitalized = _.startCase(body5) as Capitalize<Body>;

  const body1Symbol = symbolByBody[body1] as BodySymbol;
  const body2Symbol = symbolByBody[body2] as BodySymbol;
  const body3Symbol = symbolByBody[body3] as BodySymbol;
  const body4Symbol = symbolByBody[body4] as BodySymbol;
  const body5Symbol = symbolByBody[body5] as BodySymbol;
  const quintupleAspectSymbol = symbolByQuintupleAspect[
    quintupleAspect
  ] as QuintupleAspectSymbol;

  // Sort bodies alphabetically for consistent event naming
  const bodiesSorted = [
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
    body4Capitalized,
    body5Capitalized,
  ].sort();

  const description =
    `${bodiesSorted[0]}, ${bodiesSorted[1]}, ${bodiesSorted[2]}, ${bodiesSorted[3]}, ${bodiesSorted[4]} ${quintupleAspect} ${phase}` as QuintupleAspectDescription;

  // Add phase emoji
  let phaseEmoji = "";
  if (phase === "forming") {
    phaseEmoji = "➡️ ";
  } else if (phase === "exact") {
    phaseEmoji = "🎯 ";
  } else if (phase === "dissolving") {
    phaseEmoji = "⬅️ ";
  }

  const summary = `${phaseEmoji}${quintupleAspectSymbol} ${body1Symbol}-${body2Symbol}-${body3Symbol}-${body4Symbol}-${body5Symbol} ${description}`;

  console.log(`${summary} at ${timestamp.toISOString()}`);

  const categories = [
    "Astronomy",
    "Astrology",
    "Quintuple Aspect",
    _.startCase(quintupleAspect),
    _.startCase(phase),
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
    body4Capitalized,
    body5Capitalized,
  ];

  const quintupleAspectEvent: QuintupleAspectEvent = {
    start: timestamp,
    end: timestamp,
    description,
    summary,
    categories,
  };

  return quintupleAspectEvent;
}

// #endregion Events

export function writeQuintupleAspectEvents(args: {
  end: Date;
  quintupleAspectBodies: Body[];
  quintupleAspectEvents: QuintupleAspectEvent[];
  start: Date;
}) {
  const { end, quintupleAspectEvents, quintupleAspectBodies, start } = args;
  if (_.isEmpty(quintupleAspectEvents)) return;

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${quintupleAspectEvents.length} quintuple aspect events from ${timespan}`;
  console.log(`⭐ Writing ${message}`);

  upsertEvents(quintupleAspectEvents);

  const quintupleAspectBodiesString = quintupleAspectBodies.join(",");
  const quintupleAspectsCalendar = getCalendar({
    events: quintupleAspectEvents,
    name: "Quintuple Aspect ⭐",
  });
  fs.writeFileSync(
    getOutputPath(
      `quintuple-aspects_${quintupleAspectBodiesString}_${timespan}.ics`
    ),
    new TextEncoder().encode(quintupleAspectsCalendar)
  );

  console.log(`⭐ Wrote ${message}`);
}

// #region Duration Events

export function getQuintupleAspectDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to quintuple aspect events only
  const quintupleAspectEvents = events.filter((event) =>
    event.categories.includes("Quintuple Aspect")
  ) as QuintupleAspectEvent[];

  // Group by body quintet and aspect type using categories
  const groupedEvents = _.groupBy(quintupleAspectEvents, (event) => {
    const planets = event.categories
      .filter((category) =>
        quintupleAspectBodies.map(_.startCase).includes(category)
      )
      .sort();

    const aspect = event.categories.find((category) =>
      ["Pentagram"].includes(category)
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
