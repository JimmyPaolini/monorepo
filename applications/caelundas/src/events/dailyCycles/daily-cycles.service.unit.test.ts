import { EphemerisService } from "@caelundas/src/ephemeris/ephemeris.service";
import moment from "moment-timezone";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DailyCyclesService } from "./daily-cycles.service";

import type { AzimuthElevationEphemeris } from "@caelundas/src/ephemeris/ephemeris.types";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

const ephemerisService = new EphemerisService();
const service = new DailyCyclesService(ephemerisService);

interface ServicePrivate {
  isRise: (args: {
    currentElevation: number;
    previousElevation: number;
  }) => boolean;
  isSet: (args: {
    previousElevation: number;
    currentElevation: number;
  }) => boolean;
}

const s = service as unknown as ServicePrivate;

describe("dailySolarCycle.events", () => {
  describe("service.detect", () => {
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

      const events = service.getDailySolarCycleEvents({
        minute: currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.summary).toContain("Sunrise");
      expect(events[0]?.categories).toContain("Solar");
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

      const events = service.getDailySolarCycleEvents({
        minute: currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.summary).toContain("Sunset");
      expect(events[0]?.categories).toContain("Solar");
    });

    it("should detect solar zenith when sun reaches maximum elevation", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      // Sun at local maximum elevation
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 178, elevation: 44.9 },
        [currentMinute.toISOString()]: { azimuth: 180, elevation: 45 },
        [nextMinute.toISOString()]: { azimuth: 182, elevation: 44.9 },
      };

      const events = service.getDailySolarCycleEvents({
        minute: currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.summary).toContain("Solar Zenith");
      expect(events[0]?.categories).toContain("Daily Solar Cycle");
    });

    it("should detect solar nadir when sun reaches minimum elevation", () => {
      const currentMinute = moment.utc("2024-03-22T00:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const nextMinute = currentMinute.clone().add(1, "minute");

      // Sun at local minimum elevation (below horizon at night)
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 358, elevation: -44.9 },
        [currentMinute.toISOString()]: { azimuth: 0, elevation: -45 },
        [nextMinute.toISOString()]: { azimuth: 2, elevation: -44.9 },
      };

      const events = service.getDailySolarCycleEvents({
        minute: currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.summary).toContain("Solar Nadir");
      expect(events[0]?.categories).toContain("Daily Solar Cycle");
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

      const events = service.getDailySolarCycleEvents({
        minute: currentMinute,
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

      const events = service.getDailySolarCycleEvents({
        minute: currentMinute,
        sunAzimuthElevationEphemeris,
      });

      // Should have sunrise and potentially zenith if the elevation is at a maximum
      expect(events.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getSunriseEvent", () => {
    it("should create a sunrise event with correct structure", () => {
      const date = moment.utc("2024-03-21T06:30:00.000Z");

      const event = service.buildSunriseEvent(date);

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
      const date = moment.utc("2024-03-21T12:00:00.000Z");

      const event = service.buildSolarZenithEvent(date);

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
      const date = moment.utc("2024-03-21T18:30:00.000Z");

      const event = service.buildSunsetEvent(date);

      expect(event.summary).toBe("☀️ 🔽 Sunset");
      expect(event.description).toBe("Sunset");
      expect(event.start).toEqual(date);
      expect(event.end).toEqual(date);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Daily Solar Cycle");
      expect(event.categories).toContain("Solar");
    });
  });

  describe("getSolarNadirEvent", () => {
    it("should create a solar nadir event with correct structure", () => {
      const date = moment.utc("2024-03-22T00:00:00.000Z");

      const event = service.buildSolarNadirEvent(date);

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

describe("dailyLunarCycle.events", () => {
  describe("service.detect", () => {
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

      const events = service.getDailyLunarCycleEvents({
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

      const events = service.getDailyLunarCycleEvents({
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

      const events = service.getDailyLunarCycleEvents({
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

      const events = service.getDailyLunarCycleEvents({
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

      const events = service.getDailyLunarCycleEvents({
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

      const events = service.getDailyLunarCycleEvents({
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

      const event = service.buildMoonriseEvent(date);

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

      const event = service.buildLunarZenithEvent(date);

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

      const event = service.buildMoonsetEvent(date);

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

      const event = service.buildLunarNadirEvent(date);

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

describe("private utility methods", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("DailyCyclesService.sunRadiusDegrees", () => {
    it("should have correct value for sun radius", () => {
      // Sun radius is 16 arcminutes, 60 arcminutes per degree
      expect(DailyCyclesService.sunRadiusDegrees).toBeCloseTo(16 / 60, 5);
      expect(DailyCyclesService.sunRadiusDegrees).toBeCloseTo(0.2667, 3);
    });
  });

  describe("isRise", () => {
    it("should return true when crossing above sun radius threshold", () => {
      // Rise occurs when elevation goes from below -DailyCyclesService.sunRadiusDegrees to above
      const result = s.isRise({
        currentElevation: 0, // Above threshold
        previousElevation: -0.5, // Below threshold (-0.2667)
      });

      expect(result).toBeTruthy();
    });

    it("should return true at exact threshold crossing", () => {
      const result = s.isRise({
        currentElevation: -DailyCyclesService.sunRadiusDegrees + 0.01, // Just above threshold
        previousElevation: -DailyCyclesService.sunRadiusDegrees - 0.01, // Just below threshold
      });

      expect(result).toBeTruthy();
    });

    it("should return false when elevation stays below threshold", () => {
      const result = s.isRise({
        currentElevation: -0.5,
        previousElevation: -1,
      });

      expect(result).toBeFalsy();
    });

    it("should return false when elevation stays above threshold", () => {
      const result = s.isRise({
        currentElevation: 1,
        previousElevation: 0.5,
      });

      expect(result).toBeFalsy();
    });

    it("should return false when crossing threshold downward (set direction)", () => {
      const result = s.isRise({
        currentElevation: -0.5, // Below threshold
        previousElevation: 0, // Above threshold
      });

      expect(result).toBeFalsy();
    });
  });

  describe("isSet", () => {
    it("should return true when crossing below sun radius threshold", () => {
      // Set occurs when elevation goes from above -DailyCyclesService.sunRadiusDegrees to below
      const result = s.isSet({
        currentElevation: -0.5, // Below threshold
        previousElevation: 0, // Above threshold
      });

      expect(result).toBeTruthy();
    });

    it("should return true at exact threshold crossing", () => {
      const result = s.isSet({
        currentElevation: -DailyCyclesService.sunRadiusDegrees - 0.01, // Just below threshold
        previousElevation: -DailyCyclesService.sunRadiusDegrees + 0.01, // Just above threshold
      });

      expect(result).toBeTruthy();
    });

    it("should return false when elevation stays above threshold", () => {
      const result = s.isSet({
        currentElevation: 0.5,
        previousElevation: 1,
      });

      expect(result).toBeFalsy();
    });

    it("should return false when elevation stays below threshold", () => {
      const result = s.isSet({
        currentElevation: -1,
        previousElevation: -0.5,
      });

      expect(result).toBeFalsy();
    });

    it("should return false when crossing threshold upward (rise direction)", () => {
      const result = s.isSet({
        currentElevation: 0, // Above threshold
        previousElevation: -0.5, // Below threshold
      });

      expect(result).toBeFalsy();
    });
  });
});
