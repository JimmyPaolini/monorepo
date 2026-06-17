import { aspectBodies as tripleAspectBodies } from "@caelundas/src/modules/caelundas/caelundas.constants";
import {
  symbolByBody,
  symbolByTripleAspect,
} from "@caelundas/src/modules/caelundas/caelundas.symbol-constants";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import { LoggerService } from "../logger/logger.service.js";

import type { ProgressiveBodiesMeta } from "./triple-aspects.types";
import type { AspectBodies } from "@caelundas/src/modules/aspects/aspects.service";
import type {
  Aspect,
  AspectPhase,
  Body,
  TripleAspect,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { Moment } from "moment-timezone";

/**
 * Builds triple-aspect events and progressive spans for grand trines, T-squares, and yods.
 */
@Injectable()
export class TripleAspectsComposerService {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext(TripleAspectsComposerService.name);
  }

  /**
   * Derives forming/dissolving phase by comparing pattern existence across two snapshots.
   */
  static determineCompoundPhaseFromSnapshots(args: {
    checkPatternExists: (edges: AspectBodies[]) => boolean;
    currentAspectBodies: AspectBodies[];
    currentMinute: Moment;
    patternBodies: Body[];
    previousAspectBodies: AspectBodies[];
  }): null | { eventMinute: Moment; phase: AspectPhase } {
    const {
      checkPatternExists,
      currentAspectBodies,
      currentMinute,
      patternBodies,
      previousAspectBodies,
    } = args;

    const bodySet = new Set(patternBodies);
    const filterByBodies = (edges: AspectBodies[]): AspectBodies[] =>
      edges.filter(
        (edge) => bodySet.has(edge.bodies[0]) && bodySet.has(edge.bodies[1]),
      );

    const currentExists = checkPatternExists(
      filterByBodies(currentAspectBodies),
    );
    const previousExists = checkPatternExists(
      filterByBodies(previousAspectBodies),
    );

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
   * Returns neighbors of `body` connected by the requested aspect type.
   */
  static findBodiesWithAspectTo(
    body: Body,
    aspectType: Aspect,
    edges: AspectBodies[],
  ): Body[] {
    return edges
      .filter(
        (edge) =>
          edge.aspect === aspectType &&
          (edge.bodies[0] === body || edge.bodies[1] === body),
      )
      .map((edge) =>
        edge.bodies[0] === body ? edge.bodies[1] : edge.bodies[0],
      );
  }

  /**
   * Returns `true` when an undirected body pair has the requested aspect in the edge set.
   */
  static haveAspect(args: {
    aspectType: Aspect;
    body1: Body;
    body2: Body;
    edges: AspectBodies[];
  }): boolean {
    const { aspectType, body1, body2, edges } = args;
    return edges.some(
      (edge) =>
        edge.aspect === aspectType &&
        ((edge.bodies[0] === body1 && edge.bodies[1] === body2) ||
          (edge.bodies[0] === body2 && edge.bodies[1] === body1)),
    );
  }

  private buildProgressiveBodiesMeta(
    forming: Event,
    aspectCapitalized: string,
  ): null | ProgressiveBodiesMeta {
    const tripleAspectBodyNames = new Set(
      tripleAspectBodies.map((body) => _.startCase(body)),
    );
    const bodiesCapitalized = _.sortBy(
      forming.categories.filter((category) =>
        tripleAspectBodyNames.has(category),
      ),
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

  private buildTripleAspectCategories(args: {
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

  private buildTripleAspectDescription(args: {
    bodiesSorted: (string | undefined)[];
    focalOrApexBody: Body | undefined;
    phase: AspectPhase;
    tripleAspect: TripleAspect;
  }): string {
    const { bodiesSorted, focalOrApexBody, phase, tripleAspect } = args;
    const base = `${bodiesSorted[0]}, ${bodiesSorted[1]}, ${bodiesSorted[2]} ${tripleAspect} ${phase}`;
    return focalOrApexBody
      ? `${base} (${_.startCase(focalOrApexBody)} focal)`
      : base;
  }

  private getFocalExtraInfo(
    formingCategories: string[],
    aspect: TripleAspect,
  ): string {
    const focalCategory = formingCategories.find((category) =>
      category.includes(" Focal"),
    );
    if (!focalCategory) {
      return "";
    }

    const focalBody = focalCategory.replace(" Focal", "");
    if (aspect === "t-square") {
      return ` (focal: ${focalBody})`;
    }
    if (aspect === "yod") {
      return ` (apex: ${focalBody})`;
    }
    return "";
  }

  private getPhaseEmoji(phase: AspectPhase): string {
    if (phase === "forming") {
      return "➡️ ";
    }
    if (phase === "dissolving") {
      return "⬅️ ";
    }
    return "🎯 ";
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
      ) {
        continue;
      }

      const aspectCapitalized = forming.categories.find((category) =>
        ["Grand Trine", "T Square", "Yod"].includes(category),
      );
      if (!aspectCapitalized) {
        continue;
      }

      const event = this.buildProgressiveEvent({
        aspectCapitalized,
        dissolving,
        forming,
      });
      if (event) {
        results.push(event);
      }
    }

    return results;
  }

  private resolveAspectType(aspectCapitalized: string): null | TripleAspect {
    if (aspectCapitalized === "Grand Trine") {
      return "grand trine";
    }
    if (aspectCapitalized === "T Square") {
      return "t-square";
    }
    if (aspectCapitalized === "Yod") {
      return "yod";
    }
    return null;
  }

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

    const body1 = bodyMap[body1Capitalized];
    const body2 = bodyMap[body2Capitalized];
    const body3 = bodyMap[body3Capitalized];

    if (!body1 || !body2 || !body3) {
      this.logger.warn(
        `Unknown body in progressive event: ${body1Capitalized}, ${body2Capitalized}, ${body3Capitalized}`,
      );
      return null;
    }

    return {
      aspect,
      body1,
      body1Capitalized,
      body2,
      body2Capitalized,
      body3,
      body3Capitalized,
    };
  }

  /**
   * Builds one triple-aspect duration event from a forming/dissolving pair.
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
    if (!meta) {
      return null;
    }

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
   * Builds one triple-aspect boundary event with optional focal/apex metadata.
   */
  buildTripleAspectEvent(args: {
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

    const body1Capitalized = _.startCase(body1);
    const body2Capitalized = _.startCase(body2);
    const body3Capitalized = _.startCase(body3);
    const description = this.buildTripleAspectDescription({
      bodiesSorted: _.sortBy([
        body1Capitalized,
        body2Capitalized,
        body3Capitalized,
      ]),
      focalOrApexBody,
      phase,
      tripleAspect,
    });
    const summary = `${this.getPhaseEmoji(phase)}${symbolByTripleAspect[tripleAspect]} ${symbolByBody[body1]}-${symbolByBody[body2]}-${symbolByBody[body3]} ${description}`;

    this.logger.log(`${summary} at ${timestamp.toISOString()}`);

    return {
      categories: this.buildTripleAspectCategories({
        body1Capitalized,
        body2Capitalized,
        body3Capitalized,
        focalOrApexBody,
        phase,
        tripleAspect,
      }),
      description,
      end: timestamp,
      start: timestamp,
      summary,
    };
  }

  /**
   * Builds a stable progressive grouping key from sorted bodies plus aspect label.
   */
  getProgressiveGroupKey(event: Event): string {
    const tripleAspectBodyNames = new Set(
      tripleAspectBodies.map((body) => _.startCase(body)),
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
   * Pairs sorted forming/dissolving events for one triple-aspect group key.
   */
  pairProgressiveGroup(groupEvents: Event[]): Event[] {
    const formingEvents = groupEvents
      .filter((event) => event.categories.includes("Forming"))
      .toSorted((left, right) => left.start.valueOf() - right.start.valueOf());
    const dissolvingEvents = groupEvents
      .filter((event) => event.categories.includes("Dissolving"))
      .toSorted((left, right) => left.start.valueOf() - right.start.valueOf());

    return this.pairProgressiveGroupPairs(formingEvents, dissolvingEvents);
  }
}
