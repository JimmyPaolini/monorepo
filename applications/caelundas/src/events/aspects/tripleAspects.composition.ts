import _ from "lodash";
import type { Moment } from "moment";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type { Body, AspectPhase } from "../../types";
import type { TripleAspectEvent } from "./tripleAspects.events";
import {
  type AspectEdge,
  parseAspectEvents,
  groupAspectsByType,
  findBodiesWithAspectTo,
  haveAspect,
  involvesBody,
  getOtherBody,
  determineMultiBodyPhase,
} from "./aspects.composition";
import { symbolByBody, symbolByTripleAspect } from "../../constants";
import type { Event } from "../../calendar.utilities";

/**
 * Compose T-Squares from stored 2-body aspects
 * T-Square = 1 opposition + 2 squares forming a T
 */
function composeTSquares(
  edges: AspectEdge[],
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>,
  currentMinute: Moment
): TripleAspectEvent[] {
  const events: TripleAspectEvent[] = [];
  const aspectsByType = groupAspectsByType(edges);

  const oppositions = aspectsByType.get("opposite") || [];
  const squares = aspectsByType.get("square") || [];

  for (const opposition of oppositions) {
    const body1 = opposition.body1;
    const body2 = opposition.body2;

    // Find bodies that are square to both opposition bodies
    const squaresToBody1 = findBodiesWithAspectTo(body1, "square", squares);
    const squaresToBody2 = findBodiesWithAspectTo(body2, "square", squares);

    // Find common bodies (focal point of T-Square)
    const focalBodies = _.intersection(squaresToBody1, squaresToBody2);

    for (const focalBody of focalBodies) {
      // Verify all three aspects exist
      if (
        haveAspect(body1, body2, "opposite", edges) &&
        haveAspect(body1, focalBody, "square", edges) &&
        haveAspect(body2, focalBody, "square", edges)
      ) {
        // Calculate tightness dynamically
        const calculateTightness = (longitudes: number[]) => {
          const [long1, long2, long3] = longitudes;
          // Import getAngle if needed, or implement simple version
          const angle12 = Math.abs(long1 - long2);
          const angle13 = Math.abs(long1 - long3);
          const angle23 = Math.abs(long2 - long3);
          return (
            Math.abs(angle12 - 180) +
            Math.abs(angle13 - 90) +
            Math.abs(angle23 - 90)
          );
        };

        const phaseInfo = determineMultiBodyPhase(
          [opposition],
          coordinateEphemerisByBody,
          currentMinute,
          calculateTightness,
          [body1, body2, focalBody],
          // Check if T-Square pattern exists at given longitudes
          (longitudes) => {
            const [l1, l2, l3] = longitudes;
            const angle12 =
              Math.abs(l1 - l2) > 180
                ? 360 - Math.abs(l1 - l2)
                : Math.abs(l1 - l2);
            const angle13 =
              Math.abs(l1 - l3) > 180
                ? 360 - Math.abs(l1 - l3)
                : Math.abs(l1 - l3);
            const angle23 =
              Math.abs(l2 - l3) > 180
                ? 360 - Math.abs(l2 - l3)
                : Math.abs(l2 - l3);

            // Check if any configuration forms T-Square (opposition + 2 squares)
            const orb = 8; // Use reasonable orb for detection
            return (
              (Math.abs(angle12 - 180) < orb &&
                Math.abs(angle13 - 90) < orb &&
                Math.abs(angle23 - 90) < orb) ||
              (Math.abs(angle13 - 180) < orb &&
                Math.abs(angle12 - 90) < orb &&
                Math.abs(angle23 - 90) < orb) ||
              (Math.abs(angle23 - 180) < orb &&
                Math.abs(angle12 - 90) < orb &&
                Math.abs(angle13 - 90) < orb)
            );
          }
        );

        if (phaseInfo) {
          events.push(
            createTripleAspectEvent({
              timestamp: currentMinute.toDate(),
              body1,
              body2,
              body3: focalBody,
              tripleAspect: "t-square",
              focalOrApexBody: focalBody,
              phase: phaseInfo.phase,
            })
          );
        }
      }
    }
  }

  return events;
}

/**
 * Compose Yods from stored 2-body aspects
 * Yod = 1 sextile + 2 quincunxes forming a finger
 */
