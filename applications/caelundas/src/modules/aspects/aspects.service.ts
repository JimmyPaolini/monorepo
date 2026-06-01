import { bodies } from "@caelundas/src/modules/caelundas/caelundas.constants";
import { isAspect } from "@caelundas/src/modules/caelundas/caelundas.types";
import { Inject, Injectable } from "@nestjs/common";

import { MajorAspectsService } from "../majorAspects/majorAspects.service";
import { MinorAspectsService } from "../minorAspects/minorAspects.service";
import { QuadrupleAspectsService } from "../quadrupleAspects/quadrupleAspects.service";
import { QuintupleAspectsService } from "../quintupleAspects/quintupleAspects.service";
import { SextupleAspectsService } from "../sextupleAspects/sextupleAspects.service";
import { SpecialtyAspectsService } from "../specialtyAspects/specialtyAspects.service";
import { StelliumService } from "../stellium/stellium.service";
import { TripleAspectsService } from "../tripleAspects/tripleAspects.service";

import type { AspectBodies } from "./aspects.types";
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
  // 🏗️ Dependency Injection
  constructor(
    @Inject(MajorAspectsService)
    private readonly majorAspectsService: MajorAspectsService,
    @Inject(MinorAspectsService)
    private readonly minorAspectsService: MinorAspectsService,
    @Inject(QuadrupleAspectsService)
    private readonly quadrupleAspectsService: QuadrupleAspectsService,
    @Inject(QuintupleAspectsService)
    private readonly quintupleAspectsService: QuintupleAspectsService,
    @Inject(SextupleAspectsService)
    private readonly sextupleAspectsService: SextupleAspectsService,
    @Inject(SpecialtyAspectsService)
    private readonly specialtyAspectsService: SpecialtyAspectsService,
    @Inject(StelliumService)
    private readonly stelliumService: StelliumService,
    @Inject(TripleAspectsService)
    private readonly tripleAspectsService: TripleAspectsService,
  ) {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  private makeKey(body1: Body, body2: Body, aspect: Aspect): string {
    const [sortedBody1, sortedBody2] = [body1, body2].toSorted();
    return `${sortedBody1}\u001F${sortedBody2}\u001F${aspect}`;
  }

  // 🌎 Public Methods

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

    const currentAspectBodies = this.computeAspectBodies(
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

      const aspect = normalizedCategories.find((category): category is Aspect =>
        isAspect(category),
      );

      if (!aspect) {
        continue;
      }

      const body1 = eventBodies[0];
      const body2 = eventBodies[1];
      if (!body1 || !body2) continue;
      const key = this.makeKey(body1, body2, aspect);

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
}
