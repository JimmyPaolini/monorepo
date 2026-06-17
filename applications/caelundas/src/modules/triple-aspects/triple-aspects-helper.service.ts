import {
  symbolByBody,
  symbolByTripleAspect,
} from "@caelundas/src/modules/caelundas/caelundas.constants";
import { tripleAspectBodies } from "@caelundas/src/modules/caelundas/caelundas.types";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import { LoggerService } from "../logger/logger.service.js";

import type { ProgressiveBodiesMeta } from "./triple-aspects.types";
import type { AspectBodies } from "@caelundas/src/modules/aspects/aspects.service";
import type {
  AspectPhase,
  Body,
  TripleAspect,
} from "@caelundas/src/modules/caelundas/caelundas.body-types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { Moment } from "moment-timezone";

/**
 * Helper service for triple aspect composition and event building.
 */
@Injectable()
export class TripleAspectsHelperService {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    this.logger.setContext(TripleAspectsHelperService.name);
  }

  // 🌎 Public Methods

  private buildProgressiveBodiesMeta(
    forming: Event,
    aspectCapitalized: string,
  ): null | ProgressiveBodiesMeta {
    const tripleAspectBodyNames = new Set(
      tripleAspectBodies.map((b) => _.startCase(b)),
    );
    const bodiesCapitalized = _.sortBy(
      forming.categories.filter((cat) => tripleAspectBodyNames.has(cat)),
    );
    if (bodiesCapitalized.length !== 3) {
      return null;
    }
    const aspect = this.resolveAspectType(aspectCapitalized);
    if (!aspect) {
      this.logger.warn(`Unknown aspect type: ${aspectCapitalized}`);
      return null;
    }
    return this.resolveProgressiveMeta(bodiesCapitalized, aspect);
  }

  private checkGrandTrineTriplet(args: {
    body1: Body;
    body2: Body;
    body3: Body;
    currentAspectBodies: AspectBodies[];
    determineCompoundPhaseFromSnapshots: (
      args: unknown,
    ) => null | { eventMinute: Moment; phase: AspectPhase };
    isGrandTrine: (args: {
      body1: Body;
      body2: Body;
      body3: Body;
      edges: AspectBodies[];
    }) => boolean;
    minute: Moment;
    previousAspectBodies: AspectBodies[];
    trines: AspectBodies[];
  }): Event | null {
    const {
      body1,
      body2,
      body3,
      currentAspectBodies,
      determineCompoundPhaseFromSnapshots,
      isGrandTrine,
      minute,
      previousAspectBodies,
      trines,
    } = args;
    if (!isGrandTrine({ body1, body2, body3, edges: trines })) {
      return null;
    }
    const result = determineCompoundPhaseFromSnapshots({
      checkPatternExists: (edges: AspectBodies[]) =>
        isGrandTrine({ body1, body2, body3, edges }),
      currentAspectBodies,
      currentMinute: minute,
      patternBodies: [body1, body2, body3],
      previousAspectBodies,
    });
    if (!result) {
      return null;
    }
    return this.getTripleAspectEvent({
      body1,
      body2,
      body3,
      phase: result.phase,
      timestamp: result.eventMinute,
      tripleAspect: "grand trine",
    });
  }

  private checkTSquareFocalBody(args: {
    body1: Body;
    body2: Body;
    currentAspectBodies: AspectBodies[];
    focalBody: Body;
    isTSquare: (args: {
      body1: Body;
      body2: Body;
      edges: AspectBodies[];
      focalBody: Body;
    }) => boolean;
    minute: Moment;
    previousAspectBodies: AspectBodies[];
    unionEdges: AspectBodies[];
  }): Event | null {
    const { body1, body2, focalBody, isTSquare, minute, unionEdges } = args;
    if (!isTSquare({ body1, body2, edges: unionEdges, focalBody })) {
      return null;
    }
    return this.getTripleAspectEvent({
      body1,
      body2,
      body3: focalBody,
      focalOrApexBody: focalBody,
      phase: "forming",
      timestamp: minute,
      tripleAspect: "t-square",
    });
  }

  private checkYodApexBody(args: {
    apexBody: Body;
    body1: Body;
    body2: Body;
    currentAspectBodies: AspectBodies[];
    isYod: (args: {
      apexBody: Body;
      body1: Body;
      body2: Body;
      edges: AspectBodies[];
    }) => boolean;
    minute: Moment;
    previousAspectBodies: AspectBodies[];
    unionEdges: AspectBodies[];
  }): Event | null {
    const { apexBody, body1, body2, isYod, minute, unionEdges } = args;
    if (!isYod({ apexBody, body1, body2, edges: unionEdges })) {
      return null;
    }
    return this.getTripleAspectEvent({
      body1,
      body2,
      body3: apexBody,
      focalOrApexBody: apexBody,
      phase: "forming",
      timestamp: minute,
      tripleAspect: "yod",
    });
  }

  private composeGrandTrinesFromArray(args: {
    bodiesArray: Body[];
    currentAspectBodies: AspectBodies[];
    determineCompoundPhaseFromSnapshots: (
      args: unknown,
    ) => null | { eventMinute: Moment; phase: AspectPhase };
    isGrandTrine: (args: {
      body1: Body;
      body2: Body;
      body3: Body;
      edges: AspectBodies[];
    }) => boolean;
    minute: Moment;
    previousAspectBodies: AspectBodies[];
    trines: AspectBodies[];
  }): Event[] {
    const {
      bodiesArray,
      currentAspectBodies,
      determineCompoundPhaseFromSnapshots,
      isGrandTrine,
      minute,
      previousAspectBodies,
      trines,
    } = args;
    const events: Event[] = [];
    for (let index = 0; index < bodiesArray.length; index++) {
      for (let index_ = index + 1; index_ < bodiesArray.length; index_++) {
        for (
          let index__ = index_ + 1;
          index__ < bodiesArray.length;
          index__++
        ) {
          const body1 = bodiesArray[index];
          const body2 = bodiesArray[index_];
          const body3 = bodiesArray[index__];
          if (!body1 || !body2 || !body3) continue;
          const event = this.checkGrandTrineTriplet({
            body1,
            body2,
            body3,
            currentAspectBodies,
            determineCompoundPhaseFromSnapshots,
            isGrandTrine,
            minute,
            previousAspectBodies,
            trines,
          });
          if (event) events.push(event);
        }
      }
    }
    return events;
  }

  private composeGrandTrinesFromBodies(args: {
    currentAspectBodies: AspectBodies[];
    isGrandTrine: (args: {
      body1: Body;
      body2: Body;
      body3: Body;
      edges: AspectBodies[];
    }) => boolean;
    minute: Moment;
    previousAspectBodies: AspectBodies[];
    trines: AspectBodies[];
  }): Event[] {
    const {
      currentAspectBodies,
      isGrandTrine,
      minute,
      previousAspectBodies,
      trines,
    } = args;
    const bodiesInTrines = new Set<Body>();
    for (const trine of trines) {
      bodiesInTrines.add(trine.bodies[0]);
      bodiesInTrines.add(trine.bodies[1]);
    }
    const bodiesArray = [...bodiesInTrines];
    return this.composeGrandTrinesFromArray({
      bodiesArray,
      currentAspectBodies,
      determineCompoundPhaseFromSnapshots: () => null,
      isGrandTrine,
      minute,
      previousAspectBodies,
      trines,
    });
  }

  private getTripleAspectEvent(args: {
    body1: Body;
    body2: Body;
    body3: Body;
    focalOrApexBody?: Body;
    phase: AspectPhase;
    timestamp: Moment;
    tripleAspect: TripleAspect;
  }): Event {
    const {
      body1,
      body2,
      body3,
      focalOrApexBody,
      phase,
      timestamp,
      tripleAspect,
    } = args;
    const b1c = _.startCase(body1),
      b2c = _.startCase(body2),
      b3c = _.startCase(body3);
    const description = this.buildTripleAspectDescription({
      bodiesSorted: _.sortBy([b1c, b2c, b3c]),
      focalOrApexBody,
      phase,
      tripleAspect,
    });
    const phaseEmoji =
      phase === "forming" ? "➡️ " : phase === "dissolving" ? "⬅️ " : "🎯 ";
    const summary = `${phaseEmoji}${symbolByTripleAspect[tripleAspect]} ${symbolByBody[body1]}-${symbolByBody[body2]}-${symbolByBody[body3]} ${description}`;
    this.logger.log(`${summary} at ${timestamp.toISOString()}`);
    const categories = this.buildTripleAspectCategories({
      body1Capitalized: b1c,
      body2Capitalized: b2c,
      body3Capitalized: b3c,
      focalOrApexBody,
      phase,
      tripleAspect,
    });
    return {
      categories,
      description,
      end: timestamp,
      start: timestamp,
      summary,
    };
  }

  private pairProgressiveGroupPairs(
    formingEvents: Event[],
    dissolvingEvents: Event[],
  ): Event[] {
    const results: Event[] = [];
    for (
      let index = 0;
      index < Math.min(formingEvents.length, dissolvingEvents.length);
      index++
    ) {
      const forming = formingEvents[index];
      const dissolving = dissolvingEvents[index];
      if (
        !forming ||
        !dissolving ||
        dissolving.start.valueOf() <= forming.start.valueOf()
      )
        continue;
      const aspectCapitalized = forming.categories.find((c) =>
        ["Grand Trine", "T Square", "Yod"].includes(c),
      );
      if (!aspectCapitalized) continue;
      const event = this.buildProgressiveEvent({
        aspectCapitalized,
        dissolving,
        forming,
      });
      if (event) results.push(event);
    }
    return results;
  }

  private resolveAspectType(aspectCapitalized: string): null | TripleAspect {
    if (aspectCapitalized === "Grand Trine") return "grand trine";
    if (aspectCapitalized === "T Square") return "t-square";
    if (aspectCapitalized === "Yod") return "yod";
    return null;
  }

  // 🔏 Private Methods

  private resolveProgressiveMeta(
    bodiesCapitalized: string[],
    aspect: TripleAspect,
  ): null | ProgressiveBodiesMeta {
    const body1Capitalized = bodiesCapitalized[0] ?? "";
    const body2Capitalized = bodiesCapitalized[1] ?? "";
    const body3Capitalized = bodiesCapitalized[2] ?? "";
    const bodyMap: Record<string, Body> = {
      Jupiter: "jupiter",
      Mars: "mars",
      Mercury: "mercury",
      Moon: "moon",
      Neptune: "neptune",
      Pluto: "pluto",
      Saturn: "saturn",
      Sun: "sun",
      Uranus: "uranus",
      Venus: "venus",
    };
    const b1 = bodyMap[body1Capitalized];
    const b2 = bodyMap[body2Capitalized];
    const b3 = bodyMap[body3Capitalized];
    if (!b1 || !b2 || !b3) {
      this.logger.warn(
        `Unknown body in progressive event: ${body1Capitalized}, ${body2Capitalized}, ${body3Capitalized}`,
      );
      return null;
    }
    return {
      aspect,
      body1: b1,
      body1Capitalized,
      body2: b2,
      body2Capitalized,
      body3: b3,
      body3Capitalized,
    };
  }

  /**
   *
   */
  buildProgressiveEvent(args: {
    aspectCapitalized: string;
    dissolving: Event;
    forming: Event;
  }): Event | null {
    const meta = this.buildProgressiveBodiesMeta(
      args.forming,
      args.aspectCapitalized,
    );
    if (!meta) return null;
    const {
      aspect,
      body1,
      body1Capitalized,
      body2,
      body2Capitalized,
      body3,
      body3Capitalized,
    } = meta;
    const extraInfo = this.getFocalExtraInfo(args.forming.categories, aspect);
    const descBodies = `${body1Capitalized}, ${body2Capitalized}, ${body3Capitalized}`;
    return {
      categories: [
        "Astronomy",
        "Astrology",
        "Compound Aspect",
        "Triple Aspect",
        args.aspectCapitalized,
        body1Capitalized,
        body2Capitalized,
        body3Capitalized,
      ],
      description: `${descBodies} ${aspect}`,
      end: args.dissolving.start,
      start: args.forming.start,
      summary: `${symbolByTripleAspect[aspect]} ${symbolByBody[body1]}-${symbolByBody[body2]}-${symbolByBody[body3]} ${descBodies} ${aspect}${extraInfo}`,
    };
  }

  /**
   *
   */
  buildTripleAspectCategories(args: {
    body1Capitalized: string;
    body2Capitalized: string;
    body3Capitalized: string;
    focalOrApexBody: Body | undefined;
    phase: AspectPhase;
    tripleAspect: TripleAspect;
  }): string[] {
    const {
      body1Capitalized,
      body2Capitalized,
      body3Capitalized,
      focalOrApexBody,
      phase,
      tripleAspect,
    } = args;
    const categories = [
      "Astronomy",
      "Astrology",
      "Compound Aspect",
      "Triple Aspect",
      _.startCase(tripleAspect),
      _.startCase(phase),
      body1Capitalized,
      body2Capitalized,
      body3Capitalized,
    ];
    if (focalOrApexBody) {
      categories.push(`${_.startCase(focalOrApexBody)} Focal`);
    }
    return categories;
  }

  /**
   *
   */
  buildTripleAspectDescription(args: {
    bodiesSorted: (string | undefined)[];
    focalOrApexBody: Body | undefined;
    phase: string;
    tripleAspect: TripleAspect;
  }): string {
    const { bodiesSorted, focalOrApexBody, phase, tripleAspect } = args;
    const base = `${bodiesSorted[0]}, ${bodiesSorted[1]}, ${bodiesSorted[2]} ${tripleAspect} ${phase}`;
    return focalOrApexBody
      ? `${base} (${_.startCase(focalOrApexBody)} focal)`
      : base;
  }

  /**
   *
   */
  composeGrandTrines(args: {
    currentAspectBodies: AspectBodies[];
    groupAspectsByType: (edges: AspectBodies[]) => Map<string, AspectBodies[]>;
    isGrandTrine: (args: {
      body1: Body;
      body2: Body;
      body3: Body;
      edges: AspectBodies[];
    }) => boolean;
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): Event[] {
    const {
      currentAspectBodies,
      groupAspectsByType,
      isGrandTrine,
      minute,
      previousAspectBodies,
    } = args;
    const unionEdges = [...currentAspectBodies, ...previousAspectBodies];
    const trines = groupAspectsByType(unionEdges).get("trine") || [];
    return this.composeGrandTrinesFromBodies({
      currentAspectBodies,
      isGrandTrine,
      minute,
      previousAspectBodies,
      trines,
    });
  }

  /**
   *
   */
  composeTSquares(args: {
    currentAspectBodies: AspectBodies[];
    findBodiesWithAspectTo: (
      body: Body,
      aspect: string,
      edges: AspectBodies[],
    ) => Body[];
    groupAspectsByType: (edges: AspectBodies[]) => Map<string, AspectBodies[]>;
    isTSquare: (args: {
      body1: Body;
      body2: Body;
      edges: AspectBodies[];
      focalBody: Body;
    }) => boolean;
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): Event[] {
    const {
      currentAspectBodies,
      findBodiesWithAspectTo,
      groupAspectsByType,
      isTSquare,
      minute,
      previousAspectBodies,
    } = args;
    const unionEdges = [...currentAspectBodies, ...previousAspectBodies];
    const aspectsByType = groupAspectsByType(unionEdges);
    const oppositions = aspectsByType.get("opposite") || [];
    const squares = aspectsByType.get("square") || [];
    const events: Event[] = [];
    for (const opposition of oppositions) {
      const b1 = opposition.bodies[0],
        b2 = opposition.bodies[1];
      const s1 = findBodiesWithAspectTo(b1, "square", squares);
      const s2 = findBodiesWithAspectTo(b2, "square", squares);
      for (const focalBody of _.intersection(s1, s2)) {
        const event = this.checkTSquareFocalBody({
          body1: b1,
          body2: b2,
          currentAspectBodies,
          focalBody,
          isTSquare,
          minute,
          previousAspectBodies,
          unionEdges,
        });
        if (event) events.push(event);
      }
    }
    return events;
  }

  /**
   *
   */
  composeYods(args: {
    currentAspectBodies: AspectBodies[];
    findBodiesWithAspectTo: (
      body: Body,
      aspect: string,
      edges: AspectBodies[],
    ) => Body[];
    groupAspectsByType: (edges: AspectBodies[]) => Map<string, AspectBodies[]>;
    isYod: (args: {
      apexBody: Body;
      body1: Body;
      body2: Body;
      edges: AspectBodies[];
    }) => boolean;
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): Event[] {
    const {
      currentAspectBodies,
      findBodiesWithAspectTo,
      groupAspectsByType,
      isYod,
      minute,
      previousAspectBodies,
    } = args;
    const unionEdges = [...currentAspectBodies, ...previousAspectBodies];
    const aspectsByType = groupAspectsByType(unionEdges);
    const sextiles = aspectsByType.get("sextile") || [];
    const quincunxes = aspectsByType.get("quincunx") || [];
    const events: Event[] = [];
    for (const sextile of sextiles) {
      const b1 = sextile.bodies[0],
        b2 = sextile.bodies[1];
      const q1 = findBodiesWithAspectTo(b1, "quincunx", quincunxes);
      const q2 = findBodiesWithAspectTo(b2, "quincunx", quincunxes);
      for (const apexBody of _.intersection(q1, q2)) {
        const event = this.checkYodApexBody({
          apexBody,
          body1: b1,
          body2: b2,
          currentAspectBodies,
          isYod,
          minute,
          previousAspectBodies,
          unionEdges,
        });
        if (event) events.push(event);
      }
    }
    return events;
  }

  /**
   *
   */
  getFocalExtraInfo(formingCategories: string[], aspect: TripleAspect): string {
    const focalCategory = formingCategories.find((cat) =>
      cat.includes(" Focal"),
    );
    if (!focalCategory) return "";
    const focalBody = focalCategory.replace(" Focal", "");
    if (aspect === "t-square") return ` (focal: ${focalBody})`;
    if (aspect === "yod") return ` (apex: ${focalBody})`;
    return "";
  }

  /**
   *
   */
  getProgressiveGroupKey(event: Event): string {
    const tripleAspectBodyNames = new Set(
      tripleAspectBodies.map((b) => _.startCase(b)),
    );
    const planets = _.sortBy(
      event.categories.filter((category) =>
        tripleAspectBodyNames.has(category),
      ),
    );
    const aspect = event.categories.find((category) =>
      ["Grand Trine", "T Square", "Yod"].includes(category),
    );
    if (planets.length === 3 && aspect) {
      return `${planets[0]}-${planets[1]}-${planets[2]}-${aspect}`;
    }
    return "";
  }

  /**
   *
   */
  pairProgressiveGroup(groupEvents: Event[]): Event[] {
    const formingEvents = groupEvents
      .filter((event) => event.categories.includes("Forming"))
      .toSorted((a, b) => a.start.valueOf() - b.start.valueOf());
    const dissolvingEvents = groupEvents
      .filter((event) => event.categories.includes("Dissolving"))
      .toSorted((a, b) => a.start.valueOf() - b.start.valueOf());
    return this.pairProgressiveGroupPairs(formingEvents, dissolvingEvents);
  }
}
