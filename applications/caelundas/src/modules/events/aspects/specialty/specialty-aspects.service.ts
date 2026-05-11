import {
  specialtyAspects,
  symbolByBody,
  symbolBySpecialtyAspect,
} from "@caelundas/src/caelundas.constants";
import { specialtyAspectBodies } from "@caelundas/src/caelundas.types";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { AspectsUtilitiesService } from "@caelundas/src/modules/events/aspects/aspects.utilities";
import { ProgressiveService } from "@caelundas/src/modules/progressive/progressive.service";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import type {
  AspectPhase,
  Body,
  BodySymbol,
  SpecialtyAspect,
  SpecialtyAspectSymbol,
} from "@caelundas/src/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { CoordinateEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

/**
 * Detects and formats specialty (harmonic) aspect events between celestial bodies.
 *
 * Covers quintile (72°), biquintile (144°), septile (~51.4°), and novile (40°).
 * These aspects represent subtler energetic relationships and use narrower orbs.
 * Includes progressive event pairing for duration-aware tracking.
 *
 * @see {@link AspectsUtilitiesService} for orb and angle configuration
 */
@Injectable()
export class SpecialtyAspectsService {
  private readonly detectAspectPhase: ReturnType<
    AspectsUtilitiesService["getIsAspect"]
  >;

  constructor(
    private readonly aspectsUtilitiesService: AspectsUtilitiesService,
    private readonly ephemerisService: EphemerisService,
  ) {
    this.detectAspectPhase = aspectsUtilitiesService.getIsAspect([
      ...specialtyAspects,
    ]);
  }

