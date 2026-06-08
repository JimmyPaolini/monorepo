import {
  symbolByBody,
  symbolByQuintupleAspect,
} from "@caelundas/src/modules/caelundas/caelundas.constants";
import {
  groupByToMap,
  quintupleAspectBodies,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import type { AspectBodies } from "@caelundas/src/modules/aspects/aspects.service";
import type {
  Aspect,
  AspectPhase,
  Body,
  QuintupleAspect,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { Moment } from "moment-timezone";

// #region Progressive Events

/**
 * Detects 5-body compound aspect configurations: the Pentagram pattern.
 *
 * Analyses quintile (72°) aspects among five celestial bodies to identify the
 * star-shaped pentagram configuration. Computes forming and dissolving phases
 * by comparing current and previous aspect sets.
 */
@Injectable()
export class QuintupleAspectsService {
  // 🏗 Dependency Injection

  constructor(private readonly mathService: MathService) {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  /**
   * Composes Pentagram patterns from stored 2-body aspects.
   *
   * A Pentagram is an extremely rare configuration of 5 bodies forming
   * a 5-pointed star with 5 quintile aspects (72° each). This pattern
   * represents the harmonic division of 360° by 5.
   *
   * The pentagram is associated with creativity, talent, and the golden
   * ratio in sacred geometry. Its occurrence indicates a powerful alignment
   * for manifestation and creative expression.
   *
   * @param allEdges - All aspect edges across time for phase detection
   * @param minute - The minute to check for Pentagram patterns
   * @returns Array of Pentagram events detected at this minute
   * @see {@link findPentagramPattern} for pattern validation logic
   * @see {@link determineMultiBodyPhase} for phase calculation
   * @see {@link getCombinations} for generating body combinations
   */
  private composePentagrams(args: {
    currentAspectBodies: AspectBodies[];
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): Event[] {
    const { currentAspectBodies, minute, previousAspectBodies } = args;
    const events: Event[] = [];

    const unionEdges = [...currentAspectBodies, ...previousAspectBodies];
    const aspectsByType = this.groupAspectsByType(unionEdges);
    const quintiles = aspectsByType.get("quintile") || [];

    if (quintiles.length < 5) {
      return events;
    }

    // Collect all unique bodies involved in quintiles
    const bodiesSet = new Set<Body>();
    for (const edge of quintiles) {
      bodiesSet.add(edge.bodies[0]);
      bodiesSet.add(edge.bodies[1]);
    }
    const bodies = [...bodiesSet];

    if (bodies.length < 5) {
      return events;
    }

    // Try all combinations of 5 bodies
    const combinations = this.mathService.getCombinations(bodies, 5);

    for (const combo of combinations) {
      // Check if these 5 bodies form a pentagram pattern
      // A pentagram is a 5-pointed star where each body connects to exactly 2 others,
      // forming a cycle that skips one body each time (like a star)
      const pentagramBodies = this.findPentagramPattern(combo, unionEdges);

      if (pentagramBodies) {
        const result = this.determineCompoundPhaseFromSnapshots(
          currentAspectBodies,
          previousAspectBodies,
          pentagramBodies,
          minute,
          (edges) => {
            return this.findPentagramPattern(pentagramBodies, edges) !== null;
          },
        );

        if (result) {
          const b0 = pentagramBodies[0];
          const b1 = pentagramBodies[1];
          const b2 = pentagramBodies[2];
          const b3 = pentagramBodies[3];
          const b4 = pentagramBodies[4];
          if (!b0 || !b1 || !b2 || !b3 || !b4) {
            continue;
          }
          events.push(
            this.getQuintupleAspectEvent({
              body1: b0,
              body2: b1,
              body3: b2,
              body4: b3,
              body5: b4,
              phase: result.phase,
              quintupleAspect: "pentagram",
              timestamp: result.eventMinute,
            }),
          );
        }
      }
    }

    return events;
  }

  private determineCompoundPhaseFromSnapshots(
    currentAspectBodies: AspectBodies[],
    previousAspectBodies: AspectBodies[],
    patternBodies: Body[],
    currentMinute: Moment,
    checkPatternExists: (edges: AspectBodies[]) => boolean,
  ): null | { eventMinute: Moment; phase: AspectPhase } {
    const bodySet = new Set(patternBodies);
    const filterByBodies = (edges: AspectBodies[]): AspectBodies[] =>
      edges.filter((e) => bodySet.has(e.bodies[0]) && bodySet.has(e.bodies[1]));

    const currentFiltered = filterByBodies(currentAspectBodies);
    const previousFiltered = filterByBodies(previousAspectBodies);

    const currentExists = checkPatternExists(currentFiltered);
    const previousExists = checkPatternExists(previousFiltered);

    if (currentExists && !previousExists) {
      return { eventMinute: currentMinute, phase: "forming" };
    }
    if (!currentExists && previousExists) {
      return {
        eventMinute: currentMinute.clone().subtract(1, "minute"),
        phase: "dissolving",
      };
    }
    return null;
  }
  /**
   * Checks if 5 bodies form a valid pentagram pattern (5-pointed star).
   *
   * A pentagram consists of 5 bodies where each body connects to exactly
   * 2 others via quintile aspects (72°), forming a 5-pointed star shape
   * rather than a simple pentagon.
   *
   * Visual pattern:
   * ```
   *       Body1
   *       /    \
   *      /      \
   *  Body5      Body2
   *     \        /
   *      \      /
   *   Body4--Body3
   * ```
   *
   * Each line represents a quintile (72°) aspect, and the pattern skips
   * one body each connection (star pattern vs circle pattern).
   *
   * In astrological interpretation, the pentagram represents a powerful
   * creative configuration based on the harmonic division of the circle
   * by 5, associated with manifestation of creative potential.
   *
   * @param bodies - Array of 5 celestial bodies to check
   * @param edges - All aspect edges available at current time
   * @returns Bodies in pentagram order if valid pattern exists, null otherwise
   */
  private findPentagramPattern(
    bodies: Body[],
    edges: AspectBodies[],
  ): Body[] | null {
    // Build adjacency list of quintile connections
    const connections = new Map<Body, Set<Body>>();
    for (const body of bodies) {
      connections.set(body, new Set());
    }

    // Add all quintile edges between these bodies
    for (const edge of edges) {
      if (
        edge.aspect === "quintile" &&
        bodies.includes(edge.bodies[0]) &&
        bodies.includes(edge.bodies[1])
      ) {
        connections.get(edge.bodies[0])?.add(edge.bodies[1]);
        connections.get(edge.bodies[1])?.add(edge.bodies[0]);
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
      const neighbors = [...currentConnections];
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
    // by checking that we have exactly 5 unique quintile pairs total.
    // Deduplicate by sorted body pair to handle unionEdges containing duplicates.
    const uniqueQuintilePairs = new Set(
      edges
        .filter(
          (edge) =>
            edge.aspect === "quintile" &&
            orderedBodies.includes(edge.bodies[0]) &&
            orderedBodies.includes(edge.bodies[1]),
        )
        .map((edge) => {
          const sorted = [edge.bodies[0], edge.bodies[1]].toSorted();
          return `${sorted[0]}-${sorted[1]}`;
        }),
    );

    if (uniqueQuintilePairs.size !== 5) {
      return null;
    }

    return orderedBodies;
  }

  /**
   * Create a quintuple aspect event
   */
  private getQuintupleAspectEvent(params: {
    body1: Body;
    body2: Body;
    body3: Body;
    body4: Body;
    body5: Body;
    phase: AspectPhase;
    quintupleAspect: QuintupleAspect;
    timestamp: Moment;
  }): Event {
    const {
      body1,
      body2,
      body3,
      body4,
      body5,
      phase,
      quintupleAspect,
      timestamp,
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

    const bodiesSorted = _.sortBy([
      body1Capitalized,
      body2Capitalized,
      body3Capitalized,
      body4Capitalized,
      body5Capitalized,
    ]);

    const description = `${bodiesSorted.join(", ")} ${quintupleAspect} ${phase}`;

    let phaseEmoji: string;
    if (phase === "forming") {
      phaseEmoji = "➡️ ";
    } else if (phase === "perfective") {
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
      categories,
      description,
      end: timestamp,
      start: timestamp,
      summary,
    };
  }

  private groupAspectsByType<T extends AspectBodies>(
    edges: T[],
  ): Map<Aspect, T[]> {
    return groupByToMap(edges, (edge) => edge.aspect);
  }

  // 🌎 Public Methods

  /**
   * Detects all quintuple aspect patterns from stored 2-body aspect events.
   *
   * Currently detects the Pentagram pattern (5 bodies in quintile relationships
   * forming a 5-pointed star). This is one of the rarest and most significant
   * configurations in astrology.
   *
   * @param aspectEvents - Previously detected simple aspect events
   * @param minute - The minute to check for quintuple aspect patterns
   * @returns Array of all detected quintuple aspect events at this minute
   * @see {@link parseAspectEvents} for extracting aspect relationships
   * @see {@link composePentagrams} for Pentagram detection
   */
  detect(args: {
    currentAspectBodies: AspectBodies[];
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): Event[] {
    const { currentAspectBodies, minute, previousAspectBodies } = args;
    return this.composePentagrams({
      currentAspectBodies,
      minute,
      previousAspectBodies,
    });
  }

  /**
   * Converts instantaneous quintuple aspect events into progressive events.
   *
   * Pairs forming and dissolving events for the same body quintet and
   * pattern type to create events spanning the entire active period.
   * Progressive events show when a pattern is in effect rather than just
   * boundary moments.
   *
   * @param events - All events to process (non-quintuple-aspect events are filtered out)
   * @returns Array of progressive events spanning from forming to dissolving
   */
  detectProgressive(events: Event[]): Event[] {
    const progressiveEvents: Event[] = [];

    // Filter to quintuple aspect events only
    const quintupleAspectEvents = events.filter((event) =>
      event.categories.includes("Quintuple Aspect"),
    );

    // Group by body quintet and aspect type using categories
    const groupedEvents = _.groupBy(quintupleAspectEvents, (event) => {
      const filteredPlanets = event.categories.filter((category) =>
        quintupleAspectBodies
          .map((quintupleAspectBody) => _.startCase(quintupleAspectBody))
          .includes(category),
      );
      const planets = _.sortBy(filteredPlanets);

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
            // Create progressive event
            progressiveEvents.push({
              categories: currentEvent.categories.filter(
                (c) =>
                  c !== "Forming" && c !== "Perfective" && c !== "Dissolving",
              ),
              description: currentEvent.description.replace(
                / (forming|exact|dissolving)$/,
                "",
              ),
              end: potentialDissolvingEvent.start,
              start: currentEvent.start,
              summary: currentEvent.summary.replace(/^(➡️|⬅️|🎯)\s/, ""),
            });

            break; // Found the pair, move to next forming event
          }
        }
      }
    }

    return progressiveEvents;
  }
}
