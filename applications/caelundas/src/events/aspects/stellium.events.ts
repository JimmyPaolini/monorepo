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
 * Composes Stellium patterns from stored 2-body aspects.
 *
 * A Stellium is a concentration of 4 or more celestial bodies within
 * a small area of the zodiac (typically within 8° in the same sign).
 * All bodies must be in conjunction (0° ± orb) with each other.
 *
 * Uses graph traversal to identify clusters of conjunct bodies:
 * - Starts with each unvisited body
 * - Breadth-first search to find all transitively conjunct bodies
 * - Validates that all pairs in cluster are directly conjunct
 * - Only accepts clusters with 4+ bodies
 *
 * Stelliums represent focused energy and emphasis in a particular
 * area of life or zodiac sign. The concentration of planetary energies
 * can indicate both talent and challenge in the associated domain.
 *
 * @param allEdges - All aspect edges across time for phase detection
 * @param currentMinute - The minute to check for Stellium patterns
 * @returns Array of Stellium events detected at this minute
 * @see {@link determineMultiBodyPhase} for phase calculation
 * @see {@link haveAspect} for verifying conjunction relationships
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
 * Detects all stellium patterns from stored 2-body aspect events.
 *
 * A stellium occurs when 4 or more bodies cluster together in conjunction,
 * typically within the same zodiac sign. This represents an area of
 * concentrated energy and focus in astrological interpretation.
 *
 * The function uses graph traversal to identify all conjunction clusters
 * and validates that each cluster forms a complete stellium (all pairs
 * must be in conjunction, not just transitively connected).
 *
 * @param aspectEvents - Previously detected simple aspect events
 * @param currentMinute - The minute to check for stellium patterns
 * @returns Array of all detected stellium events at this minute
 * @see {@link parseAspectEvents} for extracting aspect relationships
 * @see {@link composeStelliums} for stellium detection logic
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

/**
 * Converts instantaneous stellium events into duration events.
 *
 * Pairs forming and dissolving events for the same body group and
 * stellium size to create events spanning the entire active period.
 * Duration events show when a stellium is in effect rather than just
 * boundary moments.
 *
 * @param events - All events to process (non-stellium events are filtered out)
 * @returns Array of duration events spanning from forming to dissolving
 */
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
