import _ from "lodash";
import type { Moment } from "moment";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type { Body, AspectPhase } from "../../types";
import type { StelliumEvent } from "./stellium.events";
import {
  type AspectEdge,
  parseAspectEvents,
  groupAspectsByType,
  haveAspect,
  determineMultiBodyPhase,
} from "./aspects.composition";
import { symbolByStellium, symbolByBody } from "../../constants";
import type { Event } from "../../calendar.utilities";

/**
 * Compose Stellium patterns from stored 2-body aspects
 * Stellium = 4+ bodies all in conjunction with each other
 */
function composeStelliums(
  edges: AspectEdge[],
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>,
  currentMinute: Moment
): StelliumEvent[] {
  const events: StelliumEvent[] = [];
  const aspectsByType = groupAspectsByType(edges);
  const conjunctions = aspectsByType.get("conjunct") || [];

  if (conjunctions.length < 6) return events;

  // Build clusters of conjunct bodies using graph traversal
  const clusters: Set<Body>[] = [];
  const visited = new Set<Body>();

  // Collect all unique bodies involved in conjunctions
  const bodiesSet = new Set<Body>();
  for (const edge of conjunctions) {
    bodiesSet.add(edge.body1);
    bodiesSet.add(edge.body2);
  }

  // For each unvisited body, explore its conjunction cluster
  for (const startBody of bodiesSet) {
    if (visited.has(startBody)) continue;

    const cluster = new Set<Body>();
    const queue: Body[] = [startBody];

    // BFS to find all bodies conjunct (directly or transitively) with startBody
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (cluster.has(current)) continue;

      cluster.add(current);
      visited.add(current);

      // Find all bodies conjunct with current
      for (const edge of conjunctions) {
        let other: Body | null = null;
        if (edge.body1 === current) other = edge.body2;
        else if (edge.body2 === current) other = edge.body1;

        if (other && !cluster.has(other)) {
          queue.push(other);
        }
      }
    }

    // Only keep clusters with 4+ bodies
    if (cluster.size >= 4) {
      clusters.push(cluster);
    }
  }

  // For each cluster, verify it's a true stellium (all pairs are conjunct)
  for (const cluster of clusters) {
    const bodies = Array.from(cluster);

    // Verify all pairs are in conjunction
    let isStellium = true;
    for (let i = 0; i < bodies.length && isStellium; i++) {
      for (let j = i + 1; j < bodies.length && isStellium; j++) {
        if (!haveAspect(bodies[i], bodies[j], "conjunct", edges)) {
          isStellium = false;
        }
      }
    }

    if (isStellium) {
      // Found a Stellium
      const calculateTightness = (longitudes: number[]) => {
        // Calculate the spread (max - min longitude)
        const min = Math.min(...longitudes);
        const max = Math.max(...longitudes);
        return max - min;
      };

      const relatedEdges = conjunctions.filter((edge) =>
        bodies.includes(edge.body1 as Body)
      );

      const phaseInfo = determineMultiBodyPhase(
        relatedEdges,
        coordinateEphemerisByBody,
        currentMinute,
        calculateTightness,
        bodies,
        // Check if Stellium pattern exists at given longitudes
        (longitudes) => {
          const orb = 8;
          // All bodies must be within conjunction orb of each other
          for (let i = 0; i < longitudes.length; i++) {
            for (let j = i + 1; j < longitudes.length; j++) {
              const angle = Math.abs(longitudes[i] - longitudes[j]);
              const normalized = angle > 180 ? 360 - angle : angle;
              if (normalized >= orb) return false;
            }
          }
          return true;
        }
      );

      if (phaseInfo) {
        events.push(
          createStelliumEvent({
            timestamp: currentMinute.toDate(),
            bodies,
            phase: phaseInfo.phase,
          })
        );
      }
    }
  }

  return events;
}

/**
 * Create a stellium event
 */
function createStelliumEvent(params: {
  timestamp: Date;
  bodies: Body[];
  phase: AspectPhase;
}): StelliumEvent {
  const { timestamp, bodies, phase } = params;

  const bodiesCapitalized = bodies.map((b) => _.startCase(b));
  const bodySymbols = bodies.map((b) => symbolByBody[b]);

  const stelliumType = `${bodies.length}-body`;
  const stelliumSymbol = (symbolByStellium as any)[stelliumType] || "✨";

  const bodiesSorted = [...bodiesCapitalized].sort();
  const description = `${bodiesSorted.join(", ")} stellium ${phase}`;

  let phaseEmoji = "";
  if (phase === "forming") phaseEmoji = "➡️ ";
  else if (phase === "exact") phaseEmoji = "🎯 ";
  else if (phase === "dissolving") phaseEmoji = "⬅️ ";

  const summary = `${phaseEmoji}${stelliumSymbol} ${bodySymbols.join(
    "-"
  )} ${description}`;

  const categories = [
    "Astronomy",
    "Astrology",
    "Compound Aspect",
    "Stellium",
    _.startCase(stelliumType),
    _.startCase(phase),
    ...bodiesCapitalized,
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
 * Main entry point: compose all stellium events from stored 2-body aspects
 */
export function composeStelliumEvents(
  aspectEvents: Event[],
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>,
  currentMinute: Moment
): StelliumEvent[] {
  const edges = parseAspectEvents(aspectEvents);
  const events: StelliumEvent[] = [];

  events.push(
    ...composeStelliums(edges, coordinateEphemerisByBody, currentMinute)
  );

  return events;
}
