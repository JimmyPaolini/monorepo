import moment from "moment-timezone";
import { describe, expect, it, vi } from "vitest";

import {
  getMajorAspectDurationEvents,
  getMajorAspectEvent,
  getMajorAspectEvents,
  writeMajorAspectEvents,
} from "./majorAspects.events";

import type { Event } from "../../calendar.utilities";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type { Body } from "../../types";

// Mock dependencies (common pattern - see __mocks__/common-mocks.ts for documentation)
vi.mock("../../database.utilities", () => ({
  upsertEvents: vi.fn(),
}));

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

describe("majorAspects.events", () => {
  describe("getMajorAspectEvents", () => {
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
      // Create ephemeris for all major aspect bodies with far-apart longitudes
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

    it("should detect exact conjunction", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      const coordinateEphemerisByBody = createDefaultEphemeris(
        currentMinute,
        previousMinute,
        nextMinute
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

      const events = getMajorAspectEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      expect(events.length).toBeGreaterThanOrEqual(1);
      const conjunctionEvent = events.find(
        (e) =>
          e.description.includes("conjunct") &&
          e.description.includes("Sun") &&
          e.description.includes("Mercury")
      );
      expect(conjunctionEvent).toBeDefined();
      expect(conjunctionEvent?.categories).toContain("Exact");

      // Snapshot testing: validates complete event structure
      // Useful for catching unintended changes to event format
      expect(conjunctionEvent).toMatchSnapshot();
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
        nextMinute
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

      const events = getMajorAspectEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      const formingOpposition = events.find(
        (e) =>
          e.description.includes("opposite") &&
          e.categories.includes("Forming") &&
          e.description.includes("Sun") &&
          e.description.includes("Venus")
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
        nextMinute
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

      const events = getMajorAspectEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      const dissolvingTrine = events.find(
        (e) =>
          e.description.includes("trine") &&
          e.categories.includes("Dissolving") &&
          e.description.includes("Sun") &&
          e.description.includes("Mars")
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
        nextMinute
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

      const events = getMajorAspectEvents({
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
      // Major aspects need specific angle differences: 0°, 60°, 90°, 120°, 180°
      // If all bodies are within a ~35° range, no pairs will have angles matching major aspects
      // Positions: 10° through 45° (35° span, all angles < 56° which is outside all aspect orbs)
      const safeLongitudes = [
        10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44,
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

      const events = getMajorAspectEvents({
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
        [previousMinute.toISOString()]: 0,
        [currentMinute.toISOString()]: 0,
        [nextMinute.toISOString()]: 0,
      });
      coordinateEphemerisByBody.jupiter = createEphemeris({
        [previousMinute.toISOString()]: 1,
        [currentMinute.toISOString()]: 0,
        [nextMinute.toISOString()]: 359,
      });

      const events = getMajorAspectEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      // Should only have one sun-jupiter conjunction, not two (sun-jupiter and jupiter-sun)
      const sunJupiterEvents = events.filter(
        (e) =>
          e.description.includes("Sun") && e.description.includes("Jupiter")
      );
      expect(sunJupiterEvents).toHaveLength(1);
    });
  });

  describe("getMajorAspectEvent", () => {
    it("should create exact conjunction event", () => {
      const timestamp = new Date("2024-03-21T12:00:00.000Z");
      const event = getMajorAspectEvent({
        longitudeBody1: 0,
        longitudeBody2: 0,
        timestamp,
        body1: "sun",
        body2: "moon",
        phase: "exact",
      });

      expect(event.summary).toContain("🎯");
      expect(event.summary).toContain("☀️");
      expect(event.summary).toContain("🌙");
      expect(event.summary).toContain("☌");
      expect(event.description).toBe("Sun exact conjunct Moon");
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Astrology");
      expect(event.categories).toContain("Major Aspect");
      expect(event.categories).toContain("Sun");
      expect(event.categories).toContain("Moon");
      expect(event.categories).toContain("Conjunct");
      expect(event.categories).toContain("Exact");
      expect(event.start).toEqual(timestamp);
      expect(event.end).toEqual(timestamp);
    });

    it("should create forming opposition event", () => {
      const timestamp = new Date("2024-03-21T12:00:00.000Z");
      const event = getMajorAspectEvent({
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
      const timestamp = new Date("2024-03-21T12:00:00.000Z");
      const event = getMajorAspectEvent({
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
      const timestamp = new Date("2024-03-21T12:00:00.000Z");
      const event = getMajorAspectEvent({
        longitudeBody1: 0,
        longitudeBody2: 90,
        timestamp,
        body1: "mercury",
        body2: "saturn",
        phase: "exact",
      });

      expect(event.summary).toContain("☿");
      expect(event.summary).toContain("♄");
      expect(event.summary).toContain("□");
      expect(event.description).toBe("Mercury exact square Saturn");
      expect(event.categories).toContain("Square");
    });

    it("should create sextile event", () => {
      const timestamp = new Date("2024-03-21T12:00:00.000Z");
      const event = getMajorAspectEvent({
        longitudeBody1: 0,
        longitudeBody2: 60,
        timestamp,
        body1: "moon",
        body2: "uranus",
        phase: "exact",
      });

      expect(event.summary).toContain("🌙");
      expect(event.summary).toContain("♅");
      expect(event.summary).toContain("⚹");
      expect(event.description).toBe("Moon exact sextile Uranus");
      expect(event.categories).toContain("Sextile");
    });

    it("should throw error when no major aspect is found", () => {
      const timestamp = new Date("2024-03-21T12:00:00.000Z");

      expect(() =>
        getMajorAspectEvent({
          longitudeBody1: 0,
          longitudeBody2: 45, // No major aspect at 45 degrees
          timestamp,
          body1: "sun",
          body2: "moon",
          phase: "exact",
        })
      ).toThrow("No major aspect found");
    });

    it("should handle wrapped longitudes (near 360/0 degrees)", () => {
      const timestamp = new Date("2024-03-21T12:00:00.000Z");
      const event = getMajorAspectEvent({
        longitudeBody1: 358,
        longitudeBody2: 2,
        timestamp,
        body1: "sun",
        body2: "moon",
        phase: "exact",
      });

      expect(event.description).toContain("conjunct");
    });
  });

  describe("writeMajorAspectEvents", () => {
    it("should write events to file and database", async () => {
      const { upsertEvents } = await import("../../database.utilities");
      const fs = (await import("fs")).default;

      const events: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "Sun conjunct Moon",
          description: "Sun exact conjunct Moon",
          categories: ["Major Aspect"],
        },
      ];

      writeMajorAspectEvents({
        majorAspectEvents: events,
        majorAspectBodies: ["sun", "moon"],
        start: new Date("2024-03-21T00:00:00.000Z"),
        end: new Date("2024-03-22T00:00:00.000Z"),
      });

      expect(upsertEvents).toHaveBeenCalledWith(events);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it("should not write if events array is empty", async () => {
      const { upsertEvents } = await import("../../database.utilities");
      const fs = (await import("fs")).default;

      writeMajorAspectEvents({
        majorAspectEvents: [],
        majorAspectBodies: ["sun", "moon"],
        start: new Date("2024-03-21T00:00:00.000Z"),
        end: new Date("2024-03-22T00:00:00.000Z"),
      });

      expect(upsertEvents).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it("should include body names in filename", async () => {
      const fs = (await import("fs")).default;

      const events: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "Venus trine Jupiter",
          description: "Venus exact trine Jupiter",
          categories: ["Major Aspect"],
        },
      ];

      writeMajorAspectEvents({
        majorAspectEvents: events,
        majorAspectBodies: ["venus", "jupiter", "mars"],
        start: new Date("2024-03-21T00:00:00.000Z"),
        end: new Date("2024-03-22T00:00:00.000Z"),
      });

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining("venus,jupiter,mars"),
        expect.anything()
      );
    });

    it("should include date range in filename", async () => {
      const fs = (await import("fs")).default;

      const events: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "Sun square Mars",
          description: "Sun exact square Mars",
          categories: ["Major Aspect"],
        },
      ];

      const start = new Date("2024-03-21T00:00:00.000Z");
      const end = new Date("2024-03-22T00:00:00.000Z");

      writeMajorAspectEvents({
        majorAspectEvents: events,
        majorAspectBodies: ["sun", "mars"],
        start,
        end,
      });

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining(start.toISOString()),
        expect.anything()
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining(end.toISOString()),
        expect.anything()
      );
    });
  });

  describe("getMajorAspectDurationEvents", () => {
    const createMajorAspectEvent = (
      body1: string,
      body2: string,
      aspect: string,
      phase: string,
      timestamp: Date
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

    it("should create duration events from forming and dissolving pairs", () => {
      const forming = createMajorAspectEvent(
        "Sun",
        "Mercury",
        "Conjunct",
        "Forming",
        new Date("2024-03-21T10:00:00.000Z")
      );
      const dissolving = createMajorAspectEvent(
        "Sun",
        "Mercury",
        "Conjunct",
        "Dissolving",
        new Date("2024-03-21T14:00:00.000Z")
      );

      const events = [forming, dissolving];
      const durationEvents = getMajorAspectDurationEvents(events);

      expect(durationEvents).toHaveLength(1);
      expect(durationEvents[0]).toBeDefined();
      expect(durationEvents[0]?.start).toEqual(forming.start);
      expect(durationEvents[0]?.end).toEqual(dissolving.start);
      expect(durationEvents[0]?.categories).toContain("Simple Aspect");
      expect(durationEvents[0]?.categories).toContain("Major Aspect");
      expect(durationEvents[0]?.summary).toContain("☀️");
      expect(durationEvents[0]?.summary).toContain("☿");
      expect(durationEvents[0]?.summary).toContain("☌");
    });

    it("should handle multiple aspect types for same body pair", () => {
      const formingConjunct = createMajorAspectEvent(
        "Sun",
        "Mercury",
        "Conjunct",
        "Forming",
        new Date("2024-03-21T10:00:00.000Z")
      );
      const dissolvingConjunct = createMajorAspectEvent(
        "Sun",
        "Mercury",
        "Conjunct",
        "Dissolving",
        new Date("2024-03-21T14:00:00.000Z")
      );
      const formingOpposite = createMajorAspectEvent(
        "Sun",
        "Mercury",
        "Opposite",
        "Forming",
        new Date("2024-03-21T20:00:00.000Z")
      );
      const dissolvingOpposite = createMajorAspectEvent(
        "Sun",
        "Mercury",
        "Opposite",
        "Dissolving",
        new Date("2024-03-22T00:00:00.000Z")
      );

      const events = [
        formingConjunct,
        dissolvingConjunct,
        formingOpposite,
        dissolvingOpposite,
      ];
      const durationEvents = getMajorAspectDurationEvents(events);

      expect(durationEvents).toHaveLength(2);
      const conjunctDuration = durationEvents.find((e) =>
        e.description.includes("conjunct")
      );
      const oppositeDuration = durationEvents.find((e) =>
        e.description.includes("opposite")
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
        new Date("2024-03-21T10:00:00.000Z")
      );
      const sunMercuryDissolving = createMajorAspectEvent(
        "Sun",
        "Mercury",
        "Conjunct",
        "Dissolving",
        new Date("2024-03-21T14:00:00.000Z")
      );
      const venusJupiterForming = createMajorAspectEvent(
        "Venus",
        "Jupiter",
        "Trine",
        "Forming",
        new Date("2024-03-21T12:00:00.000Z")
      );
      const venusJupiterDissolving = createMajorAspectEvent(
        "Venus",
        "Jupiter",
        "Trine",
        "Dissolving",
        new Date("2024-03-21T16:00:00.000Z")
      );

      const events = [
        sunMercuryForming,
        sunMercuryDissolving,
        venusJupiterForming,
        venusJupiterDissolving,
      ];
      const durationEvents = getMajorAspectDurationEvents(events);

      expect(durationEvents).toHaveLength(2);
    });

    it("should filter out non-major-aspect events", () => {
      const majorAspectForming = createMajorAspectEvent(
        "Sun",
        "Venus",
        "Conjunct",
        "Forming",
        new Date("2024-03-21T10:00:00.000Z")
      );
      const majorAspectDissolving = createMajorAspectEvent(
        "Sun",
        "Venus",
        "Conjunct",
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
        majorAspectForming,
        majorAspectDissolving,
        nonAspectEvent,
      ];
      const durationEvents = getMajorAspectDurationEvents(events);

      expect(durationEvents).toHaveLength(1);
    });

    it("should handle empty events array", () => {
      const durationEvents = getMajorAspectDurationEvents([]);
      expect(durationEvents).toHaveLength(0);
    });

    it("should sort body names alphabetically in duration event", () => {
      const forming = createMajorAspectEvent(
        "Venus",
        "Sun",
        "Conjunct",
        "Forming",
        new Date("2024-03-21T10:00:00.000Z")
      );
      const dissolving = createMajorAspectEvent(
        "Venus",
        "Sun",
        "Conjunct",
        "Dissolving",
        new Date("2024-03-21T14:00:00.000Z")
      );

      const events = [forming, dissolving];
      const durationEvents = getMajorAspectDurationEvents(events);

      expect(durationEvents).toHaveLength(1);
      expect(durationEvents[0]).toBeDefined();
      // Should normalize to alphabetical order (capitalized)
      expect(durationEvents[0]?.description).toContain("Sun");
      expect(durationEvents[0]?.description).toContain("Venus");
    });
  });
});