function composeYods(
  edges: AspectEdge[],
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>,
  currentMinute: Moment
): TripleAspectEvent[] {
  const events: TripleAspectEvent[] = [];
  const aspectsByType = groupAspectsByType(edges);

  const sextiles = aspectsByType.get("sextile") || [];
  const quincunxes = aspectsByType.get("quincunx") || [];

  for (const sextile of sextiles) {
    const body1 = sextile.body1;
    const body2 = sextile.body2;

    // Find bodies that are quincunx to both sextile bodies
    const quincunxToBody1 = findBodiesWithAspectTo(
      body1,
      "quincunx",
      quincunxes
    );
    const quincunxToBody2 = findBodiesWithAspectTo(
      body2,
      "quincunx",
      quincunxes
    );

    // Find common bodies (apex of Yod)
    const apexBodies = _.intersection(quincunxToBody1, quincunxToBody2);

    for (const apexBody of apexBodies) {
      if (
        haveAspect(body1, body2, "sextile", edges) &&
        haveAspect(body1, apexBody, "quincunx", edges) &&
        haveAspect(body2, apexBody, "quincunx", edges)
      ) {
        const calculateTightness = (longitudes: number[]) => {
          const [long1, long2, long3] = longitudes;
          const angle12 = Math.abs(long1 - long2);
          const angle13 = Math.abs(long1 - long3);
          const angle23 = Math.abs(long2 - long3);
          return (
            Math.abs(angle12 - 60) +
            Math.abs(angle13 - 150) +
            Math.abs(angle23 - 150)
          );
        };

        const phaseInfo = determineMultiBodyPhase(
          [sextile],
          coordinateEphemerisByBody,
          currentMinute,
          calculateTightness,
          [body1, body2, apexBody],
          // Check if Yod pattern exists at given longitudes
          (longitudes) => {
            const [l1, l2, l3] = longitudes;
            const angle12 =
              Math.abs(l1 - l2) > 180
                ? 360 - Math.abs(l1 - l2)
                : Math.abs(l1 - l2);
            const angle13 =
              Math.abs(l1 - l3) > 180
                ? 360 - Math.abs(l1 - l3)
                : Math.abs(l1 - l3);
            const angle23 =
              Math.abs(l2 - l3) > 180
                ? 360 - Math.abs(l2 - l3)
                : Math.abs(l2 - l3);

            const orb = 8;
            return (
              (Math.abs(angle12 - 60) < orb &&
                Math.abs(angle13 - 150) < orb &&
                Math.abs(angle23 - 150) < orb) ||
              (Math.abs(angle13 - 60) < orb &&
                Math.abs(angle12 - 150) < orb &&
                Math.abs(angle23 - 150) < orb) ||
              (Math.abs(angle23 - 60) < orb &&
                Math.abs(angle12 - 150) < orb &&
                Math.abs(angle13 - 150) < orb)
            );
          }
        );

        if (phaseInfo) {
          events.push(
            createTripleAspectEvent({
              timestamp: currentMinute.toDate(),
              body1,
              body2,
              body3: apexBody,
              tripleAspect: "yod",
              focalOrApexBody: apexBody,
              phase: phaseInfo.phase,
            })
          );
        }
      }
    }
  }

  return events;
}

/**
 * Compose Grand Trines from stored 2-body aspects
 * Grand Trine = 3 trines forming a triangle
 */
