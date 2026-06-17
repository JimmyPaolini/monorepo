import { Injectable } from "@nestjs/common";
import _ from "lodash";

import { QuadrupleAspectsComposerService } from "./quadruple-aspects-composer.service.js";

import type { AspectBodies } from "@caelundas/src/modules/aspects/aspects.service";
import type { Body } from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { Moment } from "moment-timezone";

/**
 * Detects and pairs 4-body patterns (Grand Cross, Kite) from simple-aspect snapshots.
 */
@Injectable()
export class QuadrupleAspectsService {
  // 🏗 Dependency Injection

  constructor(
    private readonly quadrupleAspectsComposerService: QuadrupleAspectsComposerService,
  ) {}

  // 🌎 Public Methods

  /**
   * Detects all quadruple aspect patterns from stored 2-body aspect events.
   *
   * Analyzes combinations of simple aspects to identify 4-body patterns:
   * - Grand Cross (2 oppositions + 4 squares)
   * - Kite (Grand Trine + opposition + 2 sextiles)
   *
   * These rare configurations represent major life themes and turning points,
   * indicating either intense challenge (Grand Cross) or channeled talent (Kite).
   *
   * @param aspectEvents - Previously detected simple aspect events
   * @param minute - The minute to check for quadruple aspect patterns
   * @returns Array of all detected quadruple aspect events at this minute
   * @see {@link parseAspectEvents} for extracting aspect relationships
   * @see {@link composeGrandCrosses} for Grand Cross detection
   * @see {@link composeKites} for Kite detection
   */
  detect(args: {
    currentAspectBodies: AspectBodies[];
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): Event[] {
    const { currentAspectBodies, minute, previousAspectBodies } = args;
    return [
      ...this.quadrupleAspectsComposerService.composeGrandCrosses({
        currentAspectBodies,
        minute,
        previousAspectBodies,
      }),
      ...this.quadrupleAspectsComposerService.composeKites({
        currentAspectBodies,
        minute,
        previousAspectBodies,
      }),
    ];
  }

  /**
   * Converts instantaneous quadruple aspect events into progressive events.
   *
   * Pairs forming and dissolving events for the same body quartet and
   * pattern type to create events spanning the entire active period.
   * Progressive events show when a pattern is in effect rather than just
   * boundary moments.
   *
   * @param events - All events to process (non-quadruple-aspect events are filtered out)
   * @returns Array of progressive events spanning from forming to dissolving
   */
  detectProgressive(events: Event[]): Event[] {
    const progressiveEvents: Event[] = [];

    const quadrupleAspectEvents = events.filter((event) =>
      event.categories.includes("Quadruple Aspect"),
    );

    const groupedEvents = _.groupBy(quadrupleAspectEvents, (event) =>
      this.quadrupleAspectsComposerService.makeProgressiveGroupKey(event),
    );

    for (const group of Object.values(groupedEvents)) {
      this.quadrupleAspectsComposerService.collectProgressiveEventsFromGroup(
        group,
        progressiveEvents,
      );
    }

    return progressiveEvents;
  }

  /**
   * Returns the other body in an aspect edge relative to the given body.
   *
   * @param edge - An active 2-body aspect relationship
   * @param body - The reference body
   * @returns The other body, or `null` if the given body is not in the edge
   */
  getOtherBody(edge: AspectBodies, body: Body): Body | null {
    if (edge.bodies[0] === body) {
      return edge.bodies[1];
    }
    if (edge.bodies[1] === body) {
      return edge.bodies[0];
    }
    return null;
  }

  /**
   * Returns `true` if the given aspect edge involves the specified celestial body.
   *
   * @param edge - An active 2-body aspect relationship
   * @param body - The body to check for involvement
   */
  involvesBody(edge: AspectBodies, body: Body): boolean {
    return edge.bodies[0] === body || edge.bodies[1] === body;
  }
}
