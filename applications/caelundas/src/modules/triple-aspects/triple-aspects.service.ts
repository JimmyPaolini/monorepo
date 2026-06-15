import {
  symbolByBody,
  symbolByTripleAspect,
} from "@caelundas/src/modules/caelundas/caelundas.constants";
import {
  groupByToMap,
  isBody,
  tripleAspectBodies,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import { LoggerService } from "../logger/logger.service";

import type { AspectBodies } from "@caelundas/src/modules/aspects/aspects.service";
import type {
  Aspect,
  AspectPhase,
  Body,
  TripleAspect,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { Moment } from "moment-timezone";

interface ProgressiveBodiesMeta {
  aspect: TripleAspect;
  body1: Body;
  body1Capitalized: string;
  body2: Body;
  body2Capitalized: string;
  body3: Body;
  body3Capitalized: string;
}

/**
 * Composes 3-body aspect patterns from the active 2-body aspect registry.
 *
 * Detects T-Square (opposition + two squares) and Grand Trine (three trines) configurations
 * by examining combinations of active 2-body aspects among the bodies tracked by
 * {@link tripleAspectBodies}.
 */
@Injectable()
export class TripleAspectsService {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    this.logger.setContext(TripleAspectsService.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  private static buildTripleAspectDescription(
    bodiesSorted: (string | undefined)[],
    tripleAspect: TripleAspect,
    phase: AspectPhase,
    focalOrApexBody: Body | undefined,
  ): string {
    const base = `${bodiesSorted[0]}, ${bodiesSorted[1]}, ${bodiesSorted[2]} ${tripleAspect} ${phase}`;
    return focalOrApexBody ? `${base} (${_.startCase(focalOrApexBody)} focal)` : base;
  }

  private static determineCompoundPhaseFromSnapshots(
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

    const currentExists = checkPatternExists(filterByBodies(currentAspectBodies));
    const previousExists = checkPatternExists(filterByBodies(previousAspectBodies));

    if (currentExists && !previousExists) {
      return { eventMinute: currentMinute, phase: "forming" };
    }
    if (!currentExists && previousExists) {
      return { eventMinute: currentMinute.clone().subtract(1, "minute"), phase: "dissolving" };
    }
    return null;
  }

  /**
   * Finds all bodies that share a specific aspect type with the given body.
   *
   * @param body - The reference celestial body
   * @param aspectType - The aspect angle category to search for
   * @param edges - Available aspect relationships to search
   * @returns Array of bodies that have the specified aspect with the given body
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
          TripleAspectsService.involvesBody(edge, body),
      )
      .map((edge) => TripleAspectsService.getOtherBody(edge, body))
      .filter((b): b is Body => b !== null);
  }

  private static getFocalExtraInfo(
    formingCategories: string[],
    aspect: TripleAspect,
  ): string {
    const focalCategory = formingCategories.find((cat) => cat.includes(" Focal"));
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

  private static getOtherBody(edge: AspectBodies, body: Body): Body | null {
    if (edge.bodies[0] === body) {
      return edge.bodies[1];
    }
    if (edge.bodies[1] === body) {
      return edge.bodies[0];
    }
    return null;
  }

  private static getPhaseEmoji(phase: AspectPhase): string {
    if (phase === "forming") {
      return "➡️ ";
    }
    if (phase === "dissolving") {
      return "⬅️ ";
    }
    return "🎯 ";
  }

  private static getProgressiveGroupKey(event: Event): string {
    const tripleAspectBodyNames = new Set(
      tripleAspectBodies.map((b) => _.startCase(b)),
    );
    const planets = _.sortBy(
      event.categories.filter((category) => tripleAspectBodyNames.has(category)),
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
   * Groups an array of aspect edges by their aspect type.
   *
   * @param edges - Aspect relationships to group
   * @returns Map from aspect type to edges of that type
   */
  static groupAspectsByType<T extends AspectBodies>(
    edges: T[],
  ): Map<Aspect, T[]> {
    return groupByToMap(edges, (edge) => edge.aspect);
  }

  /**
   * Returns `true` if two bodies share a specific aspect type within the given edges.
   *
   * @param body1 - First celestial body
   * @param body2 - Second celestial body
   * @param aspectType - The aspect angle category to check
   * @param edges - Active aspect relationships to search
   */
  static haveAspect(
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

  private static involvesBody(edge: AspectBodies, body: Body): boolean {
    return edge.bodies[0] === body || edge.bodies[1] === body;
  }

  private static isGrandTrine(
    body1: Body,
    body2: Body,
    body3: Body,
    edges: AspectBodies[],
  ): boolean {
    return (
      TripleAspectsService.haveAspect(body1, body2, "trine", edges) &&
      TripleAspectsService.haveAspect(body1, body3, "trine", edges) &&
      TripleAspectsService.haveAspect(body2, body3, "trine", edges)
    );
  }

  private static isTSquare(
    body1: Body,
    body2: Body,
    focalBody: Body,
    edges: AspectBodies[],
  ): boolean {
    return (
      TripleAspectsService.haveAspect(body1, body2, "opposite", edges) &&
      TripleAspectsService.haveAspect(body1, focalBody, "square", edges) &&
      TripleAspectsService.haveAspect(body2, focalBody, "square", edges)
    );
  }

  private static isYod(
    body1: Body,
    body2: Body,
    apexBody: Body,
    edges: AspectBodies[],
  ): boolean {
    return (
      TripleAspectsService.haveAspect(body1, body2, "sextile", edges) &&
      TripleAspectsService.haveAspect(body1, apexBody, "quincunx", edges) &&
      TripleAspectsService.haveAspect(body2, apexBody, "quincunx", edges)
    );
  }

  private static resolveAspectType(aspectCapitalized: string): null | TripleAspect {
    const aspectMap: Record<string, TripleAspect> = {
      "Grand Trine": "grand trine",
      "T Square": "t-square",
      Yod: "yod",
    };
    return aspectMap[aspectCapitalized] ?? null;
  }

  private static resolveProgressiveBodiesLower(
    body1Capitalized: string,
    body2Capitalized: string,
    body3Capitalized: string,
  ): [Body, Body, Body] | null {
    const b1 = body1Capitalized.toLowerCase();
    const b2 = body2Capitalized.toLowerCase();
    const b3 = body3Capitalized.toLowerCase();
    if (isBody(b1) && isBody(b2) && isBody(b3)) {
      return [b1, b2, b3];
    }
    return null;
  }

  private buildProgressiveBodiesMeta(
    forming: Event,
    aspectCapitalized: string,
  ): null | ProgressiveBodiesMeta {
    const tripleAspectBodyNames = new Set(tripleAspectBodies.map((b) => _.startCase(b)));
    const bodiesCapitalized = _.sortBy(
      forming.categories.filter((cat) => tripleAspectBodyNames.has(cat)),
    );
    if (bodiesCapitalized.length !== 3) {
      return null;
    }
    const aspect = TripleAspectsService.resolveAspectType(aspectCapitalized);
    if (!aspect) {
      this.logger.warn(`Unknown aspect type: ${aspectCapitalized}`);
      return null;
    }
    return this.resolveProgressiveMeta(bodiesCapitalized, aspect);
  }

  private buildProgressiveEvent(args: {
    aspectCapitalized: string;
    dissolving: Event;
    forming: Event;
  }): Event | null {
    const { aspectCapitalized, dissolving, forming } = args;
    const meta = this.buildProgressiveBodiesMeta(forming, aspectCapitalized);
    if (!meta) {
      return null;
    }
    const { aspect, body1, body1Capitalized, body2, body2Capitalized, body3, body3Capitalized } =
      meta;

    const aspectSymbol = symbolByTripleAspect[aspect];
    const b1s = symbolByBody[body1];
    const b2s = symbolByBody[body2];
    const b3s = symbolByBody[body3];
    const extraInfo = TripleAspectsService.getFocalExtraInfo(forming.categories, aspect);
    const descBodies = `${body1Capitalized}, ${body2Capitalized}, ${body3Capitalized}`;

    return {
      categories: [
        "Astronomy", "Astrology", "Compound Aspect", "Triple Aspect",
        aspectCapitalized, body1Capitalized, body2Capitalized, body3Capitalized,
      ],
      description: `${descBodies} ${aspect}`,
      end: dissolving.start,
      start: forming.start,
      summary: `${aspectSymbol} ${b1s}-${b2s}-${b3s} ${descBodies} ${aspect}${extraInfo}`,
    };
  }

  private buildTripleAspectCategories(
    tripleAspect: TripleAspect,
    phase: AspectPhase,
    body1Capitalized: string,
    body2Capitalized: string,
    body3Capitalized: string,
    focalOrApexBody: Body | undefined,
  ): string[] {
    const categories = [
      "Astronomy", "Astrology", "Compound Aspect", "Triple Aspect",
      _.startCase(tripleAspect), _.startCase(phase),
      body1Capitalized, body2Capitalized, body3Capitalized,
    ];
    if (focalOrApexBody) {
      categories.push(`${_.startCase(focalOrApexBody)} Focal`);
    }
    return categories;
  }

  private checkGrandTrineTriplet(
    body1: Body,
    body2: Body,
    body3: Body,
    currentAspectBodies: AspectBodies[],
    previousAspectBodies: AspectBodies[],
    minute: Moment,
    trines: AspectBodies[],
  ): Event | null {
    if (!TripleAspectsService.isGrandTrine(body1, body2, body3, trines)) {
      return null;
    }
    const result = TripleAspectsService.determineCompoundPhaseFromSnapshots(
      currentAspectBodies,
      previousAspectBodies,
      [body1, body2, body3],
      minute,
      (edges) => TripleAspectsService.isGrandTrine(body1, body2, body3, edges),
    );
    if (!result) {
      return null;
    }
    return this.getTripleAspectEvent({
      body1, body2, body3,
      phase: result.phase,
      timestamp: result.eventMinute,
      tripleAspect: "grand trine",
    });
  }

  private checkTSquareFocalBody(
    body1: Body,
    body2: Body,
    focalBody: Body,
    currentAspectBodies: AspectBodies[],
    previousAspectBodies: AspectBodies[],
    minute: Moment,
    unionEdges: AspectBodies[],
  ): Event | null {
    if (!TripleAspectsService.isTSquare(body1, body2, focalBody, unionEdges)) {
      return null;
    }
    const result = TripleAspectsService.determineCompoundPhaseFromSnapshots(
      currentAspectBodies,
      previousAspectBodies,
      [body1, body2, focalBody],
      minute,
      (edges) => TripleAspectsService.isTSquare(body1, body2, focalBody, edges),
    );
    if (!result) {
      return null;
    }
    return this.getTripleAspectEvent({
      body1, body2,
      body3: focalBody,
      focalOrApexBody: focalBody,
      phase: result.phase,
      timestamp: result.eventMinute,
      tripleAspect: "t-square",
    });
  }

  private checkYodApexBody(
    body1: Body,
    body2: Body,
    apexBody: Body,
    currentAspectBodies: AspectBodies[],
    previousAspectBodies: AspectBodies[],
    minute: Moment,
    unionEdges: AspectBodies[],
  ): Event | null {
    if (!TripleAspectsService.isYod(body1, body2, apexBody, unionEdges)) {
      return null;
    }
    const result = TripleAspectsService.determineCompoundPhaseFromSnapshots(
      currentAspectBodies,
      previousAspectBodies,
      [body1, body2, apexBody],
      minute,
      (edges) => TripleAspectsService.isYod(body1, body2, apexBody, edges),
    );
    if (!result) {
      return null;
    }
    return this.getTripleAspectEvent({
      body1, body2,
      body3: apexBody,
      focalOrApexBody: apexBody,
      phase: result.phase,
      timestamp: result.eventMinute,
      tripleAspect: "yod",
    });
  }

  /**
   * Composes Grand Trine patterns from stored 2-body aspects.
   *
   * A Grand Trine is a harmonious configuration consisting of:
   * - 3 trines (120°) forming an equilateral triangle
   *
   * Visual pattern:
   * ```
   *       Body1
   *       /   \
   * 120° /     \ 120°
   *     /       \
   * Body2 ----- Body3
   *      120°
   * ```
   *
   * All three bodies are in the same element (fire/earth/air/water),
   * creating a flow of harmonious energy. Can indicate talent but
   * may lack motivation without challenging aspects.
   *
   * @param allEdges - All aspect edges across time for phase detection
   * @param minute - The minute to check for Grand Trine patterns
   * @returns Array of Grand Trine events detected at this minute
   * @see {@link determineMultiBodyPhase} for phase calculation
   */
  private composeGrandTrines(args: {
    currentAspectBodies: AspectBodies[];
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): Event[] {
    const { currentAspectBodies, minute, previousAspectBodies } = args;
    const unionEdges = [...currentAspectBodies, ...previousAspectBodies];
    const trines = TripleAspectsService.groupAspectsByType(unionEdges).get("trine") || [];
    return this.composeGrandTrinesFromBodies(
      trines,
      currentAspectBodies,
      previousAspectBodies,
      minute,
    );
  }

  private composeGrandTrinesFromArray(
    bodiesArray: Body[],
    trines: AspectBodies[],
    currentAspectBodies: AspectBodies[],
    previousAspectBodies: AspectBodies[],
    minute: Moment,
  ): Event[] {
    const events: Event[] = [];
    for (let index = 0; index < bodiesArray.length; index++) {
      for (let index_ = index + 1; index_ < bodiesArray.length; index_++) {
        for (let index__ = index_ + 1; index__ < bodiesArray.length; index__++) {
          const body1 = bodiesArray[index];
          const body2 = bodiesArray[index_];
          const body3 = bodiesArray[index__];
          if (!body1 || !body2 || !body3) {
            continue;
          }
          const event = this.checkGrandTrineTriplet(
            body1, body2, body3,
            currentAspectBodies, previousAspectBodies,
            minute, trines,
          );
          if (event) {
            events.push(event);
          }
        }
      }
    }
    return events;
  }

  private composeGrandTrinesFromBodies(
    trines: AspectBodies[],
    currentAspectBodies: AspectBodies[],
    previousAspectBodies: AspectBodies[],
    minute: Moment,
  ): Event[] {
    const bodiesInTrines = new Set<Body>();
    for (const trine of trines) {
      bodiesInTrines.add(trine.bodies[0]);
      bodiesInTrines.add(trine.bodies[1]);
    }
    const bodiesArray = [...bodiesInTrines];
    return this.composeGrandTrinesFromArray(
      bodiesArray, trines, currentAspectBodies, previousAspectBodies, minute,
    );
  }

  /**
   * Composes T-Square patterns from stored 2-body aspects.
   *
   * A T-Square is a challenging configuration consisting of:
   * - 1 opposition (180°) between two bodies
   * - 2 squares (90°) from both opposition bodies to a third focal body
   *
   * Visual pattern:
   * ```
   *     Body1
   *       |
   *       | square (90°)
   *       |
   *    FocalBody -------- Body2
   *              opposition (180°)
   * ```
   *
   * The focal body receives tension from both opposition bodies and
   * represents the point of release or action in astrological interpretation.
   *
   * @param allEdges - All aspect edges across time for phase detection
   * @param minute - The minute to check for T-Square patterns
   * @returns Array of T-Square events detected at this minute
   * @see {@link determineMultiBodyPhase} for phase calculation
   */
  private composeTSquares(args: {
    currentAspectBodies: AspectBodies[];
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): Event[] {
    const { currentAspectBodies, minute, previousAspectBodies } = args;
    const unionEdges = [...currentAspectBodies, ...previousAspectBodies];
    const aspectsByType = TripleAspectsService.groupAspectsByType(unionEdges);
    const oppositions = aspectsByType.get("opposite") || [];
    const squares = aspectsByType.get("square") || [];
    const events: Event[] = [];

    for (const opposition of oppositions) {
      const body1 = opposition.bodies[0];
      const body2 = opposition.bodies[1];
      const squaresToBody1 = TripleAspectsService.findBodiesWithAspectTo(body1, "square", squares);
      const squaresToBody2 = TripleAspectsService.findBodiesWithAspectTo(body2, "square", squares);
      for (const focalBody of _.intersection(squaresToBody1, squaresToBody2)) {
        const event = this.checkTSquareFocalBody(
          body1, body2, focalBody,
          currentAspectBodies, previousAspectBodies,
          minute, unionEdges,
        );
        if (event) {
          events.push(event);
        }
      }
    }

    return events;
  }

  /**
   * Composes Yod patterns from stored 2-body aspects.
   *
   * A Yod ("Finger of God") is a spiritual configuration consisting of:
   * - 1 sextile (60°) at the base between two bodies
   * - 2 quincunxes (150°) from both base bodies to a third apex body
   *
   * Visual pattern:
   * ```
   *       ApexBody
   *         /  \
   *   150° /    \ 150°
   *       /      \
   *   Body1 --- Body2
   *      sextile (60°)
   * ```
   *
   * The apex body represents a fated point requiring adjustment and
   * integration of the energies from the sextile base.
   *
   * @param allEdges - All aspect edges across time for phase detection
   * @param minute - The minute to check for Yod patterns
   * @returns Array of Yod events detected at this minute
   * @see {@link determineMultiBodyPhase} for phase calculation
   */
  private composeYods(args: {
    currentAspectBodies: AspectBodies[];
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): Event[] {
    const { currentAspectBodies, minute, previousAspectBodies } = args;
    const unionEdges = [...currentAspectBodies, ...previousAspectBodies];
    const aspectsByType = TripleAspectsService.groupAspectsByType(unionEdges);
    const sextiles = aspectsByType.get("sextile") || [];
    const quincunxes = aspectsByType.get("quincunx") || [];
    const events: Event[] = [];

    for (const sextile of sextiles) {
      const body1 = sextile.bodies[0];
      const body2 = sextile.bodies[1];
      const quincunxToBody1 = TripleAspectsService.findBodiesWithAspectTo(body1, "quincunx", quincunxes);
      const quincunxToBody2 = TripleAspectsService.findBodiesWithAspectTo(body2, "quincunx", quincunxes);
      for (const apexBody of _.intersection(quincunxToBody1, quincunxToBody2)) {
        const event = this.checkYodApexBody(
          body1, body2, apexBody,
          currentAspectBodies, previousAspectBodies,
          minute, unionEdges,
        );
        if (event) {
          events.push(event);
        }
      }
    }

    return events;
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
    const { body1, body2, body3, focalOrApexBody, phase, timestamp, tripleAspect } = args;
    const b1c = _.startCase(body1);
    const b2c = _.startCase(body2);
    const b3c = _.startCase(body3);
    const bodiesSorted = _.sortBy([b1c, b2c, b3c]);
    const description = TripleAspectsService.buildTripleAspectDescription(
      bodiesSorted, tripleAspect, phase, focalOrApexBody,
    );
    const tripleAspectSymbol = symbolByTripleAspect[tripleAspect];
    const phaseEmoji = TripleAspectsService.getPhaseEmoji(phase);
    const summary = `${phaseEmoji}${tripleAspectSymbol} ${symbolByBody[body1]}-${symbolByBody[body2]}-${symbolByBody[body3]} ${description}`;
    this.logger.log(`${summary} at ${timestamp.toISOString()}`);
    const categories = this.buildTripleAspectCategories(
      tripleAspect, phase, b1c, b2c, b3c, focalOrApexBody,
    );
    return { categories, description, end: timestamp, start: timestamp, summary };
  }

  private pairProgressiveGroup(groupEvents: Event[]): Event[] {
    const formingEvents = groupEvents
      .filter((event) => event.categories.includes("Forming"))
      .toSorted((a, b) => a.start.valueOf() - b.start.valueOf());
    const dissolvingEvents = groupEvents
      .filter((event) => event.categories.includes("Dissolving"))
      .toSorted((a, b) => a.start.valueOf() - b.start.valueOf());
    return this.pairProgressiveGroupPairs(formingEvents, dissolvingEvents);
  }

  private pairProgressiveGroupPairs(
    formingEvents: Event[],
    dissolvingEvents: Event[],
  ): Event[] {
    const results: Event[] = [];
    const minimumLength = Math.min(formingEvents.length, dissolvingEvents.length);
    for (let index = 0; index < minimumLength; index++) {
      const forming = formingEvents[index];
      const dissolving = dissolvingEvents[index];
      if (!forming || !dissolving) {
        continue;
      }
      if (dissolving.start.valueOf() <= forming.start.valueOf()) {
        continue;
      }
      const aspectCapitalized = forming.categories.find((category) =>
        ["Grand Trine", "T Square", "Yod"].includes(category),
      );
      if (!aspectCapitalized) {
        continue;
      }
      const event = this.buildProgressiveEvent({ aspectCapitalized, dissolving, forming });
      if (event) {
        results.push(event);
      }
    }
    return results;
  }

  private resolveProgressiveMeta(
    bodiesCapitalized: string[],
    aspect: TripleAspect,
  ): null | ProgressiveBodiesMeta {
    const body1Capitalized = bodiesCapitalized[0] ?? "";
    const body2Capitalized = bodiesCapitalized[1] ?? "";
    const body3Capitalized = bodiesCapitalized[2] ?? "";
    const resolved = TripleAspectsService.resolveProgressiveBodiesLower(
      body1Capitalized, body2Capitalized, body3Capitalized,
    );
    if (!resolved) {
      this.logger.warn(
        `Unknown body in progressive event: ${body1Capitalized}, ${body2Capitalized}, ${body3Capitalized}`,
      );
      return null;
    }
    return {
      aspect,
      body1: resolved[0], body1Capitalized,
      body2: resolved[1], body2Capitalized,
      body3: resolved[2], body3Capitalized,
    };
  }

  // 🌎 Public Methods

  /**
   * Detects all triple aspect patterns from stored 2-body aspect events.
   *
   * Analyzes combinations of simple aspects to identify higher-order patterns:
   * - T-Square (1 opposition + 2 squares)
   * - Yod (1 sextile + 2 quincunxes)
   * - Grand Trine (3 trines)
   *
   * These compound aspects represent significant configurations where
   * the whole is greater than the sum of parts, indicating major themes
   * in astrological interpretation.
   *
   * @param storedAspects - Previously detected simple aspect events
   * @param minute - The minute to check for triple aspect patterns
   * @returns Array of all detected triple aspect events at this minute
   * @see {@link parseAspectEvents} for extracting aspect relationships
   * @see {@link composeTSquares} for T-Square detection
   * @see {@link composeYods} for Yod detection
   * @see {@link composeGrandTrines} for Grand Trine detection
   */
  detect(args: {
    currentAspectBodies: AspectBodies[];
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): Event[] {
    const { currentAspectBodies, minute, previousAspectBodies } = args;
    return [
      ...this.composeTSquares({ currentAspectBodies, minute, previousAspectBodies }),
      ...this.composeYods({ currentAspectBodies, minute, previousAspectBodies }),
      ...this.composeGrandTrines({ currentAspectBodies, minute, previousAspectBodies }),
      // Can add more patterns: Hammer, etc.
    ];
  }

  /**
   * Converts instantaneous triple aspect events into progressive events.
   *
   * Pairs forming and dissolving events for the same body triplet and
   * pattern type to create events spanning the entire active period.
   * Progressive events show when a pattern is in effect rather than just
   * boundary moments.
   *
   * @param events - All events to process (non-triple-aspect events are filtered out)
   * @returns Array of progressive events spanning from forming to dissolving
   * @see {@link pairProgressiveEvents} for forming/dissolving pairing logic
   */
  detectProgressive(events: Event[]): Event[] {
    const tripleAspectEvents = events.filter((event) =>
      event.categories.includes("Triple Aspect"),
    );
    const groupedEvents = _.groupBy(tripleAspectEvents, (event) =>
      TripleAspectsService.getProgressiveGroupKey(event),
    );
    const progressiveEvents: Event[] = [];
    for (const [key, groupEvents] of Object.entries(groupedEvents)) {
      if (!key) {
        continue;
      }
      progressiveEvents.push(...this.pairProgressiveGroup(groupEvents));
    }
    return progressiveEvents;
  }
}
