import { AspectsUtilities } from "@caelundas/src/modules/aspects/aspects.utilities";
import {
  minorAspects,
  symbolByBody,
  symbolByMinorAspect,
} from "@caelundas/src/modules/caelundas/caelundas.constants";
import {
  capitalize,
  isBody,
  isMinorAspect,
  minorAspectBodies,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import { LoggerService } from "../logger/logger.service";

import type {
  AspectPhase,
  Body,
  MinorAspect,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { CoordinateEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

/**
 * Detects and formats minor aspect events between celestial bodies.
 *
 * Covers semi-sextile (30°), semi-square (45°), sesquiquadrate (135°), and quincunx (150°)
 * using smaller orbs than major aspects. Includes progressive event pairing for
 * duration-aware tracking.
 *
 * @see {@link AspectsUtilities} for orb and angle configuration
 */
@Injectable()
export class MinorAspectsService {
  // 🏗 Dependency Injection

  constructor(
    private readonly logger: LoggerService,
    private readonly aspectsUtilitiesService: AspectsUtilities,
    private readonly ephemerisService: EphemerisService,
    private readonly progressiveUtilitiesService: ProgressiveUtilities,
  ) {
    this.logger.setContext(MinorAspectsService.name);
    this.detectAspectPhase = aspectsUtilitiesService.getIsAspect([
      ...minorAspects,
    ]);
  }

  // 🔐 Private Fields

  private readonly detectAspectPhase: ReturnType<
    AspectsUtilities["getIsAspect"]
  >;

  // 🔑 Public Fields

  // 🔏 Private Methods

  private assembleMinorAspectEvent(
    body1: Body,
    body2: Body,
    minorAspect: MinorAspect,
    phase: AspectPhase,
    timestamp: Moment,
  ): Event {
    const body1Capitalized = capitalize(body1);
    const body2Capitalized = capitalize(body2);
    const body1Symbol = symbolByBody[body1];
    const body2Symbol = symbolByBody[body2];
    const minorAspectSymbol = symbolByMinorAspect[minorAspect];
    const baseCategories = [
      "Astronomy",
      "Astrology",
      "Simple Aspect",
      "Minor Aspect",
      body1Capitalized,
      body2Capitalized,
      _.startCase(minorAspect),
    ];
    const { categories, description, phaseEmoji } = this.resolvePhaseDetails(
      phase,
      body1Capitalized,
      body2Capitalized,
      minorAspect,
      baseCategories,
    );
    const summary = `${phaseEmoji} ${body1Symbol} ${minorAspectSymbol} ${body2Symbol} ${description}`;
    this.logger.log(`${summary} at ${timestamp.toISOString()}`);
    return { categories, description, end: timestamp, start: timestamp, summary };
  }

  private buildGroupKey(event: Event): string {
    const planets = _.sortBy(
      event.categories.filter((category) =>
        minorAspectBodies
          .map((minorAspectBody) => _.startCase(minorAspectBody))
          .includes(category),
      ),
    );
    const aspect = event.categories.find((category) =>
      minorAspects
        .map((minorAspect) => _.startCase(minorAspect))
        .includes(category),
    );
    if (planets.length === 2 && aspect) {
      return `${planets[0]}-${aspect}-${planets[1]}`;
    }
    return "";
  }

  private castAspectComponentsToTypes(
    body1Capitalized: string,
    body2Capitalized: string,
    aspectCapitalized: string,
    categories: string[],
  ): { aspect: MinorAspect; body1: Body; body2: Body } {
    const aspectLower = aspectCapitalized.toLowerCase();
    const body1Lower = body1Capitalized.toLowerCase();
    const body2Lower = body2Capitalized.toLowerCase();
    if (!isMinorAspect(aspectLower) || !isBody(body1Lower) || !isBody(body2Lower)) {
      throw new Error(
        `Could not extract typed values from categories: ${categories.join(", ")}`,
      );
    }
    return { aspect: aspectLower, body1: body1Lower, body2: body2Lower };
  }

  private detectBodyPairAspect(
    body1: Body,
    body2: Body,
    coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>,
    previousMinute: Moment,
    minute: Moment,
    nextMinute: Moment,
  ): Event | null {
    const win1 = this.getLongitudesWindowForBody(body1, coordinateEphemerisByBody, previousMinute, minute, nextMinute);
    const win2 = this.getLongitudesWindowForBody(body2, coordinateEphemerisByBody, previousMinute, minute, nextMinute);
    const phase = this.detectPhaseFromWindows(win1, win2);
    if (!phase) {
      return null;
    }
    return this.buildMinorAspectEvent({
      body1,
      body2,
      longitudeBody1: win1.current,
      longitudeBody2: win2.current,
      phase,
      timestamp: minute,
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

  private extractAspectComponents(categories: string[]): {
    aspect: MinorAspect;
    aspectCapitalized: string;
    body1: Body;
    body1Capitalized: string;
    body2: Body;
    body2Capitalized: string;
  } {
    const bodiesCapitalized = _.sortBy(
      categories.filter((category) =>
        minorAspectBodies
          .map((minorAspectBody) => _.startCase(minorAspectBody))
          .includes(category),
      ),
    );
    const aspectCapitalized = categories.find((category) =>
      minorAspects.map((minorAspect) => _.startCase(minorAspect)).includes(category),
    );
    if (bodiesCapitalized.length !== 2 || !aspectCapitalized) {
      throw new Error(
        `Could not extract aspect info from categories: ${categories.join(", ")}`,
      );
    }
    const body1Capitalized = bodiesCapitalized[0] ?? "";
    const body2Capitalized = bodiesCapitalized[1] ?? "";
    const { aspect, body1, body2 } = this.castAspectComponentsToTypes(body1Capitalized, body2Capitalized, aspectCapitalized, categories);
    return { aspect, aspectCapitalized, body1, body1Capitalized, body2, body2Capitalized };
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

  private getMinorAspectProgressiveEvent(
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
    } = this.extractAspectComponents(beginning.categories);

    const body1Symbol = symbolByBody[body1];
    const body2Symbol = symbolByBody[body2];
    const aspectSymbol = symbolByMinorAspect[aspect];

    return {
      categories: [
        "Astronomy",
        "Astrology",
        "Simple Aspect",
        "Minor Aspect",
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
    if (!key) {
      return [];
    }
    const formingEvents = groupEvents.filter((event) =>
      event.categories.includes("Forming"),
    );
    const dissolvingEvents = groupEvents.filter((event) =>
      event.categories.includes("Dissolving"),
    );
    const pairs = this.progressiveUtilitiesService.pairProgressiveEvents(
      formingEvents,
      dissolvingEvents,
      `minor aspect ${key}`,
    );
    return pairs.map(([beginning, ending]) =>
      this.getMinorAspectProgressiveEvent(beginning, ending),
    );
  }

  private resolvePhaseDetails(
    phase: AspectPhase,
    body1Capitalized: string,
    body2Capitalized: string,
    minorAspect: MinorAspect,
    baseCategories: string[],
  ): { categories: string[]; description: string; phaseEmoji: string } {
    if (phase === "perfective") {
      return {
        categories: [...baseCategories, "Perfective"],
        description: `${body1Capitalized} perfective ${minorAspect} ${body2Capitalized}`,
        phaseEmoji: "🎯",
      };
    } else if (phase === "forming") {
      return {
        categories: [...baseCategories, "Forming"],
        description: `${body1Capitalized} forming ${minorAspect} ${body2Capitalized}`,
        phaseEmoji: "➡️",
      };
    } else {
      return {
        categories: [...baseCategories, "Dissolving"],
        description: `${body1Capitalized} dissolving ${minorAspect} ${body2Capitalized}`,
        phaseEmoji: "⬅️",
      };
    }
  }

  // 🌎 Public Methods

  /**
   * Creates a calendar event for a specific minor aspect occurrence.
   *
   * Formats the event with appropriate emoji indicators, body symbols,
   * and categorization for filtering and organization.
   *
   * @param args - Event parameters
   * @param longitudeBody1 - Ecliptic longitude of first body in degrees
   * @param longitudeBody2 - Ecliptic longitude of second body in degrees
   * @param timestamp - Exact moment of the aspect phase
   * @param body1 - First celestial body
   * @param body2 - Second celestial body
   * @param phase - Aspect phase: forming, exact, or dissolving
   * @returns Formatted calendar event with summary, description, and categories
   * @throws When no valid minor aspect is detected between the bodies
   * @see {@link getMinorAspect} for aspect type determination
   */
  buildMinorAspectEvent(args: {
    body1: Body;
    body2: Body;
    longitudeBody1: number;
    longitudeBody2: number;
    phase: AspectPhase;
    timestamp: Moment;
  }): Event {
    const { body1, body2, longitudeBody1, longitudeBody2, phase, timestamp } =
      args;
    const minorAspect = this.getMinorAspect({ longitudeBody1, longitudeBody2 });
    if (!minorAspect) {
      this.logger.error(
        `No minor aspect found between ${body1} and ${body2} at ${timestamp.toISOString()}: ${longitudeBody1} and ${longitudeBody2}`,
      );
      throw new Error("No minor aspect found");
    }
    return this.assembleMinorAspectEvent(body1, body2, minorAspect, phase, timestamp);
  }

  /**
   * Detects minor aspect events within a single minute time window.
   *
   * Scans all configured body pairs for minor aspects (semi-sextile 30°,
   * semi-square 45°, sesquiquadrate 135°, quincunx 150°) and determines
   * the phase (forming, exact, or dissolving) based on comparison with
   * adjacent minutes.
   *
   * Minor aspects are weaker harmonic relationships that add nuance to
   * astrological interpretations. They use smaller orbs than major aspects
   * (typically ±2-3° vs ±8-10°).
   *
   * @param args - Configuration object
   * @param coordinateEphemerisByBody - Pre-computed ephemeris data for all bodies
   * @param minute - The minute to check for aspect events
   * @returns Array of calendar events for all detected minor aspects at this minute
   * @see {@link getMinorAspect} for aspect type detection
   * @see {@link getMinorAspectPhase} for phase determination
   * @see {@link minorAspectBodies} for configured body list
   */
  detect(args: {
    coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
    minute: Moment;
  }): Event[] {
    const { coordinateEphemerisByBody, minute } = args;
    const previousMinute = minute.clone().subtract(1, "minute");
    const nextMinute = minute.clone().add(1, "minute");
    const minorAspectEvents: Event[] = [];

    for (const body1 of minorAspectBodies) {
      const index = minorAspectBodies.indexOf(body1);
      for (const body2 of minorAspectBodies.slice(index + 1)) {
        if (body1 === body2) {
          continue;
        }
        const event = this.detectBodyPairAspect(
          body1,
          body2,
          coordinateEphemerisByBody,
          previousMinute,
          minute,
          nextMinute,
        );
        if (event) {
          minorAspectEvents.push(event);
        }
      }
    }

    return minorAspectEvents;
  }

  /**
   * Converts instantaneous minor aspect events into progressive events.
   *
   * Pairs forming and dissolving events for the same body-aspect combination
   * to create events spanning the entire active period of each aspect.
   * Progressive events show when an aspect is in orb rather than just boundary moments.
   *
   * @param events - All events to process (non-aspect events are filtered out)
   * @returns Array of progressive events spanning from forming to dissolving
   * @see {@link pairProgressiveEvents} for forming/dissolving pairing logic
   */
  detectProgressive(events: Event[]): Event[] {
    const minorAspectEvents = events.filter((event) =>
      event.categories.includes("Minor Aspect"),
    );
    const groupedEvents = _.groupBy(minorAspectEvents, (event) =>
      this.buildGroupKey(event),
    );
    const progressiveEvents: Event[] = [];

    for (const [key, groupEvents] of Object.entries(groupedEvents)) {
      progressiveEvents.push(...this.processAspectGroup(key, groupEvents));
    }

    return progressiveEvents;
  }

  /**
   * Returns the first minor aspect between two bodies, or `null` if none is within orb.
   *
   * @param args - `longitudeBody1` and `longitudeBody2` in ecliptic degrees
   */
  getMinorAspect(args: {
    longitudeBody1: number;
    longitudeBody2: number;
  }): MinorAspect | null {
    const { longitudeBody1, longitudeBody2 } = args;
    for (const aspect of minorAspects) {
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
   * Classifies the minor aspect phase (forming / perfective / dissolving) between two bodies
   * across three consecutive minutes, or `null` if no minor aspect is in progress.
   *
   * @param args - Longitudes at previous, current, and next minutes for both bodies
   */
  getMinorAspectPhase(args: {
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
