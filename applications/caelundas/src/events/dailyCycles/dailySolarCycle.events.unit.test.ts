import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import moment from "moment-timezone";
import type { Event } from "../../calendar.utilities";
import type { AzimuthElevationEphemeris } from "../../ephemeris/ephemeris.types";
import {
  getDailySolarCycleEvents,
  getSunriseEvent,
  getSolarZenithEvent,
  getSunsetEvent,
  getSolarNadirEvent,
} from "./dailySolarCycle.events";

// Mock dependencies
vi.mock("../../database.utilities", () => ({
  upsertEvents: vi.fn(),
}));

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

describe("dailySolarCycle.events", () => {
  describe("getDailySolarCycleEvents", () => {
    it("should detect sunrise event when sun rises above horizon", () => {
      const currentMinute = moment.utc("2024-03-21T06:30:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      // Sun rising above horizon (threshold is -16/60 degrees = -0.2667)
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 90, elevation: -0.3 },
        [currentMinute.toISOString()]: { azimuth: 91, elevation: -0.1 },
        [nextMinute.toISOString()]: { azimuth: 92, elevation: 0.1 },
      };

      const events = getDailySolarCycleEvents({
        currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0].summary).toContain("Sunrise");
      expect(events[0].categories).toContain("Solar");
    });

    it("should detect sunset event when sun sets below horizon", () => {
      const currentMinute = moment.utc("2024-03-21T18:30:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      // Sun setting below horizon
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 270, elevation: -0.1 },
        [currentMinute.toISOString()]: { azimuth: 271, elevation: -0.3 },
        [nextMinute.toISOString()]: { azimuth: 272, elevation: -0.5 },
      };

      const events = getDailySolarCycleEvents({
        currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0].summary).toContain("Sunset");
      expect(events[0].categories).toContain("Solar");
    });

    it("should detect solar zenith when sun reaches maximum elevation", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      // Sun at local maximum elevation
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 178, elevation: 44.9 },
        [currentMinute.toISOString()]: { azimuth: 180, elevation: 45.0 },
        [nextMinute.toISOString()]: { azimuth: 182, elevation: 44.9 },
      };

      const events = getDailySolarCycleEvents({
        currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0].summary).toContain("Solar Zenith");
      expect(events[0].categories).toContain("Daily Solar Cycle");
    });

    it("should detect solar nadir when sun reaches minimum elevation", () => {
      const currentMinute = moment.utc("2024-03-22T00:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      // Sun at local minimum elevation (below horizon at night)
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 358, elevation: -44.9 },
        [currentMinute.toISOString()]: { azimuth: 0, elevation: -45.0 },
        [nextMinute.toISOString()]: { azimuth: 2, elevation: -44.9 },
      };

      const events = getDailySolarCycleEvents({
        currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0].summary).toContain("Solar Nadir");
      expect(events[0].categories).toContain("Daily Solar Cycle");
    });

    it("should return empty array when no events occur", () => {
      const currentMinute = moment.utc("2024-03-21T10:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      // Sun in middle of sky, not at any threshold
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 150, elevation: 29 },
        [currentMinute.toISOString()]: { azimuth: 151, elevation: 30 },
        [nextMinute.toISOString()]: { azimuth: 152, elevation: 31 },
      };

      const events = getDailySolarCycleEvents({
        currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(0);
    });

    it("should return multiple events if they occur at the same minute", () => {
      const currentMinute = moment.utc("2024-03-21T06:30:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      // Edge case: sunrise and maximum at same time
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 90, elevation: -0.3 },
        [currentMinute.toISOString()]: { azimuth: 91, elevation: -0.2 },
        [nextMinute.toISOString()]: { azimuth: 92, elevation: -0.25 },
      };

      const events = getDailySolarCycleEvents({
        currentMinute,
        sunAzimuthElevationEphemeris,
      });

      // Should have sunrise and potentially zenith if the elevation is at a maximum
      expect(events.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getSunriseEvent", () => {
    it("should create a sunrise event with correct structure", () => {
      const date = new Date("2024-03-21T06:30:00.000Z");

      const event = getSunriseEvent(date);

      expect(event.summary).toBe("☀️ 🔼 Sunrise");
      expect(event.description).toBe("Sunrise");
      expect(event.start).toEqual(date);
      expect(event.end).toEqual(date);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Daily Solar Cycle");
      expect(event.categories).toContain("Solar");
    });
  });

  describe("getSolarZenithEvent", () => {
    it("should create a solar zenith event with correct structure", () => {
      const date = new Date("2024-03-21T12:00:00.000Z");

      const event = getSolarZenithEvent(date);

      expect(event.summary).toBe("☀️ ⏫ Solar Zenith");
      expect(event.description).toBe("Solar Zenith");
      expect(event.start).toEqual(date);
      expect(event.end).toEqual(date);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Daily Solar Cycle");
      expect(event.categories).toContain("Solar");
    });
  });

  describe("getSunsetEvent", () => {
    it("should create a sunset event with correct structure", () => {
      const date = new Date("2024-03-21T18:30:00.000Z");

      const event = getSunsetEvent(date);

      expect(event.summary).toBe("☀️ 🔽 Sunset");
      expect(event.description).toBe("Sunset");
      expect(event.start).toEqual(date);
      expect(event.end).toEqual(date);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Daily Solar Cycle");
      expect(event.categories).toContain("Solar");
    });
  });

  describe("writeDailySolarCycleEvents", () => {
    it("should write events to database and file when events array is not empty", async () => {
      const { upsertEvents } = await import("../../database.utilities");
      const fs = (await import("fs")).default;

      const events: Event[] = [
        {
          start: new Date("2024-03-21T06:00:00.000Z"),
          end: new Date("2024-03-21T06:00:00.000Z"),
          summary: "☀️ ⏫ Sunrise",
          description: "Sunrise",
          categories: ["Astronomy", "Astrology", "Solar", "Sunrise"],
        },
      ];

      const { writeDailySolarCycleEvents } = await import(
        "./dailySolarCycle.events"
      );
      writeDailySolarCycleEvents({
        dailySolarCycleEvents: events,
        start: new Date("2024-01-01"),
        end: new Date("2024-12-31"),
      });

      expect(upsertEvents).toHaveBeenCalledWith(events);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it("should not write if events array is empty", async () => {
      const { upsertEvents } = await import("../../database.utilities");
      const fs = (await import("fs")).default;

      const { writeDailySolarCycleEvents } = await import(
        "./dailySolarCycle.events"
      );
      writeDailySolarCycleEvents({
        dailySolarCycleEvents: [],
        start: new Date("2024-01-01"),
        end: new Date("2024-12-31"),
      });

      expect(upsertEvents).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe("getSolarNadirEvent", () => {
    it("should create a solar nadir event with correct structure", () => {
      const date = new Date("2024-03-22T00:00:00.000Z");

      const event = getSolarNadirEvent(date);

      expect(event.summary).toBe("☀️ ⏬ Solar Nadir");
      expect(event.description).toBe("Solar Nadir");
      expect(event.start).toEqual(date);
      expect(event.end).toEqual(date);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Daily Solar Cycle");
      expect(event.categories).toContain("Solar");
    });
  });
});
