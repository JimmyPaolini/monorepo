import moment from "moment-timezone";
import { describe, expect, it, vi } from "vitest";

import {
  getAstronomicalDawnEvent,
  getAstronomicalDuskEvent,
  getCivilDawnEvent,
  getCivilDuskEvent,
  getNauticalDawnEvent,
  getNauticalDuskEvent,
  getTwilightDurationEvents,
  getTwilightEvents,
} from "./twilights.events";

import type { Event } from "../../calendar.utilities";
import type { AzimuthElevationEphemeris } from "../../ephemeris/ephemeris.types";

// Mock dependencies
vi.mock("../../database.utilities", () => ({
  upsertEvents: vi.fn(),
}));

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

describe("twilights.events", () => {
  describe("getTwilightEvents", () => {
    it("should detect civil dawn when sun rises from -6 to above -6 degrees", () => {
      const currentMinute = moment.utc("2024-03-21T06:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Sun crossing -6 degree threshold upward (civil dawn)
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 85, elevation: -6.1 },
        [currentMinute.toISOString()]: { azimuth: 86, elevation: -5.9 },
      };

      const events = getTwilightEvents({
        currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0].summary).toContain("Civil Dawn");
      expect(events[0].categories).toContain("Civil Dawn");
    });

    it("should detect civil dusk when sun sets from above -6 to below -6 degrees", () => {
      const currentMinute = moment.utc("2024-03-21T19:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Sun crossing -6 degree threshold downward (civil dusk)
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 275, elevation: -5.9 },
        [currentMinute.toISOString()]: { azimuth: 276, elevation: -6.1 },
      };

      const events = getTwilightEvents({
        currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0].summary).toContain("Civil Dusk");
      expect(events[0].categories).toContain("Civil Dusk");
    });

    it("should detect nautical dawn when sun rises from -12 to above -12 degrees", () => {
      const currentMinute = moment.utc("2024-03-21T05:30:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Sun crossing -12 degree threshold upward (nautical dawn)
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 80, elevation: -12.1 },
        [currentMinute.toISOString()]: { azimuth: 81, elevation: -11.9 },
      };

      const events = getTwilightEvents({
        currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0].summary).toContain("Nautical Dawn");
      expect(events[0].categories).toContain("Nautical Dawn");
    });

    it("should detect nautical dusk when sun sets from above -12 to below -12 degrees", () => {
      const currentMinute = moment.utc("2024-03-21T19:30:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Sun crossing -12 degree threshold downward (nautical dusk)
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 280, elevation: -11.9 },
        [currentMinute.toISOString()]: { azimuth: 281, elevation: -12.1 },
      };

      const events = getTwilightEvents({
        currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0].summary).toContain("Nautical Dusk");
      expect(events[0].categories).toContain("Nautical Dusk");
    });

    it("should detect astronomical dawn when sun rises from -18 to above -18 degrees", () => {
      const currentMinute = moment.utc("2024-03-21T05:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Sun crossing -18 degree threshold upward (astronomical dawn)
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 75, elevation: -18.1 },
        [currentMinute.toISOString()]: { azimuth: 76, elevation: -17.9 },
      };

      const events = getTwilightEvents({
        currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0].summary).toContain("Astronomical Dawn");
      expect(events[0].categories).toContain("Astronomical Dawn");
    });

    it("should detect astronomical dusk when sun sets from above -18 to below -18 degrees", () => {
      const currentMinute = moment.utc("2024-03-21T20:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Sun crossing -18 degree threshold downward (astronomical dusk)
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 285, elevation: -17.9 },
        [currentMinute.toISOString()]: { azimuth: 286, elevation: -18.1 },
      };

      const events = getTwilightEvents({
        currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0].summary).toContain("Astronomical Dusk");
      expect(events[0].categories).toContain("Astronomical Dusk");
    });

    it("should return empty array when no twilight events occur", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Sun in middle of day, not at any twilight threshold
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 160, elevation: 44 },
        [currentMinute.toISOString()]: { azimuth: 161, elevation: 45 },
      };

      const events = getTwilightEvents({
        currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("getCivilDawnEvent", () => {
    it("should create a civil dawn event with correct structure", () => {
      const date = new Date("2024-03-21T06:00:00.000Z");

      const event = getCivilDawnEvent(date);

      expect(event.summary).toBe("🌄 Civil Dawn");
      expect(event.description).toBe("Civil Dawn");
      expect(event.start).toEqual(date);
      expect(event.end).toEqual(date);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Twilight");
      expect(event.categories).toContain("Civil Dawn");
    });
  });

  describe("getCivilDuskEvent", () => {
    it("should create a civil dusk event with correct structure", () => {
      const date = new Date("2024-03-21T19:00:00.000Z");

      const event = getCivilDuskEvent(date);

      expect(event.summary).toBe("🌇 Civil Dusk");
      expect(event.description).toBe("Civil Dusk");
      expect(event.start).toEqual(date);
      expect(event.end).toEqual(date);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Twilight");
      expect(event.categories).toContain("Civil Dusk");
    });
  });

  describe("getNauticalDawnEvent", () => {
    it("should create a nautical dawn event with correct structure", () => {
      const date = new Date("2024-03-21T05:30:00.000Z");

      const event = getNauticalDawnEvent(date);

      expect(event.summary).toBe("🌅 Nautical Dawn");
      expect(event.description).toBe("Nautical Dawn");
      expect(event.start).toEqual(date);
      expect(event.end).toEqual(date);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Twilight");
      expect(event.categories).toContain("Nautical Dawn");
    });
  });

  describe("getNauticalDuskEvent", () => {
    it("should create a nautical dusk event with correct structure", () => {
      const date = new Date("2024-03-21T19:30:00.000Z");

      const event = getNauticalDuskEvent(date);

      expect(event.summary).toBe("🌉 Nautical Dusk");
      expect(event.description).toBe("Nautical Dusk");
      expect(event.start).toEqual(date);
      expect(event.end).toEqual(date);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Twilight");
      expect(event.categories).toContain("Nautical Dusk");
    });
  });

  describe("getAstronomicalDawnEvent", () => {
    it("should create an astronomical dawn event with correct structure", () => {
      const date = new Date("2024-03-21T05:00:00.000Z");

      const event = getAstronomicalDawnEvent(date);

      expect(event.summary).toBe("🌠 Astronomical Dawn");
      expect(event.description).toBe("Astronomical Dawn");
      expect(event.start).toEqual(date);
      expect(event.end).toEqual(date);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Twilight");
      expect(event.categories).toContain("Astronomical Dawn");
    });
  });

  describe("getAstronomicalDuskEvent", () => {
    it("should create an astronomical dusk event with correct structure", () => {
      const date = new Date("2024-03-21T20:00:00.000Z");

      const event = getAstronomicalDuskEvent(date);

      expect(event.summary).toBe("🌌 Astronomical Dusk");
      expect(event.description).toBe("Astronomical Dusk");
      expect(event.start).toEqual(date);
      expect(event.end).toEqual(date);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Twilight");
      expect(event.categories).toContain("Astronomical Dusk");
    });
  });

  describe("writeTwilightEvents", () => {
    it("should write events to database and file when events array is not empty", async () => {
      const { upsertEvents } = await import("../../database.utilities");
      const fs = (await import("fs")).default;

      const events: Event[] = [
        {
          start: new Date("2024-03-21T06:00:00.000Z"),
          end: new Date("2024-03-21T06:00:00.000Z"),
          summary: "🌄 Civil Dawn",
          description: "Civil Dawn",
          categories: ["Astronomy", "Astrology", "Twilight", "Civil Dawn"],
        },
      ];

      const { writeTwilightEvents } = await import("./twilights.events");
      writeTwilightEvents({
        twilightEvents: events,
        start: new Date("2024-01-01"),
        end: new Date("2024-12-31"),
      });

      expect(upsertEvents).toHaveBeenCalledWith(events);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it("should not write if events array is empty", async () => {
      const { upsertEvents } = await import("../../database.utilities");
      const fs = (await import("fs")).default;

      const { writeTwilightEvents } = await import("./twilights.events");
      writeTwilightEvents({
        twilightEvents: [],
        start: new Date("2024-01-01"),
        end: new Date("2024-12-31"),
      });

      expect(upsertEvents).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe("getTwilightDurationEvents", () => {
    it("should create daylight duration event from civil dawn to civil dusk", () => {
      const civilDawn: Event = {
        start: new Date("2024-03-21T06:00:00.000Z"),
        end: new Date("2024-03-21T06:00:00.000Z"),
        summary: "🌄 Civil Dawn",
        description: "Civil Dawn",
        categories: ["Astronomy", "Astrology", "Twilight", "Civil Dawn"],
      };
      const civilDusk: Event = {
        start: new Date("2024-03-21T19:00:00.000Z"),
        end: new Date("2024-03-21T19:00:00.000Z"),
        summary: "🌇 Civil Dusk",
        description: "Civil Dusk",
        categories: ["Astronomy", "Astrology", "Twilight", "Civil Dusk"],
      };

      const durationEvents = getTwilightDurationEvents([civilDawn, civilDusk]);

      // Should have Daylight duration
      const daylightEvents = durationEvents.filter(
        (e) => e.description === "Daylight"
      );
      expect(daylightEvents.length).toBeGreaterThanOrEqual(1);
    });

    it("should create nautical twilight morning duration event", () => {
      const nauticalDawn: Event = {
        start: new Date("2024-03-21T05:30:00.000Z"),
        end: new Date("2024-03-21T05:30:00.000Z"),
        summary: "🌅 Nautical Dawn",
        description: "Nautical Dawn",
        categories: ["Astronomy", "Astrology", "Twilight", "Nautical Dawn"],
      };
      const civilDawn: Event = {
        start: new Date("2024-03-21T06:00:00.000Z"),
        end: new Date("2024-03-21T06:00:00.000Z"),
        summary: "🌄 Civil Dawn",
        description: "Civil Dawn",
        categories: ["Astronomy", "Astrology", "Twilight", "Civil Dawn"],
      };

      const durationEvents = getTwilightDurationEvents([
        nauticalDawn,
        civilDawn,
      ]);

      const nauticalMorningEvents = durationEvents.filter(
        (e) => e.description === "Nautical Twilight (Morning)"
      );
      expect(nauticalMorningEvents.length).toBeGreaterThanOrEqual(1);
    });

    it("should create astronomical twilight morning duration event", () => {
      const astronomicalDawn: Event = {
        start: new Date("2024-03-21T05:00:00.000Z"),
        end: new Date("2024-03-21T05:00:00.000Z"),
        summary: "🌠 Astronomical Dawn",
        description: "Astronomical Dawn",
        categories: ["Astronomy", "Astrology", "Twilight", "Astronomical Dawn"],
      };
      const nauticalDawn: Event = {
        start: new Date("2024-03-21T05:30:00.000Z"),
        end: new Date("2024-03-21T05:30:00.000Z"),
        summary: "🌅 Nautical Dawn",
        description: "Nautical Dawn",
        categories: ["Astronomy", "Astrology", "Twilight", "Nautical Dawn"],
      };

      const durationEvents = getTwilightDurationEvents([
        astronomicalDawn,
        nauticalDawn,
      ]);

      const astronomicalMorningEvents = durationEvents.filter(
        (e) => e.description === "Astronomical Twilight (Morning)"
      );
      expect(astronomicalMorningEvents.length).toBeGreaterThanOrEqual(1);
    });

    it("should create night duration event from astronomical dusk to astronomical dawn", () => {
      // First day - evening
      const astronomicalDusk: Event = {
        start: new Date("2024-03-21T20:00:00.000Z"),
        end: new Date("2024-03-21T20:00:00.000Z"),
        summary: "🌌 Astronomical Dusk",
        description: "Astronomical Dusk",
        categories: ["Astronomy", "Astrology", "Twilight", "Astronomical Dusk"],
      };
      // Next day - morning
      const astronomicalDawn: Event = {
        start: new Date("2024-03-22T05:00:00.000Z"),
        end: new Date("2024-03-22T05:00:00.000Z"),
        summary: "🌠 Astronomical Dawn",
        description: "Astronomical Dawn",
        categories: ["Astronomy", "Astrology", "Twilight", "Astronomical Dawn"],
      };

      const durationEvents = getTwilightDurationEvents([
        astronomicalDusk,
        astronomicalDawn,
      ]);

      const nightEvents = durationEvents.filter(
        (e) => e.description === "Night"
      );
      expect(nightEvents.length).toBeGreaterThanOrEqual(1);
    });

    it("should return empty array when no twilight events provided", () => {
      const durationEvents = getTwilightDurationEvents([]);

      expect(durationEvents).toHaveLength(0);
    });
  });
});
