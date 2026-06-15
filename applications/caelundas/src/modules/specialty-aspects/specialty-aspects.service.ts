import { AspectsUtilities } from "@caelundas/src/modules/aspects/aspects.utilities";
import {
  specialtyAspects,
  symbolByBody,
  symbolBySpecialtyAspect,
} from "@caelundas/src/modules/caelundas/caelundas.constants";
import {
  capitalize,
  isBody,
  isSpecialtyAspect,
  specialtyAspectBodies,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import { LoggerService } from "../logger/logger.service";

import type {
  AspectPhase,
  Body,
  SpecialtyAspect,
  SpecialtyAspectSymbol,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { CoordinateEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

interface LongitudesWindow {
  currentLongitudeBody1: number;
  currentLongitudeBody2: number;
  nextLongitudeBody1: number;
  nextLongitudeBody2: number;
  previousLongitudeBody1: number;
  previousLongitudeBody2: number;
}

/**
 * Detects and formats specialty (harmonic) aspect events between celestial bodies.
 *
 * Covers quintile (72°), biquintile (144°), septile (~51.4°), and novile (40°).
 * These aspects represent subtler energetic relationships and use narrower orbs.
 * Includes progressive event pairing for duration-aware tracking.
 *
 * @see {@link AspectsUtilities} for orb and angle configuration
 */
@Injectable()
export class SpecialtyAspectsService {
  // 🏗 Dependency Injection

  constructor(
    private readonly logger: LoggerService,
    private readonly aspectsUtilitiesService: AspectsUtilities,
    private readonly ephemerisService: EphemerisService,
    private readonly progressiveUtilitiesService: ProgressiveUtilities,
  ) {
    this.logger.setContext(SpecialtyAspectsService.name);
    this.detectAspectPhase = aspectsUtilitiesService.getIsAspect([
      ...specialtyAspects,
    ]);
  }

  // 🔐 Private Fields

  private readonly detectAspectPhase: ReturnType<
    AspectsUtilities["getIsAspect"]
  >;

  // 🔑 Public Fields

  // 🔏 Private Methods

  private buildSpecialtyAspectEventFromParts(args: {
    body1Symbol: string;
    body2Symbol: string;
    categories: string[];
    description: string;
    phaseEmoji: string;
    specialtyAspectSymbol: SpecialtyAspectSymbol;
    timestamp: Moment;
  }): Event {
    const {
      body1Symbol,
      body2Symbol,
      categories,
      description,
      phaseEmoji,
      specialtyAspectSymbol,
      timestamp,
    } = args;
    const summary = `${phaseEmoji} ${body1Symbol} ${specialtyAspectSymbol} ${body2Symbol} ${description}`;
    this.logger.log(`${summary} at ${timestamp.toISOString()}`);
    return {
      categories,
      description,
      end: timestamp,
      start: timestamp,
      summary,
    };
  }

  private detectBodyPairEvent(
    body1: Body,
    body2: Body,
    coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>,
    previousMinute: Moment,
    minute: Moment,
    nextMinute: Moment,
  ): Event | null {
    const longitudes = this.detectBodyPairLongitudes(
      body1,
      body2,
      coordinateEphemerisByBody,
      previousMinute,
      minute,
      nextMinute,
    );
    const phase = this.detectAspectPhase(longitudes);
    if (!phase) return null;
    return this.buildSpecialtyAspectEvent({
      body1,
      body2,
      longitudeBody1: longitudes.currentLongitudeBody1,
      longitudeBody2: longitudes.currentLongitudeBody2,
      phase,
      timestamp: minute,
    });
  }

  private detectBodyPairLongitudes(
    body1: Body,
    body2: Body,
    coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>,
    previousMinute: Moment,
    minute: Moment,
    nextMinute: Moment,
  ): LongitudesWindow {
    const w1 = this.getBodyLongitudesWindow(
      coordinateEphemerisByBody[body1],
      previousMinute,
      minute,
      nextMinute,
    );
    const w2 = this.getBodyLongitudesWindow(
      coordinateEphemerisByBody[body2],
      previousMinute,
      minute,
      nextMinute,
    );
    return {
      currentLongitudeBody1: w1.current,
      currentLongitudeBody2: w2.current,
      nextLongitudeBody1: w1.next,
      nextLongitudeBody2: w2.next,
      previousLongitudeBody1: w1.previous,
      previousLongitudeBody2: w2.previous,
    };
  }

  private extractAspectBodiesFromCategories(categories: string[]): {
    aspectCapitalized: string;
    body1Capitalized: string;
    body2Capitalized: string;
  } {
    const bodiesCapitalized = _.sortBy(
      categories.filter((category) =>
        specialtyAspectBodies.map((b) => _.startCase(b)).includes(category),
      ),
    );
    const aspectCapitalized = categories.find((category) =>
      specialtyAspects.map((a) => _.startCase(a)).includes(category),
    );
    if (bodiesCapitalized.length !== 2 || !aspectCapitalized) {
      throw new Error(
        `Could not extract aspect info from categories: ${categories.join(", ")}`,
      );
    }
    return {
      aspectCapitalized,
      body1Capitalized: bodiesCapitalized[0] ?? "",
      body2Capitalized: bodiesCapitalized[1] ?? "",
    };
  }

  private extractTypedAspectValues(
    body1Capitalized: string,
    body2Capitalized: string,
    aspectCapitalized: string,
    categories: string[],
  ): { aspect: SpecialtyAspect; body1: Body; body2: Body } {
    const aspectLower = aspectCapitalized.toLowerCase();
    const body1Lower = body1Capitalized.toLowerCase();
    const body2Lower = body2Capitalized.toLowerCase();
    if (
      !isSpecialtyAspect(aspectLower) ||
      !isBody(body1Lower) ||
      !isBody(body2Lower)
    ) {
      throw new Error(
        `Could not extract typed values from categories: ${categories.join(", ")}`,
      );
    }
    return { aspect: aspectLower, body1: body1Lower, body2: body2Lower };
  }

  private getBodyLongitudesWindow(
    ephemeris: CoordinateEphemeris,
    previousMinute: Moment,
    minute: Moment,
    nextMinute: Moment,
  ): { current: number; next: number; previous: number } {
    return this.ephemerisService.getLongitudesWindow(
      ephemeris,
      previousMinute,
      minute,
      nextMinute,
    );
  }

  private getSpecialtyAspectProgressiveEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    const { aspectCapitalized, body1Capitalized, body2Capitalized } =
      this.extractAspectBodiesFromCategories(beginning.categories);
    const { aspect, body1, body2 } = this.extractTypedAspectValues(
      body1Capitalized,
      body2Capitalized,
      aspectCapitalized,
      beginning.categories,
    );
    const body1Symbol = symbolByBody[body1];
    const body2Symbol = symbolByBody[body2];
    const aspectSymbol = symbolBySpecialtyAspect[aspect];
    return {
      categories: [
        "Astronomy",
        "Astrology",
        "Simple Aspect",
        "Specialty Aspect",
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

  private phaseFields(
    phase: AspectPhase,
    body1Capitalized: string,
    body2Capitalized: string,
    specialtyAspect: SpecialtyAspect,
    baseCategories: string[],
  ): { categories: string[]; description: string; phaseEmoji: string } {
    if (phase === "perfective") {
      return {
        categories: [...baseCategories, "Perfective"],
        description: `${body1Capitalized} perfective ${specialtyAspect} ${body2Capitalized}`,
        phaseEmoji: "🎯",
      };
    }
    if (phase === "forming") {
      return {
        categories: [...baseCategories, "Forming"],
        description: `${body1Capitalized} forming ${specialtyAspect} ${body2Capitalized}`,
        phaseEmoji: "➡️",
      };
    }
    return {
      categories: [...baseCategories, "Dissolving"],
      description: `${body1Capitalized} dissolving ${specialtyAspect} ${body2Capitalized}`,
      phaseEmoji: "⬅️",
    };
  }

  private specialtyAspectGroupKey(event: Event): string {
    const planets = _.sortBy(
      event.categories.filter((category) =>
        specialtyAspectBodies.map((b) => _.startCase(b)).includes(category),
      ),
    );
    const aspect = event.categories.find((category) =>
      specialtyAspects.map((a) => _.startCase(a)).includes(category),
    );
    return planets.length === 2 && aspect
      ? `${planets[0]}-${aspect}-${planets[1]}`
      : "";
  }

  // 🌎 Public Methods

  /**
   * Creates a calendar event for a specific specialty aspect occurrence.
   *
   * Formats the event with appropriate emoji indicators, body symbols,
   * and categorization. Specialty aspects use distinct Unicode symbols
   * for each aspect type.
   *
   * @param args - Event parameters
   * @param longitudeBody1 - Ecliptic longitude of first body in degrees
   * @param longitudeBody2 - Ecliptic longitude of second body in degrees
   * @param timestamp - Exact moment of the aspect phase
   * @param body1 - First celestial body
   * @param body2 - Second celestial body
   * @param phase - Aspect phase: forming, exact, or dissolving
   * @returns Formatted calendar event with summary, description, and categories
   * @throws When no valid specialty aspect is detected between the bodies
   * @see {@link getSpecialtyAspect} for aspect type determination
   */
  buildSpecialtyAspectEvent(args: {
    body1: Body;
    body2: Body;
    longitudeBody1: number;
    longitudeBody2: number;
    phase: AspectPhase;
    timestamp: Moment;
  }): Event {
    const { body1, body2, longitudeBody1, longitudeBody2, phase, timestamp } =
      args;
    const specialtyAspect = this.getSpecialtyAspect({
      longitudeBody1,
      longitudeBody2,
    });
    if (!specialtyAspect) {
      this.logger.error(
        `No specialty aspect found between ${body1} and ${body2} at ${timestamp.toISOString()}: ${longitudeBody1} and ${longitudeBody2}`,
      );
      throw new Error("No specialty aspect found");
    }
    const b1Cap = capitalize(body1);
    const b2Cap = capitalize(body2);
    const baseCategories = [
      "Astronomy",
      "Astrology",
      "Simple Aspect",
      "Specialty Aspect",
      b1Cap,
      b2Cap,
      _.startCase(specialtyAspect),
    ];
    const { categories, description, phaseEmoji } = this.phaseFields(
      phase,
      b1Cap,
      b2Cap,
      specialtyAspect,
      baseCategories,
    );
    return this.buildSpecialtyAspectEventFromParts({
      body1Symbol: symbolByBody[body1],
      body2Symbol: symbolByBody[body2],
      categories,
      description,
      phaseEmoji,
      specialtyAspectSymbol: symbolBySpecialtyAspect[specialtyAspect],
      timestamp,
    });
  }

  /**
   * Detects specialty aspect events within a single minute time window.
   *
   * Scans all configured body pairs for specialty aspects (quintile 72°,
   * biquintile 144°, septile 51.43°, novile 40°) and determines
   * the phase (forming, exact, or dissolving) based on comparison with
   * adjacent minutes.
   *
   * @param args - Configuration object
   * @param coordinateEphemerisByBody - Pre-computed ephemeris data for all bodies
   * @param currentMinute - The minute to check for aspect events
   * @returns Array of calendar events for all detected specialty aspects at this minute
   */
  detect(args: {
    coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
    minute: Moment;
  }): Event[] {
    const { coordinateEphemerisByBody, minute } = args;
    const previousMinute = minute.clone().subtract(1, "minute");
    const nextMinute = minute.clone().add(1, "minute");
    const specialtyAspectEvents: Event[] = [];

    for (const body1 of specialtyAspectBodies) {
      const index = specialtyAspectBodies.indexOf(body1);
      for (const body2 of specialtyAspectBodies.slice(index + 1)) {
        if (body1 === body2) continue;
        const event = this.detectBodyPairEvent(
          body1,
          body2,
          coordinateEphemerisByBody,
          previousMinute,
          minute,
          nextMinute,
        );
        if (event) specialtyAspectEvents.push(event);
      }
    }

    return specialtyAspectEvents;
  }

  /**
   * Converts instantaneous specialty aspect events into progressive events.
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
    const specialtyAspectEvents = events.filter((event) =>
      event.categories.includes("Specialty Aspect"),
    );

    const groupedEvents = _.groupBy(specialtyAspectEvents, (event) =>
      this.specialtyAspectGroupKey(event),
    );

    const progressiveEvents: Event[] = [];

    for (const [key, groupEvents] of Object.entries(groupedEvents)) {
      if (!key) continue;

      const formingEvents = groupEvents.filter((event) =>
        event.categories.includes("Forming"),
      );
      const dissolvingEvents = groupEvents.filter((event) =>
        event.categories.includes("Dissolving"),
      );

      const pairs = this.progressiveUtilitiesService.pairProgressiveEvents(
        formingEvents,
        dissolvingEvents,
        `specialty aspect ${key}`,
      );

      progressiveEvents.push(
        ...pairs.map(([beginning, ending]) =>
          this.getSpecialtyAspectProgressiveEvent(beginning, ending),
        ),
      );
    }

    return progressiveEvents;
  }

  /**
   * Returns the first specialty aspect between two bodies, or `null` if none is within orb.
   *
   * @param args - `longitudeBody1` and `longitudeBody2` in ecliptic degrees
   */
  getSpecialtyAspect(args: {
    longitudeBody1: number;
    longitudeBody2: number;
  }): null | SpecialtyAspect {
    const { longitudeBody1, longitudeBody2 } = args;
    for (const aspect of specialtyAspects) {
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
   * Classifies the specialty aspect phase (forming / perfective / dissolving) between two bodies
   * across three consecutive minutes, or `null` if no specialty aspect is in progress.
   *
   * @param args - Longitudes at previous, current, and next minutes for both bodies
   */
  getSpecialtyAspectPhase(args: {
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
