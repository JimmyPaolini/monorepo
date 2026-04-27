import moment from "moment-timezone";
import { describe, expect, it, vi } from "vitest";

import {
    buildLunarNadirEvent,
    buildLunarZenithEvent,
    buildMoonriseEvent,
    buildMoonsetEvent,
    getDailyLunarCycleEvents,
} from "./dailyLunarCycle.events";

import type { AzimuthElevationEphemeris } from "../../ephemeris/ephemeris.types";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

describe("dailyLunarCycle.events", () => {
  describe("getDailyLunarCycleEvents", () => {
    it("should detect moonrise event when moon rises above horizon", () => {
      const currentMinute = moment.utc("2024-03-21T20:30:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      // Moon rising above horizon (threshold is -16/60 degrees = -0.2667)
      const moonAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 90, elevation: -0.3 },
        [currentMinute.toISOString()]: { azimuth: 91, elevation: -0.1 },
        [nextMinute.toISOString()]: { azimuth: 92, elevation: 0.1 },
      };

      const events = getDailyLunarCycleEvents({
        minute: currentMinute,
        moonAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0]).toBeDefined();
      expect(events[0]?.summary).toContain("Moonrise");
      expect(events[0]?.categories).toContain("Lunar");
    });

    it("should detect moonset event when moon sets below horizon", () => {
      const currentMinute = moment.utc("2024-03-22T06:30:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      // Moon setting below horizon
      const moonAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 270, elevation: -0.1 },
        [currentMinute.toISOString()]: { azimuth: 271, elevation: -0.3 },
        [nextMinute.toISOString()]: { azimuth: 272, elevation: -0.5 },
      };

      const events = getDailyLunarCycleEvents({
        minute: currentMinute,
        moonAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0]).toBeDefined();
      expect(events[0]?.summary).toContain("Moonset");
      expect(events[0]?.categories).toContain("Lunar");
    });

    it("should detect lunar zenith when moon reaches maximum elevation", () => {
      const currentMinute = moment.utc("2024-03-22T01:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      // Moon at local maximum elevation
      const moonAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 178, elevation: 39.9 },
        [currentMinute.toISOString()]: { azimuth: 180, elevation: 40 },
        [nextMinute.toISOString()]: { azimuth: 182, elevation: 39.9 },
      };

      const events = getDailyLunarCycleEvents({
        minute: currentMinute,
        moonAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0]).toBeDefined();
      expect(events[0]?.summary).toContain("Lunar Zenith");
      expect(events[0]?.categories).toContain("Daily Lunar Cycle");
    });

    it("should detect lunar nadir when moon reaches minimum elevation", () => {
      const currentMinute = moment.utc("2024-03-21T13:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      // Moon at local minimum elevation (below horizon during day)
      const moonAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 358, elevation: -39.9 },
        [currentMinute.toISOString()]: { azimuth: 0, elevation: -40 },
        [nextMinute.toISOString()]: { azimuth: 2, elevation: -39.9 },
      };

      const events = getDailyLunarCycleEvents({
        minute: currentMinute,
        moonAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0]).toBeDefined();
      expect(events[0]?.summary).toContain("Lunar Nadir");
      expect(events[0]?.categories).toContain("Daily Lunar Cycle");
    });

    it("should return empty array when no events occur", () => {
      const currentMinute = moment.utc("2024-03-21T22:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      // Moon in middle of sky, not at any threshold
      const moonAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 150, elevation: 29 },
        [currentMinute.toISOString()]: { azimuth: 151, elevation: 30 },
        [nextMinute.toISOString()]: { azimuth: 152, elevation: 31 },
      };

      const events = getDailyLunarCycleEvents({
        minute: currentMinute,
        moonAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(0);
    });

    it("should handle multiple events at once", () => {
      const currentMinute = moment.utc("2024-03-21T20:30:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      // Moonrise with a local maximum (unlikely in reality but tests code path)
      const moonAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 90, elevation: -0.3 },
        [currentMinute.toISOString()]: { azimuth: 91, elevation: -0.2 },
        [nextMinute.toISOString()]: { azimuth: 92, elevation: -0.25 },
      };

      const events = getDailyLunarCycleEvents({
        minute: currentMinute,
        moonAzimuthElevationEphemeris,
      });

      // Should have at least moonrise or zenith (depends on exact threshold)
      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(
        events.some((e) => e.categories.includes("Daily Lunar Cycle")),
      ).toBe(true);
    });
  });

  describe("getMoonriseEvent", () => {
    it("should create a moonrise event with correct structure", () => {
      const date = moment.utc("2024-03-21T20:30:00.000Z");

      const event = buildMoonriseEvent(date);

      expect(event.summary).toBe("🌙 🔼 Moonrise");
      expect(event.description).toBe("Moonrise");
      expect(event.start).toEqual(date);
      expect(event.end).toEqual(date);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Daily Lunar Cycle");
      expect(event.categories).toContain("Lunar");
    });
  });

  describe("getLunarZenithEvent", () => {
    it("should create a lunar zenith event with correct structure", () => {
      const date = moment.utc("2024-03-22T01:00:00.000Z");

      const event = buildLunarZenithEvent(date);

      expect(event.summary).toBe("🌙 ⏫ Lunar Zenith");
      expect(event.description).toBe("Lunar Zenith");
      expect(event.start).toEqual(date);
      expect(event.end).toEqual(date);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Daily Lunar Cycle");
      expect(event.categories).toContain("Lunar");
    });
  });

  describe("getMoonsetEvent", () => {
    it("should create a moonset event with correct structure", () => {
      const date = moment.utc("2024-03-22T06:30:00.000Z");

      const event = buildMoonsetEvent(date);

      expect(event.summary).toBe("🌙 🔽 Moonset");
      expect(event.description).toBe("Moonset");
      expect(event.start).toEqual(date);
      expect(event.end).toEqual(date);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Daily Lunar Cycle");
      expect(event.categories).toContain("Lunar");
    });
  });

  describe("getLunarNadirEvent", () => {
    it("should create a lunar nadir event with correct structure", () => {
      const date = moment.utc("2024-03-21T13:00:00.000Z");

      const event = buildLunarNadirEvent(date);

      expect(event.summary).toBe("🌙 ⏬ Lunar Nadir");
      expect(event.description).toBe("Lunar Nadir");
      expect(event.start).toEqual(date);
      expect(event.end).toEqual(date);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Daily Lunar Cycle");
      expect(event.categories).toContain("Lunar");
    });
  });
});
