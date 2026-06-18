import { LoggerService } from "@caelundas/src/modules/logger/logger.service";
import { MajorAspectEventService } from "@caelundas/src/modules/major-aspects/major-aspect-event.service";
import { MajorAspectProgressiveService } from "@caelundas/src/modules/major-aspects/major-aspect-progressive.service";
import { MinorAspectsComposerService } from "@caelundas/src/modules/minor-aspects/minor-aspects-composer.service";
import { MinorAspectsEventService } from "@caelundas/src/modules/minor-aspects/minor-aspects-event.service";
import { MinorAspectsProgressiveService } from "@caelundas/src/modules/minor-aspects/minor-aspects-progressive.service";
import { QuadrupleAspectsComposerService } from "@caelundas/src/modules/quadruple-aspects/quadruple-aspects-composer.service";
import { QuintupleAspectsComposerService } from "@caelundas/src/modules/quintuple-aspects/quintuple-aspects-composer.service";
import { SextupleAspectsComposerService } from "@caelundas/src/modules/sextuple-aspects/sextuple-aspects-composer.service";
import { SpecialtyAspectsComposerService } from "@caelundas/src/modules/specialty-aspects/specialty-aspects-composer.service";
import { SpecialtyAspectsEventService } from "@caelundas/src/modules/specialty-aspects/specialty-aspects-event.service";
import { SpecialtyAspectsProgressiveService } from "@caelundas/src/modules/specialty-aspects/specialty-aspects-progressive.service";
import { TripleAspectsComposerService } from "@caelundas/src/modules/triple-aspects/triple-aspects-composer.service";
import { TripleAspectsDetectorService } from "@caelundas/src/modules/triple-aspects/triple-aspects-detector.service";
import { Test } from "@nestjs/testing";
import moment from "moment-timezone";
import { beforeAll, describe, expect, it } from "vitest";

import { EphemerisService } from "../ephemeris/ephemeris.service";
import { MajorAspectsService } from "../major-aspects/major-aspects.service";
import { MathService } from "../math/math.service";
import { MinorAspectsService } from "../minor-aspects/minor-aspects.service";
import { ProgressiveUtilities } from "../progressive/progressive.utilities";
import { QuadrupleAspectsService } from "../quadruple-aspects/quadruple-aspects.service";
import { QuintupleAspectsService } from "../quintuple-aspects/quintuple-aspects.service";
import { SextupleAspectsService } from "../sextuple-aspects/sextuple-aspects.service";
import { SpecialtyAspectsService } from "../specialty-aspects/specialty-aspects.service";
import { StelliumService } from "../stellium/stellium.service";
import { TripleAspectsService } from "../triple-aspects/triple-aspects.service";

import {
  COMPOSITE_ASPECT_DETECTORS_TOKEN,
  PROGRESSIVE_ASPECT_DETECTORS_TOKEN,
  SIMPLE_ASPECT_DETECTORS_TOKEN,
} from "./aspects.constants";
import { AspectsService } from "./aspects.service";
import { AspectsUtilities } from "./aspects.utilities";

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

