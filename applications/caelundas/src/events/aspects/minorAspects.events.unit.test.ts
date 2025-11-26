import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import moment from "moment";
import type { Event } from "../../calendar.utilities";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type { Body, MinorAspect } from "../../types";
import {
  getMinorAspectEvent,
  getMinorAspectEvents,
  getMinorAspectDurationEvents,
  writeMinorAspectEvents,
} from "./minorAspects.events";

vi.mock("../../database.utilities", () => ({
  upsertEvents: vi.fn(),
}));

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

describe("minorAspects.events", () => {
  describe("getMinorAspectEvents", () => {
    const createEphemeris = (
      longitudes: Record<string, number>
    ): CoordinateEphemeris => {
      return Object.fromEntries(
        Object.entries(longitudes).map(([timestamp, longitude]) => [
          timestamp,
          { longitude, latitude: 0 },
        ])
      );
    };

    const createDefaultEphemeris = (
      currentMinute: moment.Moment,
      previousMinute: moment.Moment,
      nextMinute: moment.Moment
    ): Record<Body, CoordinateEphemeris> => {
      // Create ephemeris for all minor aspect bodies with far-apart longitudes
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

    it("should detect exact semisextile", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      const coordinateEphemerisByBody = createDefaultEphemeris(
        currentMinute,
        previousMinute,
        nextMinute
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

      const events = getMinorAspectEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      expect(events.length).toBeGreaterThanOrEqual(1);
      const semisextileEvent = events.find(
        (e) =>
          e.description.includes("semisextile") &&
          e.categories.includes("Exact") &&
          e.description.includes("Sun") &&
          e.description.includes("Mercury")
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
        nextMinute
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

      const events = getMinorAspectEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      const formingSemisquare = events.find(
        (e) =>
          e.description.includes("semisquare") &&
          e.categories.includes("Forming") &&
          e.description.includes("Sun") &&
          e.description.includes("Venus")
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
        207, 209, 211, 213,
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
        coordinateEphemerisByBody[body] = createEphemeris({
          [previousMinute.toISOString()]: safeLongitudes[index],
          [currentMinute.toISOString()]: safeLongitudes[index],
          [nextMinute.toISOString()]: safeLongitudes[index],
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

      const events = getMinorAspectEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      const dissolvingQuincunx = events.find(
        (e) =>
          e.description.includes("quincunx") &&
          e.categories.includes("Dissolving") &&
          e.description.includes("Sun") &&
          e.description.includes("Mars")
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
        nextMinute
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

      const events = getMinorAspectEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      expect(events.length).toBeGreaterThanOrEqual(2);
      const sunMercuryAspect = events.find(
        (e) =>
          e.description.includes("Sun") && e.description.includes("Mercury")
      );
      const sunVenusAspect = events.find(
        (e) => e.description.includes("Sun") && e.description.includes("Venus")
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
        50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 51, 53, 55, 57, 59, 61, 63,
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
        coordinateEphemerisByBody[body] = createEphemeris({
          [previousMinute.toISOString()]: safeLongitudes[index],
          [currentMinute.toISOString()]: safeLongitudes[index],
          [nextMinute.toISOString()]: safeLongitudes[index],
        });
      });

      const events = getMinorAspectEvents({
        coordinateEphemerisByBody,
        currentMinute,
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
        nextMinute
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

      const events = getMinorAspectEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      const sunMercuryEvents = events.filter(
        (e) =>
          e.description.includes("Sun") && e.description.includes("Mercury")
      );
      expect(sunMercuryEvents).toHaveLength(1);
    });
  });

  describe("getMinorAspectEvent", () => {
    it("should create exact semisextile event", () => {
      const timestamp = new Date("2024-03-21T12:00:00.000Z");
      const event = getMinorAspectEvent({
        longitudeBody1: 0,
        longitudeBody2: 30,
        timestamp,
        body1: "sun",
        body2: "moon",
        phase: "exact",
      });

      expect(event.summary).toContain("🎯");
      expect(event.summary).toContain("☀️");
      expect(event.summary).toContain("🌙");
      expect(event.summary).toContain("⚺");
      expect(event.description).toBe("Sun exact semisextile Moon");
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Astrology");
      expect(event.categories).toContain("Minor Aspect");
      expect(event.categories).toContain("Sun");
      expect(event.categories).toContain("Moon");
      expect(event.categories).toContain("Semisextile");
      expect(event.categories).toContain("Exact");
      expect(event.start).toEqual(timestamp);
      expect(event.end).toEqual(timestamp);
    });

    it("should create forming semisquare event", () => {
      const timestamp = new Date("2024-03-21T12:00:00.000Z");
      const event = getMinorAspectEvent({
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
      const timestamp = new Date("2024-03-21T12:00:00.000Z");
      const event = getMinorAspectEvent({
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
      const timestamp = new Date("2024-03-21T12:00:00.000Z");
      const event = getMinorAspectEvent({
        longitudeBody1: 0,
        longitudeBody2: 150,
        timestamp,
        body1: "sun",
        body2: "jupiter",
        phase: "exact",
      });

      expect(event.summary).toContain("⚻");
      expect(event.description).toContain("quincunx");
      expect(event.categories).toContain("Quincunx");
    });

    it("should throw error when no minor aspect is found", () => {
      expect(() =>
        getMinorAspectEvent({
          longitudeBody1: 0,
          longitudeBody2: 90,
          timestamp: new Date("2024-03-21T12:00:00.000Z"),
          body1: "sun",
          body2: "moon",
          phase: "exact",
        })
      ).toThrow("No minor aspect found");
    });

    it("should handle wrapped longitudes (near 360/0 degrees)", () => {
      const timestamp = new Date("2024-03-21T12:00:00.000Z");
      const event = getMinorAspectEvent({
        longitudeBody1: 358,
        longitudeBody2: 28,
        timestamp,
        body1: "sun",
        body2: "moon",
        phase: "exact",
      });

      expect(event.description).toContain("semisextile");
    });
  });

  describe("writeMinorAspectEvents", () => {
    it("should write events to file and database", async () => {
      const { upsertEvents } = await import("../../database.utilities");
      const fs = (await import("fs")).default;

      const minorAspectEvents: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "Sun semisextile Moon",
          description: "Sun semisextile Moon",
          categories: ["Minor Aspect"],
        },
      ];

      writeMinorAspectEvents({
        minorAspectEvents,
        minorAspectBodies: ["sun", "moon"],
        start: new Date("2024-03-21T00:00:00.000Z"),
        end: new Date("2024-03-21T23:59:59.000Z"),
      });

      expect(upsertEvents).toHaveBeenCalledWith(minorAspectEvents);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it("should not write if events array is empty", async () => {
      const { upsertEvents } = await import("../../database.utilities");
      const fs = (await import("fs")).default;

      writeMinorAspectEvents({
        minorAspectEvents: [],
        minorAspectBodies: ["sun", "moon"],
        start: new Date("2024-03-21T00:00:00.000Z"),
        end: new Date("2024-03-21T23:59:59.000Z"),
      });

      expect(upsertEvents).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it("should include body names in filename", async () => {
      const fs = (await import("fs")).default;

      const minorAspectEvents: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "Test",
          description: "Test",
          categories: [],
        },
      ];

      writeMinorAspectEvents({
        minorAspectEvents,
        minorAspectBodies: ["sun", "mercury"],
        start: new Date("2024-03-21T00:00:00.000Z"),
        end: new Date("2024-03-21T23:59:59.000Z"),
      });

      expect(fs.writeFileSync).toHaveBeenCalled();
      const callArgs = (fs.writeFileSync as any).mock.calls[0];
      expect(callArgs[0]).toContain("sun,mercury");
    });

    it("should include date range in filename", async () => {
      const fs = (await import("fs")).default;

      const minorAspectEvents: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "Test",
          description: "Test",
          categories: [],
        },
      ];

      const start = new Date("2024-03-21T00:00:00.000Z");
      const end = new Date("2024-03-22T00:00:00.000Z");

      writeMinorAspectEvents({
        minorAspectEvents,
        minorAspectBodies: ["sun"],
        start,
        end,
      });

      expect(fs.writeFileSync).toHaveBeenCalled();
      const callArgs = (fs.writeFileSync as any).mock.calls[0];
      expect(callArgs[0]).toContain(start.toISOString());
      expect(callArgs[0]).toContain(end.toISOString());
    });
  });

  describe("getMinorAspectDurationEvents", () => {
    const createMinorAspectEvent = (
      body1: string,
      body2: string,
      aspect: string,
      phase: string,
      timestamp: Date
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

    it("should create duration events from forming and dissolving pairs", () => {
      // Note: Categories must use Start Case for body/aspect names to match _.startCase() conversion
      const forming = createMinorAspectEvent(
        "Sun",
        "Mercury",
        "Semisextile",
        "Forming",
        new Date("2024-03-21T10:00:00.000Z")
      );
      const dissolving = createMinorAspectEvent(
        "Sun",
        "Mercury",
        "Semisextile",
        "Dissolving",
        new Date("2024-03-21T14:00:00.000Z")
      );

      const events = [forming, dissolving];
      const durationEvents = getMinorAspectDurationEvents(events);

      expect(durationEvents).toHaveLength(1);
      expect(durationEvents[0].start).toEqual(forming.start);
      expect(durationEvents[0].end).toEqual(dissolving.start);
      expect(durationEvents[0].description).toContain("semisextile");
      expect(durationEvents[0].categories).toContain("Minor Aspect");
      expect(durationEvents[0].categories).toContain("Simple Aspect");
    });

    it("should handle multiple aspect types for same body pair", () => {
      const semisextileForming = createMinorAspectEvent(
        "Sun",
        "Mercury",
        "Semisextile",
        "Forming",
        new Date("2024-03-21T10:00:00.000Z")
      );
      const semisextileDissolving = createMinorAspectEvent(
        "Sun",
        "Mercury",
        "Semisextile",
        "Dissolving",
        new Date("2024-03-21T12:00:00.000Z")
      );
      const semisquareForming = createMinorAspectEvent(
        "Sun",
        "Mercury",
        "Semisquare",
        "Forming",
        new Date("2024-03-21T14:00:00.000Z")
      );
      const semisquareDissolving = createMinorAspectEvent(
        "Sun",
        "Mercury",
        "Semisquare",
        "Dissolving",
        new Date("2024-03-21T16:00:00.000Z")
      );

      const events = [
        semisextileForming,
        semisextileDissolving,
        semisquareForming,
        semisquareDissolving,
      ];
      const durationEvents = getMinorAspectDurationEvents(events);

      expect(durationEvents).toHaveLength(2);
    });

    it("should handle multiple body pairs", () => {
      const sunMercuryForming = createMinorAspectEvent(
        "Sun",
        "Mercury",
        "Semisextile",
        "Forming",
        new Date("2024-03-21T10:00:00.000Z")
      );
      const sunMercuryDissolving = createMinorAspectEvent(
        "Sun",
        "Mercury",
        "Semisextile",
        "Dissolving",
        new Date("2024-03-21T12:00:00.000Z")
      );
      const venusJupiterForming = createMinorAspectEvent(
        "Venus",
        "Jupiter",
        "Quincunx",
        "Forming",
        new Date("2024-03-21T12:00:00.000Z")
      );
      const venusJupiterDissolving = createMinorAspectEvent(
        "Venus",
        "Jupiter",
        "Quincunx",
        "Dissolving",
        new Date("2024-03-21T16:00:00.000Z")
      );

      const events = [
        sunMercuryForming,
        sunMercuryDissolving,
        venusJupiterForming,
        venusJupiterDissolving,
      ];
      const durationEvents = getMinorAspectDurationEvents(events);

      expect(durationEvents).toHaveLength(2);
    });

    it("should filter out non-minor-aspect events", () => {
      const minorAspectForming = createMinorAspectEvent(
        "Sun",
        "Venus",
        "Semisextile",
        "Forming",
        new Date("2024-03-21T10:00:00.000Z")
      );
      const minorAspectDissolving = createMinorAspectEvent(
        "Sun",
        "Venus",
        "Semisextile",
        "Dissolving",
        new Date("2024-03-21T14:00:00.000Z")
      );
      const nonAspectEvent: Event = {
        start: new Date("2024-03-21T12:00:00.000Z"),
        end: new Date("2024-03-21T12:00:00.000Z"),
        summary: "Sunrise",
        description: "Sunrise",
        categories: ["Solar", "Daily Cycle"],
      };

      const events = [
        minorAspectForming,
        minorAspectDissolving,
        nonAspectEvent,
      ];
      const durationEvents = getMinorAspectDurationEvents(events);

      expect(durationEvents).toHaveLength(1);
    });

    it("should handle empty events array", () => {
      const durationEvents = getMinorAspectDurationEvents([]);
      expect(durationEvents).toHaveLength(0);
    });

    it("should sort body names alphabetically in duration event", () => {
      const forming = createMinorAspectEvent(
        "Venus",
        "Sun",
        "Semisextile",
        "Forming",
        new Date("2024-03-21T10:00:00.000Z")
      );
      const dissolving = createMinorAspectEvent(
        "Venus",
        "Sun",
        "Semisextile",
        "Dissolving",
        new Date("2024-03-21T14:00:00.000Z")
      );

      const events = [forming, dissolving];
      const durationEvents = getMinorAspectDurationEvents(events);

      expect(durationEvents).toHaveLength(1);
      // Should normalize to alphabetical order (capitalized)
      expect(durationEvents[0].description).toContain("Sun");
      expect(durationEvents[0].description).toContain("Venus");
    });
  });
});
