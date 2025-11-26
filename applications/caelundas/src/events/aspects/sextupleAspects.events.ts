import _ from "lodash";
import type { Moment } from "moment";
import type { Body, AspectPhase, SextupleAspect } from "../../types";
import { sextupleAspectBodies } from "../../types";
import {
  type AspectEdge,
  parseAspectEvents,
  groupAspectsByType,
  haveAspect,
  determineMultiBodyPhase,
} from "./aspects.composition";
import { symbolBySextupleAspect, symbolByBody } from "../../symbols";
import type { Event } from "../../calendar.utilities";
import { getCombinations } from "../../math.utilities";

/**
 * Check if 6 bodies form a valid hexagram (Star of David) pattern
 * A hexagram consists of two interlocking grand trines plus sextiles forming a hexagon.
 *
 * Returns the bodies in hexagram order if valid, null otherwise.
 */
function findHexagramPattern(
  bodies: Body[],
  edges: AspectEdge[]
): Body[] | null {
  // Build adjacency lists for trines and sextiles
  const trineConnections = new Map<Body, Set<Body>>();
  const sextileConnections = new Map<Body, Set<Body>>();

  for (const body of bodies) {
    trineConnections.set(body, new Set());
    sextileConnections.set(body, new Set());
  }

  // Populate connections
  for (const edge of edges) {
    if (bodies.includes(edge.body1) && bodies.includes(edge.body2)) {
      if (edge.aspectType === "trine") {
        trineConnections.get(edge.body1)!.add(edge.body2);
        trineConnections.get(edge.body2)!.add(edge.body1);
      } else if (edge.aspectType === "sextile") {
        sextileConnections.get(edge.body1)!.add(edge.body2);
        sextileConnections.get(edge.body2)!.add(edge.body1);
      }
    }
  }

  // Find two groups of 3 bodies (grand trines)
  // Each body should have exactly 2 trine connections (to form two interlocking triangles)
  const trineGroups: Body[][] = [];
  const visited = new Set<Body>();

  for (const body of bodies) {
    if (visited.has(body)) continue;

    const trineNeighbors = Array.from(trineConnections.get(body)!);
    if (trineNeighbors.length !== 2) continue;

    // Check if these 3 bodies form a complete triangle
    const [b1, b2] = trineNeighbors;
    if (trineConnections.get(b1)!.has(b2)) {
      trineGroups.push([body, b1, b2]);
      visited.add(body);
      visited.add(b1);
      visited.add(b2);
    }
  }

  // Must have exactly 2 grand trines
  if (trineGroups.length !== 2) return null;

  // Now arrange bodies in hexagon order (alternating between the two trines)
  // such that adjacent bodies (in hexagon) are connected by sextiles
  const [trine1, trine2] = trineGroups;

  // Try all possible interleavings of the two trines
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        if (k === i) continue;
        for (let l = 0; l < 3; l++) {
          if (l === j) continue;

          // Try arrangement: trine1[i], trine2[j], trine1[k], trine2[l], trine1[remaining], trine2[remaining]
          const i2 = [0, 1, 2].find((x) => x !== i && x !== k)!;
          const j2 = [0, 1, 2].find((x) => x !== j && x !== l)!;

          const arrangement = [
            trine1[i],
            trine2[j],
            trine1[k],
            trine2[l],
            trine1[i2],
            trine2[j2],
          ];

          // Check if this arrangement has all adjacent sextiles (forming hexagon)
          const hasAllSextiles =
            sextileConnections.get(arrangement[0])!.has(arrangement[1]) &&
            sextileConnections.get(arrangement[1])!.has(arrangement[2]) &&
            sextileConnections.get(arrangement[2])!.has(arrangement[3]) &&
            sextileConnections.get(arrangement[3])!.has(arrangement[4]) &&
            sextileConnections.get(arrangement[4])!.has(arrangement[5]) &&
            sextileConnections.get(arrangement[5])!.has(arrangement[0]);

          if (hasAllSextiles) {
            return arrangement;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Compose Hexagram (Star of David) patterns from stored 2-body aspects
 * Hexagram = 6 bodies forming two interlocking Grand Trines
 */
function composeHexagrams(
  allEdges: AspectEdge[],
  currentMinute: Moment
): Event[] {
  const events: Event[] = [];

  // Filter to current minute for pattern detection
  const currentTimestamp = currentMinute.toDate().getTime();
  const edges = allEdges.filter(
    (edge) =>
      edge.event.start.getTime() <= currentTimestamp &&
      edge.event.end.getTime() >= currentTimestamp
  );

  const aspectsByType = groupAspectsByType(edges);
  const trines = aspectsByType.get("trine") || [];
  const sextiles = aspectsByType.get("sextile") || [];

  if (trines.length < 6 || sextiles.length < 6) return events;

  // Collect all unique bodies involved in trines
  const bodiesSet = new Set<Body>();
  for (const edge of trines) {
    bodiesSet.add(edge.body1);
    bodiesSet.add(edge.body2);
  }
  const bodies = Array.from(bodiesSet);

  if (bodies.length < 6) return events;

  // Try all combinations of 6 bodies
  const combinations = getCombinations(bodies, 6);

  for (const combo of combinations) {
    // Check if these 6 bodies form a hexagram pattern
    const hexagramBodies = findHexagramPattern(combo, edges);

    if (hexagramBodies) {
      const phase = determineMultiBodyPhase(
        allEdges,
        currentMinute,
        hexagramBodies,
        // Check if Hexagram pattern exists in given edges
        (edgesAtTime) => {
          return findHexagramPattern(hexagramBodies, edgesAtTime) !== null;
        }
      );

      if (phase) {
        events.push(
          getSextupleAspectEvent({
            timestamp: currentMinute.toDate(),
            body1: hexagramBodies[0],
            body2: hexagramBodies[1],
            body3: hexagramBodies[2],
            body4: hexagramBodies[3],
            body5: hexagramBodies[4],
            body6: hexagramBodies[5],
            sextupleAspect: "hexagram",
            phase,
          })
        );
      }
    }
  }

  return events;
}

/**
 * Create a sextuple aspect event
 */
function getSextupleAspectEvent(params: {
  timestamp: Date;
  body1: Body;
  body2: Body;
  body3: Body;
  body4: Body;
  body5: Body;
  body6: Body;
  sextupleAspect: SextupleAspect;
  phase: AspectPhase;
}): Event {
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
  } = params;

  const body1Capitalized = _.startCase(body1);
  const body2Capitalized = _.startCase(body2);
  const body3Capitalized = _.startCase(body3);
  const body4Capitalized = _.startCase(body4);
  const body5Capitalized = _.startCase(body5);
  const body6Capitalized = _.startCase(body6);

  const body1Symbol = symbolByBody[body1];
  const body2Symbol = symbolByBody[body2];
  const body3Symbol = symbolByBody[body3];
  const body4Symbol = symbolByBody[body4];
  const body5Symbol = symbolByBody[body5];
  const body6Symbol = symbolByBody[body6];
  const sextupleAspectSymbol = symbolBySextupleAspect[sextupleAspect];

  const bodiesSorted = [
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
    body4Capitalized,
    body5Capitalized,
    body6Capitalized,
  ].sort();

  const description = `${bodiesSorted.join(", ")} ${sextupleAspect} ${phase}`;

  let phaseEmoji = "";
  if (phase === "forming") phaseEmoji = "➡️ ";
  else if (phase === "exact") phaseEmoji = "🎯 ";
  else if (phase === "dissolving") phaseEmoji = "⬅️ ";

  const summary = `${phaseEmoji}${sextupleAspectSymbol} ${body1Symbol}-${body2Symbol}-${body3Symbol}-${body4Symbol}-${body5Symbol}-${body6Symbol} ${description}`;

  const categories = [
    "Astronomy",
    "Astrology",
    "Compound Aspect",
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

  return {
    start: timestamp,
    end: timestamp,
    description: description as any,
    summary: summary as any,
    categories,
  };
}

/**
 * Main entry point: compose all sextuple aspect events from stored 2-body aspects
 */
export function getSextupleAspectEvents(
  aspectEvents: Event[],
  currentMinute: Moment
): Event[] {
  const edges = parseAspectEvents(aspectEvents);
  const events: Event[] = [];

  events.push(...composeHexagrams(edges, currentMinute));

  return events;
}

// #region Duration Events

export function getSextupleAspectDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to sextuple aspect events only
  const sextupleAspectEvents = events.filter((event) =>
    event.categories.includes("Sextuple Aspect")
  ) as Event[];

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
