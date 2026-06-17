import { bodies } from "@caelundas/src/modules/caelundas/caelundas.constants";
import { isAspect } from "@caelundas/src/modules/caelundas/caelundas.types";
import { Inject, Injectable } from "@nestjs/common";

import {
  COMPOSITE_ASPECT_DETECTORS_TOKEN,
  PROGRESSIVE_ASPECT_DETECTORS_TOKEN,
  SIMPLE_ASPECT_DETECTORS_TOKEN,
} from "./aspects.constants";

import type {
  AspectBodies,
  CompositeAspectDetector,
  ProgressiveAspectDetector,
  SimpleAspectDetector,
} from "./aspects.types";
import type {
  Aspect,
  Body,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { CoordinateEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

export type { AspectBodies } from "./aspects.types";

/**
 * Orchestrates aspect detection across all aspect-type services.
 *
 * Delegates 2-body detection (major, minor, specialty) and composes results into
 * multi-body patterns (T-squares, grand trines, yods, stelliums) via the
 * respective sub-services. Also coordinates progressive event pairing.
 */
@Injectable()
export class AspectsService {
  // 🏗 Dependency Injection

  constructor(
    @Inject(SIMPLE_ASPECT_DETECTORS_TOKEN)
    private readonly simpleAspectDetectors: SimpleAspectDetector[],
    @Inject(COMPOSITE_ASPECT_DETECTORS_TOKEN)
    private readonly compositeAspectDetectors: CompositeAspectDetector[],
    @Inject(PROGRESSIVE_ASPECT_DETECTORS_TOKEN)
    private readonly progressiveAspectDetectors: ProgressiveAspectDetector[],
  ) {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  private applyEventToMap(
    map: Map<string, AspectBodies>,
    event: Event,
    lowercaseBodies: string[],
  ): void {
    const parsed = this.parseSimpleAspectEvent(event, lowercaseBodies);
    if (!parsed) return;
    const { aspect, body1, body2, isDissolving } = parsed;
    const key = this.makeKey(body1, body2, aspect);
    if (isDissolving) {
      map.delete(key);
    } else if (!map.has(key)) {
      map.set(key, { aspect, bodies: [body1, body2] });
    }
  }

  private detectCompositeAspects(
    currentAspectBodies: AspectBodies[],
    minute: Moment,
    previousAspectBodies: AspectBodies[],
  ): Event[] {
    const sharedArguments = {
      currentAspectBodies,
      minute,
      previousAspectBodies,
    };
    const detectedEvents: Event[] = [];
    for (const compositeAspectDetector of this.compositeAspectDetectors) {
      detectedEvents.push(...compositeAspectDetector.detect(sharedArguments));
    }
    return detectedEvents;
  }

  private detectSimpleAspects(
    coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>,
    minute: Moment,
  ): Event[] {
    const detectedEvents: Event[] = [];
    for (const simpleAspectDetector of this.simpleAspectDetectors) {
      detectedEvents.push(
        ...simpleAspectDetector.detect({ coordinateEphemerisByBody, minute }),
      );
    }
    return detectedEvents;
  }

  private extractEventBodies(
    normalizedCategories: string[],
    lowercaseBodies: string[],
  ): Body[] {
    const eventBodies: Body[] = [];
    for (const category of normalizedCategories) {
      const bodyIndex = lowercaseBodies.indexOf(category);
      if (bodyIndex !== -1) {
        const body = bodies[bodyIndex];
        if (body) {
          eventBodies.push(body);
        }
      }
    }
    return eventBodies;
  }

  private makeKey(body1: Body, body2: Body, aspect: Aspect): string {
    const [sortedBody1, sortedBody2] = [body1, body2].toSorted();
    return `${sortedBody1}\u001F${sortedBody2}\u001F${aspect}`;
  }

  private parseSimpleAspectEvent(
    event: Event,
    lowercaseBodies: string[],
  ): null | {
    aspect: Aspect;
    body1: Body;
    body2: Body;
    isDissolving: boolean;
  } {
    const cats = event.categories.map((c) => c.toLowerCase().trim());
    if (!cats.includes("simple aspect")) return null;
    const isForming = cats.includes("forming");
    const isDissolving = cats.includes("dissolving");
    if (!isForming && !isDissolving) return null;
    const eventBodies = this.extractEventBodies(cats, lowercaseBodies);
    if (eventBodies.length !== 2) return null;
    const aspect = cats.find((c): c is Aspect => isAspect(c));
    const body1 = eventBodies[0];
    const body2 = eventBodies[1];
    if (!aspect || !body1 || !body2) return null;
    return { aspect, body1, body2, isDissolving };
  }

  // 🌎 Public Methods

  /**
   * Incrementally updates the active 2-body aspect registry from the current minute's events.
   *
   * Starting from `previousAspectBodies`, adds any new forming aspects and removes any
   * aspects that have dissolved, based on the "Simple Aspect" events in `events`.
   *
   * @param previousAspectBodies - Active aspects from the previous minute
   * @param events - Instantaneous events detected at the current minute
   * @returns Updated list of currently active 2-body aspects
   */
  computeAspectBodies(
    previousAspectBodies: AspectBodies[],
    events: Event[],
  ): AspectBodies[] {
    const map = new Map<string, AspectBodies>(
      previousAspectBodies.map((ab) => [
        this.makeKey(ab.bodies[0], ab.bodies[1], ab.aspect),
        ab,
      ]),
    );
    const lowercaseBodies = bodies.map((body) => body.toLowerCase());
    for (const event of events) {
      this.applyEventToMap(map, event, lowercaseBodies);
    }
    return [...map.values()];
  }

  /**
   * Detects all aspect events at a single minute, including 2-body and multi-body patterns.
   *
   * Runs simple-aspect detection first (major, minor, specialty), then computes the
   * updated active-aspect registry and uses it to detect composite configurations
   * (triple, quadruple, quintuple, sextuple, stellium).
   *
   * @param args - Ephemeris data, target minute, and the currently active aspect bodies
   * @returns Detected calendar events and the updated active-aspect registry
   */
  detect(args: {
    coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): { aspectBodies: AspectBodies[]; events: Event[] } {
    const { coordinateEphemerisByBody, minute, previousAspectBodies } = args;
    const simpleAspectEvents = this.detectSimpleAspects(
      coordinateEphemerisByBody,
      minute,
    );
    const currentAspectBodies = this.computeAspectBodies(
      previousAspectBodies,
      simpleAspectEvents,
    );
    const compositeEvents = this.detectCompositeAspects(
      currentAspectBodies,
      minute,
      previousAspectBodies,
    );
    const events: Event[] = [...simpleAspectEvents, ...compositeEvents];
    return { aspectBodies: currentAspectBodies, events };
  }

  /**
   * Pairs forming and dissolving events into progressive (duration) events for all aspect types.
   *
   * Delegates to each sub-service so that every aspect category produces progressive
   * events spanning its full in-orb period.
   *
   * @param events - Instantaneous events accumulated over a complete date range
   * @returns Progressive events, one per aspect occurrence, covering its forming-to-dissolving span
   */
  detectProgressive(events: Event[]): Event[] {
    const progressiveEvents: Event[] = [];
    for (const progressiveAspectDetector of this.progressiveAspectDetectors) {
      progressiveEvents.push(
        ...progressiveAspectDetector.detectProgressive(events),
      );
    }
    return progressiveEvents;
  }
}
