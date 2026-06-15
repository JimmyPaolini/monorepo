import { AspectsUtilities } from "@caelundas/src/modules/aspects/aspects.utilities";
import {
  majorAspects,
  symbolByBody,
  symbolByMajorAspect,
} from "@caelundas/src/modules/caelundas/caelundas.constants";
import {
  capitalize,
  isBody,
  isMajorAspect,
  majorAspectBodies,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import { LoggerService } from "../logger/logger.service";

import type {
  AspectPhase,
  Body,
  MajorAspect,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { CoordinateEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

interface AssembleMajorAspectEventArguments {
  body1: Body;
  body1Capitalized: string;
  body2: Body;
  body2Capitalized: string;
  majorAspect: MajorAspect;
  phase: AspectPhase;
  timestamp: Moment;
}

interface DetectAspectForBodyPairArguments {
  body1: Body;
  body2: Body;
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  minute: Moment;
  nextMinute: Moment;
  previousMinute: Moment;
}

interface ExtractAspectPartsFromCategoriesResult {
  aspect: MajorAspect;
  aspectCapitalized: string;
  body1: Body;
  body1Capitalized: string;
  body2: Body;
  body2Capitalized: string;
}

/**
 * Detects and formats major aspect events between celestial bodies.
 *
 * Covers conjunction (0°), sextile (60°), square (90°), trine (120°), and opposition (180°)
 * using an 8° orb tolerance. Includes progressive event pairing for duration-aware tracking.
 *
 * @see {@link AspectsUtilities} for orb and angle configuration
 */
@Injectable()
export class MajorAspectsService {
  // 🏗 Dependency Injection

  constructor(
    private readonly logger: LoggerService,
    private readonly aspectsUtilitiesService: AspectsUtilities,
    private readonly ephemerisService: EphemerisService,
    private readonly progressiveUtilitiesService: ProgressiveUtilities,
  ) {
    this.logger.setContext(MajorAspectsService.name);
    this.detectAspectPhase = aspectsUtilitiesService.getIsAspect([
      ...majorAspects,
    ]);
  }

  // 🔐 Private Fields

  private readonly detectAspectPhase: ReturnType<
    AspectsUtilities["getIsAspect"]
  >;

  private readonly phaseMetadata = {
    dissolving: { emoji: "⬅️", label: "Dissolving", verb: "dissolving" },
    forming: { emoji: "➡️", label: "Forming", verb: "forming" },
    perfective: { emoji: "🎯", label: "Perfective", verb: "perfective" },
  } as const satisfies Record<
    AspectPhase,
    { emoji: string; label: string; verb: string }
  >;

  // 🔑 Public Fields

  // 🔏 Private Methods

  private assembleMajorAspectEvent(
    args: AssembleMajorAspectEventArguments,
  ): Event {
    const { categories, description, summary } = this.buildAspectEventParts(
      args.body1,
      args.body1Capitalized,
      args.body2,
      args.body2Capitalized,
      args.majorAspect,
      args.phase,
    );
    this.logger.log(`${summary} at ${args.timestamp.toISOString()}`);
    return {
      categories,
      description,
      end: args.timestamp,
      start: args.timestamp,
      summary,
    };
  }

  private buildAspectEventParts(
    body1: Body,
    body1Capitalized: string,
    body2: Body,
    body2Capitalized: string,
    majorAspect: MajorAspect,
    phase: AspectPhase,
  ): { categories: string[]; description: string; summary: string } {
    const body1Symbol = symbolByBody[body1];
    const body2Symbol = symbolByBody[body2];
    const majorAspectSymbol = symbolByMajorAspect[majorAspect];
    const { emoji: phaseEmoji, label, verb } = this.phaseMetadata[phase];
    const description = `${body1Capitalized} ${verb} ${majorAspect} ${body2Capitalized}`;
    const categories = [
      "Astronomy",
      "Astrology",
      "Simple Aspect",
      "Major Aspect",
      body1Capitalized,
      body2Capitalized,
      _.startCase(majorAspect),
      label,
    ];
    const summary = `${phaseEmoji} ${body1Symbol} ${majorAspectSymbol} ${body2Symbol} ${description}`;
    return { categories, description, summary };
  }

  private castAspectPartsToTypes(
    body1Capitalized: string,
    body2Capitalized: string,
    aspectCapitalized: string,
    categories: string[],
  ): { aspect: MajorAspect; body1: Body; body2: Body } {
    const aspectLower = aspectCapitalized.toLowerCase();
    const body1Lower = body1Capitalized.toLowerCase();
    const body2Lower = body2Capitalized.toLowerCase();
    if (
      !isMajorAspect(aspectLower) ||
      !isBody(body1Lower) ||
      !isBody(body2Lower)
    ) {
      throw new Error(
        `Could not extract typed values from categories: ${categories.join(", ")}`,
      );
    }
    return { aspect: aspectLower, body1: body1Lower, body2: body2Lower };
  }

  private detectAspectForBodyPair(
    args: DetectAspectForBodyPairArguments,
  ): Event | null {
    const win1 = this.getLongitudesWindowForBody(
      args.body1,
      args.coordinateEphemerisByBody,
      args.previousMinute,
      args.minute,
      args.nextMinute,
    );
    const win2 = this.getLongitudesWindowForBody(
      args.body2,
      args.coordinateEphemerisByBody,
      args.previousMinute,
      args.minute,
      args.nextMinute,
    );
    const phase = this.detectPhaseFromWindows(win1, win2);
    if (!phase) return null;
    return this.buildMajorAspectEvent({
      body1: args.body1,
      body2: args.body2,
      longitudeBody1: win1.current,
      longitudeBody2: win2.current,
      phase,
      timestamp: args.minute,
    });
  }

  private detectPhaseFromWindows(
    win1: { current: number; next: number; previous: number },
    win2: { current: number; next: number; previous: number },
  ): AspectPhase | null {
    return this.detectAspectPhase({
      currentLongitudeBody1: win1.current,
      currentLongitudeBody2: win2.current,
      nextLongitudeBody1: win1.next,
      nextLongitudeBody2: win2.next,
      previousLongitudeBody1: win1.previous,
      previousLongitudeBody2: win2.previous,
    });
  }

  private extractAspectPartsFromCategories(
    categories: string[],
  ): ExtractAspectPartsFromCategoriesResult {
    const bodiesCapitalized = _.sortBy(
      categories.filter((category) =>
        majorAspectBodies
          .map((majorAspectBody) => _.startCase(majorAspectBody))
          .includes(category),
      ),
    );
    const aspectCapitalized = categories.find((category) =>
      majorAspects
        .map((majorAspect) => _.startCase(majorAspect))
        .includes(category),
    );
    if (bodiesCapitalized.length !== 2 || !aspectCapitalized) {
      throw new Error(
        `Could not extract aspect info from categories: ${categories.join(", ")}`,
      );
    }
    const body1Capitalized = bodiesCapitalized[0] ?? "";
    const body2Capitalized = bodiesCapitalized[1] ?? "";
    const { aspect, body1, body2 } = this.castAspectPartsToTypes(
      body1Capitalized,
      body2Capitalized,
      aspectCapitalized,
      categories,
    );
    return {
      aspect,
      aspectCapitalized,
      body1,
      body1Capitalized,
      body2,
      body2Capitalized,
    };
  }

  private getAspectGroupKey(event: Event): string {
    const planets = _.sortBy(
      event.categories.filter((category) =>
        majorAspectBodies
          .map((majorAspectBody) => _.startCase(majorAspectBody))
          .includes(category),
      ),
    );
    const aspect = event.categories.find((category) =>
      majorAspects
        .map((majorAspect) => _.startCase(majorAspect))
        .includes(category),
    );
    if (planets.length === 2 && aspect) {
      return `${planets[0]}-${aspect}-${planets[1]}`;
    }
    return "";
  }

  private getLongitudesWindowForBody(
    body: Body,
    coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>,
    previousMinute: Moment,
    minute: Moment,
    nextMinute: Moment,
  ): { current: number; next: number; previous: number } {
    return this.ephemerisService.getLongitudesWindow(
      coordinateEphemerisByBody[body],
      previousMinute,
      minute,
      nextMinute,
    );
  }

  /**
   * Creates a progressive event from paired forming and dissolving aspect events.
   *
   * Extracts body names and aspect type from event categories, then formats a duration
   * event showing the span of time when the aspect remained within orb.
   *
   * @param beginning - Forming aspect event (marks entry into orb)
   * @param ending - Dissolving aspect event (marks exit from orb)
   * @returns Progressive event spanning from forming to dissolving
   * @throws When categories don't contain exactly 2 bodies and 1 aspect type
   *
   * @remarks
   * - Assumes beginning and ending events have matching body pairs and aspect type
   * - Uses alphabetically sorted body names for consistency
   * - Summary format: `[body1Symbol][aspectSymbol][body2Symbol] [Body1] [aspect] [Body2]`
   * - Categories: Astronomy, Astrology, Simple Aspect, Major Aspect, [Body1], [Body2], [Aspect]
   * - Duration spans from beginning.start to ending.start (not ending.end)
   *
   * @see {@link majorAspectBodies} for extracting body categories
   * @see {@link majorAspects} for extracting aspect category
   *
   * @example
   * ```typescript
   * const progressive = getMajorAspectProgressiveEvent(
   *   { summary: "➡️ ☉ □ ♃ ...", start: Jan 1, categories: ["Sun", "Jupiter", "Square", ...] },
   *   { summary: "⬅️ ☉ □ ♃ ...", start: Jan 10, categories: ["Sun", "Jupiter", "Square", ...] }
   * );
   * // Returns: { summary: "☉□♃ Sun square Jupiter", start: Jan 1, end: Jan 10, ... }
   * ```
   */
  private getMajorAspectProgressiveEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    const {
      aspect,
      aspectCapitalized,
      body1,
      body1Capitalized,
      body2,
      body2Capitalized,
    } = this.extractAspectPartsFromCategories(beginning.categories);
    const body1Symbol = symbolByBody[body1];
    const body2Symbol = symbolByBody[body2];
    const aspectSymbol = symbolByMajorAspect[aspect];
    return {
      categories: [
        "Astronomy",
        "Astrology",
        "Simple Aspect",
        "Major Aspect",
        body1Capitalized,
        body2Capitalized,
        aspectCapitalized,
      ],
      description: `${body1Capitalized} ${aspect} ${body2Capitalized}`,
      end: ending.start,
      start: beginning.start,
      summary: `${body1Symbol}${aspectSymbol}${body2Symbol} ${body1Capitalized} ${aspect} ${body2Capitalized}`,
    };
  }

  private processAspectGroup(key: string, groupEvents: Event[]): Event[] {
    if (!key) return [];
    const formingEvents = groupEvents.filter((event) =>
      event.categories.includes("Forming"),
    );
    const dissolvingEvents = groupEvents.filter((event) =>
      event.categories.includes("Dissolving"),
    );
    const pairs = this.progressiveUtilitiesService.pairProgressiveEvents(
      formingEvents,
      dissolvingEvents,
      `major aspect ${key}`,
    );
    return pairs.map(([beginning, ending]) =>
      this.getMajorAspectProgressiveEvent(beginning, ending),
    );
  }

  // 🌎 Public Methods

  /**
   *
   */
  buildMajorAspectEvent(args: {
    body1: Body;
    body2: Body;
    longitudeBody1: number;
    longitudeBody2: number;
    phase: AspectPhase;
    timestamp: Moment;
  }): Event {
    const { body1, body2, longitudeBody1, longitudeBody2, phase, timestamp } =
      args;
    const majorAspect = this.getMajorAspect({ longitudeBody1, longitudeBody2 });
    if (!majorAspect) {
      this.logger.error(
        `No major aspect found between ${body1} and ${body2} at ${timestamp.toISOString()}: ${longitudeBody1} and ${longitudeBody2}`,
      );
      throw new Error("No major aspect found");
    }
    return this.assembleMajorAspectEvent({
      body1,
      body1Capitalized: capitalize(body1),
      body2,
      body2Capitalized: capitalize(body2),
      majorAspect,
      phase,
      timestamp,
    });
  }

  /**
   *
   */
  detect(args: {
    coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
    minute: Moment;
  }): Event[] {
    const { coordinateEphemerisByBody, minute } = args;
    const previousMinute = minute.clone().subtract(1, "minute");
    const nextMinute = minute.clone().add(1, "minute");
    const majorAspectEvents: Event[] = [];
    for (const body1 of majorAspectBodies) {
      const index = majorAspectBodies.indexOf(body1);
      for (const body2 of majorAspectBodies.slice(index + 1)) {
        const event = this.detectAspectForBodyPair({
          body1,
          body2,
          coordinateEphemerisByBody,
          minute,
          nextMinute,
          previousMinute,
        });
        if (event) majorAspectEvents.push(event);
      }
    }
    return majorAspectEvents;
  }

  /**
   *
   */
  detectProgressive(events: Event[]): Event[] {
    const majorAspectEvents = events.filter((event) =>
      event.categories.includes("Major Aspect"),
    );
    const groupedEvents = _.groupBy(majorAspectEvents, (event) =>
      this.getAspectGroupKey(event),
    );
    const progressiveEvents: Event[] = [];
    for (const [key, groupEvents] of Object.entries(groupedEvents)) {
      progressiveEvents.push(...this.processAspectGroup(key, groupEvents));
    }
    return progressiveEvents;
  }

  /**
   * Returns the first major aspect between two bodies, or `null` if none is within orb.
   *
   * @param args - `longitudeBody1` and `longitudeBody2` in ecliptic degrees
   */
  getMajorAspect(args: {
    longitudeBody1: number;
    longitudeBody2: number;
  }): MajorAspect | null {
    const { longitudeBody1, longitudeBody2 } = args;
    for (const aspect of majorAspects) {
      if (
        this.aspectsUtilitiesService.isAspect({
          aspect,
          longitudeBody1,
          longitudeBody2,
        })
      ) {
        return aspect;
      }
    }
    return null;
  }

  /**
   * Classifies the major aspect phase (forming / perfective / dissolving) between two bodies
   * across three consecutive minutes, or `null` if no major aspect is in progress.
   *
   * @param args - Longitudes at previous, current, and next minutes for both bodies
   */
  getMajorAspectPhase(args: {
    currentLongitudeBody1: number;
    currentLongitudeBody2: number;
    nextLongitudeBody1: number;
    nextLongitudeBody2: number;
    previousLongitudeBody1: number;
    previousLongitudeBody2: number;
  }): AspectPhase | null {
    return this.detectAspectPhase(args);
  }
}