  /**
   * Returns the first specialty aspect between two bodies, or `null` if none is within orb.
   *
   * @param args - `longitudeBody1` and `longitudeBody2` in ecliptic degrees
   */
  getSpecialtyAspect(args: {
    longitudeBody1: number;
    longitudeBody2: number;
  }): SpecialtyAspect | null {
    const { longitudeBody1, longitudeBody2 } = args;
    for (const aspect of specialtyAspects) {
      if (
        this.aspectsUtilitiesService.isAspect({
          longitudeBody1,
          longitudeBody2,
          aspect,
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
        if (body1 === body2) {
          continue;
        }

        const ephemerisBody1 = coordinateEphemerisByBody[body1];
        const ephemerisBody2 = coordinateEphemerisByBody[body2];

        const {
          previous: previousLongitudeBody1,
          current: currentLongitudeBody1,
          next: nextLongitudeBody1,
        } = this.ephemerisService.getLongitudesWindow(
          ephemerisBody1,
          previousMinute,
          minute,
          nextMinute,
        );
        const {
          previous: previousLongitudeBody2,
          current: currentLongitudeBody2,
          next: nextLongitudeBody2,
        } = this.ephemerisService.getLongitudesWindow(
          ephemerisBody2,
          previousMinute,
          minute,
          nextMinute,
        );

        const phase = this.detectAspectPhase({
          currentLongitudeBody1,
          currentLongitudeBody2,
          previousLongitudeBody1,
          previousLongitudeBody2,
          nextLongitudeBody1,
          nextLongitudeBody2,
        });

        if (phase) {
          specialtyAspectEvents.push(
            this.buildSpecialtyAspectEvent({
              timestamp: minute,
              longitudeBody1: currentLongitudeBody1,
              longitudeBody2: currentLongitudeBody2,
              body1,
              body2,
              phase,
            }),
          );
        }
      }
    }

    return specialtyAspectEvents;
  }

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
    longitudeBody1: number;
    longitudeBody2: number;
    timestamp: Moment;
    body1: Body;
    body2: Body;
    phase: AspectPhase;
  }): Event {
    const { longitudeBody1, longitudeBody2, timestamp, body1, body2, phase } =
      args;
    const specialtyAspect = this.getSpecialtyAspect({
      longitudeBody1,
      longitudeBody2,
    });
    if (!specialtyAspect) {
      console.error(
        `No specialty aspect found between ${body1} and ${body2} at ${timestamp.toISOString()}: ${longitudeBody1} and ${longitudeBody2}`,
      );
      throw new Error("No specialty aspect found");
    }

    const body1Capitalized = _.startCase(body1) as Capitalize<Body>;
    const body2Capitalized = _.startCase(body2) as Capitalize<Body>;

    const body1Symbol = symbolByBody[body1] as BodySymbol;
    const body2Symbol = symbolByBody[body2] as BodySymbol;
    const specialtyAspectSymbol: SpecialtyAspectSymbol =
      symbolBySpecialtyAspect[specialtyAspect];

    let description: string;
    let phaseEmoji: string;
    let categories: string[];

    const baseCategories = [
      "Astronomy",
      "Astrology",
      "Simple Aspect",
      "Specialty Aspect",
      body1Capitalized,
      body2Capitalized,
      _.startCase(specialtyAspect),
    ];

    if (phase === "perfective") {
      description = `${body1Capitalized} perfective ${specialtyAspect} ${body2Capitalized}`;
      phaseEmoji = "🎯";
      categories = [...baseCategories, "Perfective"];
    } else if (phase === "forming") {
      description = `${body1Capitalized} forming ${specialtyAspect} ${body2Capitalized}`;
      phaseEmoji = "➡️";
      categories = [...baseCategories, "Forming"];
    } else {
      description = `${body1Capitalized} dissolving ${specialtyAspect} ${body2Capitalized}`;
      phaseEmoji = "⬅️";
      categories = [...baseCategories, "Dissolving"];
    }

    const summary = `${phaseEmoji} ${body1Symbol} ${specialtyAspectSymbol} ${body2Symbol} ${description}`;

    console.log(`${summary} at ${timestamp.toISOString()}`);

    const specialtyAspectEvent: Event = {
      start: timestamp,
      end: timestamp,
      description,
      summary,
      categories,
    };
    return specialtyAspectEvent;
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
   * @see {@link ProgressiveService.pairProgressiveEvents} for forming/dissolving pairing logic
   */
  detectProgressive(events: Event[]): Event[] {
    const progressiveEvents: Event[] = [];

    // Filter to specialty aspect events only
    const specialtyAspectEvents = events.filter((event) =>
      event.categories.includes("Specialty Aspect"),
    );

    // Group by body pair and aspect type using categories
    const groupedEvents = _.groupBy(specialtyAspectEvents, (event) => {
      const planets = _.sortBy(
        event.categories.filter((category) =>
          specialtyAspectBodies
            .map((specialtyAspectBody) => _.startCase(specialtyAspectBody))
            .includes(category),
        ),
      );

      const aspect = event.categories.find((category) =>
        specialtyAspects
          .map((specialtyAspect) => _.startCase(specialtyAspect))
          .includes(category),
      );

      if (planets.length === 2 && aspect) {
        return `${planets[0]}-${aspect}-${planets[1]}`;
      }
      return "";
    });

    // Process each group
    for (const [key, groupEvents] of Object.entries(groupedEvents)) {
      if (!key) {
        continue;
      }

      const formingEvents = groupEvents.filter((event) =>
        event.categories.includes("Forming"),
      );
      const dissolvingEvents = groupEvents.filter((event) =>
        event.categories.includes("Dissolving"),
      );

      const pairs = ProgressiveService.pairProgressiveEvents(
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

  private getSpecialtyAspectProgressiveEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    const bodiesCapitalized = _.sortBy(
      beginning.categories.filter((category) =>
        specialtyAspectBodies
          .map((specialtyAspectBody) => _.startCase(specialtyAspectBody))
          .includes(category),
      ),
    );

    const aspectCapitalized = beginning.categories.find((category) =>
      specialtyAspects
        .map((specialtyAspect) => _.startCase(specialtyAspect))
        .includes(category),
    );

    if (bodiesCapitalized.length !== 2 || !aspectCapitalized) {
      throw new Error(
        `Could not extract aspect info from categories: ${beginning.categories.join(
          ", ",
        )}`,
      );
    }

    const body1Capitalized = bodiesCapitalized[0] ?? "";
    const body2Capitalized = bodiesCapitalized[1] ?? "";
    const aspect = aspectCapitalized.toLowerCase() as SpecialtyAspect;

    const body1 = body1Capitalized.toLowerCase() as Body;
    const body2 = body2Capitalized.toLowerCase() as Body;

    const body1Symbol = symbolByBody[body1] as BodySymbol;
    const body2Symbol = symbolByBody[body2] as BodySymbol;
    const aspectSymbol = symbolBySpecialtyAspect[
      aspect
    ] as SpecialtyAspectSymbol;

    return {
      start: beginning.start,
      end: ending.start,
      summary: `${body1Symbol}${aspectSymbol}${body2Symbol} ${body1Capitalized} ${aspect} ${body2Capitalized}`,
      description: `${body1Capitalized} ${aspect} ${body2Capitalized}`,
      categories: [
        "Astronomy",
        "Astrology",
        "Simple Aspect",
        "Specialty Aspect",
        body1Capitalized,
        body2Capitalized,
        aspectCapitalized,
      ],
    };
  }
}
