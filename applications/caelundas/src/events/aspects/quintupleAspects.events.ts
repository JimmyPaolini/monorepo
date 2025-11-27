import _ from "lodash";

import { getCombinations } from "../../math.utilities";
import { symbolByBody, symbolByQuintupleAspect } from "../../symbols";
import { quintupleAspectBodies } from "../../types";

import {
  type AspectEdge,
  determineMultiBodyPhase,
  groupAspectsByType,
  parseAspectEvents,
} from "./aspects.composition";

import type { Event } from "../../calendar.utilities";
import type { AspectPhase, Body, QuintupleAspect } from "../../types";
import type { Moment } from "moment";

/**
 * Check if 5 bodies form a valid pentagram pattern (5-pointed star)
 * A pentagram requires each body to have exactly 2 quintile connections,
 * forming a cycle that skips one vertex each time.
 *
 * Returns the bodies in pentagram order if valid, null otherwise.
 */
function findPentagramPattern(
  bodies: Body[],
  edges: AspectEdge[],
): Body[] | null {
  // Build adjacency list of quintile connections
  const connections = new Map<Body, Set<Body>>();
  for (const body of bodies) {
    connections.set(body, new Set());
  }

  // Add all quintile edges between these bodies
  for (const edge of edges) {
    if (edge.aspectType === "quintile") {
      if (bodies.includes(edge.body1) && bodies.includes(edge.body2)) {
        connections.get(edge.body1)?.add(edge.body2);
        connections.get(edge.body2)?.add(edge.body1);
      }
    }
  }

  // Check if each body has exactly 2 connections (pentagram property)
  for (const [, connected] of connections) {
    if (connected.size !== 2) {
      return null; // Not a valid pentagram
    }
  }

  // Verify it forms a proper 5-pointed star (not just a pentagon)
  // In a pentagram, if you follow the connections, you visit each body once
  // before returning to start, and each connection skips one body
  const start = bodies[0];
  if (!start) {
    return null;
  }
  const visited = new Set<Body>([start]);
  let current = start;
  const orderedBodies: Body[] = [start];

  // Follow the path through the star
  for (let i = 0; i < 4; i++) {
    const currentConnections = connections.get(current);
    if (!currentConnections) {
      return null;
    }
    const neighbors = Array.from(currentConnections);
    // Pick the neighbor we haven't visited yet
    const next = neighbors.find((n) => !visited.has(n));

    if (!next) {
      return null; // Dead end, not a valid star
    }

    visited.add(next);
    orderedBodies.push(next);
    current = next;
  }

  // Verify the last body connects back to the start
  const finalConnections = connections.get(current);
  if (!finalConnections?.has(start)) {
    return null;
  }

  // Verify this is a star pattern (each connection skips a body in sequence)
  // by checking that we have exactly 5 quintiles total
  const quintileCount = edges.filter(
    (edge) =>
      edge.aspectType === "quintile" &&
      orderedBodies.includes(edge.body1) &&
      orderedBodies.includes(edge.body2),
  ).length;

  if (quintileCount !== 5) {
    return null;
  }

  return orderedBodies;
}

/**
 * Compose Pentagram patterns from stored 2-body aspects
 * Pentagram = 5 bodies forming a 5-pointed star with 5 quintiles
 */
