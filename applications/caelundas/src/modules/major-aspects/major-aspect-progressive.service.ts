import {
  aspectBodies as majorAspectBodies,
  majorAspects,
} from "@caelundas/src/modules/caelundas/caelundas.constants";
import {
  symbolByBody,
  symbolByMajorAspect,
} from "@caelundas/src/modules/caelundas/caelundas.symbol-constants";
import {
  isBody,
  isMajorAspect,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import type { ExtractAspectPartsFromCategoriesResult } from "./major-aspects.types";
import type {
  Body,
  MajorAspect,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

/**
 * Builds progressive major-aspect duration events by pairing forming and dissolving boundaries.
 */
@Injectable()
export class MajorAspectProgressiveService {
  // 🏗 Dependency Injection

  constructor(
    private readonly progressiveUtilitiesService: ProgressiveUtilities,
  ) {}

  // 🔏 Private Methods

  /**
   * Casts extracted category strings to typed body/aspect values.
   */
  private castAspectPartsToTypes(args: {
    aspectCapitalized: string;
    body1Capitalized: string;
    body2Capitalized: string;
    categories: string[];
  }): { aspect: MajorAspect; body1: Body; body2: Body } {
    const {
      aspectCapitalized,
      body1Capitalized,
      body2Capitalized,
      categories,
    } = args;

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

  /**
   * Extracts typed body/aspect parts from event categories.
   */
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
    const { aspect, body1, body2 } = this.castAspectPartsToTypes({
      aspectCapitalized,
      body1Capitalized,
      body2Capitalized,
      categories,
    });

    return {
      aspect,
      aspectCapitalized,
      body1,
      body1Capitalized,
      body2,
      body2Capitalized,
    };
  }

  /**
   * Derives a stable group key from body pair and aspect category values.
   */
  private getAspectGroupKey(event: Event): string {
    const bodiesCapitalized = _.sortBy(
      event.categories.filter((category) =>
        majorAspectBodies
          .map((majorAspectBody) => _.startCase(majorAspectBody))
          .includes(category),
      ),
    );

    const aspectCapitalized = event.categories.find((category) =>
      majorAspects
        .map((majorAspect) => _.startCase(majorAspect))
        .includes(category),
    );

    if (bodiesCapitalized.length === 2 && aspectCapitalized) {
      return `${bodiesCapitalized[0]}-${aspectCapitalized}-${bodiesCapitalized[1]}`;
    }

    return "";
  }

  /**
   * Builds one progressive duration event from a forming/dissolving pair.
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

  /**
   * Pairs forming and dissolving events for one grouped body-pair/aspect key.
   */
  private processAspectGroup(
    aspectGroupKey: string,
    aspectGroupEvents: Event[],
  ): Event[] {
    if (!aspectGroupKey) {
      return [];
    }

    const formingEvents = aspectGroupEvents.filter((event) =>
      event.categories.includes("Forming"),
    );
    const dissolvingEvents = aspectGroupEvents.filter((event) =>
      event.categories.includes("Dissolving"),
    );

    const pairs = this.progressiveUtilitiesService.pairProgressiveEvents(
      formingEvents,
      dissolvingEvents,
      `major aspect ${aspectGroupKey}`,
    );

    return pairs.map(([beginning, ending]) =>
      this.getMajorAspectProgressiveEvent(beginning, ending),
    );
  }

  // 🌎 Public Methods

  /**
   * Builds progressive major-aspect events from detected minute-level events.
   */
  detectProgressive(events: Event[]): Event[] {
    const majorAspectEvents = events.filter((event) =>
      event.categories.includes("Major Aspect"),
    );

    const groupedAspectEvents = _.groupBy(majorAspectEvents, (event) =>
      this.getAspectGroupKey(event),
    );

    const progressiveEvents: Event[] = [];
    for (const [aspectGroupKey, aspectGroupEvents] of Object.entries(
      groupedAspectEvents,
    )) {
      progressiveEvents.push(
        ...this.processAspectGroup(aspectGroupKey, aspectGroupEvents),
      );
    }

    return progressiveEvents;
  }
}
