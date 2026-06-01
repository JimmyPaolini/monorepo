import { AspectsUtilities } from "@caelundas/src/modules/aspects/aspects.utilities";
import { majorAspectBodies } from "@caelundas/src/modules/caelundas/caelundas.types";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Test } from "@nestjs/testing";
import moment, { type Moment } from "moment-timezone";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { MajorAspectsService } from "./majorAspects.service";

import type { Body } from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { CoordinateEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

describe("MajorAspectsService", () => {
  let service: MajorAspectsService;
  let aspectsUtilitiesService: AspectsUtilities;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MajorAspectsService,
        AspectsUtilities,
        EphemerisService,
        MathService,
        ProgressiveUtilities,
      ],
    }).compile();
    service = module.get(MajorAspectsService);
    aspectsUtilitiesService = module.get(AspectsUtilities);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("majorAspects.events", () => {
    describe("service.detect", () => {
      const createEphemeris = (
        longitudes: Record<string, number>,
      ): CoordinateEphemeris => {
        return Object.fromEntries(
          Object.entries(longitudes).map(([timestamp, longitude]) => [
            timestamp,
            { longitude, latitude: 0 },
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
            [previousMinute.toISOString()]: longitude,
            [currentMinute.toISOString()]: longitude,
            [nextMinute.toISOString()]: longitude,
          });
        });
        return ephemerisByBody;
      };

      it("should detect perfective conjunction", () => {
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
          [previousMinute.toISOString()]: 0,
          [currentMinute.toISOString()]: 0,
          [nextMinute.toISOString()]: 0,
        });
        coordinateEphemerisByBody.mercury = createEphemeris({
          [previousMinute.toISOString()]: 1,
          [currentMinute.toISOString()]: 0,
          [nextMinute.toISOString()]: 359,
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

      it("should detect forming aspect", () => {
        // Test context provides debugging info and task metadata
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
          [previousMinute.toISOString()]: 0,
          [currentMinute.toISOString()]: 0,
          [nextMinute.toISOString()]: 0,
        });
        coordinateEphemerisByBody.venus = createEphemeris({
          [previousMinute.toISOString()]: 189, // Outside 8° orb (>188°)
          [currentMinute.toISOString()]: 187, // Inside 8° orb (entering)
          [nextMinute.toISOString()]: 185, // Further in orb
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

      it("should detect dissolving aspect", () => {
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
          [previousMinute.toISOString()]: 0,
          [currentMinute.toISOString()]: 0,
          [nextMinute.toISOString()]: 0,
        });
        coordinateEphemerisByBody.mars = createEphemeris({
          [previousMinute.toISOString()]: 122, // Inside 6° orb
          [currentMinute.toISOString()]: 125, // Still inside 6° orb (moving away)
          [nextMinute.toISOString()]: 127, // Outside 6° orb (exiting)
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

      it("should detect multiple aspects between different body pairs", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const previousMinute = currentMinute.clone().subtract(1, "minute");
        const nextMinute = currentMinute.clone().add(1, "minute");

        const coordinateEphemerisByBody = createDefaultEphemeris(
          currentMinute,
          previousMinute,
          nextMinute,
        );

        coordinateEphemerisByBody.sun = createEphemeris({
          [previousMinute.toISOString()]: 0,
          [currentMinute.toISOString()]: 0,
          [nextMinute.toISOString()]: 0,
        });
        coordinateEphemerisByBody.mercury = createEphemeris({
          [previousMinute.toISOString()]: 91,
          [currentMinute.toISOString()]: 90,
          [nextMinute.toISOString()]: 89,
        });
        coordinateEphemerisByBody.venus = createEphemeris({
          [previousMinute.toISOString()]: 179,
          [currentMinute.toISOString()]: 180,
          [nextMinute.toISOString()]: 181,
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
          (e) =>
            e.description.includes("Sun") && e.description.includes("Venus"),
        );
        expect(sunMercuryAspect).toBeDefined();
        expect(sunVenusAspect).toBeDefined();
      });

      it("should not detect aspects outside orb", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const previousMinute = currentMinute.clone().subtract(1, "minute");
        const nextMinute = currentMinute.clone().add(1, "minute");

        // Create ephemeris with all bodies clustered in a small range to avoid aspects
        // Major aspects need specific angle differences: 0°, 60°, 90°, 120°, 180°
        // If all bodies are within a ~35° range, no pairs will have angles matching major aspects
        // Positions: 10° through 45° (35° span, all angles < 56° which is outside all aspect orbs)
        const safeLongitudes = [
          10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42,
          44, 46,
        ];
        const allBodies = majorAspectBodies;

        const coordinateEphemerisByBody = {} as Record<
          Body,
          CoordinateEphemeris
        >;
        allBodies.forEach((body, index) => {
          const longitude = safeLongitudes[index] ?? 0;
          coordinateEphemerisByBody[body] = createEphemeris({
            [previousMinute.toISOString()]: longitude,
            [currentMinute.toISOString()]: longitude,
            [nextMinute.toISOString()]: longitude,
          });
        });

        const events = service.detect({
          coordinateEphemerisByBody,
          minute: currentMinute,
        });

        expect(events).toHaveLength(0);
      });

      it("should not create duplicate events for same body pair", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const previousMinute = currentMinute.clone().subtract(1, "minute");
        const nextMinute = currentMinute.clone().add(1, "minute");

        const coordinateEphemerisByBody = createDefaultEphemeris(
          currentMinute,
          previousMinute,
          nextMinute,
        );

        coordinateEphemerisByBody.sun = createEphemeris({
          [previousMinute.toISOString()]: 0,
          [currentMinute.toISOString()]: 0,
          [nextMinute.toISOString()]: 0,
        });
        coordinateEphemerisByBody.jupiter = createEphemeris({
          [previousMinute.toISOString()]: 1,
          [currentMinute.toISOString()]: 0,
          [nextMinute.toISOString()]: 359,
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

    describe("getMajorAspectEvent", () => {
      it("should create perfective conjunction event", () => {
        const timestamp = moment.utc("2024-03-21T12:00:00.000Z");
        const event = service.buildMajorAspectEvent({
          longitudeBody1: 0,
          longitudeBody2: 0,
          timestamp,
          body1: "sun",
          body2: "moon",
          phase: "perfective",
        });

        expect(event.summary).toContain("🎯");
        expect(event.summary).toContain("☀️");
        expect(event.summary).toContain("🌙");
        expect(event.summary).toContain("☌");
        expect(event.description).toBe("Sun perfective conjunct Moon");
        expect(event.categories).toContain("Astronomy");
        expect(event.categories).toContain("Astrology");
        expect(event.categories).toContain("Major Aspect");
        expect(event.categories).toContain("Sun");
        expect(event.categories).toContain("Moon");
        expect(event.categories).toContain("Conjunct");
        expect(event.categories).toContain("Perfective");
        expect(event.start).toEqual(timestamp);
        expect(event.end).toEqual(timestamp);
      });

      it("should create forming opposition event", () => {
        const timestamp = moment.utc("2024-03-21T12:00:00.000Z");
        const event = service.buildMajorAspectEvent({
          longitudeBody1: 0,
          longitudeBody2: 178,
          timestamp,
          body1: "sun",
          body2: "mars",
          phase: "forming",
        });

        expect(event.summary).toContain("➡️");
        expect(event.summary).toContain("☀️");
        expect(event.summary).toContain("♂️");
        expect(event.summary).toContain("☍");
        expect(event.description).toBe("Sun forming opposite Mars");
        expect(event.categories).toContain("Forming");
        expect(event.categories).toContain("Opposite");
      });

      it("should create dissolving trine event", () => {
        const timestamp = moment.utc("2024-03-21T12:00:00.000Z");
        const event = service.buildMajorAspectEvent({
          longitudeBody1: 0,
          longitudeBody2: 122,
          timestamp,
          body1: "venus",
          body2: "jupiter",
          phase: "dissolving",
        });

        expect(event.summary).toContain("⬅️");
        expect(event.summary).toContain("♀️");
        expect(event.summary).toContain("♃");
        expect(event.summary).toContain("△");
        expect(event.description).toBe("Venus dissolving trine Jupiter");
        expect(event.categories).toContain("Dissolving");
        expect(event.categories).toContain("Trine");
        expect(event.categories).toContain("Venus");
        expect(event.categories).toContain("Jupiter");
      });

      it("should create square event", () => {
        const timestamp = moment.utc("2024-03-21T12:00:00.000Z");
        const event = service.buildMajorAspectEvent({
          longitudeBody1: 0,
          longitudeBody2: 90,
          timestamp,
          body1: "mercury",
          body2: "saturn",
          phase: "perfective",
        });

        expect(event.summary).toContain("☿");
        expect(event.summary).toContain("♄");
        expect(event.summary).toContain("□");
        expect(event.description).toBe("Mercury perfective square Saturn");
        expect(event.categories).toContain("Square");
      });

      it("should create sextile event", () => {
        const timestamp = moment.utc("2024-03-21T12:00:00.000Z");
        const event = service.buildMajorAspectEvent({
          longitudeBody1: 0,
          longitudeBody2: 60,
          timestamp,
          body1: "moon",
          body2: "uranus",
          phase: "perfective",
        });

        expect(event.summary).toContain("🌙");
        expect(event.summary).toContain("♅");
        expect(event.summary).toContain("⚹");
        expect(event.description).toBe("Moon perfective sextile Uranus");
        expect(event.categories).toContain("Sextile");
      });

      it("should throw error when no major aspect is found", () => {
        const timestamp = moment.utc("2024-03-21T12:00:00.000Z");

        expect(() =>
          service.buildMajorAspectEvent({
            longitudeBody1: 0,
            longitudeBody2: 45, // No major aspect at 45 degrees
            timestamp,
            body1: "sun",
            body2: "moon",
            phase: "perfective",
          }),
        ).toThrow("No major aspect found");
      });

      it("should handle wrapped longitudes (near 360/0 degrees)", () => {
        const timestamp = moment.utc("2024-03-21T12:00:00.000Z");
        const event = service.buildMajorAspectEvent({
          longitudeBody1: 358,
          longitudeBody2: 2,
          timestamp,
          body1: "sun",
          body2: "moon",
          phase: "perfective",
        });

        expect(event.description).toContain("conjunct");
      });
    });

    describe("service.detectProgressive", () => {
      const createMajorAspectEvent = (
        body1: string,
        body2: string,
        aspect: string,
        phase: string,
        timestamp: Moment,
      ): Event => ({
        start: timestamp,
        end: timestamp,
        summary: `${body1} ${aspect} ${body2}`,
        description: `${body1} ${phase} ${aspect} ${body2}`,
        categories: [
          "Astronomy",
          "Astrology",
          "Major Aspect",
          body1, // Already in Start Case like "Sun", "Mercury"
          body2,
          aspect, // Already in Start Case like "Conjunct", "Opposite"
          phase, // "Forming" or "Dissolving"
        ],
      });

      it("should create progressive events from forming and dissolving pairs", () => {
        const forming = createMajorAspectEvent(
          "Sun",
          "Mercury",
          "Conjunct",
          "Forming",
          moment.utc("2024-03-21T10:00:00.000Z"),
        );
        const dissolving = createMajorAspectEvent(
          "Sun",
          "Mercury",
          "Conjunct",
          "Dissolving",
          moment.utc("2024-03-21T14:00:00.000Z"),
        );

        const events = [forming, dissolving];
        const progressiveEvents = service.detectProgressive(events);

        expect(progressiveEvents).toHaveLength(1);
        expect(progressiveEvents[0]).toBeDefined();
        expect(progressiveEvents[0]?.start).toEqual(forming.start);
        expect(progressiveEvents[0]?.end).toEqual(dissolving.start);
        expect(progressiveEvents[0]?.categories).toContain("Simple Aspect");
        expect(progressiveEvents[0]?.categories).toContain("Major Aspect");
        expect(progressiveEvents[0]?.summary).toContain("☀️");
        expect(progressiveEvents[0]?.summary).toContain("☿");
        expect(progressiveEvents[0]?.summary).toContain("☌");
      });

      it("should handle multiple aspect types for same body pair", () => {
        const formingConjunct = createMajorAspectEvent(
          "Sun",
          "Mercury",
          "Conjunct",
          "Forming",
          moment.utc("2024-03-21T10:00:00.000Z"),
        );
        const dissolvingConjunct = createMajorAspectEvent(
          "Sun",
          "Mercury",
          "Conjunct",
          "Dissolving",
          moment.utc("2024-03-21T14:00:00.000Z"),
        );
        const formingOpposite = createMajorAspectEvent(
          "Sun",
          "Mercury",
          "Opposite",
          "Forming",
          moment.utc("2024-03-21T20:00:00.000Z"),
        );
        const dissolvingOpposite = createMajorAspectEvent(
          "Sun",
          "Mercury",
          "Opposite",
          "Dissolving",
          moment.utc("2024-03-22T00:00:00.000Z"),
        );

        const events = [
          formingConjunct,
          dissolvingConjunct,
          formingOpposite,
          dissolvingOpposite,
        ];
        const progressiveEvents = service.detectProgressive(events);

        expect(progressiveEvents).toHaveLength(2);
        const conjunctDuration = progressiveEvents.find((e) =>
          e.description.includes("conjunct"),
        );
        const oppositeDuration = progressiveEvents.find((e) =>
          e.description.includes("opposite"),
        );
        expect(conjunctDuration).toBeDefined();
        expect(oppositeDuration).toBeDefined();
      });

      it("should handle multiple body pairs", () => {
        const sunMercuryForming = createMajorAspectEvent(
          "Sun",
          "Mercury",
          "Conjunct",
          "Forming",
          moment.utc("2024-03-21T10:00:00.000Z"),
        );
        const sunMercuryDissolving = createMajorAspectEvent(
          "Sun",
          "Mercury",
          "Conjunct",
          "Dissolving",
          moment.utc("2024-03-21T14:00:00.000Z"),
        );
        const venusJupiterForming = createMajorAspectEvent(
          "Venus",
          "Jupiter",
          "Trine",
          "Forming",
          moment.utc("2024-03-21T12:00:00.000Z"),
        );
        const venusJupiterDissolving = createMajorAspectEvent(
          "Venus",
          "Jupiter",
          "Trine",
          "Dissolving",
          moment.utc("2024-03-21T16:00:00.000Z"),
        );

        const events = [
          sunMercuryForming,
          sunMercuryDissolving,
          venusJupiterForming,
          venusJupiterDissolving,
        ];
        const progressiveEvents = service.detectProgressive(events);

        expect(progressiveEvents).toHaveLength(2);
      });

      it("should filter out non-major-aspect events", () => {
        const majorAspectForming = createMajorAspectEvent(
          "Sun",
          "Venus",
          "Conjunct",
          "Forming",
          moment.utc("2024-03-21T10:00:00.000Z"),
        );
        const majorAspectDissolving = createMajorAspectEvent(
          "Sun",
          "Venus",
          "Conjunct",
          "Dissolving",
          moment.utc("2024-03-21T14:00:00.000Z"),
        );
        const nonAspectEvent: Event = {
          start: moment.utc("2024-03-21T12:00:00.000Z"),
          end: moment.utc("2024-03-21T12:00:00.000Z"),
          summary: "Sunrise",
          description: "Sunrise",
          categories: ["Solar", "Daily Cycle"],
        };

        const events = [
          majorAspectForming,
          majorAspectDissolving,
          nonAspectEvent,
        ];
        const progressiveEvents = service.detectProgressive(events);

        expect(progressiveEvents).toHaveLength(1);
      });

      it("should handle empty events array", () => {
        const progressiveEvents = service.detectProgressive([]);
        expect(progressiveEvents).toHaveLength(0);
      });

      it("should sort body names alphabetically in progressive event", () => {
        const forming = createMajorAspectEvent(
          "Venus",
          "Sun",
          "Conjunct",
          "Forming",
          moment.utc("2024-03-21T10:00:00.000Z"),
        );
        const dissolving = createMajorAspectEvent(
          "Venus",
          "Sun",
          "Conjunct",
          "Dissolving",
          moment.utc("2024-03-21T14:00:00.000Z"),
        );

        const events = [forming, dissolving];
        const progressiveEvents = service.detectProgressive(events);

        expect(progressiveEvents).toHaveLength(1);
        expect(progressiveEvents[0]).toBeDefined();
        // Should normalize to alphabetical order (capitalized)
        expect(progressiveEvents[0]?.description).toContain("Sun");
        expect(progressiveEvents[0]?.description).toContain("Venus");
      });
    });
  });

  describe("isAspect", () => {
    it("should return true for conjunction within orb", () => {
      expect(
        aspectsUtilitiesService.isAspect({
          longitudeBody1: 0,
          longitudeBody2: 5,
          aspect: "conjunct",
        }),
      ).toBe(true);
      expect(
        aspectsUtilitiesService.isAspect({
          longitudeBody1: 100,
          longitudeBody2: 105,
          aspect: "conjunct",
        }),
      ).toBe(true);
    });

    it("should return false for conjunction outside orb", () => {
      expect(
        aspectsUtilitiesService.isAspect({
          longitudeBody1: 0,
          longitudeBody2: 10,
          aspect: "conjunct",
        }),
      ).toBe(false);
    });

    it("should return true for opposition within orb", () => {
      expect(
        aspectsUtilitiesService.isAspect({
          longitudeBody1: 0,
          longitudeBody2: 180,
          aspect: "opposite",
        }),
      ).toBe(true);
      expect(
        aspectsUtilitiesService.isAspect({
          longitudeBody1: 0,
          longitudeBody2: 175,
          aspect: "opposite",
        }),
      ).toBe(true);
    });

    it("should return true for trine within orb", () => {
      expect(
        aspectsUtilitiesService.isAspect({
          longitudeBody1: 0,
          longitudeBody2: 120,
          aspect: "trine",
        }),
      ).toBe(true);
      expect(
        aspectsUtilitiesService.isAspect({
          longitudeBody1: 0,
          longitudeBody2: 115,
          aspect: "trine",
        }),
      ).toBe(true);
    });

    it("should return true for square within orb", () => {
      expect(
        aspectsUtilitiesService.isAspect({
          longitudeBody1: 0,
          longitudeBody2: 90,
          aspect: "square",
        }),
      ).toBe(true);
      expect(
        aspectsUtilitiesService.isAspect({
          longitudeBody1: 0,
          longitudeBody2: 85,
          aspect: "square",
        }),
      ).toBe(true);
    });

    it("should return true for sextile within orb", () => {
      expect(
        aspectsUtilitiesService.isAspect({
          longitudeBody1: 0,
          longitudeBody2: 60,
          aspect: "sextile",
        }),
      ).toBe(true);
      expect(
        aspectsUtilitiesService.isAspect({
          longitudeBody1: 0,
          longitudeBody2: 57,
          aspect: "sextile",
        }),
      ).toBe(true);
    });
  });

  describe("getMajorAspect", () => {
    it("should return conjunct for bodies at same longitude", () => {
      expect(
        service.getMajorAspect({ longitudeBody1: 45, longitudeBody2: 45 }),
      ).toBe("conjunct");
    });

    it("should return conjunct for bodies within conjunction orb", () => {
      expect(
        service.getMajorAspect({ longitudeBody1: 45, longitudeBody2: 50 }),
      ).toBe("conjunct");
    });

    it("should return opposite for bodies 180° apart", () => {
      expect(
        service.getMajorAspect({ longitudeBody1: 0, longitudeBody2: 180 }),
      ).toBe("opposite");
    });

    it("should return trine for bodies 120° apart", () => {
      expect(
        service.getMajorAspect({ longitudeBody1: 0, longitudeBody2: 120 }),
      ).toBe("trine");
      expect(
        service.getMajorAspect({ longitudeBody1: 0, longitudeBody2: 240 }),
      ).toBe("trine");
    });

    it("should return square for bodies 90° apart", () => {
      expect(
        service.getMajorAspect({ longitudeBody1: 0, longitudeBody2: 90 }),
      ).toBe("square");
      expect(
        service.getMajorAspect({ longitudeBody1: 0, longitudeBody2: 270 }),
      ).toBe("square");
    });

    it("should return sextile for bodies 60° apart", () => {
      expect(
        service.getMajorAspect({ longitudeBody1: 0, longitudeBody2: 60 }),
      ).toBe("sextile");
      expect(
        service.getMajorAspect({ longitudeBody1: 0, longitudeBody2: 300 }),
      ).toBe("sextile");
    });

    it("should return null when no major aspect is within orb", () => {
      expect(
        service.getMajorAspect({ longitudeBody1: 0, longitudeBody2: 25 }),
      ).toBeNull();
      expect(
        service.getMajorAspect({ longitudeBody1: 0, longitudeBody2: 150 }),
      ).toBeNull();
    });

    it("should handle wrapping around 360°", () => {
      expect(
        service.getMajorAspect({ longitudeBody1: 357, longitudeBody2: 2 }),
      ).toBe("conjunct");
    });
  });

  describe("getMajorAspectPhase", () => {
    it("should return forming when entering aspect orb", () => {
      const phase = service.getMajorAspectPhase({
        previousLongitudeBody1: 0,
        previousLongitudeBody2: 171,
        currentLongitudeBody1: 0,
        currentLongitudeBody2: 173,
        nextLongitudeBody1: 0,
        nextLongitudeBody2: 175,
      });
      expect(phase).toBe("forming");
    });

    it("should return dissolving when exiting aspect orb", () => {
      const phase = service.getMajorAspectPhase({
        previousLongitudeBody1: 0,
        previousLongitudeBody2: 185,
        currentLongitudeBody1: 0,
        currentLongitudeBody2: 187,
        nextLongitudeBody1: 0,
        nextLongitudeBody2: 189,
      });
      expect(phase).toBe("dissolving");
    });

    it("should return perfective when crossing the exact aspect angle", () => {
      const phase = service.getMajorAspectPhase({
        previousLongitudeBody1: 0,
        previousLongitudeBody2: 179,
        currentLongitudeBody1: 0,
        currentLongitudeBody2: 180,
        nextLongitudeBody1: 0,
        nextLongitudeBody2: 181,
      });
      expect(phase).toBe("perfective");
    });

    it("should return null when not in any aspect phase", () => {
      const phase = service.getMajorAspectPhase({
        previousLongitudeBody1: 0,
        previousLongitudeBody2: 45,
        currentLongitudeBody1: 0,
        currentLongitudeBody2: 46,
        nextLongitudeBody1: 0,
        nextLongitudeBody2: 47,
      });
      expect(phase).toBeNull();
    });
  });
});
