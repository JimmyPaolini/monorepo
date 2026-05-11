import { minorAspectBodies } from "@caelundas/src/caelundas.types";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { AspectsUtilitiesService } from "@caelundas/src/modules/events/aspects/aspects.utilities";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { Test } from "@nestjs/testing";
import moment, { type Moment } from "moment-timezone";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { MinorAspectsService } from "./minor-aspects.service";

import type { Body } from "@caelundas/src/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { CoordinateEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

describe("MinorAspectsService", () => {
  let service: MinorAspectsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MinorAspectsService,
        AspectsUtilitiesService,
        EphemerisService,
        MathService,
      ],
    }).compile();
    service = module.get(MinorAspectsService);
  });

  describe("minorAspects.events", () => {
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
        // Create ephemeris for all minor aspect bodies with far-apart longitudes
        const allBodies = minorAspectBodies;

        const ephemerisByBody = {} as Record<Body, CoordinateEphemeris>;
        // Position all bodies at 200° - a safe angle that doesn't create minor aspects
        // with common test positions (0°, 30°, 75°)
        // 200° from 0° = 200° (no aspect), from 30° = 170° (no aspect), from 75° = 125° (no aspect)
        allBodies.forEach((body) => {
          ephemerisByBody[body] = createEphemeris({
            [previousMinute.toISOString()]: 200,
            [currentMinute.toISOString()]: 200,
            [nextMinute.toISOString()]: 200,
          });
        });
        return ephemerisByBody;
      };

      it("should detect perfective semisextile", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const previousMinute = currentMinute.clone().subtract(1, "minute");
        const nextMinute = currentMinute.clone().add(1, "minute");

        const coordinateEphemerisByBody = createDefaultEphemeris(
          currentMinute,
          previousMinute,
          nextMinute,
        );

        coordinateEphemerisByBody.sun = createEphemeris({
          [previousMinute.toISOString()]: 29,
          [currentMinute.toISOString()]: 30,
          [nextMinute.toISOString()]: 31,
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
        const semisextileEvent = events.find(
          (e) =>
            e.description.includes("semisextile") &&
            e.categories.includes("Perfective") &&
            e.description.includes("Sun") &&
            e.description.includes("Mercury"),
        );
        expect(semisextileEvent).toBeDefined();
      });

      it("should detect forming aspect", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const previousMinute = currentMinute.clone().subtract(1, "minute");
        const nextMinute = currentMinute.clone().add(1, "minute");

        const coordinateEphemerisByBody = createDefaultEphemeris(
          currentMinute,
          previousMinute,
          nextMinute,
        );

        // Semisquare has 2° orb, so venus needs to enter from >47° or <43°
        coordinateEphemerisByBody.sun = createEphemeris({
          [previousMinute.toISOString()]: 0,
          [currentMinute.toISOString()]: 0,
          [nextMinute.toISOString()]: 0,
        });
        coordinateEphemerisByBody.venus = createEphemeris({
          [previousMinute.toISOString()]: 48, // Outside 2° orb (>47°)
          [currentMinute.toISOString()]: 46.5, // Inside 2° orb (entering)
          [nextMinute.toISOString()]: 45.5, // Further in orb
        });

        const events = service.detect({
          coordinateEphemerisByBody,
          minute: currentMinute,
        });

        const formingSemisquare = events.find(
          (e) =>
            e.description.includes("semisquare") &&
            e.categories.includes("Forming") &&
            e.description.includes("Sun") &&
            e.description.includes("Venus"),
        );
        expect(formingSemisquare).toBeDefined();
      });

      it("should detect dissolving aspect", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const previousMinute = currentMinute.clone().subtract(1, "minute");
        const nextMinute = currentMinute.clone().add(1, "minute");

        // Use clustered positions to avoid accidental aspects from default ephemeris
        const safeLongitudes = [
          200, 202, 204, 206, 208, 210, 212, 214, 216, 218, 220, 201, 203, 205,
          207, 209, 211, 213, 215,
        ];
        const allBodies = minorAspectBodies;

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

        // Quincunx has 3° orb, so mars needs to be inside at current and outside at next
        coordinateEphemerisByBody.sun = createEphemeris({
          [previousMinute.toISOString()]: 0,
          [currentMinute.toISOString()]: 0,
          [nextMinute.toISOString()]: 0,
        });
        coordinateEphemerisByBody.mars = createEphemeris({
          [previousMinute.toISOString()]: 151, // Inside 3° orb (1° off)
          [currentMinute.toISOString()]: 152.5, // Still inside 3° orb (2.5° off, moving away)
          [nextMinute.toISOString()]: 154, // Outside 3° orb (4° off, exiting)
        });

        const events = service.detect({
          coordinateEphemerisByBody,
          minute: currentMinute,
        });

        const dissolvingQuincunx = events.find(
          (e) =>
            e.description.includes("quincunx") &&
            e.categories.includes("Dissolving") &&
            e.description.includes("Sun") &&
            e.description.includes("Mars"),
        );
        expect(dissolvingQuincunx).toBeDefined();
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

        // Set Sun, Mercury, Venus with semisextile and semisquare aspects
        // Sun at 30°, Mercury at 0° = semisextile (30°)
        // Sun at 30°, Venus at 75° = semisquare (45°)
        coordinateEphemerisByBody.sun = createEphemeris({
          [previousMinute.toISOString()]: 29,
          [currentMinute.toISOString()]: 30,
          [nextMinute.toISOString()]: 31,
        });
        coordinateEphemerisByBody.mercury = createEphemeris({
          [previousMinute.toISOString()]: 1,
          [currentMinute.toISOString()]: 0,
          [nextMinute.toISOString()]: 359,
        });
        coordinateEphemerisByBody.venus = createEphemeris({
          [previousMinute.toISOString()]: 74,
          [currentMinute.toISOString()]: 75,
          [nextMinute.toISOString()]: 76,
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
        // Minor aspects: 30° (2° orb), 45° (2° orb), 135° (2° orb), 150° (3° orb)
        // If all bodies are within a ~20° range, no pairs will have angles matching minor aspects
        // Positions: 50° through 70° (20° span, all angles < 28° which is outside all aspect orbs)
        const safeLongitudes = [
          50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 51, 53, 55, 57, 59, 61,
          63, 65,
        ];
        const allBodies = minorAspectBodies;

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
          [previousMinute.toISOString()]: 29,
          [currentMinute.toISOString()]: 30,
          [nextMinute.toISOString()]: 31,
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

        const sunMercuryEvents = events.filter(
          (e) =>
            e.description.includes("Sun") && e.description.includes("Mercury"),
        );
        expect(sunMercuryEvents).toHaveLength(1);
      });
    });

    describe("getMinorAspectEvent", () => {
      it("should create perfective semisextile event", () => {
        const timestamp = moment.utc("2024-03-21T12:00:00.000Z");
        const event = service.buildMinorAspectEvent({
          longitudeBody1: 0,
          longitudeBody2: 30,
          timestamp,
          body1: "sun",
          body2: "moon",
          phase: "perfective",
        });

        expect(event.summary).toContain("🎯");
        expect(event.summary).toContain("☀️");
        expect(event.summary).toContain("🌙");
        expect(event.summary).toContain("⚺");
        expect(event.description).toBe("Sun perfective semisextile Moon");
        expect(event.categories).toContain("Astronomy");
        expect(event.categories).toContain("Astrology");
        expect(event.categories).toContain("Minor Aspect");
        expect(event.categories).toContain("Sun");
        expect(event.categories).toContain("Moon");
        expect(event.categories).toContain("Semisextile");
        expect(event.categories).toContain("Perfective");
        expect(event.start).toEqual(timestamp);
        expect(event.end).toEqual(timestamp);
      });

      it("should create forming semisquare event", () => {
        const timestamp = moment.utc("2024-03-21T12:00:00.000Z");
        const event = service.buildMinorAspectEvent({
          longitudeBody1: 0,
          longitudeBody2: 44,
          timestamp,
          body1: "sun",
          body2: "venus",
          phase: "forming",
        });

        expect(event.summary).toContain("➡️");
        expect(event.summary).toContain("☀️");
        expect(event.summary).toContain("♀️");
        expect(event.summary).toContain("∠");
        expect(event.description).toBe("Sun forming semisquare Venus");
        expect(event.categories).toContain("Forming");
        expect(event.categories).toContain("Semisquare");
      });

      it("should create dissolving sesquiquadrate event", () => {
        const timestamp = moment.utc("2024-03-21T12:00:00.000Z");
        const event = service.buildMinorAspectEvent({
          longitudeBody1: 0,
          longitudeBody2: 136,
          timestamp,
          body1: "sun",
          body2: "mars",
          phase: "dissolving",
        });

        expect(event.summary).toContain("⬅️");
        expect(event.summary).toContain("☀️");
        expect(event.summary).toContain("♂️");
        expect(event.summary).toContain("⚼");
        expect(event.description).toBe("Sun dissolving sesquiquadrate Mars");
        expect(event.categories).toContain("Dissolving");
        expect(event.categories).toContain("Sesquiquadrate");
      });

      it("should create quincunx event", () => {
        const timestamp = moment.utc("2024-03-21T12:00:00.000Z");
        const event = service.buildMinorAspectEvent({
          longitudeBody1: 0,
          longitudeBody2: 150,
          timestamp,
          body1: "sun",
          body2: "jupiter",
          phase: "perfective",
        });

        expect(event.summary).toContain("⚻");
        expect(event.description).toContain("quincunx");
        expect(event.categories).toContain("Quincunx");
      });

      it("should throw error when no minor aspect is found", () => {
        expect(() =>
          service.buildMinorAspectEvent({
            longitudeBody1: 0,
            longitudeBody2: 90,
            timestamp: moment.utc("2024-03-21T12:00:00.000Z"),
            body1: "sun",
            body2: "moon",
            phase: "perfective",
          }),
        ).toThrow("No minor aspect found");
      });

      it("should handle wrapped longitudes (near 360/0 degrees)", () => {
        const timestamp = moment.utc("2024-03-21T12:00:00.000Z");
        const event = service.buildMinorAspectEvent({
          longitudeBody1: 358,
          longitudeBody2: 28,
          timestamp,
          body1: "sun",
          body2: "moon",
          phase: "perfective",
        });

        expect(event.description).toContain("semisextile");
      });
    });

    describe("service.detectProgressive", () => {
      const createMinorAspectEvent = (
        body1: string,
        body2: string,
        aspect: string,
        phase: string,
        timestamp: Moment,
      ): Event => {
        return {
          start: timestamp,
          end: timestamp,
          summary: `${phase} ${body1} ${aspect} ${body2}`,
          description: `${body1} ${phase.toLowerCase()} ${aspect.toLowerCase()} ${body2}`,
          categories: [
            "Astronomy",
            "Astrology",
            "Minor Aspect",
            body1,
            body2,
            aspect,
            phase,
          ],
        };
      };

      it("should create progressive events from forming and dissolving pairs", () => {
        // Note: Categories must use Start Case for body/aspect names to match _.startCase() conversion
        const forming = createMinorAspectEvent(
          "Sun",
          "Mercury",
          "Semisextile",
          "Forming",
          moment.utc("2024-03-21T10:00:00.000Z"),
        );
        const dissolving = createMinorAspectEvent(
          "Sun",
          "Mercury",
          "Semisextile",
          "Dissolving",
          moment.utc("2024-03-21T14:00:00.000Z"),
        );

        const events = [forming, dissolving];
        const progressiveEvents = service.detectProgressive(events);

        expect(progressiveEvents).toHaveLength(1);
        expect(progressiveEvents[0]).toBeDefined();
        expect(progressiveEvents[0]?.start).toEqual(forming.start);
        expect(progressiveEvents[0]?.end).toEqual(dissolving.start);
        expect(progressiveEvents[0]?.description).toContain("semisextile");
        expect(progressiveEvents[0]?.categories).toContain("Minor Aspect");
        expect(progressiveEvents[0]?.categories).toContain("Simple Aspect");
      });

      it("should handle multiple aspect types for same body pair", () => {
        const semisextileForming = createMinorAspectEvent(
          "Sun",
          "Mercury",
          "Semisextile",
          "Forming",
          moment.utc("2024-03-21T10:00:00.000Z"),
        );
        const semisextileDissolving = createMinorAspectEvent(
          "Sun",
          "Mercury",
          "Semisextile",
          "Dissolving",
          moment.utc("2024-03-21T12:00:00.000Z"),
        );
        const semisquareForming = createMinorAspectEvent(
          "Sun",
          "Mercury",
          "Semisquare",
          "Forming",
          moment.utc("2024-03-21T14:00:00.000Z"),
        );
        const semisquareDissolving = createMinorAspectEvent(
          "Sun",
          "Mercury",
          "Semisquare",
          "Dissolving",
          moment.utc("2024-03-21T16:00:00.000Z"),
        );

        const events = [
          semisextileForming,
          semisextileDissolving,
          semisquareForming,
          semisquareDissolving,
        ];
        const progressiveEvents = service.detectProgressive(events);

        expect(progressiveEvents).toHaveLength(2);
      });

      it("should handle multiple body pairs", () => {
        const sunMercuryForming = createMinorAspectEvent(
          "Sun",
          "Mercury",
          "Semisextile",
          "Forming",
          moment.utc("2024-03-21T10:00:00.000Z"),
        );
        const sunMercuryDissolving = createMinorAspectEvent(
          "Sun",
          "Mercury",
          "Semisextile",
          "Dissolving",
          moment.utc("2024-03-21T12:00:00.000Z"),
        );
        const venusJupiterForming = createMinorAspectEvent(
          "Venus",
          "Jupiter",
          "Quincunx",
          "Forming",
          moment.utc("2024-03-21T12:00:00.000Z"),
        );
        const venusJupiterDissolving = createMinorAspectEvent(
          "Venus",
          "Jupiter",
          "Quincunx",
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

      it("should filter out non-minor-aspect events", () => {
        const minorAspectForming = createMinorAspectEvent(
          "Sun",
          "Venus",
          "Semisextile",
          "Forming",
          moment.utc("2024-03-21T10:00:00.000Z"),
        );
        const minorAspectDissolving = createMinorAspectEvent(
          "Sun",
          "Venus",
          "Semisextile",
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
          minorAspectForming,
          minorAspectDissolving,
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
        const forming = createMinorAspectEvent(
          "Venus",
          "Sun",
          "Semisextile",
          "Forming",
          moment.utc("2024-03-21T10:00:00.000Z"),
        );
        const dissolving = createMinorAspectEvent(
          "Venus",
          "Sun",
          "Semisextile",
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

  describe("getMinorAspect", () => {
    it("should return semisextile for bodies 30° apart", () => {
      expect(
        service.getMinorAspect({ longitudeBody1: 0, longitudeBody2: 30 }),
      ).toBe("semisextile");
    });

    it("should return semisquare for bodies 45° apart", () => {
      expect(
        service.getMinorAspect({ longitudeBody1: 0, longitudeBody2: 45 }),
      ).toBe("semisquare");
    });

    it("should return sesquiquadrate for bodies 135° apart", () => {
      expect(
        service.getMinorAspect({ longitudeBody1: 0, longitudeBody2: 135 }),
      ).toBe("sesquiquadrate");
    });

    it("should return quincunx for bodies 150° apart", () => {
      expect(
        service.getMinorAspect({ longitudeBody1: 0, longitudeBody2: 150 }),
      ).toBe("quincunx");
    });

    it("should return null when no minor aspect is within orb", () => {
      expect(
        service.getMinorAspect({ longitudeBody1: 0, longitudeBody2: 10 }),
      ).toBeNull();
      expect(
        service.getMinorAspect({ longitudeBody1: 0, longitudeBody2: 120 }),
      ).toBeNull();
    });
  });

  describe("getMinorAspectPhase", () => {
    it("should detect minor aspect phases", () => {
      const phase = service.getMinorAspectPhase({
        previousLongitudeBody1: 0,
        previousLongitudeBody2: 27,
        currentLongitudeBody1: 0,
        currentLongitudeBody2: 29,
        nextLongitudeBody1: 0,
        nextLongitudeBody2: 30,
      });
      expect(phase).toBe("forming");
    });
  });
});
