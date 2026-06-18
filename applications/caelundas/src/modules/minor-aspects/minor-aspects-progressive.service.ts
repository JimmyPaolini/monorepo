import {
  aspectBodies as minorAspectBodies,
  minorAspects,
} from "@caelundas/src/modules/caelundas/caelundas.constants";
import {
  symbolByBody,
  symbolByMinorAspect,
} from "@caelundas/src/modules/caelundas/caelundas.symbol-constants";
import {
  isBody,
  isMinorAspect,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import type { ExtractAspectComponentsResult } from "./minor-aspects.types";
import type {
  Body,
  MinorAspect,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

/**
 * Builds progressive minor-aspect duration events by pairing forming and dissolving boundaries.
 */
@Injectable()
export class MinorAspectsProgressiveService {
  // 🏗 Dependency Injection

  constructor(
    private readonly progressiveUtilitiesService: ProgressiveUtilities,
  ) {}

  // 🔏 Private Methods

  /**
   * Casts extracted category strings to typed body/aspect values.
   */
  private castAspectComponentsToTypes(args: {
    aspectCapitalized: string;
    body1Capitalized: string;
    body2Capitalized: string;
    categories: string[];
  }): { aspect: MinorAspect; body1: Body; body2: Body } {
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
      !isMinorAspect(aspectLower) ||
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
   * Extracts aspect components from event categories.
   */
  private extractAspectComponents(
    categories: string[],
  ): ExtractAspectComponentsResult {
    const bodiesCapitalized = _.sortBy(
      categories.filter((category) =>
        minorAspectBodies
          .map((minorAspectBody) => _.startCase(minorAspectBody))
          .includes(category),
      ),
    );
    const aspectCapitalized = categories.find((category) =>
      minorAspects
        .map((minorAspect) => _.startCase(minorAspect))
        .includes(category),
    );

    if (bodiesCapitalized.length !== 2 || !aspectCapitalized) {
      throw new Error(
        `Could not extract aspect info from categories: ${categories.join(", ")}`,
      );
    }

    const body1Capitalized = bodiesCapitalized[0] ?? "";
    const body2Capitalized = bodiesCapitalized[1] ?? "";
    const { aspect, body1, body2 } = this.castAspectComponentsToTypes({
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
   * Builds a stable grouping key from sorted bodies plus aspect name for pairing.
   */
  buildGroupKey(event: Event): string {
    const bodiesCapitalized = _.sortBy(
      event.categories.filter((category) =>
        minorAspectBodies
          .map((minorAspectBody) => _.startCase(minorAspectBody))
          .includes(category),
      ),
    );
    const aspectCapitalized = event.categories.find((category) =>
      minorAspects
        .map((minorAspect) => _.startCase(minorAspect))
        .includes(category),
    );

    if (bodiesCapitalized.length === 2 && aspectCapitalized) {
      return `${bodiesCapitalized[0]}-${aspectCapitalized}-${bodiesCapitalized[1]}`;
    }

    return "";
  }

  /**
   * Builds progressive minor-aspect events from detected minute-level events.
   */
  detectProgressive(events: Event[]): Event[] {
    const minorAspectEvents = events.filter((event) =>
      event.categories.includes("Minor Aspect"),
    );

    const groupedAspectEvents = _.groupBy(minorAspectEvents, (event) =>
      this.buildGroupKey(event),
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

  /**
   * Creates one minor-aspect duration event from a matched forming/dissolving pair.
   */
  getMinorAspectProgressiveEvent(beginning: Event, ending: Event): Event {
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

  /**
   * Pairs forming and dissolving events for one grouped body-pair/aspect key.
   */
  processAspectGroup(
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
      `minor aspect ${aspectGroupKey}`,
    );

    return pairs.map(([beginning, ending]) =>
      this.getMinorAspectProgressiveEvent(beginning, ending),
    );
  }
}
