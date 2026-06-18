import {
  aspectBodies as specialtyAspectBodies,
  specialtyAspects,
} from "@caelundas/src/modules/caelundas/caelundas.constants";
import {
  symbolByBody,
  symbolBySpecialtyAspect,
} from "@caelundas/src/modules/caelundas/caelundas.symbol-constants";
import {
  isBody,
  isSpecialtyAspect,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import type {
  Body,
  SpecialtyAspect,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

/**
 * Builds progressive specialty-aspect duration events by pairing forming and dissolving boundaries.
 */
@Injectable()
export class SpecialtyAspectsProgressiveService {
  // 🏗 Dependency Injection

  constructor(
    private readonly progressiveUtilitiesService: ProgressiveUtilities,
  ) {}

  // 🔏 Private Methods

  /**
   * Extracts bodies and aspect labels from an event's categories.
   */
  private extractAspectBodiesFromCategories(categories: string[]): {
    aspectCapitalized: string;
    body1Capitalized: string;
    body2Capitalized: string;
  } {
    const bodiesCapitalized = _.sortBy(
      categories.filter((category) =>
        specialtyAspectBodies
          .map((specialtyAspectBody) => _.startCase(specialtyAspectBody))
          .includes(category),
      ),
    );
    const aspectCapitalized = categories.find((category) =>
      specialtyAspects
        .map((specialtyAspect) => _.startCase(specialtyAspect))
        .includes(category),
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

  /**
   * Casts extracted category strings to typed body/aspect values.
   */
  private extractTypedAspectValues(args: {
    aspectCapitalized: string;
    body1Capitalized: string;
    body2Capitalized: string;
    categories: string[];
  }): { aspect: SpecialtyAspect; body1: Body; body2: Body } {
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

  /**
   * Builds progressive specialty-aspect events from detected minute-level events.
   */
  detectProgressive(events: Event[]): Event[] {
    const specialtyAspectEvents = events.filter((event) =>
      event.categories.includes("Specialty Aspect"),
    );

    const groupedEvents = _.groupBy(specialtyAspectEvents, (event) =>
      this.specialtyAspectGroupKey(event),
    );

    const progressiveEvents: Event[] = [];
    for (const [aspectGroupKey, aspectGroupEvents] of Object.entries(
      groupedEvents,
    )) {
      progressiveEvents.push(
        ...this.processAspectGroup(aspectGroupKey, aspectGroupEvents),
      );
    }

    return progressiveEvents;
  }

  /**
   * Creates one specialty-aspect duration event from a forming/dissolving pair.
   */
  getSpecialtyAspectProgressiveEvent(beginning: Event, ending: Event): Event {
    const { aspectCapitalized, body1Capitalized, body2Capitalized } =
      this.extractAspectBodiesFromCategories(beginning.categories);
    const { aspect, body1, body2 } = this.extractTypedAspectValues({
      aspectCapitalized,
      body1Capitalized,
      body2Capitalized,
      categories: beginning.categories,
    });

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
      `specialty aspect ${aspectGroupKey}`,
    );

    return pairs.map(([beginning, ending]) =>
      this.getSpecialtyAspectProgressiveEvent(beginning, ending),
    );
  }

  /**
   * Builds a stable grouping key from sorted bodies plus specialty-aspect label.
   */
  specialtyAspectGroupKey(event: Event): string {
    const bodiesCapitalized = _.sortBy(
      event.categories.filter((category) =>
        specialtyAspectBodies
          .map((specialtyAspectBody) => _.startCase(specialtyAspectBody))
          .includes(category),
      ),
    );
    const aspectCapitalized = event.categories.find((category) =>
      specialtyAspects
        .map((specialtyAspect) => _.startCase(specialtyAspect))
        .includes(category),
    );

    if (bodiesCapitalized.length === 2 && aspectCapitalized) {
      return `${bodiesCapitalized[0]}-${aspectCapitalized}-${bodiesCapitalized[1]}`;
    }

    return "";
  }
}
