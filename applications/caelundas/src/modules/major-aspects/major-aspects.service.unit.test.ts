import { AspectsUtilities } from "@caelundas/src/modules/aspects/aspects.utilities";
import { aspectBodies as majorAspectBodies } from "@caelundas/src/modules/caelundas/caelundas.constants";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { LoggerService } from "@caelundas/src/modules/logger/logger.service";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { ProgressiveUtilitiesService } from "@caelundas/src/modules/progressive/progressive-utilities.service";
import { Test } from "@nestjs/testing";
import moment, { type Moment } from "moment-timezone";
import { beforeAll, describe, expect, it } from "vitest";

import { MajorAspectEventService } from "./major-aspect-event.service";
import { MajorAspectProgressiveService } from "./major-aspect-progressive.service";
import { MajorAspectsService } from "./major-aspects.service";

import type { Body } from "@caelundas/src/modules/caelundas/caelundas.types";
import type { CoordinateEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn<(path: string, data: string) => void>(),
  },
}));

describe(MajorAspectsService, () => {
  let service: MajorAspectsService;
  let aspectsUtilitiesService: AspectsUtilities;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LoggerService,
        MajorAspectsService,
        MajorAspectEventService,
        MajorAspectProgressiveService,
        AspectsUtilities,
        EphemerisService,
        MathService,
        ProgressiveUtilitiesService,
      ],
    }).compile();
    service = await module.resolve(MajorAspectsService);
    aspectsUtilitiesService = await module.resolve(AspectsUtilities);
  });

  describe("detect", () => {
    const createEphemeris = (
      longitudes: Record<string, number>,
    ): CoordinateEphemeris => {
      return Object.fromEntries(
        Object.entries(longitudes).map(([timestamp, longitude]) => [
          timestamp,
          { latitude: 0, longitude },
        ]),
      );
    };

    const createDefaultEphemeris = (
      currentMinute: Moment,
      previousMinute: Moment,
      nextMinute: Moment,
    ): Record<Body, CoordinateEphemeris> => {
      // Create ephemeris for all major aspect bodies with far-apart longitudes
      const allBodies = majorAspectBodies;

      const ephemerisByBody = {} as Record<Body, CoordinateEphemeris>;
      allBodies.forEach((body, index) => {
        const longitude = index * 20; // Space them out
        ephemerisByBody[body] = createEphemeris({
          [currentMinute.toISOString()]: longitude,
          [nextMinute.toISOString()]: longitude,
          [previousMinute.toISOString()]: longitude,
        });
      });
      return ephemerisByBody;
    };

    it("detects perfective conjunction", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      const coordinateEphemerisByBody = createDefaultEphemeris(
        currentMinute,
        previousMinute,
        nextMinute,
      );

      // Override sun and mercury to be in conjunction
      coordinateEphemerisByBody.sun = createEphemeris({
        [currentMinute.toISOString()]: 0,
        [nextMinute.toISOString()]: 0,
        [previousMinute.toISOString()]: 0,
      });
      coordinateEphemerisByBody.mercury = createEphemeris({
        [currentMinute.toISOString()]: 0,
        [nextMinute.toISOString()]: 359,
        [previousMinute.toISOString()]: 1,
      });

      const events = service.detect({
        coordinateEphemerisByBody,
        minute: currentMinute,
      });

      expect(events.length).toBeGreaterThanOrEqual(1);

      const conjunctionEvent = events.find(
        (e) =>
          e.description.includes("conjunct") &&
          e.description.includes("Sun") &&
          e.description.includes("Mercury"),
      );

      expect(conjunctionEvent).toBeDefined();
      expect(conjunctionEvent?.categories).toContain("Perfective");
    });

    it("detects forming aspect", () => {
      expect.hasAssertions(); // Test context provides debugging info and task metadata

      // Useful for logging test names in complex scenarios
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      const coordinateEphemerisByBody = createDefaultEphemeris(
        currentMinute,
        previousMinute,
        nextMinute,
      );

      // Opposition has 8° orb, so venus needs to enter from >188° or <172°
      coordinateEphemerisByBody.sun = createEphemeris({
        [currentMinute.toISOString()]: 0,
        [nextMinute.toISOString()]: 0,
        [previousMinute.toISOString()]: 0,
      });
      coordinateEphemerisByBody.venus = createEphemeris({
        [currentMinute.toISOString()]: 187, // Inside 8° orb (entering)
        [nextMinute.toISOString()]: 185, // Further in orb
        [previousMinute.toISOString()]: 189, // Outside 8° orb (>188°)
      });

      const events = service.detect({
        coordinateEphemerisByBody,
        minute: currentMinute,
      });

      const formingOpposition = events.find(
        (e) =>
          e.description.includes("opposite") &&
          e.categories.includes("Forming") &&
          e.description.includes("Sun") &&
          e.description.includes("Venus"),
      );

      expect(formingOpposition).toBeDefined();
    });

    it("detects dissolving aspect", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      const coordinateEphemerisByBody = createDefaultEphemeris(
        currentMinute,
        previousMinute,
        nextMinute,
      );

      // Trine has 6° orb, so mars needs to exit beyond >126° or <114°
      coordinateEphemerisByBody.sun = createEphemeris({
        [currentMinute.toISOString()]: 0,
        [nextMinute.toISOString()]: 0,
        [previousMinute.toISOString()]: 0,
      });
      coordinateEphemerisByBody.mars = createEphemeris({
        [currentMinute.toISOString()]: 125, // Still inside 6° orb (moving away)
        [nextMinute.toISOString()]: 127, // Outside 6° orb (exiting)
        [previousMinute.toISOString()]: 122, // Inside 6° orb
      });

      const events = service.detect({
        coordinateEphemerisByBody,
        minute: currentMinute,
      });

      const dissolvingTrine = events.find(
        (e) =>
          e.description.includes("trine") &&
          e.categories.includes("Dissolving") &&
          e.description.includes("Sun") &&
          e.description.includes("Mars"),
      );

      expect(dissolvingTrine).toBeDefined();
    });

    it("detects multiple aspects between different body pairs", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      const coordinateEphemerisByBody = createDefaultEphemeris(
        currentMinute,
        previousMinute,
        nextMinute,
      );

      coordinateEphemerisByBody.sun = createEphemeris({
        [currentMinute.toISOString()]: 0,
        [nextMinute.toISOString()]: 0,
        [previousMinute.toISOString()]: 0,
      });
      coordinateEphemerisByBody.mercury = createEphemeris({
        [currentMinute.toISOString()]: 90,
        [nextMinute.toISOString()]: 89,
        [previousMinute.toISOString()]: 91,
      });
      coordinateEphemerisByBody.venus = createEphemeris({
        [currentMinute.toISOString()]: 180,
        [nextMinute.toISOString()]: 181,
        [previousMinute.toISOString()]: 179,
      });

      const events = service.detect({
        coordinateEphemerisByBody,
        minute: currentMinute,
      });

      expect(events.length).toBeGreaterThanOrEqual(2);

      const sunMercuryAspect = events.find(
        (e) =>
          e.description.includes("Sun") && e.description.includes("Mercury"),
      );
      const sunVenusAspect = events.find(
        (e) => e.description.includes("Sun") && e.description.includes("Venus"),
      );

      expect(sunMercuryAspect).toBeDefined();
      expect(sunVenusAspect).toBeDefined();
    });

    it("does not detect aspects outside orb", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      // Create ephemeris with all bodies clustered in a small range to avoid aspects
      // Major aspects need specific angle differences: 0°, 60°, 90°, 120°, 180°
      // If all bodies are within a ~35° range, no pairs will have angles matching major aspects
      // Positions: 10° through 45° (35° span, all angles < 56° which is outside all aspect orbs)
      const safeLongitudes = [
        10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44,
        46,
      ];
      const allBodies = majorAspectBodies;

      const coordinateEphemerisByBody = {} as Record<Body, CoordinateEphemeris>;
      allBodies.forEach((body, index) => {
        const longitude = safeLongitudes[index] ?? 0;
        coordinateEphemerisByBody[body] = createEphemeris({
          [currentMinute.toISOString()]: longitude,
          [nextMinute.toISOString()]: longitude,
          [previousMinute.toISOString()]: longitude,
        });
      });

      const events = service.detect({
        coordinateEphemerisByBody,
        minute: currentMinute,
      });

      expect(events).toHaveLength(0);
    });

    it("does not create duplicate events for same body pair", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      const coordinateEphemerisByBody = createDefaultEphemeris(
        currentMinute,
        previousMinute,
        nextMinute,
      );

      coordinateEphemerisByBody.sun = createEphemeris({
        [currentMinute.toISOString()]: 0,
        [nextMinute.toISOString()]: 0,
        [previousMinute.toISOString()]: 0,
      });
      coordinateEphemerisByBody.jupiter = createEphemeris({
        [currentMinute.toISOString()]: 0,
        [nextMinute.toISOString()]: 359,
        [previousMinute.toISOString()]: 1,
      });

      const events = service.detect({
        coordinateEphemerisByBody,
        minute: currentMinute,
      });

      // Should only have one sun-jupiter conjunction, not two (sun-jupiter and jupiter-sun)
      const sunJupiterEvents = events.filter(
        (e) =>
          e.description.includes("Sun") && e.description.includes("Jupiter"),
      );

      expect(sunJupiterEvents).toHaveLength(1);
    });
  });

  // Event-construction and progressive-pairing coverage moved to:
  // - major-aspect-event.service.unit.test.ts
  // - major-aspect-progressive.service.unit.test.ts

  it("is defined", () => {
    expect(service).toBeDefined();
  });

  describe("isAspect", () => {
    it("returns true for conjunction within orb", () => {
      expect(
        aspectsUtilitiesService.isAspect({
          aspect: "conjunct",
          longitudeBody1: 0,
          longitudeBody2: 5,
        }),
      ).toBe(true);
      expect(
        aspectsUtilitiesService.isAspect({
          aspect: "conjunct",
          longitudeBody1: 100,
          longitudeBody2: 105,
        }),
      ).toBe(true);
    });

    it("returns false for conjunction outside orb", () => {
      expect(
        aspectsUtilitiesService.isAspect({
          aspect: "conjunct",
          longitudeBody1: 0,
          longitudeBody2: 10,
        }),
      ).toBe(false);
    });

    it("returns true for opposition within orb", () => {
      expect(
        aspectsUtilitiesService.isAspect({
          aspect: "opposite",
          longitudeBody1: 0,
          longitudeBody2: 180,
        }),
      ).toBe(true);
      expect(
        aspectsUtilitiesService.isAspect({
          aspect: "opposite",
          longitudeBody1: 0,
          longitudeBody2: 175,
        }),
      ).toBe(true);
    });

    it("returns true for trine within orb", () => {
      expect(
        aspectsUtilitiesService.isAspect({
          aspect: "trine",
          longitudeBody1: 0,
          longitudeBody2: 120,
        }),
      ).toBe(true);
      expect(
        aspectsUtilitiesService.isAspect({
          aspect: "trine",
          longitudeBody1: 0,
          longitudeBody2: 115,
        }),
      ).toBe(true);
    });

    it("returns true for square within orb", () => {
      expect(
        aspectsUtilitiesService.isAspect({
          aspect: "square",
          longitudeBody1: 0,
          longitudeBody2: 90,
        }),
      ).toBe(true);
      expect(
        aspectsUtilitiesService.isAspect({
          aspect: "square",
          longitudeBody1: 0,
          longitudeBody2: 85,
        }),
      ).toBe(true);
    });

    it("returns true for sextile within orb", () => {
      expect(
        aspectsUtilitiesService.isAspect({
          aspect: "sextile",
          longitudeBody1: 0,
          longitudeBody2: 60,
        }),
      ).toBe(true);
      expect(
        aspectsUtilitiesService.isAspect({
          aspect: "sextile",
          longitudeBody1: 0,
          longitudeBody2: 57,
        }),
      ).toBe(true);
    });
  });

  describe("getMajorAspectPhase", () => {
    it("returns forming when entering aspect orb", () => {
      const phase = service.getMajorAspectPhase({
        currentLongitudeBody1: 0,
        currentLongitudeBody2: 173,
        nextLongitudeBody1: 0,
        nextLongitudeBody2: 175,
        previousLongitudeBody1: 0,
        previousLongitudeBody2: 171,
      });

      expect(phase).toBe("forming");
    });

    it("returns dissolving when exiting aspect orb", () => {
      const phase = service.getMajorAspectPhase({
        currentLongitudeBody1: 0,
        currentLongitudeBody2: 187,
        nextLongitudeBody1: 0,
        nextLongitudeBody2: 189,
        previousLongitudeBody1: 0,
        previousLongitudeBody2: 185,
      });

      expect(phase).toBe("dissolving");
    });

    it("returns perfective when crossing the exact aspect angle", () => {
      const phase = service.getMajorAspectPhase({
        currentLongitudeBody1: 0,
        currentLongitudeBody2: 180,
        nextLongitudeBody1: 0,
        nextLongitudeBody2: 181,
        previousLongitudeBody1: 0,
        previousLongitudeBody2: 179,
      });

      expect(phase).toBe("perfective");
    });

    it("returns null when not in any aspect phase", () => {
      const phase = service.getMajorAspectPhase({
        currentLongitudeBody1: 0,
        currentLongitudeBody2: 46,
        nextLongitudeBody1: 0,
        nextLongitudeBody2: 47,
        previousLongitudeBody1: 0,
        previousLongitudeBody2: 45,
      });

      expect(phase).toBeNull();
    });
  });
});
