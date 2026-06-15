import {
  symbolByBody,
  symbolByQuadrupleAspect,
} from "@caelundas/src/modules/caelundas/caelundas.constants";
import {
  groupByToMap,
  quadrupleAspectBodies,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import type { AspectBodies } from "@caelundas/src/modules/aspects/aspects.service";
import type {
  Aspect,
  AspectPhase,
  Body,
  QuadrupleAspect,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { Moment } from "moment-timezone";

/**
 * Detects 4-body compound aspect configurations: Grand Cross and Kite patterns.
 *
 * Analyses combinations of stored 2-body aspects to identify higher-order patterns
 * that form between four celestial bodies. Computes forming and dissolving phases
 * by comparing the current and previous minute's active aspect sets.
 */
@Injectable()
export class QuadrupleAspectsService {
  // 🏗 Dependency Injection

  constructor() {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  /**
   * Composes Grand Cross patterns from stored 2-body aspects.
   *
   * A Grand Cross is an intense configuration consisting of:
   * - 2 oppositions (180°) at right angles to each other
   * - 4 squares (90°) connecting adjacent bodies
   *
   * Visual pattern:
   * ```
   *     Body1
   *       |
   *       | square
   *       |
   * Body4 + Body2
   *       |
   *       | square
   *       |
   *     Body3
   * ```
   *
   * The four bodies form a cross with all cardinal/fixed/mutable signs.
   * Represents maximum tension and dynamic energy requiring integration
   * of four conflicting forces. Often indicates major life challenges
   * and potential for significant achievement.
   *
   * @param allEdges - All aspect edges across time for phase detection
   * @param minute - The minute to check for Grand Cross patterns
   * @returns Array of Grand Cross events detected at this minute
   * @see {@link determineMultiBodyPhase} for phase calculation
   */
  private composeGrandCrosses(args: {
    currentAspectBodies: AspectBodies[];
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): Event[] {
    const { currentAspectBodies, minute, previousAspectBodies } = args;
    const events: Event[] = [];

    const unionEdges = [...currentAspectBodies, ...previousAspectBodies];
    const aspectsByType = this.groupAspectsByType(unionEdges);

    const oppositions = aspectsByType.get("opposite") || [];
    const squares = aspectsByType.get("square") || [];

    // Need at least 2 oppositions and 4 squares
    if (oppositions.length < 2 || squares.length < 4) {
      return events;
    }

    // Try each pair of oppositions
    for (let index = 0; index < oppositions.length; index++) {
      const opp1 = oppositions[index];
      if (!opp1) {
        continue;
      }
      for (let index_ = index + 1; index_ < oppositions.length; index_++) {
        const opp2 = oppositions[index_];
        if (!opp2) {
          continue;
        }

        // Collect all 4 unique bodies from both oppositions
        const bodies = new Set<Body>([
          opp1.bodies[0],
          opp1.bodies[1],
          opp2.bodies[0],
          opp2.bodies[1],
        ]);
        if (bodies.size !== 4) {
          continue;
        }

        const bodyList = [...bodies];

        const oppositeBodyMap = new Map<Body, Body>([
          [opp1.bodies[0], opp1.bodies[1]],
          [opp1.bodies[1], opp1.bodies[0]],
          [opp2.bodies[0], opp2.bodies[1]],
          [opp2.bodies[1], opp2.bodies[0]],
        ]);

        // Verify all adjacent pairs (in cross configuration) are in square
        let hasAllSquares = true;
        for (const body of bodyList) {
          // Find which body is opposite to this one
          const oppositeBody = oppositeBodyMap.get(body) ?? null;

          if (!oppositeBody) {
            hasAllSquares = false;
            break;
          }

          // This body should be square to the two bodies that are NOT opposite to it
          const adjacentBodies = bodyList.filter(
            (b) => b !== body && b !== oppositeBody,
          );
          for (const adjBody of adjacentBodies) {
            if (!this.haveAspect(body, adjBody, "square", unionEdges)) {
              hasAllSquares = false;
              break;
            }
          }
          if (!hasAllSquares) {
            break;
          }
        }

        if (hasAllSquares) {
          // Found a Grand Cross - calculate phase
          const result = this.determineCompoundPhaseFromSnapshots(
            currentAspectBodies,
            previousAspectBodies,
            bodyList,
            minute,
            (edges) => {
              // Verify all required aspects exist
              const aspectsByType = this.groupAspectsByType(edges);
              const oppositionsAtTime = aspectsByType.get("opposite") || [];
              const squaresAtTime = aspectsByType.get("square") || [];

              // Need the 2 specific oppositions
              const hasOpp1 = this.haveAspect(
                opp1.bodies[0],
                opp1.bodies[1],
                "opposite",
                oppositionsAtTime,
              );
              const hasOpp2 = this.haveAspect(
                opp2.bodies[0],
                opp2.bodies[1],
                "opposite",
                oppositionsAtTime,
              );
              if (!hasOpp1 || !hasOpp2) {
                return false;
              }

              // Verify all adjacent pairs are in square
              const innerOppositeBodyMap = new Map<Body, Body>([
                [opp1.bodies[0], opp1.bodies[1]],
                [opp1.bodies[1], opp1.bodies[0]],
                [opp2.bodies[0], opp2.bodies[1]],
                [opp2.bodies[1], opp2.bodies[0]],
              ]);
              for (const body of bodyList) {
                const oppositeBody = innerOppositeBodyMap.get(body) ?? null;

                if (!oppositeBody) {
                  return false;
                }

                const adjacentBodies = bodyList.filter(
                  (b) => b !== body && b !== oppositeBody,
                );
                for (const adjBody of adjacentBodies) {
                  if (
                    !this.haveAspect(body, adjBody, "square", squaresAtTime)
                  ) {
                    return false;
                  }
                }
              }

              return true;
            },
          );

          if (
            result &&
            bodyList[0] &&
            bodyList[1] &&
            bodyList[2] &&
            bodyList[3]
          ) {
            events.push(
              this.getQuadrupleAspectEvent({
                body1: bodyList[0],
                body2: bodyList[1],
                body3: bodyList[2],
                body4: bodyList[3],
                phase: result.phase,
                quadrupleAspect: "grand cross",
                timestamp: result.eventMinute,
              }),
            );
          }
        }
      }
    }

    return events;
  }

  /**
   * Composes Kite patterns from stored 2-body aspects.
   *
   * A Kite is a mixed configuration consisting of:
   * - 1 Grand Trine (3 trines forming a triangle)
   * - 1 opposition from one trine body to a fourth focal body
   * - 2 sextiles from the focal body to the other two trine bodies
   *
   * Visual pattern:
   * ```
   *        Body1
   *        /   \
   *  trine/     \trine
   *      /       \
   *  Body2 ----- Body3
   *      \  trine /
   * sextile\   /sextile
   *         \ /
   *      FocalBody
   * ```
   *
   * The focal body provides direction and motivation to the harmonious
   * Grand Trine, creating a configuration that balances ease with drive.
   * Often indicates talent with opportunity for manifestation.
   *
   * @param allEdges - All aspect edges across time for phase detection
   * @param minute - The minute to check for Kite patterns
   * @returns Array of Kite events detected at this minute
   * @see {@link determineMultiBodyPhase} for phase calculation
   */
  private composeKites(args: {
    currentAspectBodies: AspectBodies[];
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): Event[] {
    const { currentAspectBodies, minute, previousAspectBodies } = args;
    const events: Event[] = [];

    const unionEdges = [...currentAspectBodies, ...previousAspectBodies];
    const aspectsByType = this.groupAspectsByType(unionEdges);

    const trines = aspectsByType.get("trine") || [];
    const oppositions = aspectsByType.get("opposite") || [];
    const sextiles = aspectsByType.get("sextile") || [];

    if (trines.length < 3 || oppositions.length === 0 || sextiles.length < 2) {
      return events;
    }

    // First find all grand trines (3 bodies all in trine with each other)
    const grandTrines: Set<Body>[] = [];
    for (let index = 0; index < trines.length; index++) {
      const trineI = trines[index];
      if (!trineI) {
        continue;
      }
      for (let index_ = index + 1; index_ < trines.length; index_++) {
        const trineJ = trines[index_];
        if (!trineJ) {
          continue;
        }
        for (let index__ = index_ + 1; index__ < trines.length; index__++) {
          const trineK = trines[index__];
          if (!trineK) {
            continue;
          }
          const bodies = new Set<Body>([
            trineI.bodies[0],
            trineI.bodies[1],
            trineJ.bodies[0],
            trineJ.bodies[1],
            trineK.bodies[0],
            trineK.bodies[1],
          ]);

          if (bodies.size === 3) {
            const bodyList = [...bodies];
            const body0 = bodyList[0];
            const body1 = bodyList[1];
            const body2 = bodyList[2];
            if (
              body0 &&
              body1 &&
              body2 &&
              this.haveAspect(body0, body1, "trine", unionEdges) &&
              this.haveAspect(body0, body2, "trine", unionEdges) &&
              this.haveAspect(body1, body2, "trine", unionEdges)
            ) {
              grandTrines.push(bodies);
            }
          }
        }
      }
    }

    // For each grand trine, look for a 4th body that forms a kite
    for (const gtBodies of grandTrines) {
      const gtList = [...gtBodies];

      for (const baseBody of gtList) {
        const otherTwo = gtList.filter((b) => b !== baseBody);

        for (const opp of oppositions) {
          if (!this.involvesBody(opp, baseBody)) {
            continue;
          }

          const fourthBody = this.getOtherBody(opp, baseBody);
          if (!fourthBody || gtBodies.has(fourthBody)) {
            continue;
          }

          const other0 = otherTwo[0];
          const other1 = otherTwo[1];
          if (
            other0 &&
            other1 &&
            this.haveAspect(fourthBody, other0, "sextile", unionEdges) &&
            this.haveAspect(fourthBody, other1, "sextile", unionEdges)
          ) {
            // Found a Kite!
            const bodies = [baseBody, other0, other1, fourthBody];

            const result = this.determineCompoundPhaseFromSnapshots(
              currentAspectBodies,
              previousAspectBodies,
              bodies,
              minute,
              (edges) => {
                return (
                  this.haveAspect(baseBody, fourthBody, "opposite", edges) &&
                  this.haveAspect(baseBody, other0, "trine", edges) &&
                  this.haveAspect(baseBody, other1, "trine", edges) &&
                  this.haveAspect(other0, other1, "trine", edges) &&
                  this.haveAspect(fourthBody, other0, "sextile", edges) &&
                  this.haveAspect(fourthBody, other1, "sextile", edges)
                );
              },
            );

            if (result && bodies[0] && bodies[1] && bodies[2] && bodies[3]) {
              events.push(
                this.getQuadrupleAspectEvent({
                  body1: bodies[0],
                  body2: bodies[1],
                  body3: bodies[2],
                  body4: bodies[3],
                  focalOrApexBody: fourthBody,
                  phase: result.phase,
                  quadrupleAspect: "kite",
                  timestamp: result.eventMinute,
                }),
              );
            }
          }
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
      edges.filter(
        (edge) => bodySet.has(edge.bodies[0]) && bodySet.has(edge.bodies[1]),
      );

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
   * Create a quadruple aspect event
   */
  private getQuadrupleAspectEvent(parameters: {
    body1: Body;
    body2: Body;
    body3: Body;
    body4: Body;
    focalOrApexBody?: Body;
    phase: AspectPhase;
    quadrupleAspect: QuadrupleAspect;
    timestamp: Moment;
  }): Event {
    const {
      body1,
      body2,
      body3,
      body4,
      focalOrApexBody,
      phase,
      quadrupleAspect,
      timestamp,
    } = parameters;

    const body1Capitalized = _.startCase(body1);
    const body2Capitalized = _.startCase(body2);
    const body3Capitalized = _.startCase(body3);
    const body4Capitalized = _.startCase(body4);

    const body1Symbol = symbolByBody[body1];
    const body2Symbol = symbolByBody[body2];
    const body3Symbol = symbolByBody[body3];
    const body4Symbol = symbolByBody[body4];
    const quadrupleAspectSymbol = symbolByQuadrupleAspect[quadrupleAspect];

    const bodiesSorted = _.sortBy([
      body1Capitalized,
      body2Capitalized,
      body3Capitalized,
      body4Capitalized,
    ]);

    const description = focalOrApexBody
      ? `${bodiesSorted.join(", ")} ${quadrupleAspect} ${phase} (${_.startCase(
          focalOrApexBody,
        )} focal)`
      : `${bodiesSorted.join(", ")} ${quadrupleAspect} ${phase}`;

    let phaseEmoji: string;
    if (phase === "forming") {
      phaseEmoji = "➡️ ";
    } else if (phase === "perfective") {
      phaseEmoji = "🎯 ";
    } else {
      phaseEmoji = "⬅️ ";
    }

    const summary = `${phaseEmoji}${quadrupleAspectSymbol} ${body1Symbol}-${body2Symbol}-${body3Symbol}-${body4Symbol} ${description}`;

    const categories = [
      "Astronomy",
      "Astrology",
      "Compound Aspect",
      "Quadruple Aspect",
      _.startCase(quadrupleAspect),
      _.startCase(phase),
      body1Capitalized,
      body2Capitalized,
      body3Capitalized,
      body4Capitalized,
    ];

    if (focalOrApexBody) {
      categories.push(`${_.startCase(focalOrApexBody)} Focal`);
    }

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

  private haveAspect(
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

  // 🌎 Public Methods

  /**
   * Detects all quadruple aspect patterns from stored 2-body aspect events.
   *
   * Analyzes combinations of simple aspects to identify 4-body patterns:
   * - Grand Cross (2 oppositions + 4 squares)
   * - Kite (Grand Trine + opposition + 2 sextiles)
   *
   * These rare configurations represent major life themes and turning points,
   * indicating either intense challenge (Grand Cross) or channeled talent (Kite).
   *
   * @param aspectEvents - Previously detected simple aspect events
   * @param minute - The minute to check for quadruple aspect patterns
   * @returns Array of all detected quadruple aspect events at this minute
   * @see {@link parseAspectEvents} for extracting aspect relationships
   * @see {@link composeGrandCrosses} for Grand Cross detection
   * @see {@link composeKites} for Kite detection
   */
  detect(args: {
    currentAspectBodies: AspectBodies[];
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): Event[] {
    const { currentAspectBodies, minute, previousAspectBodies } = args;
    return [
      ...this.composeGrandCrosses({
        currentAspectBodies,
        minute,
        previousAspectBodies,
      }),
      ...this.composeKites({
        currentAspectBodies,
        minute,
        previousAspectBodies,
      }),
    ];
  }

  /**
   * Converts instantaneous quadruple aspect events into progressive events.
   *
   * Pairs forming and dissolving events for the same body quartet and
   * pattern type to create events spanning the entire active period.
   * Progressive events show when a pattern is in effect rather than just
   * boundary moments.
   *
   * @param events - All events to process (non-quadruple-aspect events are filtered out)
   * @returns Array of progressive events spanning from forming to dissolving
   */
  detectProgressive(events: Event[]): Event[] {
    const progressiveEvents: Event[] = [];

    // Filter to quadruple aspect events only
    const quadrupleAspectEvents = events.filter((event) =>
      event.categories.includes("Quadruple Aspect"),
    );

    // Group by body quartet and aspect type using categories
    const groupedEvents = _.groupBy(quadrupleAspectEvents, (event) => {
      const planets = _.sortBy(
        event.categories.filter((category) =>
          quadrupleAspectBodies
            .map((quadrupleAspectBody) => _.startCase(quadrupleAspectBody))
            .includes(category),
        ),
      );

      const aspect = event.categories.find((category) =>
        ["Grand Cross", "Kite"].includes(category),
      );

      return `${planets.join("-")}_${aspect}`;
    });

    // Process each group to find forming/dissolving pairs
    for (const group of Object.values(groupedEvents)) {
      const sortedEvents = _.sortBy(group, "start");

      for (let index = 0; index < sortedEvents.length; index++) {
        const currentEvent = sortedEvents[index];
        if (!currentEvent) {
          continue;
        }

        // Skip if not a forming event
        if (!currentEvent.categories.includes("Forming")) {
          continue;
        }

        // Look for the next dissolving event
        for (let index_ = index + 1; index_ < sortedEvents.length; index_++) {
          const potentialDissolvingEvent = sortedEvents[index_];
          if (!potentialDissolvingEvent) {
            continue;
          }

          if (potentialDissolvingEvent.categories.includes("Dissolving")) {
            // Create progressive event
            const categories = currentEvent.categories.filter(
              (c) =>
                c !== "Forming" && c !== "Perfective" && c !== "Dissolving",
            );

            progressiveEvents.push({
              categories,
              description: currentEvent.description.replace(
                / (forming|exact|dissolving)( \(.*\))?$/i,
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

  /**
   * Returns the other body in an aspect edge relative to the given body.
   *
   * @param edge - An active 2-body aspect relationship
   * @param body - The reference body
   * @returns The other body, or `null` if the given body is not in the edge
   */
  getOtherBody(edge: AspectBodies, body: Body): Body | null {
    if (edge.bodies[0] === body) {
      return edge.bodies[1];
    }
    if (edge.bodies[1] === body) {
      return edge.bodies[0];
    }
    return null;
  }

  /**
   * Returns `true` if the given aspect edge involves the specified celestial body.
   *
   * @param edge - An active 2-body aspect relationship
   * @param body - The body to check for involvement
   */
  involvesBody(edge: AspectBodies, body: Body): boolean {
    return edge.bodies[0] === body || edge.bodies[1] === body;
  }
}
