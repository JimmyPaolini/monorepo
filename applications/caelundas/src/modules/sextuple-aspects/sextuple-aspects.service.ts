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
interface BuildSextupleEventParameters {
  aspectSymbol: string;
  bodies: Body[];
  bodiesSorted: string[];
  phase: AspectPhase;
  sextupleAspect: SextupleAspect;
  symbols: string[];
  timestamp: Moment;
}

interface ComposeHexagramsArguments {
  currentAspectBodies: AspectBodies[];
  minute: Moment;
  previousAspectBodies: AspectBodies[];
}

interface GetSextupleAspectEventArguments {
  body1: Body;
  body2: Body;
  body3: Body;
  body4: Body;
  body5: Body;
  body6: Body;
  phase: AspectPhase;
  sextupleAspect: SextupleAspect;
  timestamp: Moment;
}

/**
 *
 */
@Injectable()
export class SextupleAspectsService {
  // 🏗 Dependency Injection

  constructor(private readonly mathService: MathService) {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  private addConnection(map: Map<Body, Set<Body>>, b1: Body, b2: Body): void {
    const s = map.get(b1);
    if (s) s.add(b2);
  }

  private buildAspectConnectionMaps(
    bodies: Body[],
    edges: AspectBodies[],
  ): {
    sextileConnections: Map<Body, Set<Body>>;
    trineConnections: Map<Body, Set<Body>>;
  } {
    const trineConnections = new Map<Body, Set<Body>>(
      bodies.map((b) => [b, new Set()]),
    );
    const sextileConnections = new Map<Body, Set<Body>>(
      bodies.map((b) => [b, new Set()]),
    );
    for (const edge of edges) {
      const b0 = edge.bodies[0];
      const b1 = edge.bodies[1];
      if (!bodies.includes(b0) || !bodies.includes(b1)) continue;
      if (edge.aspect === "trine") {
        this.addConnection(trineConnections, b0, b1);
        this.addConnection(trineConnections, b1, b0);
      } else if (edge.aspect === "sextile") {
        this.addConnection(sextileConnections, b0, b1);
        this.addConnection(sextileConnections, b1, b0);
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

  private buildSextupleEventFromParameters(
    parameters: BuildSextupleEventParameters,
  ): Event {
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

    return {
      categories,
      description,
      end: timestamp,
      start: timestamp,
      summary,
    };
  }

  private checkHexagonSextiles(
    arrangement: Body[],
    sextileConnections: Map<Body, Set<Body>>,
  ): boolean {
    if (arrangement.length !== 6) return false;
    for (let index = 0; index < 6; index++) {
      const current = arrangement[index];
      const next = arrangement[(index + 1) % 6];
      if (!current || !next) return false;
      const conns = sextileConnections.get(current);
      if (!conns?.has(next)) return false;
    }
    return true;
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
  private composeHexagrams(args: ComposeHexagramsArguments): Event[] {
    const { currentAspectBodies, minute, previousAspectBodies } = args;
    const unionEdges = [...currentAspectBodies, ...previousAspectBodies];
    const aspectsByType = this.groupAspectsByType(unionEdges);
    const trines = aspectsByType.get("trine") || [];
    const sextiles = aspectsByType.get("sextile") || [];
    if (trines.length < 6 || sextiles.length < 6) return [];
    const bodies = this.collectTrineBodies(trines);
    if (bodies.length < 6) return [];
    return this.processHexagramCombinations(
      this.mathService.getCombinations(bodies, 6),
      unionEdges,
      currentAspectBodies,
      previousAspectBodies,
      minute,
    );
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
      if (visited.has(body)) continue;
      const trineNeighbors = this.getGrandTrineNeighbors(
        body,
        trineConnections,
      );
      if (trineNeighbors) {
        const n0 = trineNeighbors[0];
        const n1 = trineNeighbors[1];
        if (n0 && n1) {
          trineGroups.push([body, n0, n1]);
          [body, n0, n1].forEach((b) => visited.add(b));
        }
      }
    }
    return trineGroups.length === 2 ? trineGroups : null;
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

  private getGrandTrineNeighbors(
    body: Body,
    trineConnections: Map<Body, Set<Body>>,
  ): Body[] | null {
    const tNeighbors = trineConnections.get(body);
    if (tNeighbors?.size !== 2) return null;
    const neighbors = [...tNeighbors];
    const n0 = neighbors[0];
    const n1 = neighbors[1];
    return n0 && n1 && this.isValidGrandTrine(trineConnections, n0, n1)
      ? [n0, n1]
      : null;
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
  private getSextupleAspectEvent(
    parameters: GetSextupleAspectEventArguments,
  ): Event {
    const {
      body1,
      body2,
      body3,
      body4,
      body5,
      body6,
      phase,
      sextupleAspect,
      timestamp,
    } = parameters;

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

  private groupSextupleEventsByKey(events: Event[]): Record<string, Event[]> {
    const sextupleAspectEvents = events.filter((event) =>
      event.categories.includes("Sextuple Aspect"),
    );

    return _.groupBy(sextupleAspectEvents, (event) => {
      const filteredPlanets = event.categories.filter((category) =>
        sextupleAspectBodies.map((b) => _.startCase(b)).includes(category),
      );
      const planets = _.sortBy(filteredPlanets);
      const aspect = event.categories.find((c) =>
        ["Grand Sextile", "Hexagram"].includes(c),
      );

      return `${planets.join("-")}_${aspect}`;
    });
  }

  private isValidGrandTrine(
    trineConnections: Map<Body, Set<Body>>,
    b1: Body | undefined,
    b2: Body | undefined,
  ): boolean {
    return !!(b1 && b2 && trineConnections.get(b1)?.has(b2));
  }

  private processHexagramCombinations(
    combinations: Body[][],
    unionEdges: AspectBodies[],
    currentAspectBodies: AspectBodies[],
    previousAspectBodies: AspectBodies[],
    minute: Moment,
  ): Event[] {
    const events: Event[] = [];
    for (const combo of combinations) {
      const hexagramBodies = this.findHexagramPattern(combo, unionEdges);
      if (!hexagramBodies) continue;
      const result = this.determineCompoundPhaseFromSnapshots(
        currentAspectBodies,
        previousAspectBodies,
        hexagramBodies,
        minute,
        (edges) => this.findHexagramPattern(hexagramBodies, edges) !== null,
      );
      if (!result) continue;
      const event = this.buildHexagramEvent(
        hexagramBodies,
        result.phase,
        result.eventMinute,
      );
      if (event) events.push(event);
    }
    return events;
  }

  private tryHexagonArrangement(
    trine1: Body[],
    trine2: Body[],
    index: number,
    index_: number,
    sextileConnections: Map<Body, Set<Body>>,
  ): Body[] | null {
    for (const index__ of [0, 1, 2]) {
      if (index__ === index) continue;
      for (const l of [0, 1, 2]) {
        if (l === index_) continue;
        const m = [0, 1, 2].find((x) => x !== index && x !== index__);
        const n = [0, 1, 2].find((x) => x !== index_ && x !== l);
        if (m === undefined || n === undefined) continue;
        const t1_0 = trine1[index];
        const t2_0 = trine2[index_];
        const t1_1 = trine1[index__];
        const t2_1 = trine2[l];
        const t1_2 = trine1[m];
        const t2_2 = trine2[n];
        if (!t1_0 || !t2_0 || !t1_1 || !t2_1 || !t1_2 || !t2_2) continue;
        const arrangement: Body[] = [t1_0, t2_0, t1_1, t2_1, t1_2, t2_2];
        if (this.checkHexagonSextiles(arrangement, sextileConnections))
          return arrangement;
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