function composePentagrams(
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
  const quintiles = aspectsByType.get("quintile") || [];

  if (quintiles.length < 5) {
    return events;
  }

  // Collect all unique bodies involved in quintiles
  const bodiesSet = new Set<Body>();
  for (const edge of quintiles) {
    bodiesSet.add(edge.body1);
    bodiesSet.add(edge.body2);
  }
  const bodies = Array.from(bodiesSet);

  if (bodies.length < 5) {
    return events;
  }

  // Try all combinations of 5 bodies
  const combinations = getCombinations(bodies, 5);

  for (const combo of combinations) {
    // Check if these 5 bodies form a pentagram pattern
    // A pentagram is a 5-pointed star where each body connects to exactly 2 others,
    // forming a cycle that skips one body each time (like a star)
    const pentagramBodies = findPentagramPattern(combo, edges);

    if (pentagramBodies) {
      const phase = determineMultiBodyPhase(
        allEdges,
        currentMinute,
        pentagramBodies,
        // Check if Pentagram pattern exists in given edges
        (edgesAtTime) => {
          return findPentagramPattern(pentagramBodies, edgesAtTime) !== null;
        },
      );

      if (phase) {
        const b0 = pentagramBodies[0];
        const b1 = pentagramBodies[1];
        const b2 = pentagramBodies[2];
        const b3 = pentagramBodies[3];
        const b4 = pentagramBodies[4];
        if (!b0 || !b1 || !b2 || !b3 || !b4) {
          continue;
        }
        events.push(
          getQuintupleAspectEvent({
            timestamp: currentMinute.toDate(),
            body1: b0,
            body2: b1,
            body3: b2,
            body4: b3,
            body5: b4,
            quintupleAspect: "pentagram",
            phase,
          }),
        );
      }
    }
  }

  return events;
}

/**
 * Create a quintuple aspect event
 */
function getQuintupleAspectEvent(params: {
  timestamp: Date;
  body1: Body;
  body2: Body;
  body3: Body;
  body4: Body;
  body5: Body;
  quintupleAspect: QuintupleAspect;
  phase: AspectPhase;
}): Event {
  const {
    timestamp,
    body1,
    body2,
    body3,
    body5,
    body4,
    quintupleAspect,
    phase,
  } = params;

  const body1Capitalized = _.startCase(body1);
  const body2Capitalized = _.startCase(body2);
  const body3Capitalized = _.startCase(body3);
  const body4Capitalized = _.startCase(body4);
  const body5Capitalized = _.startCase(body5);

  const body1Symbol = symbolByBody[body1];
  const body2Symbol = symbolByBody[body2];
  const body3Symbol = symbolByBody[body3];
  const body4Symbol = symbolByBody[body4];
  const body5Symbol = symbolByBody[body5];
  const quintupleAspectSymbol = symbolByQuintupleAspect[quintupleAspect];

  const bodiesSorted = [
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
    body4Capitalized,
    body5Capitalized,
  ].sort();

  const description = `${bodiesSorted.join(", ")} ${quintupleAspect} ${phase}`;

  let phaseEmoji = "";
  if (phase === "forming") {
    phaseEmoji = "➡️ ";
  } else if (phase === "exact") {
    phaseEmoji = "🎯 ";
  } else {
    phaseEmoji = "⬅️ ";
  }

  const summary = `${phaseEmoji}${quintupleAspectSymbol} ${body1Symbol}-${body2Symbol}-${body3Symbol}-${body4Symbol}-${body5Symbol} ${description}`;

  const categories = [
    "Astronomy",
    "Astrology",
    "Compound Aspect",
    "Quintuple Aspect",
    _.startCase(quintupleAspect),
    _.startCase(phase),
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
    body4Capitalized,
    body5Capitalized,
  ];

  return {
    start: timestamp,
    end: timestamp,
    description,
    summary,
    categories,
  } as Event;
}

/**
 * Main entry point: compose all quintuple aspect events from stored 2-body aspects
 */
export function getQuintupleAspectEvents(
  aspectEvents: Event[],
  currentMinute: Moment,
): Event[] {
  const edges = parseAspectEvents(aspectEvents);
  const events: Event[] = [];

  events.push(...composePentagrams(edges, currentMinute));

  return events;
}

// #region Duration Events

export function getQuintupleAspectDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to quintuple aspect events only
  const quintupleAspectEvents = events.filter((event) =>
    event.categories.includes("Quintuple Aspect"),
  );

  // Group by body quintet and aspect type using categories
  const groupedEvents = _.groupBy(quintupleAspectEvents, (event) => {
    const planets = event.categories
      .filter((category) =>
        quintupleAspectBodies
          .map((quintupleAspectBody) => _.startCase(quintupleAspectBody))
          .includes(category),
      )
      .sort();

    const aspect = event.categories.find((category) =>
      ["Pentagram"].includes(category),
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
            summary: currentEvent.summary.replace(/^(➡️|⬅️|🎯)\s/, ""),
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
