import moment from "moment-timezone";
import { describe, expect, it, vi } from "vitest";

import { MARGIN_MINUTES } from "../../calendar.utilities";

import {
  getRetrogradeDurationEvents,
  getRetrogradeEvent,
  getRetrogradeEvents,
} from "./retrogrades.events";

import type { Event } from "../../calendar.utilities";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type { RetrogradeBody } from "../../types";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

describe("retrogrades.events", () => {
  // Helper to create ephemeris data with margin
  function createCoordinateEphemeris(
    currentMinute: moment.Moment,
    longitudes: number[]
  ): CoordinateEphemeris {
    const ephemeris: CoordinateEphemeris = {};
    const totalMinutes = MARGIN_MINUTES * 2 + 1;

    for (let i = 0; i < totalMinutes; i++) {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - i, "minutes");
      const longitude = longitudes[i] ?? longitudes[longitudes.length - 1] ?? 0;
      ephemeris[minute.toISOString()] = {
        longitude,
        latitude: 0,
      };
    }

    return ephemeris;
  }

  describe("getRetrogradeEvents", () => {
    it("should detect retrograde station when longitude starts decreasing", () => {
      const currentMinute = moment.utc("2024-04-01T12:00:00.000Z");

      // Mercury slowing down and then going retrograde
      // Longitudes increasing slower then decreasing (retrograde)
      const longitudes: number[] = [];
      for (let i = 0; i < MARGIN_MINUTES; i++) {
        // Previous: increasing toward maximum
        longitudes.push(100 + i * 0.001);
      }
      longitudes.push(100 + MARGIN_MINUTES * 0.001); // Current at peak
      for (let i = 0; i < MARGIN_MINUTES; i++) {
        // Next: decreasing (retrograde)
        longitudes.push(100 + MARGIN_MINUTES * 0.001 - (i + 1) * 0.001);
      }

      const mercuryEphemeris = createCoordinateEphemeris(
        currentMinute,
        longitudes
      );

      // Create empty ephemeris for other bodies
      const emptyEphemeris: CoordinateEphemeris = {};
      for (let i = -MARGIN_MINUTES; i <= MARGIN_MINUTES; i++) {
        const minute = currentMinute.clone().add(i, "minutes");
        emptyEphemeris[minute.toISOString()] = { longitude: 0, latitude: 0 };
      }

      const coordinateEphemerisByBody: Record<
        RetrogradeBody,
        CoordinateEphemeris
      > = {
        mercury: mercuryEphemeris,
        venus: emptyEphemeris,
        mars: emptyEphemeris,
        jupiter: emptyEphemeris,
        saturn: emptyEphemeris,
        uranus: emptyEphemeris,
        neptune: emptyEphemeris,
        pluto: emptyEphemeris,
        chiron: emptyEphemeris,
        lilith: emptyEphemeris,
        ceres: emptyEphemeris,
        pallas: emptyEphemeris,
        juno: emptyEphemeris,
        vesta: emptyEphemeris,
      };

      const events = getRetrogradeEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      const mercuryRetrograde = events.find(
        (e) =>
          e.description.includes("Mercury") &&
          e.description.includes("Retrograde")
      );
      expect(mercuryRetrograde).toBeDefined();
    });

    it("should return empty array when no retrograde events occur", () => {
      const currentMinute = moment.utc("2024-04-01T12:00:00.000Z");

      // All planets moving direct (increasing longitude)
      const directLongitudes: number[] = [];
      for (let i = 0; i < MARGIN_MINUTES * 2 + 1; i++) {
        directLongitudes.push(100 + i * 0.01);
      }

      const directEphemeris = createCoordinateEphemeris(
        currentMinute,
        directLongitudes
      );

      const coordinateEphemerisByBody: Record<
        RetrogradeBody,
        CoordinateEphemeris
      > = {
        mercury: directEphemeris,
        venus: directEphemeris,
        mars: directEphemeris,
        jupiter: directEphemeris,
        saturn: directEphemeris,
        uranus: directEphemeris,
        neptune: directEphemeris,
        pluto: directEphemeris,
        chiron: directEphemeris,
        lilith: directEphemeris,
        ceres: directEphemeris,
        pallas: directEphemeris,
        juno: directEphemeris,
        vesta: directEphemeris,
      };

      const events = getRetrogradeEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("getRetrogradeEvent", () => {
    it("should create a retrograde event with correct structure", () => {
      const timestamp = new Date("2024-04-01T12:00:00.000Z");

      const event = getRetrogradeEvent({
        body: "mercury",
        timestamp,
        direction: "retrograde",
      });

      expect(event.summary).toBe("☿ ↩️ Mercury Stationary Retrograde");
      expect(event.description).toBe("Mercury Stationary Retrograde");
      expect(event.start).toEqual(timestamp);
      expect(event.end).toEqual(timestamp);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Astrology");
      expect(event.categories).toContain("Direction");
      expect(event.categories).toContain("Retrograde");
    });

    it("should create a direct event with correct structure", () => {
      const timestamp = new Date("2024-04-25T12:00:00.000Z");

      const event = getRetrogradeEvent({
        body: "mercury",
        timestamp,
        direction: "direct",
      });

      expect(event.summary).toBe("☿ ↪️ Mercury Stationary Direct");
      expect(event.description).toBe("Mercury Stationary Direct");
      expect(event.categories).toContain("Direct");
      expect(event.categories).not.toContain("Retrograde");
    });

    it("should use correct symbol for Venus", () => {
      const timestamp = new Date("2024-07-22T12:00:00.000Z");

      const event = getRetrogradeEvent({
        body: "venus",
        timestamp,
        direction: "retrograde",
      });

      expect(event.summary).toBe("♀️ ↩️ Venus Stationary Retrograde");
    });

    it("should use correct symbol for Mars", () => {
      const timestamp = new Date("2024-12-06T12:00:00.000Z");

      const event = getRetrogradeEvent({
        body: "mars",
        timestamp,
        direction: "retrograde",
      });

      expect(event.summary).toBe("♂️ ↩️ Mars Stationary Retrograde");
    });

    it("should use correct symbol for Jupiter", () => {
      const timestamp = new Date("2024-10-09T12:00:00.000Z");

      const event = getRetrogradeEvent({
        body: "jupiter",
        timestamp,
        direction: "retrograde",
      });

      expect(event.summary).toBe("♃ ↩️ Jupiter Stationary Retrograde");
    });

    it("should use correct symbol for Saturn", () => {
      const timestamp = new Date("2024-06-29T12:00:00.000Z");

      const event = getRetrogradeEvent({
        body: "saturn",
        timestamp,
        direction: "retrograde",
      });

      expect(event.summary).toBe("♄ ↩️ Saturn Stationary Retrograde");
    });
  });

  describe("writeRetrogradeEvents", () => {
    it("should write events to database and file when events array is not empty", async () => {
      const fs = (await import("fs")).default;

      const events: Event[] = [
        {
          start: new Date("2024-04-01T12:00:00.000Z"),
          end: new Date("2024-04-01T12:00:00.000Z"),
          summary: "☿ ↩️ Mercury Stationary Retrograde",
          description: "Mercury Stationary Retrograde",
          categories: ["Astronomy", "Astrology", "Direction", "Retrograde"],
        },
      ];

      const { writeRetrogradeEvents } = await import("./retrogrades.events");
      writeRetrogradeEvents({
        retrogradeBodies: ["mercury"],
        retrogradeEvents: events,
        start: new Date("2024-01-01"),
        end: new Date("2024-12-31"),
      });

      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it("should not write if events array is empty", async () => {
      const fs = (await import("fs")).default;

      const { writeRetrogradeEvents } = await import("./retrogrades.events");
      writeRetrogradeEvents({
        retrogradeBodies: ["mercury"],
        retrogradeEvents: [],
        start: new Date("2024-01-01"),
        end: new Date("2024-12-31"),
      });

      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe("getRetrogradeDurationEvents", () => {
    it("should create duration event from retrograde to direct", () => {
      const retrogradeEvent: Event = {
        start: new Date("2024-04-01T12:00:00.000Z"),
        end: new Date("2024-04-01T12:00:00.000Z"),
        summary: "☿ ↩️ Mercury Stationary Retrograde",
        description: "Mercury Stationary Retrograde",
        categories: ["Astronomy", "Astrology", "Direction", "Retrograde"],
      };
      const directEvent: Event = {
        start: new Date("2024-04-25T12:00:00.000Z"),
        end: new Date("2024-04-25T12:00:00.000Z"),
        summary: "☿ ↪️ Mercury Stationary Direct",
        description: "Mercury Stationary Direct",
        categories: ["Astronomy", "Astrology", "Direction", "Direct"],
      };

      const durationEvents = getRetrogradeDurationEvents([
        retrogradeEvent,
        directEvent,
      ]);

      // Should create duration events for each planet that has retrograde/direct pairs
      expect(durationEvents.length).toBeGreaterThanOrEqual(1);

      const mercuryDuration = durationEvents.find(
        (e) =>
          e.description.includes("Mercury") &&
          e.description.includes("Retrograde")
      );
      expect(mercuryDuration).toBeDefined();
      if (mercuryDuration) {
        expect(mercuryDuration.start).toEqual(retrogradeEvent.start);
        expect(mercuryDuration.end).toEqual(directEvent.start);
        expect(mercuryDuration.summary).toContain("Retrograde");
      }
    });

    it("should return empty array when no direction events provided", () => {
      const durationEvents = getRetrogradeDurationEvents([]);

      expect(durationEvents).toHaveLength(0);
    });

    it("should handle multiple planets retrograde periods", () => {
      const mercuryRetrograde: Event = {
        start: new Date("2024-04-01T12:00:00.000Z"),
        end: new Date("2024-04-01T12:00:00.000Z"),
        summary: "☿ ↩️ Mercury Stationary Retrograde",
        description: "Mercury Stationary Retrograde",
        categories: ["Astronomy", "Astrology", "Direction", "Retrograde"],
      };
      const mercuryDirect: Event = {
        start: new Date("2024-04-25T12:00:00.000Z"),
        end: new Date("2024-04-25T12:00:00.000Z"),
        summary: "☿ ↪️ Mercury Stationary Direct",
        description: "Mercury Stationary Direct",
        categories: ["Astronomy", "Astrology", "Direction", "Direct"],
      };
      const venusRetrograde: Event = {
        start: new Date("2024-07-22T12:00:00.000Z"),
        end: new Date("2024-07-22T12:00:00.000Z"),
        summary: "♀️ ↩️ Venus Stationary Retrograde",
        description: "Venus Stationary Retrograde",
        categories: ["Astronomy", "Astrology", "Direction", "Retrograde"],
      };
      const venusDirect: Event = {
        start: new Date("2024-09-03T12:00:00.000Z"),
        end: new Date("2024-09-03T12:00:00.000Z"),
        summary: "♀️ ↪️ Venus Stationary Direct",
        description: "Venus Stationary Direct",
        categories: ["Astronomy", "Astrology", "Direction", "Direct"],
      };

      const durationEvents = getRetrogradeDurationEvents([
        mercuryRetrograde,
        mercuryDirect,
        venusRetrograde,
        venusDirect,
      ]);

      // Should have duration events for both Mercury and Venus
      expect(durationEvents.length).toBeGreaterThanOrEqual(2);
    });
  });
});
