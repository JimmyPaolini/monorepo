import _ from "lodash";

import { getCombinations } from "../../math.utilities";
import { symbolByBody, symbolBySextupleAspect } from "../../symbols";
import { sextupleAspectBodies } from "../../types";

import {
  type AspectEdge,
  determineMultiBodyPhase,
  groupAspectsByType,
  parseAspectEvents,
} from "./aspects.composition";

import type { Event } from "../../calendar.utilities";
import type { AspectPhase, Body, SextupleAspect } from "../../types";
import type { Moment } from "moment";

/**
 * Checks if 6 bodies form a valid hexagram (Star of David) pattern.
 *
 * A hexagram consists of two interlocking Grand Trines plus sextiles
 * forming a hexagon:
 * - 6 trines (120°) forming two separate triangles
 * - 6 sextiles (60°) forming a hexagon connecting the triangles
 *
 * Visual pattern:
 * ```
 *       Body1
 *      / | \
 *     /  |  \
 * Body6  |  Body2
 *    |   |   |
 * Body5  |  Body3
 *     \  |  /
 *      \ | /
 *      Body4
 * ```
 *
 * Each body has exactly 2 trine connections (to same-element signs)
 * and 2 sextile connections (to adjacent bodies in the hexagon).
 *
 * This extremely rare pattern represents perfect balance and harmony,
 * with bodies evenly distributed at 60° intervals around the zodiac.
 * Associated with spiritual attainment and manifestation of divine order.
 *
 * @param bodies - Array of 6 celestial bodies to check
 * @param edges - All aspect edges available at current time
 * @returns Bodies in hexagram order if valid pattern exists, null otherwise
 */
function findHexagramPattern(
  bodies: Body[],
  edges: AspectEdge[],
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
        trineConnections.get(edge.body1)?.add(edge.body2);
        trineConnections.get(edge.body2)?.add(edge.body1);
      } else if (edge.aspectType === "sextile") {
        sextileConnections.get(edge.body1)?.add(edge.body2);
        sextileConnections.get(edge.body2)?.add(edge.body1);
      }
    }
  }

  // Find two groups of 3 bodies (grand trines)
  // Each body should have exactly 2 trine connections (to form two interlocking triangles)
  const trineGroups: Body[][] = [];
  const visited = new Set<Body>();

  for (const body of bodies) {
    if (visited.has(body)) {
      continue;
    }

    const trineNeighbors = trineConnections.get(body);
    if (trineNeighbors?.size !== 2) {
      continue;
    }

    // Check if these 3 bodies form a complete triangle
    const neighbors = [...trineNeighbors];
    const b1 = neighbors[0];
    const b2 = neighbors[1];
    if (!b1 || !b2) {
      continue;
    }
    const b1Connections = trineConnections.get(b1);
    if (b1Connections?.has(b2)) {
      trineGroups.push([body, b1, b2]);
      visited.add(body);
      visited.add(b1);
      visited.add(b2);
    }
  }

  // Must have exactly 2 grand trines
  if (trineGroups.length !== 2) {
    return null;
  }

  // Now arrange bodies in hexagon order (alternating between the two trines)
  // such that adjacent bodies (in hexagon) are connected by sextiles
  const trine1 = trineGroups[0];
  const trine2 = trineGroups[1];
  if (!trine1 || !trine2) {
    return null;
  }

  // Try all possible interleavings of the two trines
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        if (k === i) {
          continue;
        }
        for (let l = 0; l < 3; l++) {
          if (l === j) {
            continue;
          }

          // Try arrangement: trine1[i], trine2[j], trine1[k], trine2[l], trine1[remaining], trine2[remaining]
          const i2 = [0, 1, 2].find((x) => x !== i && x !== k);
          const j2 = [0, 1, 2].find((x) => x !== j && x !== l);

          if (i2 === undefined || j2 === undefined) {
            continue;
          }

          const t1i = trine1[i];
          const t2j = trine2[j];
          const t1k = trine1[k];
          const t2l = trine2[l];
          const t1i2 = trine1[i2];
          const t2j2 = trine2[j2];
          if (!t1i || !t2j || !t1k || !t2l || !t1i2 || !t2j2) {
            continue;
          }

          const arrangement = [t1i, t2j, t1k, t2l, t1i2, t2j2];

          // Check if this arrangement has all adjacent sextiles (forming hexagon)
          const a0 = arrangement[0];
          const a1 = arrangement[1];
          const a2 = arrangement[2];
          const a3 = arrangement[3];
          const a4 = arrangement[4];
          const a5 = arrangement[5];
          if (!a0 || !a1 || !a2 || !a3 || !a4 || !a5) {
            continue;
          }

          const hasAllSextiles =
            sextileConnections.get(a0)?.has(a1) &&
            sextileConnections.get(a1)?.has(a2) &&
            sextileConnections.get(a2)?.has(a3) &&
            sextileConnections.get(a3)?.has(a4) &&
            sextileConnections.get(a4)?.has(a5) &&
            sextileConnections.get(a5)?.has(a0);

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
 * Composes Hexagram (Star of David) patterns from stored 2-body aspects.
 *
 * A Hexagram is one of the rarest configurations in astrology, consisting
 * of 6 bodies forming:
 * - Two interlocking Grand Trines (6 trine aspects total)
 * - A hexagon of sextile connections (6 sextile aspects)
 *
 * The bodies are evenly distributed at 60° intervals around the zodiac,
 * creating a perfectly balanced configuration. This pattern represents
 * the harmonic division of 360° by 6.
 *
 * In astrological interpretation, the hexagram signifies a state of
 * perfect balance, divine order, and the potential for spiritual
 * manifestation. It's also known as the Grand Sextile.
 *
 * @param allEdges - All aspect edges across time for phase detection
 * @param currentMinute - The minute to check for Hexagram patterns
 * @returns Array of Hexagram events detected at this minute
 * @see {@link findHexagramPattern} for pattern validation logic
 * @see {@link determineMultiBodyPhase} for phase calculation
 * @see {@link getCombinations} for generating body combinations
 */
function composeHexagrams(
  allEdges: AspectEdge[],
  currentMinute: Moment,
): Event[] {
  const events: Event[] = [];

  // Filter to current minute for pattern detection
  const currentTimestamp = currentMinute.toDate().getTime();
  const edges = allEdges.filter(
    (edge) =>
      edge.event.start.getTime() <= currentTimestamp &&
      edge.event.end.getTime() >= currentTimestamp,
  );

  const aspectsByType = groupAspectsByType(edges);
  const trines = aspectsByType.get("trine") || [];
  const sextiles = aspectsByType.get("sextile") || [];

  if (trines.length < 6 || sextiles.length < 6) {
    return events;
  }

  // Collect all unique bodies involved in trines
  const bodiesSet = new Set<Body>();
  for (const edge of trines) {
    bodiesSet.add(edge.body1);
    bodiesSet.add(edge.body2);
  }
  const bodies = [...bodiesSet];

  if (bodies.length < 6) {
    return events;
  }

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
        },
      );

      const b0 = hexagramBodies[0];
      const b1 = hexagramBodies[1];
      const b2 = hexagramBodies[2];
      const b3 = hexagramBodies[3];
      const b4 = hexagramBodies[4];
      const b5 = hexagramBodies[5];
      if (phase && b0 && b1 && b2 && b3 && b4 && b5) {
        events.push(
          getSextupleAspectEvent({
            timestamp: currentMinute.toDate(),
            body1: b0,
            body2: b1,
            body3: b2,
            body4: b3,
            body5: b4,
            body6: b5,
            sextupleAspect: "hexagram",
            phase,
          }),
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
  if (phase === "forming") {
    phaseEmoji = "➡️ ";
  } else if (phase === "exact") {
    phaseEmoji = "🎯 ";
  } else {
    phaseEmoji = "⬅️ ";
  }

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
    description,
    summary,
    categories,
  };
}