function composeGrandTrines(
  edges: AspectEdge[],
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>,
  currentMinute: Moment
): TripleAspectEvent[] {
  const events: TripleAspectEvent[] = [];
  const aspectsByType = groupAspectsByType(edges);

  const trines = aspectsByType.get("trine") || [];

  // Find sets of three bodies where each pair is in trine
  const bodiesInTrines = new Set<Body>();
  for (const trine of trines) {
    bodiesInTrines.add(trine.body1);
    bodiesInTrines.add(trine.body2);
  }

  const bodiesArray = Array.from(bodiesInTrines);

  // Check all combinations of 3 bodies
  for (let i = 0; i < bodiesArray.length; i++) {
    for (let j = i + 1; j < bodiesArray.length; j++) {
      for (let k = j + 1; k < bodiesArray.length; k++) {
        const body1 = bodiesArray[i];
        const body2 = bodiesArray[j];
        const body3 = bodiesArray[k];

        // Check if all three pairs are in trine
        if (
          haveAspect(body1, body2, "trine", trines) &&
          haveAspect(body1, body3, "trine", trines) &&
          haveAspect(body2, body3, "trine", trines)
        ) {
          const calculateTightness = (longitudes: number[]) => {
            const [long1, long2, long3] = longitudes;
            const angle12 = Math.abs(long1 - long2);
            const angle13 = Math.abs(long1 - long3);
            const angle23 = Math.abs(long2 - long3);
            return (
              Math.abs(angle12 - 120) +
              Math.abs(angle13 - 120) +
              Math.abs(angle23 - 120)
            );
          };

          const phaseInfo = determineMultiBodyPhase(
            trines.filter(
              (t) =>
                (t.body1 === body1 || t.body2 === body1) &&
                (t.body1 === body2 || t.body2 === body2)
            ),
            coordinateEphemerisByBody,
            currentMinute,
            calculateTightness,
            [body1, body2, body3],
            // Check if Grand Trine pattern exists at given longitudes
            (longitudes) => {
              const [l1, l2, l3] = longitudes;
              const angle12 =
                Math.abs(l1 - l2) > 180
                  ? 360 - Math.abs(l1 - l2)
                  : Math.abs(l1 - l2);
              const angle13 =
                Math.abs(l1 - l3) > 180
                  ? 360 - Math.abs(l1 - l3)
                  : Math.abs(l1 - l3);
              const angle23 =
                Math.abs(l2 - l3) > 180
                  ? 360 - Math.abs(l2 - l3)
                  : Math.abs(l2 - l3);

              const orb = 8;
              return (
                Math.abs(angle12 - 120) < orb &&
                Math.abs(angle13 - 120) < orb &&
                Math.abs(angle23 - 120) < orb
              );
            }
          );

          if (phaseInfo) {
            events.push(
              createTripleAspectEvent({
                timestamp: currentMinute.toDate(),
                body1,
                body2,
                body3,
                tripleAspect: "grand trine",
                phase: phaseInfo.phase,
              })
            );
          }
        }
      }
    }
  }

  return events;
}

/**
 * Main composition function for triple aspects
 */
export function composeTripleAspectEvents(
  storedAspects: Event[],
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>,
  currentMinute: Moment
): TripleAspectEvent[] {
  const edges = parseAspectEvents(storedAspects);

  return [
    ...composeTSquares(edges, coordinateEphemerisByBody, currentMinute),
    ...composeYods(edges, coordinateEphemerisByBody, currentMinute),
    ...composeGrandTrines(edges, coordinateEphemerisByBody, currentMinute),
    // Can add more patterns: Hammer, etc.
  ];
}

// Helper function to create triple aspect events
function createTripleAspectEvent(args: {
  timestamp: Date;
  body1: Body;
  body2: Body;
  body3: Body;
  tripleAspect: "t-square" | "yod" | "grand trine" | "hammer";
  phase: AspectPhase;
  focalOrApexBody?: Body;
}): TripleAspectEvent {
  const {
    timestamp,
    body1,
    body2,
    body3,
    tripleAspect,
    phase,
    focalOrApexBody,
  } = args;

  const body1Capitalized = _.startCase(body1);
  const body2Capitalized = _.startCase(body2);
  const body3Capitalized = _.startCase(body3);

  const body1Symbol = symbolByBody[body1];
  const body2Symbol = symbolByBody[body2];
  const body3Symbol = symbolByBody[body3];
  const tripleAspectSymbol = symbolByTripleAspect[tripleAspect];

  const bodiesSorted = [
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
  ].sort();

  const description = focalOrApexBody
    ? `${bodiesSorted[0]}, ${bodiesSorted[1]}, ${
        bodiesSorted[2]
      } ${tripleAspect} ${phase} (${_.startCase(focalOrApexBody)} focal)`
    : `${bodiesSorted[0]}, ${bodiesSorted[1]}, ${bodiesSorted[2]} ${tripleAspect} ${phase}`;

  let phaseEmoji = "";
  if (phase === "forming") phaseEmoji = "➡️ ";
  else if (phase === "exact") phaseEmoji = "🎯 ";
  else if (phase === "dissolving") phaseEmoji = "⬅️ ";

  const summary = `${phaseEmoji}${tripleAspectSymbol} ${body1Symbol}-${body2Symbol}-${body3Symbol} ${description}`;

  console.log(`${summary} at ${timestamp.toISOString()}`);

  const categories = [
    "Astronomy",
    "Astrology",
    "Compound Aspect",
    "Triple Aspect",
    _.startCase(tripleAspect),
    _.startCase(phase),
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
  ];

  if (focalOrApexBody) {
    categories.push(`${_.startCase(focalOrApexBody)} Focal`);
  }

  return {
    start: timestamp,
    end: timestamp,
    description: description as any,
    summary: summary as any,
    categories,
  } as TripleAspectEvent;
}
