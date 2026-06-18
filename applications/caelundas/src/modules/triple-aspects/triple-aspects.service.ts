import { Injectable } from "@nestjs/common";
import _ from "lodash";

import { TripleAspectsComposerService } from "./triple-aspects-composer.service";
import { TripleAspectsDetectorService } from "./triple-aspects-detector.service";

import type { AspectBodies } from "@caelundas/src/modules/aspects/aspects.service";
import type {
  Aspect,
  Body,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { Moment } from "moment-timezone";

/**
 * Orchestrates triple-aspect detection and progressive pairing across detector/composer services.
 */
@Injectable()
export class TripleAspectsService {
  // 🏗 Dependency Injection

  constructor(
    private readonly tripleAspectsComposerService: TripleAspectsComposerService,
    private readonly tripleAspectsDetectorService: TripleAspectsDetectorService,
  ) {}

  /**
   * Backward-compatible static utility retained for existing unit tests.
   */
  static findBodiesWithAspectTo(
    body: Body,
    aspectType: Aspect,
    edges: AspectBodies[],
  ): Body[] {
    return TripleAspectsComposerService.findBodiesWithAspectTo(
      body,
      aspectType,
      edges,
    );
  }

  /**
   * Backward-compatible static utility retained for existing unit tests.
   */
  static groupAspectsByType<T extends AspectBodies>(
    edges: T[],
  ): Map<Aspect, T[]> {
    return TripleAspectsDetectorService.groupAspectsByType(edges);
  }

  /**
   * Backward-compatible static utility retained for existing unit tests.
   */
  static haveAspect(args: {
    aspectType: Aspect;
    body1: Body;
    body2: Body;
    edges: AspectBodies[];
  }): boolean {
    return TripleAspectsComposerService.haveAspect(args);
  }

  /**
   * Detects all triple-aspect boundary events for the minute across supported patterns.
   */
  detect(args: {
    currentAspectBodies: AspectBodies[];
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): Event[] {
    const { currentAspectBodies, minute, previousAspectBodies } = args;

    return [
      ...this.tripleAspectsDetectorService.composeTSquares({
        currentAspectBodies,
        minute,
        previousAspectBodies,
      }),
      ...this.tripleAspectsDetectorService.composeYods({
        currentAspectBodies,
        minute,
        previousAspectBodies,
      }),
      ...this.tripleAspectsDetectorService.composeGrandTrines({
        currentAspectBodies,
        minute,
        previousAspectBodies,
      }),
    ];
  }

  /**
   * Builds duration events by pairing forming/dissolving events per triple-aspect group key.
   */
  detectProgressive(events: Event[]): Event[] {
    const tripleAspectEvents = events.filter((event) =>
      event.categories.includes("Triple Aspect"),
    );
    const groupedEvents = _.groupBy(tripleAspectEvents, (event) =>
      this.tripleAspectsComposerService.getProgressiveGroupKey(event),
    );

    const progressiveEvents: Event[] = [];
    for (const [key, groupEvents] of Object.entries(groupedEvents)) {
      if (!key) {
        continue;
      }
      progressiveEvents.push(
        ...this.tripleAspectsComposerService.pairProgressiveGroup(groupEvents),
      );
    }

    return progressiveEvents;
  }
}