describe("AspectsService", () => {
  let service: AspectsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LoggerService,
        AspectsService,
        AspectsUtilities,
        EphemerisService,
        MajorAspectsService,
        MajorAspectEventService,
        MajorAspectProgressiveService,
        MathService,
        MinorAspectsService,
        MinorAspectsComposerService,
        MinorAspectsEventService,
        MinorAspectsProgressiveService,
        ProgressiveUtilities,
        QuadrupleAspectsService,
        QuadrupleAspectsComposerService,
        QuintupleAspectsService,
        QuintupleAspectsComposerService,
        SextupleAspectsService,
        SextupleAspectsComposerService,
        SpecialtyAspectsService,
        SpecialtyAspectsComposerService,
        SpecialtyAspectsEventService,
        SpecialtyAspectsProgressiveService,
        StelliumService,
        TripleAspectsService,
        TripleAspectsComposerService,
        TripleAspectsDetectorService,
        {
          inject: [
            MajorAspectsService,
            MinorAspectsService,
            SpecialtyAspectsService,
          ],
          provide: SIMPLE_ASPECT_DETECTORS_TOKEN,
          useFactory: (
            majorAspectsService: MajorAspectsService,
            minorAspectsService: MinorAspectsService,
            specialtyAspectsService: SpecialtyAspectsService,
          ) => [
            majorAspectsService,
            minorAspectsService,
            specialtyAspectsService,
          ],
        },
        {
          inject: [
            TripleAspectsService,
            QuadrupleAspectsService,
            QuintupleAspectsService,
            SextupleAspectsService,
            StelliumService,
          ],
          provide: COMPOSITE_ASPECT_DETECTORS_TOKEN,
          useFactory: (
            tripleAspectsService: TripleAspectsService,
            quadrupleAspectsService: QuadrupleAspectsService,
            quintupleAspectsService: QuintupleAspectsService,
            sextupleAspectsService: SextupleAspectsService,
            stelliumService: StelliumService,
          ) => [
            tripleAspectsService,
            quadrupleAspectsService,
            quintupleAspectsService,
            sextupleAspectsService,
            stelliumService,
          ],
        },
        {
          inject: [
            MajorAspectsService,
            MinorAspectsService,
            SpecialtyAspectsService,
            TripleAspectsService,
            QuadrupleAspectsService,
            QuintupleAspectsService,
            SextupleAspectsService,
            StelliumService,
          ],
          provide: PROGRESSIVE_ASPECT_DETECTORS_TOKEN,
          useFactory: (
            majorAspectsService: MajorAspectsService,
            minorAspectsService: MinorAspectsService,
            specialtyAspectsService: SpecialtyAspectsService,
            tripleAspectsService: TripleAspectsService,
            quadrupleAspectsService: QuadrupleAspectsService,
            quintupleAspectsService: QuintupleAspectsService,
            sextupleAspectsService: SextupleAspectsService,
            stelliumService: StelliumService,
          ) => [
            majorAspectsService,
            minorAspectsService,
            specialtyAspectsService,
            tripleAspectsService,
            quadrupleAspectsService,
            quintupleAspectsService,
            sextupleAspectsService,
            stelliumService,
          ],
        },
      ],
    }).compile();

    service = await module.resolve(AspectsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("computeAspectBodies", () => {
    const timestamp = moment.utc("2026-01-21T12:00:00Z");

    function createAspectEvent(args: {
      aspectType: string;
      body1: string;
      body2: string;
      phase: "Dissolving" | "Forming" | "Perfective";
    }): Event {
      return {
        categories: [
          "Astronomy",
          "Astrology",
          "Simple Aspect",
          "Major Aspect",
          args.body1,
          args.body2,
          args.aspectType,
          args.phase,
        ],
        description: "",
        end: timestamp,
        start: timestamp,
        summary: `${args.body1} ${args.phase.toLowerCase()} ${args.aspectType} ${args.body2}`,
      };
    }

    it("returns empty array when given no previous state and no events", () => {
      expect(service.computeAspectBodies([], [])).toEqual([]);
    });

    it("adds an aspect on forming and ignores perfective", () => {
      const result = service.computeAspectBodies(
        [],
        [
          createAspectEvent({
            aspectType: "Conjunct",
            body1: "Sun",
            body2: "Moon",
            phase: "Forming",
          }),
          createAspectEvent({
            aspectType: "Conjunct",
            body1: "Sun",
            body2: "Moon",
            phase: "Perfective",
          }),
        ],
      );

      expect(result).toEqual([
        {
          aspect: "conjunct",
          bodies: ["sun", "moon"],
        },
      ]);
    });

    it("removes an aspect on dissolving", () => {
      const afterForming = service.computeAspectBodies(
        [],
        [
          createAspectEvent({
            aspectType: "Conjunct",
            body1: "Sun",
            body2: "Moon",
            phase: "Forming",
          }),
        ],
      );

      const result = service.computeAspectBodies(afterForming, [
        createAspectEvent({
          aspectType: "Conjunct",
          body1: "Sun",
          body2: "Moon",
          phase: "Dissolving",
        }),
      ]);

      expect(result).toEqual([]);
    });

    it("uses canonical key regardless of body order", () => {
      const afterForming = service.computeAspectBodies(
        [],
        [
          createAspectEvent({
            aspectType: "Conjunct",
            body1: "Moon",
            body2: "Sun",
            phase: "Forming",
          }),
        ],
      );

      const result = service.computeAspectBodies(afterForming, [
        createAspectEvent({
          aspectType: "Conjunct",
          body1: "Sun",
          body2: "Moon",
          phase: "Dissolving",
        }),
      ]);

      expect(result).toEqual([]);
    });

    it("tracks different aspect types for the same pair", () => {
      const result = service.computeAspectBodies(
        [],
        [
          createAspectEvent({
            aspectType: "Conjunct",
            body1: "Sun",
            body2: "Moon",
            phase: "Forming",
          }),
          createAspectEvent({
            aspectType: "Sextile",
            body1: "Sun",
            body2: "Moon",
            phase: "Forming",
          }),
        ],
      );

      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          { aspect: "conjunct", bodies: ["sun", "moon"] },
          { aspect: "sextile", bodies: ["sun", "moon"] },
        ]),
      );
    });

    it("skips non-simple-aspect events", () => {
      const result = service.computeAspectBodies(
        [],
        [
          {
            categories: ["Astronomy", "Ingress", "Moon", "Aries"],
            description: "",
            end: timestamp,
            start: timestamp,
            summary: "Moon enters Aries",
          },
        ],
      );

      expect(result).toEqual([]);
    });

    it("does not mutate the previous state array", () => {
      const afterForming = service.computeAspectBodies(
        [],
        [
          createAspectEvent({
            aspectType: "Conjunct",
            body1: "Sun",
            body2: "Moon",
            phase: "Forming",
          }),
        ],
      );

      service.computeAspectBodies(afterForming, [
        createAspectEvent({
          aspectType: "Conjunct",
          body1: "Sun",
          body2: "Moon",
          phase: "Dissolving",
        }),
      ]);

      expect(afterForming).toHaveLength(1);
    });
  });
});