/**
 * Detects all sextuple aspect patterns from stored 2-body aspect events.
 *
 * Currently detects the Hexagram (Star of David) pattern, which is one
 * of the rarest and most spiritually significant configurations. Requires
 * 6 bodies evenly distributed at 60° intervals with specific aspect relationships.
 *
 * @param aspectEvents - Previously detected simple aspect events
 * @param currentMinute - The minute to check for sextuple aspect patterns
 * @returns Array of all detected sextuple aspect events at this minute
 * @see {@link parseAspectEvents} for extracting aspect relationships
 * @see {@link composeHexagrams} for Hexagram detection
 */
export function getSextupleAspectEvents(
  aspectEvents: Event[],
  currentMinute: Moment,
): Event[] {
  const edges = parseAspectEvents(aspectEvents);
  const events: Event[] = [];

  events.push(...composeHexagrams(edges, currentMinute));

  return events;
}

// #region Duration Events

/**
 * Converts instantaneous sextuple aspect events into duration events.
 *
 * Pairs forming and dissolving events for the same body sextet and
 * pattern type to create events spanning the entire active period.
 * Duration events show when a pattern is in effect rather than just
 * boundary moments.
 *
 * @param events - All events to process (non-sextuple-aspect events are filtered out)
 * @returns Array of duration events spanning from forming to dissolving
 */
export function getSextupleAspectDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to sextuple aspect events only
  const sextupleAspectEvents = events.filter((event) =>
    event.categories.includes("Sextuple Aspect"),
  );

  // Group by body sextet and aspect type using categories
  const groupedEvents = _.groupBy(sextupleAspectEvents, (event) => {
    const planets = event.categories
      .filter((category) =>
        sextupleAspectBodies
          .map((sextupleAspectBody) => _.startCase(sextupleAspectBody))
          .includes(category),
      )
      .sort();

    const aspect = event.categories.find((category) =>
      ["Hexagram", "Grand Sextile"].includes(category),
    );

    return `${planets.join("-")}_${aspect}`;
  });

  // Process each group to find forming/dissolving pairs
  for (const group of Object.values(groupedEvents)) {
    const sortedEvents = _.sortBy(group, "start");

    for (let i = 0; i < sortedEvents.length; i++) {
      const currentEvent = sortedEvents[i];
      if (!currentEvent) {
        continue;
      }

      // Skip if not a forming event
      if (!currentEvent.categories.includes("Forming")) {
        continue;
      }

      // Look for the next dissolving event
      for (let j = i + 1; j < sortedEvents.length; j++) {
        const potentialDissolvingEvent = sortedEvents[j];
        if (!potentialDissolvingEvent) {
          continue;
        }

        if (potentialDissolvingEvent.categories.includes("Dissolving")) {
          // Create duration event
          durationEvents.push({
            start: currentEvent.start,
            end: potentialDissolvingEvent.start,
            summary: currentEvent.summary.replace(/^(?:➡️|🎯|⬅️)\s/u, ""),
            description: currentEvent.description.replace(
              / (forming|exact|dissolving)$/,
              "",
            ),
            categories: currentEvent.categories.filter(
              (c) => c !== "Forming" && c !== "Exact" && c !== "Dissolving",
            ),
          });

          break; // Found the pair, move to next forming event
        }
      }
    }
  }

  return durationEvents;
}
