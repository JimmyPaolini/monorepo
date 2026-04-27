import { Injectable } from "@nestjs/common";

import { computeAspectBodies } from "./aspects.utilities";
import { MajorAspectsService } from "./major/major-aspects.service";
import { MinorAspectsService } from "./minor/minor-aspects.service";
import { QuadrupleAspectsService } from "./quadruple/quadruple-aspects.service";
import { QuintupleAspectsService } from "./quintuple/quintuple-aspects.service";
import { SextupleAspectsService } from "./sextuple/sextuple-aspects.service";
import { SpecialtyAspectsService } from "./specialty/specialty-aspects.service";
import { StelliumService } from "./stellium/stellium.service";
import { TripleAspectsService } from "./triple/triple-aspects.service";

import type { AspectBodies } from "./aspects.utilities";
import type { Event } from "../../calendar.utilities";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type { Body } from "../../types";
import type { Moment } from "moment-timezone";

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
