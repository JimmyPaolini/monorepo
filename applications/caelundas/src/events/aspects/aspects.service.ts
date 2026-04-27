import { Injectable } from "@nestjs/common";

import { aspects, bodies } from "../../constants";
import { MajorAspectsService } from "./major/major-aspects.service";
import { MinorAspectsService } from "./minor/minor-aspects.service";
import { QuadrupleAspectsService } from "./quadruple/quadruple-aspects.service";
import { QuintupleAspectsService } from "./quintuple/quintuple-aspects.service";
import { SextupleAspectsService } from "./sextuple/sextuple-aspects.service";
import { SpecialtyAspectsService } from "./specialty/specialty-aspects.service";
import { StelliumService } from "./stellium/stellium.service";
import { TripleAspectsService } from "./triple/triple-aspects.service";

import type { Event } from "../../calendar/calendar.types";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type { Aspect, AspectPhase, Body } from "../../types";
import type { Moment } from "moment-timezone";

/**
 * Represents an active aspect between two celestial bodies at a specific moment.
 */
export interface AspectBodies {
  aspect: Aspect;
  bodies: [Body, Body];
}

/**
 * Represents a 2-body aspect relationship extracted from stored events.
 */
export interface AspectEdge extends AspectBodies {
  phase: AspectPhase;
  event: Event;
}

/**
 *
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
   *
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
      ...this.specialtyAspectsService.detect({ coordinateEphemerisByBody, minute }),
    ];

    const currentAspectBodies = computeAspectBodies(
      previousAspectBodies,
      simpleAspectEvents,
    );

    const events: Event[] = [
      ...simpleAspectEvents,
      ...this.tripleAspectsService.detect({ currentAspectBodies, previousAspectBodies, minute }),
      ...this.quadrupleAspectsService.detect({ currentAspectBodies, previousAspectBodies, minute }),
      ...this.quintupleAspectsService.detect({ currentAspectBodies, previousAspectBodies, minute }),
      ...this.sextupleAspectsService.detect({ currentAspectBodies, previousAspectBodies, minute }),
      ...this.stelliumService.detect({ currentAspectBodies, previousAspectBodies, minute }),
    ];

    return { events, aspectBodies: currentAspectBodies };
  }

  /**
   *
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

export function computeAspectBodies(
  previousAspectBodies: AspectBodies[],
  events: Event[],
): AspectBodies[] {
  const map = new Map<string, AspectBodies>(
    previousAspectBodies.map((ab) => [makeKey(ab.bodies[0], ab.bodies[1], ab.aspect), ab]),
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
