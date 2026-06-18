import { AspectsUtilities } from "@caelundas/src/modules/aspects/aspects.utilities";
import { minorAspects } from "@caelundas/src/modules/caelundas/caelundas.constants";
import {
  symbolByBody,
  symbolByMinorAspect,
} from "@caelundas/src/modules/caelundas/caelundas.symbol-constants";
import { capitalize } from "@caelundas/src/modules/caelundas/caelundas.types";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
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
 * Builds minor-aspect events and extracts longitude windows for detection.
 */
@Injectable()
export class MinorAspectsEventService {
  // 🏗 Dependency Injection

  constructor(
    private readonly logger: LoggerService,
    private readonly aspectsUtilitiesService: AspectsUtilities,
    private readonly ephemerisService: EphemerisService,
  ) {
    this.logger.setContext(MinorAspectsEventService.name);
  }

  // 🔏 Private Methods

  /**
   * Resolves the event text and categories for a minor aspect phase.
   */
  private resolvePhaseDetails(args: {
    baseCategories: string[];
    body1Capitalized: string;
    body2Capitalized: string;
    minorAspect: MinorAspect;
    phase: AspectPhase;
  }): { categories: string[]; description: string; phaseEmoji: string } {
    const {
      baseCategories,
      body1Capitalized,
      body2Capitalized,
      minorAspect,
      phase,
    } = args;

    if (phase === "perfective") {
      return {
        categories: [...baseCategories, "Perfective"],
        description: `${body1Capitalized} perfective ${minorAspect} ${body2Capitalized}`,
        phaseEmoji: "🎯",
      };
    }

    if (phase === "forming") {
      return {
        categories: [...baseCategories, "Forming"],
        description: `${body1Capitalized} forming ${minorAspect} ${body2Capitalized}`,
        phaseEmoji: "➡️",
      };
    }

    return {
      categories: [...baseCategories, "Dissolving"],
      description: `${body1Capitalized} dissolving ${minorAspect} ${body2Capitalized}`,
      phaseEmoji: "⬅️",
    };
  }

  // 🌎 Public Methods

  /**
   * Creates a calendar event for a specific minor aspect occurrence.
   */
  assembleMinorAspectEvent(args: {
    body1: Body;
    body2: Body;
    minorAspect: MinorAspect;
    phase: AspectPhase;
    timestamp: Moment;
  }): Event {
    const { body1, body2, minorAspect, phase, timestamp } = args;
    const body1Capitalized = capitalize(body1);
    const body2Capitalized = capitalize(body2);
    const baseCategories = [
      "Astronomy",
      "Astrology",
      "Simple Aspect",
      "Minor Aspect",
      body1Capitalized,
      body2Capitalized,
      _.startCase(minorAspect),
    ];
    const { categories, description, phaseEmoji } = this.resolvePhaseDetails({
      baseCategories,
      body1Capitalized,
      body2Capitalized,
      minorAspect,
      phase,
    });
    const summary = `${phaseEmoji} ${symbolByBody[body1]} ${symbolByMinorAspect[minorAspect]} ${symbolByBody[body2]} ${description}`;
    this.logger.log(`${summary} at ${timestamp.toISOString()}`);

    return {
      categories,
      description,
      end: timestamp,
      start: timestamp,
      summary,
    };
  }

  /**
   * Returns previous/current/next longitudes for one body at minute resolution.
   */
  getLongitudesWindowForBody(args: {
    body: Body;
    coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
    minute: Moment;
    nextMinute: Moment;
    previousMinute: Moment;
  }): { current: number; next: number; previous: number } {
    const {
      body,
      coordinateEphemerisByBody,
      minute,
      nextMinute,
      previousMinute,
    } = args;
    return this.ephemerisService.getLongitudesWindow({
      ephemeris: coordinateEphemerisByBody[body],
      minute,
      next: nextMinute,
      previous: previousMinute,
    });
  }

  /**
   * Returns the first minor aspect between two bodies, or `null` if none is within orb.
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
}
