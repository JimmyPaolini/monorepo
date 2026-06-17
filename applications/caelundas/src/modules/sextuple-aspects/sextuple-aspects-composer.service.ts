import {
  symbolByBody,
  symbolBySextupleAspect,
} from "@caelundas/src/modules/caelundas/caelundas.constants";
import {
  groupByToMap,
  sextupleAspectBodies,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import type {
  BuildSextupleEventParameters,
  GetSextupleAspectEventArguments,
} from "./sextuple-aspects.types.js";
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
 * Event building and geometry helpers for {@link SextupleAspectsService}.
 */
@Injectable()
export class SextupleAspectsComposerService {
  // 🔏 Private Methods

  /**
   *
   */
  addConnection(
    map: Map<Body, Set<Body>>,
    firstBody: Body,
    secondBody: Body,
  ): void {
    const connectedBodies = map.get(firstBody);
    if (connectedBodies) connectedBodies.add(secondBody);
  }

  /**
   *
   */
  buildAspectConnectionMaps(
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
      const firstBody = edge.bodies[0];
      const secondBody = edge.bodies[1];
      if (!bodies.includes(firstBody) || !bodies.includes(secondBody)) continue;
      if (edge.aspect === "trine") {
        this.addConnection(trineConnections, firstBody, secondBody);
        this.addConnection(trineConnections, secondBody, firstBody);
      } else if (edge.aspect === "sextile") {
        this.addConnection(sextileConnections, firstBody, secondBody);
        this.addConnection(sextileConnections, secondBody, firstBody);
      }
    }
    return { sextileConnections, trineConnections };
  }

  /**
   *
   */
  buildHexagramEvent(
    hexagramBodies: Body[],
    phase: AspectPhase,
    eventMinute: Moment,
  ): Event | null {
    const body1 = hexagramBodies[0];
    const body2 = hexagramBodies[1];
    const body3 = hexagramBodies[2];
    const body4 = hexagramBodies[3];
    const body5 = hexagramBodies[4];
    const body6 = hexagramBodies[5];

    if (!body1 || !body2 || !body3 || !body4 || !body5 || !body6) {
      return null;
    }

    return this.getSextupleAspectEvent({
      body1,
      body2,
      body3,
      body4,
      body5,
      body6,
      phase,
      sextupleAspect: "hexagram",
      timestamp: eventMinute,
    });
  }

  /**
   *
   */
  buildProgressiveSextupleEvent(forming: Event, dissolving: Event): Event {
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

  /**
   *
   */
  buildSextupleAspectCategories(
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

  /**
   *
   */
  buildSextupleAspectSummary(args: {
    aspectSymbol: string;
    description: string;
    phase: AspectPhase;
    symbols: string[];
  }): string {
    const { aspectSymbol, description, phase, symbols } = args;
    const phaseEmoji = this.getPhaseEmoji(phase);
    const symbolChain = symbols.join("-");

    return `${phaseEmoji}${aspectSymbol} ${symbolChain} ${description}`;
  }

  /**
   *
   */
  buildSextupleEventFromParameters(
    eventArguments: BuildSextupleEventParameters,
  ): Event {
    const {
      aspectSymbol,
      bodiesSorted,
      phase,
      sextupleAspect,
      symbols,
      timestamp,
    } = eventArguments;

    const description = `${bodiesSorted.join(", ")} ${sextupleAspect} ${phase}`;
    const summary = this.buildSextupleAspectSummary({
      aspectSymbol,
      description,
      phase,
      symbols,
    });
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

  /**
   *
   */
  checkHexagonSextiles(
    arrangement: Body[],
    sextileConnections: Map<Body, Set<Body>>,
  ): boolean {
    if (arrangement.length !== 6) return false;
    for (let index = 0; index < 6; index++) {
      const current = arrangement[index];
      const next = arrangement[(index + 1) % 6];
      if (!current || !next) return false;
      const sextileNeighbors = sextileConnections.get(current);
      if (!sextileNeighbors?.has(next)) return false;
    }
    return true;
  }

  /**
   *
   */
  collectTrineBodies(trines: AspectBodies[]): Body[] {
    const bodiesSet = new Set<Body>();

    for (const edge of trines) {
      bodiesSet.add(edge.bodies[0]);
      bodiesSet.add(edge.bodies[1]);
    }

    return [...bodiesSet];
  }

  /**
   *
   */
  findGrandTrinePairs(
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
  findHexagramPattern(bodies: Body[], edges: AspectBodies[]): Body[] | null {
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

  /**
   *
   */
  findValidHexagonArrangement(
    trine1: Body[],
    trine2: Body[],
    sextileConnections: Map<Body, Set<Body>>,
  ): Body[] | null {
    for (let index = 0; index < 3; index++) {
      for (let index_ = 0; index_ < 3; index_++) {
        const result = this.tryHexagonArrangement({
          index,
          index_,
          sextileConnections,
          trine1,
          trine2,
        });

        if (result) {
          return result;
        }
      }
    }

    return null;
  }

  /**
   *
   */
  getGrandTrineNeighbors(
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

  /**
   *
   */
  getPhaseEmoji(phase: AspectPhase): string {
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
  getSextupleAspectEvent(
    eventArguments: GetSextupleAspectEventArguments,
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
    } = eventArguments;

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

  /**
   *
   */
  groupAspectsByType<T extends AspectBodies>(edges: T[]): Map<Aspect, T[]> {
    return groupByToMap(edges, (edge) => edge.aspect);
  }

  /**
   *
   */
  groupSextupleEventsByKey(events: Event[]): Record<string, Event[]> {
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

  /**
   *
   */
  isValidGrandTrine(
    trineConnections: Map<Body, Set<Body>>,
    firstBody: Body | undefined,
    secondBody: Body | undefined,
  ): boolean {
    return !!(
      firstBody &&
      secondBody &&
      trineConnections.get(firstBody)?.has(secondBody)
    );
  }

  /**
   *
   */
  tryArrangementForPair(args: {
    index: number;
    index_: number;
    index__: number;
    l: number;
    sextileConnections: Map<Body, Set<Body>>;
    trine1: Body[];
    trine2: Body[];
  }): Body[] | null {
    const { index, index_, index__, l, sextileConnections, trine1, trine2 } =
      args;
    const m = [0, 1, 2].find((x) => x !== index && x !== index__);
    const n = [0, 1, 2].find((x) => x !== index_ && x !== l);
    if (m === undefined || n === undefined) return null;
    const bodies = [
      trine1[index],
      trine2[index_],
      trine1[index__],
      trine2[l],
      trine1[m],
      trine2[n],
    ];
    const arrangement = bodies.filter(
      (body): body is Body => body !== undefined,
    );
    if (arrangement.length !== bodies.length) return null;
    return this.checkHexagonSextiles(arrangement, sextileConnections)
      ? arrangement
      : null;
  }

  /**
   *
   */
  tryHexagonArrangement(args: {
    index: number;
    index_: number;
    sextileConnections: Map<Body, Set<Body>>;
    trine1: Body[];
    trine2: Body[];
  }): Body[] | null {
    const { index, index_, sextileConnections, trine1, trine2 } = args;
    for (const index__ of [0, 1, 2]) {
      if (index__ === index) continue;
      for (const l of [0, 1, 2]) {
        if (l === index_) continue;
        const result = this.tryArrangementForPair({
          index,
          index_,
          index__,
          l,
          sextileConnections,
          trine1,
          trine2,
        });
        if (result !== null) return result;
      }
    }
    return null;
  }
}
