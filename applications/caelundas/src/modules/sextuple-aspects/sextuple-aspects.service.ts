import {
  symbolByBody,
  symbolBySextupleAspect,
} from "@caelundas/src/modules/caelundas/caelundas.constants";
import {
  groupByToMap,
  sextupleAspectBodies,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import type { AspectBodies } from "@caelundas/src/modules/aspects/aspects.service";
import type {
  Aspect,
  AspectPhase,
  Body,
  SextupleAspect,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { Moment } from "moment-timezone";

/**
 * Detects 6-body compound aspect configurations: the Hexagram (Star of David) pattern.
 *
 * Analyses trine (120°) and sextile (60°) aspects among six celestial bodies to identify
 * the hexagram configuration. Computes forming and dissolving phases by comparing
 * current and previous aspect sets.
 */
@Injectable()
export class SextupleAspectsService {
  // 🏗 Dependency Injection

  constructor(private readonly mathService: MathService) {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  private buildAspectConnectionMaps(
    bodies: Body[],
    edges: AspectBodies[],
  ): { sextileConnections: Map<Body, Set<Body>>; trineConnections: Map<Body, Set<Body>> } {
    const trineConnections = new Map<Body, Set<Body>>();
    const sextileConnections = new Map<Body, Set<Body>>();

    for (const body of bodies) {
      trineConnections.set(body, new Set());
      sextileConnections.set(body, new Set());
    }

    for (const edge of edges) {
      if (!bodies.includes(edge.bodies[0]) || !bodies.includes(edge.bodies[1])) {
        continue;
      }

      if (edge.aspect === "trine") {
        trineConnections.get(edge.bodies[0])?.add(edge.bodies[1]);
        trineConnections.get(edge.bodies[1])?.add(edge.bodies[0]);
      } else if (edge.aspect === "sextile") {
        sextileConnections.get(edge.bodies[0])?.add(edge.bodies[1]);
        sextileConnections.get(edge.bodies[1])?.add(edge.bodies[0]);
      }
    }

    return { sextileConnections, trineConnections };
  }

  private buildHexagramEvent(
    hexagramBodies: Body[],
    phase: AspectPhase,
    eventMinute: Moment,
  ): Event | null {
    const b0 = hexagramBodies[0];
    const b1 = hexagramBodies[1];
    const b2 = hexagramBodies[2];
    const b3 = hexagramBodies[3];
    const b4 = hexagramBodies[4];
    const b5 = hexagramBodies[5];

    if (!b0 || !b1 || !b2 || !b3 || !b4 || !b5) {
      return null;
    }

    return this.getSextupleAspectEvent({
      body1: b0,
      body2: b1,
      body3: b2,
      body4: b3,
      body5: b4,
      body6: b5,
      phase,
      sextupleAspect: "hexagram",
      timestamp: eventMinute,
    });
  }

  private buildProgressiveSextupleEvent(
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
      summary: forming.summary.replace(/^(?:➡️|🎯|⬅️)\s/u, ""),
    };
  }

  private buildSextupleAspectCategories(
    bodiesSorted: string[],
    sextupleAspect: SextupleAspect,
    phase: AspectPhase,
  ): string[] {
    return [
      "Astronomy",
      "Astrology",
      "Compound Aspect",
      "Sextuple Aspect",
      _.startCase(sextupleAspect),
      _.startCase(phase),
      ...bodiesSorted,
    ];
  }

  private buildSextupleAspectSummary(
    phase: AspectPhase,
    aspectSymbol: string,
    symbols: string[],
    description: string,
  ): string {
    const phaseEmoji = this.getPhaseEmoji(phase);
    const symbolChain = symbols.join("-");

    return `${phaseEmoji}${aspectSymbol} ${symbolChain} ${description}`;
  }

  private buildSextupleEventFromParameters(parameters: {
    aspectSymbol: string;
    bodies: Body[];
    bodiesSorted: string[];
    phase: AspectPhase;
    sextupleAspect: SextupleAspect;
    symbols: string[];
    timestamp: Moment;
  }): Event {
    const {
      aspectSymbol,
      bodiesSorted,
      phase,
      sextupleAspect,
      symbols,
      timestamp,
    } = parameters;

    const description = `${bodiesSorted.join(", ")} ${sextupleAspect} ${phase}`;
    const summary = this.buildSextupleAspectSummary(
      phase,
      aspectSymbol,
      symbols,
      description,
    );
    const categories = this.buildSextupleAspectCategories(
      bodiesSorted,
      sextupleAspect,
      phase,
    );

    return { categories, description, end: timestamp, start: timestamp, summary };
  }

  private checkHexagonSextiles(
    arrangement: Body[],
    sextileConnections: Map<Body, Set<Body>>,
  ): boolean {
    const a0 = arrangement[0];
    const a1 = arrangement[1];
    const a2 = arrangement[2];
    const a3 = arrangement[3];
    const a4 = arrangement[4];
    const a5 = arrangement[5];

    if (!a0 || !a1 || !a2 || !a3 || !a4 || !a5) {
      return false;
    }

    return !!(
      sextileConnections.get(a0)?.has(a1) &&
      sextileConnections.get(a1)?.has(a2) &&
      sextileConnections.get(a2)?.has(a3) &&
      sextileConnections.get(a3)?.has(a4) &&
      sextileConnections.get(a4)?.has(a5) &&
      sextileConnections.get(a5)?.has(a0)
    );
  }

  private collectTrineBodies(trines: AspectBodies[]): Body[] {
    const bodiesSet = new Set<Body>();

    for (const edge of trines) {
      bodiesSet.add(edge.bodies[0]);
      bodiesSet.add(edge.bodies[1]);
    }

    return [...bodiesSet];
  }

  /**
   * Composes Hexagram (Star of David) patterns from stored 2-body aspects.
   *
   * A Hexagram consists of 6 bodies forming two interlocking Grand Trines
   * plus a hexagon of sextile connections.
   */
  private composeHexagrams(args: {
    currentAspectBodies: AspectBodies[];
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): Event[] {
    const { currentAspectBodies, minute, previousAspectBodies } = args;
    const events: Event[] = [];

    const unionEdges = [...currentAspectBodies, ...previousAspectBodies];
    const aspectsByType = this.groupAspectsByType(unionEdges);
    const trines = aspectsByType.get("trine") || [];
    const sextiles = aspectsByType.get("sextile") || [];

    if (trines.length < 6 || sextiles.length < 6) {
      return events;
    }

    const bodies = this.collectTrineBodies(trines);

    if (bodies.length < 6) {
      return events;
    }

    const combinations = this.mathService.getCombinations(bodies, 6);

    for (const combo of combinations) {
      const hexagramBodies = this.findHexagramPattern(combo, unionEdges);

      if (!hexagramBodies) {
        continue;
      }

      const result = this.determineCompoundPhaseFromSnapshots(
        currentAspectBodies,
        previousAspectBodies,
        hexagramBodies,
        minute,
        (edges) => this.findHexagramPattern(hexagramBodies, edges) !== null,
      );

      if (!result) {
        continue;
      }

      const event = this.buildHexagramEvent(
        hexagramBodies,
        result.phase,
        result.eventMinute,
      );

      if (event) {
        events.push(event);
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

  private findGrandTrinePairs(
    bodies: Body[],
    trineConnections: Map<Body, Set<Body>>,
  ): Body[][] | null {
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

    if (trineGroups.length !== 2) {
      return null;
    }

    return trineGroups;
  }

  /**
   * Checks if 6 bodies form a valid hexagram (Star of David) pattern.
   *
   * A hexagram consists of two interlocking Grand Trines plus sextiles
   * forming a hexagon: 6 trines (120°) and 6 sextiles (60°).
   */
  private findHexagramPattern(
    bodies: Body[],
    edges: AspectBodies[],
  ): Body[] | null {
    const { sextileConnections, trineConnections } =
      this.buildAspectConnectionMaps(bodies, edges);

    const trineGroups = this.findGrandTrinePairs(bodies, trineConnections);

    if (!trineGroups) {
      return null;
    }

    const trine1 = trineGroups[0];
    const trine2 = trineGroups[1];

    if (!trine1 || !trine2) {
      return null;
    }

    return this.findValidHexagonArrangement(trine1, trine2, sextileConnections);
  }

  private findValidHexagonArrangement(
    trine1: Body[],
    trine2: Body[],
    sextileConnections: Map<Body, Set<Body>>,
  ): Body[] | null {
    for (let index = 0; index < 3; index++) {
      for (let index_ = 0; index_ < 3; index_++) {
        const result = this.tryHexagonArrangement(
          trine1,
          trine2,
          index,
          index_,
          sextileConnections,
        );

        if (result) {
          return result;
        }
      }
    }

    return null;
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
   * Create a sextuple aspect event
   */
  private getSextupleAspectEvent(parameters: {
    body1: Body;
    body2: Body;
    body3: Body;
    body4: Body;
    body5: Body;
    body6: Body;
    phase: AspectPhase;
    sextupleAspect: SextupleAspect;
    timestamp: Moment;
  }): Event {
    const { body1, body2, body3, body4, body5, body6, phase, sextupleAspect, timestamp } =
      parameters;

    const bodiesList = [body1, body2, body3, body4, body5, body6];
    const bodiesSorted = _.sortBy(bodiesList.map((b) => _.startCase(b)));
    const symbols = bodiesList.map((b) => symbolByBody[b]);
    const aspectSymbol = symbolBySextupleAspect[sextupleAspect];

    return this.buildSextupleEventFromParameters({
      aspectSymbol,
      bodies: bodiesList,
      bodiesSorted,
      phase,
      sextupleAspect,
      symbols,
      timestamp,
    });
  }

  private groupAspectsByType<T extends AspectBodies>(
    edges: T[],
  ): Map<Aspect, T[]> {
    return groupByToMap(edges, (edge) => edge.aspect);
  }

  private groupSextupleEventsByKey(
    events: Event[],
  ): Record<string, Event[]> {
    const sextupleAspectEvents = events.filter((event) =>
      event.categories.includes("Sextuple Aspect"),
    );

    return _.groupBy(sextupleAspectEvents, (event) => {
      const filteredPlanets = event.categories.filter((category) =>
        sextupleAspectBodies
          .map((b) => _.startCase(b))
          .includes(category),
      );
      const planets = _.sortBy(filteredPlanets);
      const aspect = event.categories.find((c) =>
        ["Grand Sextile", "Hexagram"].includes(c),
      );

      return `${planets.join("-")}_${aspect}`;
    });
  }

  private tryHexagonArrangement(
    trine1: Body[],
    trine2: Body[],
    index: number,
    index_: number,
    sextileConnections: Map<Body, Set<Body>>,
  ): Body[] | null {
    for (let index__ = 0; index__ < 3; index__++) {
      if (index__ === index) {
        continue;
      }

      for (let l = 0; l < 3; l++) {
        if (l === index_) {
          continue;
        }

        const m = [0, 1, 2].find((x) => x !== index && x !== index__);
        const n = [0, 1, 2].find((x) => x !== index_ && x !== l);

        if (m === undefined || n === undefined) {
          continue;
        }

        const arrangement = [
          trine1[index], trine2[index_], trine1[index__], trine2[l], trine1[m], trine2[n],
        ];

        if (this.checkHexagonSextiles(arrangement as Body[], sextileConnections)) {
          return arrangement as Body[];
        }
      }
    }

    return null;
  }

  // 🌎 Public Methods

  /**
   * Detects all sextuple aspect patterns from stored 2-body aspect events.
   *
   * Currently detects the Hexagram (Star of David) pattern, which is one
   * of the rarest and most spiritually significant configurations.
   *
   * @param aspectEvents - Previously detected simple aspect events
   * @param minute - The minute to check for sextuple aspect patterns
   * @returns Array of all detected sextuple aspect events at this minute
   */
  detect(args: {
    currentAspectBodies: AspectBodies[];
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): Event[] {
    const { currentAspectBodies, minute, previousAspectBodies } = args;
    return this.composeHexagrams({
      currentAspectBodies,
      minute,
      previousAspectBodies,
    });
  }

  /**
   * Converts instantaneous sextuple aspect events into progressive events.
   *
   * Pairs forming and dissolving events for the same body sextet and
   * pattern type to create events spanning the entire active period.
   *
   * @param events - All events to process (non-sextuple-aspect events are filtered out)
   * @returns Array of progressive events spanning from forming to dissolving
   */
  detectProgressive(events: Event[]): Event[] {
    const progressiveEvents: Event[] = [];
    const groupedEvents = this.groupSextupleEventsByKey(events);

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
              this.buildProgressiveSextupleEvent(
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
