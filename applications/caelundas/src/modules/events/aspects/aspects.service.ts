import { aspects, bodies } from "@caelundas/src/caelundas.constants";
import { Injectable } from "@nestjs/common";

import type { MajorAspectsService } from "./major/major-aspects.service";
import type { MinorAspectsService } from "./minor/minor-aspects.service";
import type { QuadrupleAspectsService } from "./quadruple/quadruple-aspects.service";
import type { QuintupleAspectsService } from "./quintuple/quintuple-aspects.service";
import type { SextupleAspectsService } from "./sextuple/sextuple-aspects.service";
import type { SpecialtyAspectsService } from "./specialty/specialty-aspects.service";
import type { StelliumService } from "./stellium/stellium.service";
import type { TripleAspectsService } from "./triple/triple-aspects.service";
import type { Aspect, Body } from "@caelundas/src/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { CoordinateEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

/**
 * Represents an active aspect between two celestial bodies at a specific moment.
 */
export interface AspectBodies {
  aspect: Aspect;
  bodies: [Body, Body];
}

/**
 * Orchestrates aspect detection across all aspect-type services.
 *
 * Delegates 2-body detection (major, minor, specialty) and composes results into
 * multi-body patterns (T-squares, grand trines, yods, stelliums) via the
 * respective sub-services. Also coordinates progressive event pairing.
 */
@Injectable()
export class AspectsService {
  constructor(
    private readonly majorAspectsService: MajorAspectsService,
    private readonly minorAspectsService: MinorAspectsService,
    private readonly quadrupleAspectsService: QuadrupleAspectsService,
    private readonly quintupleAspectsService: QuintupleAspectsService,
    private readonly sextupleAspectsService: SextupleAspectsService,
    private readonly specialtyAspectsService: SpecialtyAspectsService,
    private readonly stelliumService: StelliumService,
    private readonly tripleAspectsService: TripleAspectsService,
  ) {}

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
  }): { events: Event[]; aspectBodies: AspectBodies[] } {
    const { coordinateEphemerisByBody, minute, previousAspectBodies } = args;

    const simpleAspectEvents: Event[] = [
      ...this.majorAspectsService.detect({ coordinateEphemerisByBody, minute }),
      ...this.minorAspectsService.detect({ coordinateEphemerisByBody, minute }),
      ...this.specialtyAspectsService.detect({
        coordinateEphemerisByBody,
        minute,
      }),
    ];

    const currentAspectBodies = computeAspectBodies(
      previousAspectBodies,
      simpleAspectEvents,
    );

    const events: Event[] = [
      ...simpleAspectEvents,
      ...this.tripleAspectsService.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute,
      }),
      ...this.quadrupleAspectsService.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute,
      }),
      ...this.quintupleAspectsService.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute,
      }),
      ...this.sextupleAspectsService.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute,
      }),
      ...this.stelliumService.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute,
      }),
    ];

    return { events, aspectBodies: currentAspectBodies };
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
    return [
      ...this.majorAspectsService.detectProgressive(events),
      ...this.minorAspectsService.detectProgressive(events),
      ...this.specialtyAspectsService.detectProgressive(events),
      ...this.tripleAspectsService.detectProgressive(events),
      ...this.quadrupleAspectsService.detectProgressive(events),
      ...this.quintupleAspectsService.detectProgressive(events),
      ...this.sextupleAspectsService.detectProgressive(events),
      ...this.stelliumService.detectProgressive(events),
    ];
  }
}

function makeKey(body1: Body, body2: Body, aspect: Aspect): string {
  const [sortedBody1, sortedBody2] = [body1, body2].toSorted();
  return `${sortedBody1}\u001F${sortedBody2}\u001F${aspect}`;
}

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
export function computeAspectBodies(
  previousAspectBodies: AspectBodies[],
  events: Event[],
): AspectBodies[] {
  const map = new Map<string, AspectBodies>(
    previousAspectBodies.map((ab) => [
      makeKey(ab.bodies[0], ab.bodies[1], ab.aspect),
      ab,
    ]),
  );

  const lowercaseBodies = bodies.map((body) => body.toLowerCase());

  for (const event of events) {
    const normalizedCategories = event.categories.map((category) =>
      category.toLowerCase().trim(),
    );

    if (!normalizedCategories.includes("simple aspect")) {
      continue;
    }

    const isForming = normalizedCategories.includes("forming");
    const isDissolving = normalizedCategories.includes("dissolving");

    if (!isForming && !isDissolving) {
      continue;
    }

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

    if (eventBodies.length !== 2) {
      continue;
    }

    const aspect = normalizedCategories.find((category) =>
      aspects.includes(category as Aspect),
    ) as Aspect | undefined;

    if (!aspect) {
      continue;
    }

    const [body1, body2] = eventBodies as [Body, Body];
    const key = makeKey(body1, body2, aspect);

    if (isDissolving) {
      map.delete(key);
      continue;
    }

    if (!map.has(key)) {
      map.set(key, { aspect, bodies: [body1, body2] });
    }
  }

  return [...map.values()];
}
