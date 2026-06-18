import { AspectsUtilities } from "@caelundas/src/modules/aspects/aspects.utilities";
import { specialtyAspects } from "@caelundas/src/modules/caelundas/caelundas.constants";
import {
  symbolByBody,
  symbolBySpecialtyAspect,
} from "@caelundas/src/modules/caelundas/caelundas.symbol-constants";
import { capitalize } from "@caelundas/src/modules/caelundas/caelundas.types";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import { LoggerService } from "../logger/logger.service";

import type {
  AspectPhase,
  Body,
  SpecialtyAspect,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { CoordinateEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

/**
 * Builds specialty-aspect events and extracts longitude windows for detection.
 */
@Injectable()
export class SpecialtyAspectsEventService {
  // 🏗 Dependency Injection

  constructor(
    private readonly logger: LoggerService,
    private readonly aspectsUtilitiesService: AspectsUtilities,
    private readonly ephemerisService: EphemerisService,
  ) {
    this.logger.setContext(SpecialtyAspectsEventService.name);
  }

  // 🔏 Private Methods

  /**
   * Resolves the event text and categories for a specialty aspect phase.
   */
  private resolvePhaseFields(args: {
    baseCategories: string[];
    body1Capitalized: string;
    body2Capitalized: string;
    phase: AspectPhase;
    specialtyAspect: SpecialtyAspect;
  }): { categories: string[]; description: string; phaseEmoji: string } {
    const {
      baseCategories,
      body1Capitalized,
      body2Capitalized,
      phase,
      specialtyAspect,
    } = args;

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

  // 🌎 Public Methods

  /**
   * Creates a calendar event for a specific specialty aspect occurrence.
   */
  assembleSpecialtyAspectEvent(args: {
    body1: Body;
    body2: Body;
    phase: AspectPhase;
    specialtyAspect: SpecialtyAspect;
    timestamp: Moment;
  }): Event {
    const { body1, body2, phase, specialtyAspect, timestamp } = args;
    const body1Capitalized = capitalize(body1);
    const body2Capitalized = capitalize(body2);
    const baseCategories = [
      "Astronomy",
      "Astrology",
      "Simple Aspect",
      "Specialty Aspect",
      body1Capitalized,
      body2Capitalized,
      _.startCase(specialtyAspect),
    ];
    const { categories, description, phaseEmoji } = this.resolvePhaseFields({
      baseCategories,
      body1Capitalized,
      body2Capitalized,
      phase,
      specialtyAspect,
    });
    const summary = `${phaseEmoji} ${symbolByBody[body1]} ${symbolBySpecialtyAspect[specialtyAspect]} ${symbolByBody[body2]} ${description}`;
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
  getBodyLongitudesWindow(args: {
    ephemeris: CoordinateEphemeris;
    minute: Moment;
    nextMinute: Moment;
    previousMinute: Moment;
  }): { current: number; next: number; previous: number } {
    const { ephemeris, minute, nextMinute, previousMinute } = args;
    return this.ephemerisService.getLongitudesWindow({
      ephemeris,
      minute,
      next: nextMinute,
      previous: previousMinute,
    });
  }

  /**
   * Returns the first specialty aspect between two bodies, or `null` if none is within orb.
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
}
