import {
  symbolByBody,
  symbolByStellium,
} from "@caelundas/src/caelundas.constants";
import { stelliumBodies } from "@caelundas/src/caelundas.types";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import type { Aspect, AspectPhase, Body } from "@caelundas/src/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { AspectBodies } from "@caelundas/src/modules/events/aspects/aspects.service";
import type { Moment } from "moment-timezone";

function groupAspectsByType<T extends AspectBodies>(
  edges: T[],
): Map<Aspect, T[]> {
  const grouped = _.groupBy(edges, "aspect");
  return new Map(Object.entries(grouped)) as Map<Aspect, T[]>;
}

function haveAspect(
  body1: Body,
  body2: Body,
  aspectType: Aspect,
  edges: AspectBodies[],
): boolean {
  return edges.some(
    (edge) =>
      edge.aspect === aspectType &&
      ((edge.bodies[0] === body1 && edge.bodies[1] === body2) ||
        (edge.bodies[0] === body2 && edge.bodies[1] === body1)),
  );
}

function determineCompoundPhaseFromSnapshots(
  currentAspectBodies: AspectBodies[],
  previousAspectBodies: AspectBodies[],
  patternBodies: Body[],
  currentMinute: Moment,
  checkPatternExists: (edges: AspectBodies[]) => boolean,
): { phase: AspectPhase; eventMinute: Moment } | null {
  const bodySet = new Set(patternBodies);
  const filterByBodies = (edges: AspectBodies[]): AspectBodies[] =>
    edges.filter((e) => bodySet.has(e.bodies[0]) && bodySet.has(e.bodies[1]));

  const currentFiltered = filterByBodies(currentAspectBodies);
  const previousFiltered = filterByBodies(previousAspectBodies);

  const currentExists = checkPatternExists(currentFiltered);
  const previousExists = checkPatternExists(previousFiltered);

  if (currentExists && !previousExists) {
    return { phase: "forming", eventMinute: currentMinute };
  }
  if (!currentExists && previousExists) {
    return {
      phase: "dissolving",
      eventMinute: currentMinute.clone().subtract(1, "minute"),
    };
  }
  return null;
}

// #region Progressive Events

/**
 *
 */
@Injectable()
export class StelliumService {
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
   * @param currentAspectBodies - Active aspect relationships at the current minute
   * @param previousAspectBodies - Active aspect relationships at the previous minute
   * @param minute - The minute to check for Stellium patterns
   * @returns Array of Stellium events detected at this minute
   * @see {@link determineCompoundPhaseFromSnapshots} for phase calculation
   * @see {@link haveAspect} for verifying conjunction relationships
   */
  private composeStelliums(args: {
    currentAspectBodies: AspectBodies[];
    previousAspectBodies: AspectBodies[];
    minute: Moment;
  }): Event[] {
    const { currentAspectBodies, previousAspectBodies, minute } = args;
    const events: Event[] = [];

    const unionEdges = [...currentAspectBodies, ...previousAspectBodies];
    const aspectsByType = groupAspectsByType(unionEdges);
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
      bodiesSet.add(edge.bodies[0]);
      bodiesSet.add(edge.bodies[1]);
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
          if (edge.bodies[0] === current) {
            other = edge.bodies[1];
          } else if (edge.bodies[1] === current) {
            other = edge.bodies[0];
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
      const bodies = [...cluster];

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
          if (!haveAspect(bodyI, bodyJ, "conjunct", unionEdges)) {
            isStellium = false;
          }
        }
      }

      if (isStellium) {
        // Found a Stellium
        const result = determineCompoundPhaseFromSnapshots(
          currentAspectBodies,
          previousAspectBodies,
          bodies,
          minute,
          // Check if Stellium pattern exists in given edges
          (edges) => {
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
                if (!haveAspect(bodyI, bodyJ, "conjunct", edges)) {
                  return false;
                }
              }
            }
            return true;
          },
        );

        if (result) {
          events.push(
            this.createStelliumEvent({
              timestamp: result.eventMinute,
              bodies,
              phase: result.phase,
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
  private createStelliumEvent(params: {
    timestamp: Moment;
    bodies: Body[];
    phase: AspectPhase;
  }): Event {
    const { timestamp, bodies, phase } = params;

    const bodiesCapitalized = bodies.map((b) => _.startCase(b));
    const bodySymbols = bodies.map((b) => symbolByBody[b]);

    const stelliumType = `${bodies.length}-body`;
    const stelliumSymbol =
      symbolByStellium[stelliumType as keyof typeof symbolByStellium];

    const bodiesSorted = _.sortBy([...bodiesCapitalized]);
    const description = `${bodiesSorted.join(", ")} stellium ${phase}`;

    let phaseEmoji = "";
    if (phase === "forming") {
      phaseEmoji = "➡️ ";
    } else if (phase === "perfective") {
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
   * @param currentAspectBodies - Active aspect relationships at the current minute
   * @param previousAspectBodies - Active aspect relationships at the previous minute
   * @param minute - The minute to check for stellium patterns
   * @returns Array of all detected stellium events at this minute
   * @see {@link composeStelliums} for stellium detection logic
   */
  detect(args: {
    currentAspectBodies: AspectBodies[];
    previousAspectBodies: AspectBodies[];
    minute: Moment;
  }): Event[] {
    const { currentAspectBodies, previousAspectBodies, minute } = args;
    return [
      ...this.composeStelliums({
        currentAspectBodies,
        previousAspectBodies,
        minute,
      }),
    ];
  }

  /**
   * Converts instantaneous stellium events into progressive events.
   *
   * Pairs forming and dissolving events for the same body group and
   * stellium size to create events spanning the entire active period.
   * Progressive events show when a stellium is in effect rather than just
   * boundary moments.
   *
   * @param events - All events to process (non-stellium events are filtered out)
   * @returns Array of progressive events spanning from forming to dissolving
   */
  detectProgressive(events: Event[]): Event[] {
    const progressiveEvents: Event[] = [];

    // Filter to stellium events only
    const stelliumEvents = events.filter((event) =>
      event.categories.includes("Stellium"),
    );

    // Group by bodies and stellium type using categories
    const groupedEvents = _.groupBy(stelliumEvents, (event) => {
      const planets = _.sortBy(
        event.categories.filter((category) =>
          stelliumBodies.map((b) => _.startCase(b)).includes(category),
        ),
      );

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
            // Create progressive event
            progressiveEvents.push({
              start: currentEvent.start,
              end: potentialDissolvingEvent.start,
              summary: currentEvent.summary.replace(/^(?:➡️|🎯|⬅️)\s/u, ""),
              description: currentEvent.description.replace(
                / (forming|exact|dissolving)$/i,
                "",
              ),
              categories: currentEvent.categories.filter(
                (c) =>
                  c !== "Forming" && c !== "Perfective" && c !== "Dissolving",
              ),
            });

            break; // Found the pair, move to next forming event
          }
        }
      }
    }

    return progressiveEvents;
  }
}
