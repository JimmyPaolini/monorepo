import moment from "moment-timezone";
import { describe, expect, it, vi } from "vitest";

import {
  getSpecialtyAspectDurationEvents,
  getSpecialtyAspectEvent,
  getSpecialtyAspectEvents,
  writeSpecialtyAspectEvents,
} from "./specialtyAspects.events";

import type { Event } from "../../calendar.utilities";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type { Body } from "../../types";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

describe("specialtyAspects.events", () => {
  describe("getSpecialtyAspectEvents", () => {
    const createEphemeris = (
      longitudes: Record<string, number>,
    ): CoordinateEphemeris => {
      const ephemeris: CoordinateEphemeris = {};
      Object.keys(longitudes).forEach((timestamp) => {
        const longitude = longitudes[timestamp];
        if (longitude === undefined) {
          throw new Error(`longitude is undefined for timestamp ${timestamp}`);
        }
        ephemeris[timestamp] = {
          longitude,
          latitude: 0,
        };
      });
      return ephemeris;
    };

    const createDefaultEphemeris = (
      currentMinute: moment.Moment,
      previousMinute: moment.Moment,
      nextMinute: moment.Moment,
    ): Record<Body, CoordinateEphemeris> => {
      const allBodies = [
        "sun",
        "mercury",
        "venus",
        "mars",
        "jupiter",
        "saturn",
        "uranus",
        "neptune",
        "pluto",
        "chiron",
        "lilith",
        "ceres",
        "pallas",
        "juno",
        "vesta",
        "halley",
        "north lunar node",
        "lunar apogee",
      ] as Body[];

      const ephemerisByBody = {} as Record<Body, CoordinateEphemeris>;
      // Position all bodies at 200° - a safe angle that doesn't create specialty aspects
      // with common test positions (0°, 40°, 72°, 108°)
      // Specialty aspects: quintile (72°), biquintile (144°), septile (51.43°),
      // novile (40°), undecile (32.73°), decile (36°), tredecile (108°)
      allBodies.forEach((body) => {
        ephemerisByBody[body] = createEphemeris({
          [previousMinute.toISOString()]: 200,
          [currentMinute.toISOString()]: 200,
          [nextMinute.toISOString()]: 200,
        });
      });
      return ephemerisByBody;
    };

    it("should detect exact quintile", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      const coordinateEphemerisByBody = createDefaultEphemeris(
        currentMinute,
        previousMinute,
        nextMinute,
      );

      coordinateEphemerisByBody.sun = createEphemeris({
        [previousMinute.toISOString()]: 71,
        [currentMinute.toISOString()]: 72,
        [nextMinute.toISOString()]: 73,
      });
      coordinateEphemerisByBody.mercury = createEphemeris({
        [previousMinute.toISOString()]: 1,
        [currentMinute.toISOString()]: 0,
        [nextMinute.toISOString()]: 359,
      });

      const events = getSpecialtyAspectEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      expect(events.length).toBeGreaterThanOrEqual(1);
      const quintileEvent = events.find(
        (e) =>
          e.description.includes("quintile") &&
          e.categories.includes("Exact") &&
          e.description.includes("Sun") &&
          e.description.includes("Mercury"),
      );
      expect(quintileEvent).toBeDefined();
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

      // Sun at 72°, Venus moving from 357° to 358.5° (entering 2° quintile orb)
      // Angle from Sun: 75° (outside) → 73.5° (inside) → entering orb around 72° (within 2°)
      coordinateEphemerisByBody.sun = createEphemeris({
        [previousMinute.toISOString()]: 72,
        [currentMinute.toISOString()]: 72,
        [nextMinute.toISOString()]: 72,
      });
      coordinateEphemerisByBody.venus = createEphemeris({
        [previousMinute.toISOString()]: 357,
        [currentMinute.toISOString()]: 358.5,
        [nextMinute.toISOString()]: 359.5,
      });

      const events = getSpecialtyAspectEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      expect(events.length).toBeGreaterThanOrEqual(1);
      const formingQuintile = events.find(
        (e) =>
          e.description.includes("quintile") &&
          e.categories.includes("Forming") &&
          e.description.includes("Sun") &&
          e.description.includes("Venus"),
      );
      expect(formingQuintile).toBeDefined();
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

      // Sun at 0°, Mars moving from 40.5° to 41.5° (exiting 1° novile orb at 40°)
      // Angle: 40.5° to 41.5° → exiting 1° orb around 40°
      coordinateEphemerisByBody.sun = createEphemeris({
        [previousMinute.toISOString()]: 0,
        [currentMinute.toISOString()]: 0,
        [nextMinute.toISOString()]: 0,
      });
      coordinateEphemerisByBody.mars = createEphemeris({
        [previousMinute.toISOString()]: 40.5,
        [currentMinute.toISOString()]: 40.8,
        [nextMinute.toISOString()]: 41.5,
      });

      const events = getSpecialtyAspectEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      expect(events.length).toBeGreaterThanOrEqual(1);
      const dissolvingNovile = events.find(
        (e) =>
          e.description.includes("novile") &&
          e.categories.includes("Dissolving") &&
          e.description.includes("Sun") &&
          e.description.includes("Mars"),
      );
      expect(dissolvingNovile).toBeDefined();
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

      // Set Sun, Mercury, Venus with quintile and novile aspects
      // Sun at 72°, Mercury at 0° = quintile (72°)
      // Sun at 72°, Venus at 112° = novile (40°)
      coordinateEphemerisByBody.sun = createEphemeris({
        [previousMinute.toISOString()]: 71,
        [currentMinute.toISOString()]: 72,
        [nextMinute.toISOString()]: 73,
      });
      coordinateEphemerisByBody.mercury = createEphemeris({
        [previousMinute.toISOString()]: 1,
        [currentMinute.toISOString()]: 0,
        [nextMinute.toISOString()]: 359,
      });
      coordinateEphemerisByBody.venus = createEphemeris({
        [previousMinute.toISOString()]: 111,
        [currentMinute.toISOString()]: 112,
        [nextMinute.toISOString()]: 113,
      });

      const events = getSpecialtyAspectEvents({
        coordinateEphemerisByBody,
        currentMinute,
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

    it("should not detect aspects outside orb", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      // Create ephemeris with all bodies clustered in a small range to avoid aspects
      // Specialty aspects have tight orbs (1-2°), so spacing within 10° avoids all aspects
      // Positions: 50° through 60° (10° span, no pairs will match specialty aspect angles)
      const safeLongitudes = [
        50, 52, 54, 56, 58, 60, 51, 53, 55, 57, 59, 50.5, 52.5, 54.5, 56.5,
        58.5, 60.5, 51.5,
      ];
      const allBodies = [
        "sun",
        "mercury",
        "venus",
        "mars",
        "jupiter",
        "saturn",
        "uranus",
        "neptune",
        "pluto",
        "chiron",
        "lilith",
        "ceres",
        "pallas",
        "juno",
        "vesta",
        "halley",
        "north lunar node",
        "lunar apogee",
      ] as Body[];

      const coordinateEphemerisByBody = {} as Record<Body, CoordinateEphemeris>;
      allBodies.forEach((body, index) => {
        const longitude = safeLongitudes[index] ?? 0;
        coordinateEphemerisByBody[body] = createEphemeris({
          [previousMinute.toISOString()]: longitude,
          [currentMinute.toISOString()]: longitude,
          [nextMinute.toISOString()]: longitude,
        });
      });

      const events = getSpecialtyAspectEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      expect(events.length).toBe(0);
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
        [previousMinute.toISOString()]: 71,
        [currentMinute.toISOString()]: 72,
        [nextMinute.toISOString()]: 73,
      });
      coordinateEphemerisByBody.mercury = createEphemeris({
        [previousMinute.toISOString()]: 1,
        [currentMinute.toISOString()]: 0,
        [nextMinute.toISOString()]: 359,
      });

      const events = getSpecialtyAspectEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      const sunMercuryEvents = events.filter(
        (e) =>
          e.description.includes("Sun") && e.description.includes("Mercury"),
      );

      expect(sunMercuryEvents.length).toBe(1);
    });
  });

  describe("getSpecialtyAspectEvent", () => {
    it("should create exact quintile event", () => {
      const timestamp = new Date("2024-03-21T12:00:00.000Z");
      const event = getSpecialtyAspectEvent({
        longitudeBody1: 0,
        longitudeBody2: 72,
        timestamp,
        body1: "sun",
        body2: "moon",
        phase: "exact",
      });

      expect(event.summary).toContain("🎯");
      expect(event.summary).toContain("☀️");
      expect(event.summary).toContain("🌙");
      expect(event.summary).toContain("⬠");
      expect(event.description).toBe("Sun exact quintile Moon");
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Astrology");
      expect(event.categories).toContain("Specialty Aspect");
      expect(event.categories).toContain("Sun");
      expect(event.categories).toContain("Moon");
      expect(event.categories).toContain("Quintile");
      expect(event.categories).toContain("Exact");
    });

    it("should create forming septile event", () => {
      const timestamp = new Date("2024-03-21T12:00:00.000Z");
      const event = getSpecialtyAspectEvent({
        longitudeBody1: 0,
        longitudeBody2: 50.8,
        timestamp,
        body1: "sun",
        body2: "venus",
        phase: "forming",
      });

      expect(event.summary).toContain("➡️");
      expect(event.summary).toContain("☀️");
      expect(event.summary).toContain("♀️");
      expect(event.summary).toContain("S");
      expect(event.description).toBe("Sun forming septile Venus");
      expect(event.categories).toContain("Forming");
    });

    it("should create dissolving biquintile event", () => {
      const timestamp = new Date("2024-03-21T12:00:00.000Z");
      const event = getSpecialtyAspectEvent({
        longitudeBody1: 0,
        longitudeBody2: 145.5,
        timestamp,
        body1: "sun",
        body2: "mars",
        phase: "dissolving",
      });

      expect(event.summary).toContain("⬅️");
      expect(event.summary).toContain("☀️");
      expect(event.summary).toContain("♂️");
      expect(event.summary).toContain("±");
      expect(event.description).toBe("Sun dissolving biquintile Mars");
      expect(event.categories).toContain("Dissolving");
    });

    it("should create novile event", () => {
      const timestamp = new Date("2024-03-21T12:00:00.000Z");
      const event = getSpecialtyAspectEvent({
        longitudeBody1: 0,
        longitudeBody2: 40,
        timestamp,
        body1: "sun",
        body2: "jupiter",
        phase: "exact",
      });

      expect(event.summary).toContain("🎯");
      expect(event.summary).toContain("N");
      expect(event.description).toContain("novile");
    });

    it("should throw error when no specialty aspect is found", () => {
      const timestamp = new Date("2024-03-21T12:00:00.000Z");
      expect(() =>
        getSpecialtyAspectEvent({
          longitudeBody1: 0,
          longitudeBody2: 90,
          timestamp,
          body1: "sun",
          body2: "moon",
          phase: "exact",
        }),
      ).toThrow("No specialty aspect found");
    });

    it("should handle wrapped longitudes (near 360/0 degrees)", () => {
      const timestamp = new Date("2024-03-21T12:00:00.000Z");
      const event = getSpecialtyAspectEvent({
        longitudeBody1: 350,
        longitudeBody2: 62,
        timestamp,
        body1: "sun",
        body2: "moon",
        phase: "exact",
      });

      expect(event.summary).toContain("quintile");
      expect(event.description).toBe("Sun exact quintile Moon");
    });
  });

  describe("writeSpecialtyAspectEvents", () => {
    it("should write events to file and database", async () => {
      const events: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "Sun quintile Moon",
          description: "Sun exact quintile Moon",
          categories: ["Specialty Aspect"],
        },
      ];

      const fs = (await import("fs")).default;

      writeSpecialtyAspectEvents({
        start: new Date("2024-03-21T00:00:00.000Z"),
        end: new Date("2024-03-21T23:59:59.000Z"),
        specialtyAspectBodies: ["sun", "moon"],
        specialtyAspectEvents: events,
      });

      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it("should not write if events array is empty", async () => {
      const fs = (await import("fs")).default;

      writeSpecialtyAspectEvents({
        start: new Date("2024-03-21T00:00:00.000Z"),
        end: new Date("2024-03-21T23:59:59.000Z"),
        specialtyAspectBodies: ["sun", "moon"],
        specialtyAspectEvents: [],
      });

      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it("should include body names in filename", async () => {
      const events: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "Sun quintile Moon",
          description: "Sun exact quintile Moon",
          categories: ["Specialty Aspect"],
        },
      ];

      const fs = (await import("fs")).default;

      writeSpecialtyAspectEvents({
        start: new Date("2024-03-21T00:00:00.000Z"),
        end: new Date("2024-03-21T23:59:59.000Z"),
        specialtyAspectBodies: ["sun", "moon", "mars"],
        specialtyAspectEvents: events,
      });

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      if (!writeCall) {
        throw new Error("writeCall is undefined");
      }
      const filename = writeCall[0];
      expect(filename).toContain("sun,moon,mars");
    });

    it("should include date range in filename", async () => {
      const events: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "Sun quintile Moon",
          description: "Sun exact quintile Moon",
          categories: ["Specialty Aspect"],
        },
      ];

      const fs = (await import("fs")).default;

      writeSpecialtyAspectEvents({
        start: new Date("2024-03-21T00:00:00.000Z"),
        end: new Date("2024-03-22T00:00:00.000Z"),
        specialtyAspectBodies: ["sun", "moon"],
        specialtyAspectEvents: events,
      });

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      if (!writeCall) {
        throw new Error("writeCall is undefined");
      }
      const filename = writeCall[0];
      expect(filename).toContain(
        "2024-03-21T00:00:00.000Z-2024-03-22T00:00:00.000Z",
      );
    });
  });

  describe("getSpecialtyAspectDurationEvents", () => {
    it("should create duration events from forming and dissolving pairs", () => {
      const formingEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "➡️ ☀️ ⬠ ☿ Sun forming quintile Mercury",
        description: "Sun forming quintile Mercury",
        categories: [
          "Astronomy",
          "Astrology",
          "Specialty Aspect",
          "Sun",
          "Mercury",
          "Quintile",
          "Forming",
        ],
      };

      const dissolvingEvent: Event = {
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "⬅️ ☀️ ⬠ ☿ Sun dissolving quintile Mercury",
        description: "Sun dissolving quintile Mercury",
        categories: [
          "Astronomy",
          "Astrology",
          "Specialty Aspect",
          "Sun",
          "Mercury",
          "Quintile",
          "Dissolving",
        ],
      };

      const durationEvents = getSpecialtyAspectDurationEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(durationEvents.length).toBe(1);
      expect(durationEvents[0]).toBeDefined();
      expect(durationEvents[0]?.start).toEqual(formingEvent.start);
      expect(durationEvents[0]?.end).toEqual(dissolvingEvent.start);
      expect(durationEvents[0]?.description).toBe("Mercury quintile Sun");
      expect(durationEvents[0]?.categories).toContain("Simple Aspect");
      expect(durationEvents[0]?.categories).toContain("Specialty Aspect");
    });

    it("should handle multiple aspect types for same body pair", () => {
      const quintileForming: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "forming",
        description: "Sun forming quintile Mercury",
        categories: [
          "Specialty Aspect",
          "Sun",
          "Mercury",
          "Quintile",
          "Forming",
        ],
      };

      const quintileDissolving: Event = {
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "dissolving",
        description: "Sun dissolving quintile Mercury",
        categories: [
          "Specialty Aspect",
          "Sun",
          "Mercury",
          "Quintile",
          "Dissolving",
        ],
      };

      const biquintileForming: Event = {
        start: new Date("2024-03-22T10:00:00.000Z"),
        end: new Date("2024-03-22T10:00:00.000Z"),
        summary: "forming",
        description: "Sun forming biquintile Mercury",
        categories: [
          "Specialty Aspect",
          "Sun",
          "Mercury",
          "Biquintile",
          "Forming",
        ],
      };

      const biquintileDissolving: Event = {
        start: new Date("2024-03-22T14:00:00.000Z"),
        end: new Date("2024-03-22T14:00:00.000Z"),
        summary: "dissolving",
        description: "Sun dissolving biquintile Mercury",
        categories: [
          "Specialty Aspect",
          "Sun",
          "Mercury",
          "Biquintile",
          "Dissolving",
        ],
      };

      const durationEvents = getSpecialtyAspectDurationEvents([
        quintileForming,
        quintileDissolving,
        biquintileForming,
        biquintileDissolving,
      ]);

      expect(durationEvents.length).toBe(2);
      expect(
        durationEvents.find((e) => e.description.includes("quintile")),
      ).toBeDefined();
      expect(
        durationEvents.find((e) => e.description.includes("biquintile")),
      ).toBeDefined();
    });

    it("should handle multiple body pairs", () => {
      const sunMercuryForming: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "forming",
        description: "Sun forming quintile Mercury",
        categories: [
          "Specialty Aspect",
          "Sun",
          "Mercury",
          "Quintile",
          "Forming",
        ],
      };

      const sunMercuryDissolving: Event = {
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "dissolving",
        description: "Sun dissolving quintile Mercury",
        categories: [
          "Specialty Aspect",
          "Sun",
          "Mercury",
          "Quintile",
          "Dissolving",
        ],
      };

      const venusMarForming: Event = {
        start: new Date("2024-03-21T11:00:00.000Z"),
        end: new Date("2024-03-21T11:00:00.000Z"),
        summary: "forming",
        description: "Venus forming septile Mars",
        categories: ["Specialty Aspect", "Venus", "Mars", "Septile", "Forming"],
      };

      const venusMarDissolving: Event = {
        start: new Date("2024-03-21T15:00:00.000Z"),
        end: new Date("2024-03-21T15:00:00.000Z"),
        summary: "dissolving",
        description: "Venus dissolving septile Mars",
        categories: [
          "Specialty Aspect",
          "Venus",
          "Mars",
          "Septile",
          "Dissolving",
        ],
      };

      const durationEvents = getSpecialtyAspectDurationEvents([
        sunMercuryForming,
        sunMercuryDissolving,
        venusMarForming,
        venusMarDissolving,
      ]);

      expect(durationEvents.length).toBe(2);
      expect(
        durationEvents.find(
          (e) =>
            e.description.includes("Sun") && e.description.includes("Mercury"),
        ),
      ).toBeDefined();
      expect(
        durationEvents.find(
          (e) =>
            e.description.includes("Venus") && e.description.includes("Mars"),
        ),
      ).toBeDefined();
    });

    it("should filter out non-specialty-aspect events", () => {
      const specialtyAspectEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "forming",
        description: "Sun forming quintile Moon",
        categories: ["Specialty Aspect", "Sun", "Moon", "Quintile", "Forming"],
      };

      const nonSpecialtyAspectEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "other event",
        description: "Some other event",
        categories: ["Other"],
      };

      const durationEvents = getSpecialtyAspectDurationEvents([
        specialtyAspectEvent,
        nonSpecialtyAspectEvent,
      ]);

      expect(
        durationEvents.every((e) => e.categories.includes("Specialty Aspect")),
      ).toBe(true);
    });

    it("should handle empty events array", () => {
      const durationEvents = getSpecialtyAspectDurationEvents([]);
      expect(durationEvents.length).toBe(0);
    });

    it("should sort body names alphabetically in duration event", () => {
      const formingEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "forming",
        description: "Venus forming quintile Mars",
        categories: [
          "Specialty Aspect",
          "Venus",
          "Mars",
          "Quintile",
          "Forming",
        ],
      };

      const dissolvingEvent: Event = {
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "dissolving",
        description: "Venus dissolving quintile Mars",
        categories: [
          "Specialty Aspect",
          "Venus",
          "Mars",
          "Quintile",
          "Dissolving",
        ],
      };

      const durationEvents = getSpecialtyAspectDurationEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(durationEvents.length).toBe(1);
      expect(durationEvents[0]).toBeDefined();
      // Mars comes before Venus alphabetically
      expect(durationEvents[0]?.categories).toContain("Mars");
      expect(durationEvents[0]?.categories).toContain("Venus");
      const categories = durationEvents[0]?.categories;
      if (!categories) {
        throw new Error("categories is undefined");
      }
      const marsIndex = categories.indexOf("Mars");
      const venusIndex = categories.indexOf("Venus");
      expect(marsIndex).toBeLessThan(venusIndex);
    });
  });
});
