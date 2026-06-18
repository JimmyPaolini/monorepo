import { AspectsUtilities } from "@caelundas/src/modules/aspects/aspects.utilities";
import {
  aspectBodies as minorAspectBodies,
  minorAspects,
} from "@caelundas/src/modules/caelundas/caelundas.constants";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import { LoggerService } from "../logger/logger.service";

import { MinorAspectsComposerService } from "./minor-aspects-composer.service";

import type { DetectBodyPairAspectArguments } from "./minor-aspects.types";
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
    private readonly minorAspectsComposerService: MinorAspectsComposerService,
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

  /** Detects a minor-aspect event for one body pair at a specific minute window. */
  private detectBodyPairAspect(
    args: DetectBodyPairAspectArguments,
  ): Event | null {
    const {
      body1,
      body2,
      coordinateEphemerisByBody,
      minute,
      nextMinute,
      previousMinute,
    } = args;
    const body1LongitudesWindow =
      this.minorAspectsComposerService.getLongitudesWindowForBody({
        body: body1,
        coordinateEphemerisByBody,
        minute,
        nextMinute,
        previousMinute,
      });
    const body2LongitudesWindow =
      this.minorAspectsComposerService.getLongitudesWindowForBody({
        body: body2,
        coordinateEphemerisByBody,
        minute,
        nextMinute,
        previousMinute,
      });
    const phase = this.detectPhaseFromWindows(
      body1LongitudesWindow,
      body2LongitudesWindow,
    );
    if (!phase) {
      return null;
    }
    return this.buildMinorAspectEvent({
      body1,
      body2,
      longitudeBody1: body1LongitudesWindow.current,
      longitudeBody2: body2LongitudesWindow.current,
      phase,
      timestamp: minute,
    });
  }

  /** Derives minor-aspect phase by comparing three-minute longitude windows for both bodies. */
  private detectPhaseFromWindows(
    body1LongitudesWindow: { current: number; next: number; previous: number },
    body2LongitudesWindow: { current: number; next: number; previous: number },
  ): AspectPhase | null {
    return this.detectAspectPhase({
      currentLongitudeBody1: body1LongitudesWindow.current,
      currentLongitudeBody2: body2LongitudesWindow.current,
      nextLongitudeBody1: body1LongitudesWindow.next,
      nextLongitudeBody2: body2LongitudesWindow.next,
      previousLongitudeBody1: body1LongitudesWindow.previous,
      previousLongitudeBody2: body2LongitudesWindow.previous,
    });
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
    return this.minorAspectsComposerService.assembleMinorAspectEvent({
      body1,
      body2,
      minorAspect,
      phase,
      timestamp,
    });
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
        const event = this.detectBodyPairAspect({
          body1,
          body2,
          coordinateEphemerisByBody,
          minute,
          nextMinute,
          previousMinute,
        });
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
    const groupedAspectEvents = _.groupBy(minorAspectEvents, (event) =>
      this.minorAspectsComposerService.buildGroupKey(event),
    );
    const progressiveEvents: Event[] = [];

    for (const [aspectGroupKey, aspectGroupEvents] of Object.entries(
      groupedAspectEvents,
    )) {
      progressiveEvents.push(
        ...this.minorAspectsComposerService.processAspectGroup(
          aspectGroupKey,
          aspectGroupEvents,
        ),
      );
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
