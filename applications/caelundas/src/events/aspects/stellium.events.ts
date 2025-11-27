import _ from "lodash";

import { symbolByBody, symbolByStellium } from "../../symbols";
import { stelliumBodies } from "../../types";

import {
  type AspectEdge,
  determineMultiBodyPhase,
  groupAspectsByType,
  haveAspect,
  parseAspectEvents,
} from "./aspects.composition";

import type { Event } from "../../calendar.utilities";
import type { AspectPhase, Body } from "../../types";
import type { Moment } from "moment";

/**
 * Compose Stellium patterns from stored 2-body aspects
 * Stellium = 4+ bodies all in conjunction with each other
 */
function composeStelliums(
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
  const conjunctions = aspectsByType.get("conjunct") || [];

  if (conjunctions.length < 6) {
    return events;
  }

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
    if (visited.has(startBody)) {
      continue;
    }

    const cluster = new Set<Body>();
    const queue: Body[] = [startBody];

    // BFS to find all bodies conjunct (directly or transitively) with startBody
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || cluster.has(current)) {
        continue;
      }

      cluster.add(current);
      visited.add(current);

      // Find all bodies conjunct with current
      for (const edge of conjunctions) {
        let other: Body | null = null;
        if (edge.body1 === current) {
          other = edge.body2;
        } else if (edge.body2 === current) {
          other = edge.body1;
        }

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
      const bodyI = bodies[i];
      if (!bodyI) {
        continue;
      }
      for (let j = i + 1; j < bodies.length && isStellium; j++) {
        const bodyJ = bodies[j];
        if (!bodyJ) {
          continue;
        }
        if (!haveAspect(bodyI, bodyJ, "conjunct", edges)) {
          isStellium = false;
        }
      }
    }

    if (isStellium) {
      // Found a Stellium
      const phase = determineMultiBodyPhase(
        allEdges,
        currentMinute,
        bodies,
        // Check if Stellium pattern exists in given edges
        (edgesAtTime) => {
          // All pairs of bodies must be in conjunction
          for (let i = 0; i < bodies.length; i++) {
            const bodyI = bodies[i];
            if (!bodyI) {
              continue;
            }
            for (let j = i + 1; j < bodies.length; j++) {
              const bodyJ = bodies[j];
              if (!bodyJ) {
                continue;
              }
              if (!haveAspect(bodyI, bodyJ, "conjunct", edgesAtTime)) {
                return false;
              }
            }
          }
          return true;
        },
      );

      if (phase) {
        events.push(
          createStelliumEvent({
            timestamp: currentMinute.toDate(),
            bodies,
            phase,
          }),
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
}): Event {
  const { timestamp, bodies, phase } = params;

  const bodiesCapitalized = bodies.map((b) => _.startCase(b));
  const bodySymbols = bodies.map((b) => symbolByBody[b]);

  const stelliumType = `${bodies.length}-body`;
  const stelliumSymbol =
    symbolByStellium[stelliumType as keyof typeof symbolByStellium];

  const bodiesSorted = [...bodiesCapitalized].sort();
  const description = `${bodiesSorted.join(", ")} stellium ${phase}`;

  let phaseEmoji = "";
  if (phase === "forming") {
    phaseEmoji = "➡️ ";
  } else if (phase === "exact") {
    phaseEmoji = "🎯 ";
  } else {
    phaseEmoji = "⬅️ ";
  }

  const summary = `${phaseEmoji}${stelliumSymbol} ${bodySymbols.join(
    "-",
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
    description,
    summary,
    categories,
  };
}

/**
 * Main entry point: compose all stellium events from stored 2-body aspects
 */
export function getStelliumEvents(
  aspectEvents: Event[],
  currentMinute: Moment,
): Event[] {
  const edges = parseAspectEvents(aspectEvents);
  const events: Event[] = [];

  events.push(...composeStelliums(edges, currentMinute));

  return events;
}

// #region Duration Events

export function getStelliumDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to stellium events only
  const stelliumEvents = events.filter((event) =>
    event.categories.includes("Stellium"),
  );

  // Group by bodies and stellium type using categories
  const groupedEvents = _.groupBy(stelliumEvents, (event) => {
    const planets = event.categories
      .filter((category) =>
        stelliumBodies.map((b) => _.startCase(b)).includes(category),
      )
      .sort();

    const stelliumType = event.categories.find(
      (category) => category.includes("Body") && category !== "Stellium",
    );

    return `${planets.join("-")}_${stelliumType}`;
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
              / (forming|exact|dissolving)$/i,
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
