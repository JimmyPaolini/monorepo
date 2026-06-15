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

  private buildPentagramEvent(
    pentagramBodies: Body[],
    phase: AspectPhase,
    eventMinute: Moment,
  ): Event | null {
    const b0 = pentagramBodies[0];
    const b1 = pentagramBodies[1];
    const b2 = pentagramBodies[2];
    const b3 = pentagramBodies[3];
    const b4 = pentagramBodies[4];

    if (!b0 || !b1 || !b2 || !b3 || !b4) {
      return null;
    }

    return this.getQuintupleAspectEvent({
      body1: b0,
      body2: b1,
      body3: b2,
      body4: b3,
      body5: b4,
      phase,
      quintupleAspect: "pentagram",
      timestamp: eventMinute,
    });
  }

  private buildProgressiveQuintupleEvent(
    forming: Event,
    dissolving: Event,
  ): Event {
    return {
      categories: forming.categories.filter(
        (c) => c !== "Forming" && c !== "Perfective" && c !== "Dissolving",
      ),
      description: forming.description.replace(
        / (forming|exact|dissolving)$/,
        "",
      ),
      end: dissolving.start,
      start: forming.start,
      summary: forming.summary.replace(/^(➡️|⬅️|🎯)\s/, ""),
    };
  }

  private buildQuintileConnections(
    bodies: Body[],
    edges: AspectBodies[],
  ): Map<Body, Set<Body>> {
    const connections = new Map<Body, Set<Body>>();

    for (const body of bodies) {
      connections.set(body, new Set());
    }

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

    return connections;
  }

  private buildQuintupleAspectCategories(
    bodiesSorted: string[],
    quintupleAspect: QuintupleAspect,
    phase: AspectPhase,
  ): string[] {
    return [
      "Astronomy",
      "Astrology",
      "Compound Aspect",
      "Quintuple Aspect",
      _.startCase(quintupleAspect),
      _.startCase(phase),
      ...bodiesSorted,
    ];
  }

  private buildQuintupleAspectSummary(
    phase: AspectPhase,
    aspectSymbol: string,
    symbols: string[],
    description: string,
  ): string {
    const phaseEmoji = this.getPhaseEmoji(phase);
    const symbolChain = symbols.join("-");

    return `${phaseEmoji}${aspectSymbol} ${symbolChain} ${description}`;
  }

  private buildQuintupleEventFromParameters(parameters: {
    aspectSymbol: string;
    bodies: Body[];
    bodiesSorted: string[];
    phase: AspectPhase;
    quintupleAspect: QuintupleAspect;
    symbols: string[];
    timestamp: Moment;
  }): Event {
    const {
      aspectSymbol,
      bodiesSorted,
      phase,
      quintupleAspect,
      symbols,
      timestamp,
    } = parameters;

    const description = `${bodiesSorted.join(", ")} ${quintupleAspect} ${phase}`;
    const summary = this.buildQuintupleAspectSummary(
      phase,
      aspectSymbol,
      symbols,
      description,
    );
    const categories = this.buildQuintupleAspectCategories(
      bodiesSorted,
      quintupleAspect,
      phase,
    );

    return { categories, description, end: timestamp, start: timestamp, summary };
  }

  private collectQuintileBodies(quintiles: AspectBodies[]): Body[] {
    const bodiesSet = new Set<Body>();

    for (const edge of quintiles) {
      bodiesSet.add(edge.bodies[0]);
      bodiesSet.add(edge.bodies[1]);
    }

    return [...bodiesSet];
  }

  /**
   * Composes Pentagram patterns from stored 2-body aspects.
   *
   * A Pentagram is an extremely rare configuration of 5 bodies forming
   * a 5-pointed star with 5 quintile aspects (72° each).
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

    const bodies = this.collectQuintileBodies(quintiles);

    if (bodies.length < 5) {
      return events;
    }

    const combinations = this.mathService.getCombinations(bodies, 5);

    for (const combo of combinations) {
      const pentagramBodies = this.findPentagramPattern(combo, unionEdges);

      if (!pentagramBodies) {
        continue;
      }

      const result = this.determineCompoundPhaseFromSnapshots(
        currentAspectBodies,
        previousAspectBodies,
        pentagramBodies,
        minute,
        (edges) => this.findPentagramPattern(pentagramBodies, edges) !== null,
      );

      if (!result) {
        continue;
      }

      const event = this.buildPentagramEvent(
        pentagramBodies,
        result.phase,
        result.eventMinute,
      );

      if (event) {
        events.push(event);
      }
    }

    return events;
  }

  private countUniqueQuintilePairs(
    edges: AspectBodies[],
    orderedBodies: Body[],
  ): number {
    const uniquePairs = new Set(
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

    return uniquePairs.size;
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
   * Checks if 5 bodies form a valid pentagram pattern (5-pointed star).
   *
   * A pentagram consists of 5 bodies where each body connects to exactly
   * 2 others via quintile aspects (72°), forming a 5-pointed star shape.
   */
  private findPentagramPattern(
    bodies: Body[],
    edges: AspectBodies[],
  ): Body[] | null {
    const connections = this.buildQuintileConnections(bodies, edges);

    for (const [, connected] of connections) {
      if (connected.size !== 2) {
        return null;
      }
    }

    const orderedBodies = this.traversePentagramPath(connections, bodies);

    if (!orderedBodies) {
      return null;
    }

    if (this.countUniqueQuintilePairs(edges, orderedBodies) !== 5) {
      return null;
    }

    return orderedBodies;
  }

  private getPhaseEmoji(phase: AspectPhase): string {
    if (phase === "forming") {
      return "➡️ ";
    }

    if (phase === "perfective") {
      return "🎯 ";
    }

    return "⬅️ ";
  }

  /**
   * Create a quintuple aspect event
   */
  private getQuintupleAspectEvent(parameters: {
    body1: Body;
    body2: Body;
    body3: Body;
    body4: Body;
    body5: Body;
    phase: AspectPhase;
    quintupleAspect: QuintupleAspect;
    timestamp: Moment;
  }): Event {
    const { body1, body2, body3, body4, body5, phase, quintupleAspect, timestamp } =
      parameters;

    const bodiesList = [body1, body2, body3, body4, body5];
    const bodiesSorted = _.sortBy(bodiesList.map((b) => _.startCase(b)));
    const symbols = bodiesList.map((b) => symbolByBody[b]);
    const aspectSymbol = symbolByQuintupleAspect[quintupleAspect];

    return this.buildQuintupleEventFromParameters({
      aspectSymbol,
      bodies: bodiesList,
      bodiesSorted,
      phase,
      quintupleAspect,
      symbols,
      timestamp,
    });
  }

  private groupAspectsByType<T extends AspectBodies>(
    edges: T[],
  ): Map<Aspect, T[]> {
    return groupByToMap(edges, (edge) => edge.aspect);
  }

  private groupQuintupleEventsByKey(
    events: Event[],
  ): Record<string, Event[]> {
    const quintupleAspectEvents = events.filter((event) =>
      event.categories.includes("Quintuple Aspect"),
    );

    return _.groupBy(quintupleAspectEvents, (event) => {
      const filteredPlanets = event.categories.filter((category) =>
        quintupleAspectBodies
          .map((b) => _.startCase(b))
          .includes(category),
      );
      const planets = _.sortBy(filteredPlanets);
      const aspect = event.categories.find((c) => ["Pentagram"].includes(c));

      return `${planets.join("-")}_${aspect}`;
    });
  }

  private traversePentagramPath(
    connections: Map<Body, Set<Body>>,
    bodies: Body[],
  ): Body[] | null {
    const start = bodies[0];

    if (!start) {
      return null;
    }

    const visited = new Set<Body>([start]);
    let current = start;
    const orderedBodies: Body[] = [start];

    for (let index = 0; index < 4; index++) {
      const currentConnections = connections.get(current);

      if (!currentConnections) {
        return null;
      }

      const next = [...currentConnections].find((n) => !visited.has(n));

      if (!next) {
        return null;
      }

      visited.add(next);
      orderedBodies.push(next);
      current = next;
    }

    const finalConnections = connections.get(current);

    if (!finalConnections?.has(start)) {
      return null;
    }

    return orderedBodies;
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
   *
   * @param events - All events to process (non-quintuple-aspect events are filtered out)
   * @returns Array of progressive events spanning from forming to dissolving
   */
  detectProgressive(events: Event[]): Event[] {
    const progressiveEvents: Event[] = [];
    const groupedEvents = this.groupQuintupleEventsByKey(events);

    for (const group of Object.values(groupedEvents)) {
      const sortedEvents = _.sortBy(group, "start");

      for (let index = 0; index < sortedEvents.length; index++) {
        const currentEvent = sortedEvents[index];

        if (!currentEvent?.categories.includes("Forming")) {
          continue;
        }

        for (let index_ = index + 1; index_ < sortedEvents.length; index_++) {
          const potentialDissolvingEvent = sortedEvents[index_];

          if (!potentialDissolvingEvent) {
            continue;
          }

          if (potentialDissolvingEvent.categories.includes("Dissolving")) {
            progressiveEvents.push(
              this.buildProgressiveQuintupleEvent(
                currentEvent,
                potentialDissolvingEvent,
              ),
            );
            break;
          }
        }
      }
    }

    return progressiveEvents;
  }
}
