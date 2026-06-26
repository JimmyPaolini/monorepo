import { symbolByBody } from "@caelundas/src/modules/caelundas/caelundas.symbol-constants";
import { capitalize } from "@caelundas/src/modules/caelundas/caelundas.types";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import type {
  AspectPhase,
  Body,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { Moment } from "moment-timezone";

/**
 * Shared helper service for simple-aspect event construction and aspect matching.
 */
@Injectable()
export class SimpleAspectsEventService {
  // 🏗 Dependency Injection

  constructor() {}

  // 🔏 Private Methods

  /**
   * Resolve category labels, description text, and emoji for an aspect phase.
   */
  private resolveAspectPhaseDetails(args: {
    aspectName: string;
    baseCategories: string[];
    body1Capitalized: string;
    body2Capitalized: string;
    phase: AspectPhase;
  }): { categories: string[]; description: string; phaseEmoji: string } {
    const {
      aspectName,
      baseCategories,
      body1Capitalized,
      body2Capitalized,
      phase,
    } = args;

    if (phase === "perfective") {
      return {
        categories: [...baseCategories, "Perfective"],
        description: `${body1Capitalized} perfective ${aspectName} ${body2Capitalized}`,
        phaseEmoji: "🎯",
      };
    }

    if (phase === "forming") {
      return {
        categories: [...baseCategories, "Forming"],
        description: `${body1Capitalized} forming ${aspectName} ${body2Capitalized}`,
        phaseEmoji: "➡️",
      };
    }

    return {
      categories: [...baseCategories, "Dissolving"],
      description: `${body1Capitalized} dissolving ${aspectName} ${body2Capitalized}`,
      phaseEmoji: "⬅️",
    };
  }

  // 🌎 Public Methods

  /**
   * Build a simple-aspect calendar event (major/minor/specialty) with consistent labels and summary.
   */
  assembleSimpleAspectEvent(args: {
    aspectCategory: "Major Aspect" | "Minor Aspect" | "Specialty Aspect";
    aspectName: string;
    aspectSymbol: string;
    body1: Body;
    body2: Body;
    log: (message: string) => void;
    phase: AspectPhase;
    timestamp: Moment;
  }): Event {
    const {
      aspectCategory,
      aspectName,
      aspectSymbol,
      body1,
      body2,
      log,
      phase,
      timestamp,
    } = args;

    const body1Capitalized = capitalize(body1);
    const body2Capitalized = capitalize(body2);
    const baseCategories = [
      "Astronomy",
      "Astrology",
      "Simple Aspect",
      aspectCategory,
      body1Capitalized,
      body2Capitalized,
      _.startCase(aspectName),
    ];
    const { categories, description, phaseEmoji } =
      this.resolveAspectPhaseDetails({
        aspectName,
        baseCategories,
        body1Capitalized,
        body2Capitalized,
        phase,
      });
    const summary = `${phaseEmoji} ${symbolByBody[body1]} ${aspectSymbol} ${symbolByBody[body2]} ${description}`;
    log(`${summary} at ${timestamp.toISOString()}`);

    return {
      categories,
      description,
      end: timestamp,
      start: timestamp,
      summary,
    };
  }

  /**
   * Return the first aspect whose angular condition matches the two longitudes.
   */
  findFirstMatchingAspect<TAspect extends string>(args: {
    aspects: readonly TAspect[];
    isMatchingAspect: (aspect: TAspect) => boolean;
  }): null | TAspect {
    const { aspects, isMatchingAspect } = args;

    for (const aspect of aspects) {
      if (isMatchingAspect(aspect)) {
        return aspect;
      }
    }

    return null;
  }
}
