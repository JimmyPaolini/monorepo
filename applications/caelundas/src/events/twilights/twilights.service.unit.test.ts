import moment from "moment-timezone";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    TwilightsService,
} from "./twilights.service";
import { EphemerisService } from "@caelundas/src/ephemeris/ephemeris.service";

import type { Event } from "@caelundas/src/calendar/calendar.types";
import type { AzimuthElevationEphemeris } from "@caelundas/src/ephemeris/ephemeris.types";
import type { Twilight } from "./twilights.service";

// Mock dependencies
vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

interface ServicePrivate {
  isDawn: (args: {
    currentElevation: number;
    previousElevation: number;
    twilight: Twilight;
  }) => boolean;
  isDusk: (args: {
    currentElevation: number;
    previousElevation: number;
    twilight: Twilight;
  }) => boolean;
  isAstronomicalDawn: (args: {
    currentElevation: number;
    previousElevation: number;
  }) => boolean;
  isNauticalDawn: (args: {
    currentElevation: number;
    previousElevation: number;
  }) => boolean;
  isCivilDawn: (args: {
    currentElevation: number;
    previousElevation: number;
  }) => boolean;
  isAstronomicalDusk: (args: {
    currentElevation: number;
    previousElevation: number;
  }) => boolean;
  isNauticalDusk: (args: {
    currentElevation: number;
    previousElevation: number;
  }) => boolean;
  isCivilDusk: (args: {
    currentElevation: number;
    previousElevation: number;
  }) => boolean;
}

const ephemerisService = new EphemerisService();
const service = new TwilightsService(ephemerisService);
const s = service as unknown as ServicePrivate;

describe("twilights.events", () => {
  describe("service.detect", () => {
    it("should detect civil dawn when sun rises from -6 to above -6 degrees", () => {
      const currentMinute = moment.utc("2024-03-21T06:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Sun crossing -6 degree threshold upward (civil dawn)
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 85, elevation: -6.1 },
        [currentMinute.toISOString()]: { azimuth: 86, elevation: -5.9 },
      };

      const events = service.detect({
        minute: currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.summary).toContain("Civil Dawn");
      expect(events[0]?.categories).toContain("Civil Dawn");
    });

    it("should detect civil dusk when sun sets from above -6 to below -6 degrees", () => {
      const currentMinute = moment.utc("2024-03-21T19:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Sun crossing -6 degree threshold downward (civil dusk)
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 275, elevation: -5.9 },
        [currentMinute.toISOString()]: { azimuth: 276, elevation: -6.1 },
      };

      const events = service.detect({
        minute: currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.summary).toContain("Civil Dusk");
      expect(events[0]?.categories).toContain("Civil Dusk");
    });

    it("should detect nautical dawn when sun rises from -12 to above -12 degrees", () => {
      const currentMinute = moment.utc("2024-03-21T05:30:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Sun crossing -12 degree threshold upward (nautical dawn)
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 80, elevation: -12.1 },
        [currentMinute.toISOString()]: { azimuth: 81, elevation: -11.9 },
      };

      const events = service.detect({
        minute: currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.summary).toContain("Nautical Dawn");
      expect(events[0]?.categories).toContain("Nautical Dawn");
    });

    it("should detect nautical dusk when sun sets from above -12 to below -12 degrees", () => {
      const currentMinute = moment.utc("2024-03-21T19:30:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Sun crossing -12 degree threshold downward (nautical dusk)
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 280, elevation: -11.9 },
        [currentMinute.toISOString()]: { azimuth: 281, elevation: -12.1 },
      };

      const events = service.detect({
        minute: currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.summary).toContain("Nautical Dusk");
      expect(events[0]?.categories).toContain("Nautical Dusk");
    });

    it("should detect astronomical dawn when sun rises from -18 to above -18 degrees", () => {
      const currentMinute = moment.utc("2024-03-21T05:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Sun crossing -18 degree threshold upward (astronomical dawn)
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 75, elevation: -18.1 },
        [currentMinute.toISOString()]: { azimuth: 76, elevation: -17.9 },
      };

      const events = service.detect({
        minute: currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.summary).toContain("Astronomical Dawn");
      expect(events[0]?.categories).toContain("Astronomical Dawn");
    });

    it("should detect astronomical dusk when sun sets from above -18 to below -18 degrees", () => {
      const currentMinute = moment.utc("2024-03-21T20:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Sun crossing -18 degree threshold downward (astronomical dusk)
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 285, elevation: -17.9 },
        [currentMinute.toISOString()]: { azimuth: 286, elevation: -18.1 },
      };

      const events = service.detect({
        minute: currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.summary).toContain("Astronomical Dusk");
      expect(events[0]?.categories).toContain("Astronomical Dusk");
    });

    it("should return empty array when no twilight events occur", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Sun in middle of day, not at any twilight threshold
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [previousMinute.toISOString()]: { azimuth: 160, elevation: 44 },
        [currentMinute.toISOString()]: { azimuth: 161, elevation: 45 },
      };

      const events = service.detect({
        minute: currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("getCivilDawnEvent", () => {
    it("should create a civil dawn event with correct structure", () => {
      const date = moment.utc("2024-03-21T06:00:00.000Z");

      const event = service.buildCivilDawnEvent(date);

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
      const date = moment.utc("2024-03-21T19:00:00.000Z");

      const event = service.buildCivilDuskEvent(date);

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
      const date = moment.utc("2024-03-21T05:30:00.000Z");

      const event = service.buildNauticalDawnEvent(date);

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
      const date = moment.utc("2024-03-21T19:30:00.000Z");

      const event = service.buildNauticalDuskEvent(date);

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
      const date = moment.utc("2024-03-21T05:00:00.000Z");

      const event = service.buildAstronomicalDawnEvent(date);

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
      const date = moment.utc("2024-03-21T20:00:00.000Z");

      const event = service.buildAstronomicalDuskEvent(date);

      expect(event.summary).toBe("🌌 Astronomical Dusk");
      expect(event.description).toBe("Astronomical Dusk");
      expect(event.start).toEqual(date);
      expect(event.end).toEqual(date);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Twilight");
      expect(event.categories).toContain("Astronomical Dusk");
    });
  });

  describe("service.detectProgressive", () => {
    it("should create daylight progressive event from civil dawn to civil dusk", () => {
      const civilDawn: Event = {
        start: moment.utc("2024-03-21T06:00:00.000Z"),
        end: moment.utc("2024-03-21T06:00:00.000Z"),
        summary: "🌄 Civil Dawn",
        description: "Civil Dawn",
        categories: ["Astronomy", "Astrology", "Twilight", "Civil Dawn"],
      };
      const civilDusk: Event = {
        start: moment.utc("2024-03-21T19:00:00.000Z"),
        end: moment.utc("2024-03-21T19:00:00.000Z"),
        summary: "🌇 Civil Dusk",
        description: "Civil Dusk",
        categories: ["Astronomy", "Astrology", "Twilight", "Civil Dusk"],
      };

      const progressiveEvents = service.detectProgressive([
        civilDawn,
        civilDusk,
      ]);

      // Should have Daylight duration
      const daylightEvents = progressiveEvents.filter(
        (e) => e.description === "Daylight",
      );
      expect(daylightEvents.length).toBeGreaterThanOrEqual(1);
    });

    it("should create nautical twilight morning progressive event", () => {
      const nauticalDawn: Event = {
        start: moment.utc("2024-03-21T05:30:00.000Z"),
        end: moment.utc("2024-03-21T05:30:00.000Z"),
        summary: "🌅 Nautical Dawn",
        description: "Nautical Dawn",
        categories: ["Astronomy", "Astrology", "Twilight", "Nautical Dawn"],
      };
      const civilDawn: Event = {
        start: moment.utc("2024-03-21T06:00:00.000Z"),
        end: moment.utc("2024-03-21T06:00:00.000Z"),
        summary: "🌄 Civil Dawn",
        description: "Civil Dawn",
        categories: ["Astronomy", "Astrology", "Twilight", "Civil Dawn"],
      };

      const progressiveEvents = service.detectProgressive([
        nauticalDawn,
        civilDawn,
      ]);

      const nauticalMorningEvents = progressiveEvents.filter(
        (e) => e.description === "Nautical Twilight (Morning)",
      );
      expect(nauticalMorningEvents.length).toBeGreaterThanOrEqual(1);
    });

    it("should create astronomical twilight morning progressive event", () => {
      const astronomicalDawn: Event = {
        start: moment.utc("2024-03-21T05:00:00.000Z"),
        end: moment.utc("2024-03-21T05:00:00.000Z"),
        summary: "🌠 Astronomical Dawn",
        description: "Astronomical Dawn",
        categories: ["Astronomy", "Astrology", "Twilight", "Astronomical Dawn"],
      };
      const nauticalDawn: Event = {
        start: moment.utc("2024-03-21T05:30:00.000Z"),
        end: moment.utc("2024-03-21T05:30:00.000Z"),
        summary: "🌅 Nautical Dawn",
        description: "Nautical Dawn",
        categories: ["Astronomy", "Astrology", "Twilight", "Nautical Dawn"],
      };

      const progressiveEvents = service.detectProgressive([
        astronomicalDawn,
        nauticalDawn,
      ]);

      const astronomicalMorningEvents = progressiveEvents.filter(
        (e) => e.description === "Astronomical Twilight (Morning)",
      );
      expect(astronomicalMorningEvents.length).toBeGreaterThanOrEqual(1);
    });

    it("should create night progressive event from astronomical dusk to astronomical dawn", () => {
      // First day - evening
      const astronomicalDusk: Event = {
        start: moment.utc("2024-03-21T20:00:00.000Z"),
        end: moment.utc("2024-03-21T20:00:00.000Z"),
        summary: "🌌 Astronomical Dusk",
        description: "Astronomical Dusk",
        categories: ["Astronomy", "Astrology", "Twilight", "Astronomical Dusk"],
      };
      // Next day - morning
      const astronomicalDawn: Event = {
        start: moment.utc("2024-03-22T05:00:00.000Z"),
        end: moment.utc("2024-03-22T05:00:00.000Z"),
        summary: "🌠 Astronomical Dawn",
        description: "Astronomical Dawn",
        categories: ["Astronomy", "Astrology", "Twilight", "Astronomical Dawn"],
      };

      const progressiveEvents = service.detectProgressive([
        astronomicalDusk,
        astronomicalDawn,
      ]);

      const nightEvents = progressiveEvents.filter(
        (e) => e.description === "Night",
      );
      expect(nightEvents.length).toBeGreaterThanOrEqual(1);
    });

    it("should return empty array when no twilight events provided", () => {
      const progressiveEvents = service.detectProgressive([]);

      expect(progressiveEvents).toHaveLength(0);
    });
  });

  describe("private utility methods", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    describe("constants", () => {
      it("should have correct twilight types", () => {
        expect(TwilightsService.twilights).toEqual(["civil", "nautical", "astronomical"]);
      });

      it("should have correct degrees for each twilight type", () => {
        expect(TwilightsService.degreesByTwilight.civil).toBe(6);
        expect(TwilightsService.degreesByTwilight.nautical).toBe(12);
        expect(TwilightsService.degreesByTwilight.astronomical).toBe(18);
      });

      it("should calculate sun radius in degrees correctly", () => {
        // Sun radius is 16 arcminutes, 60 arcminutes per degree
        expect(TwilightsService.sunRadiusDegrees).toBeCloseTo(16 / 60, 5);
      });
    });

    describe("isDawn", () => {
      it("should return true when crossing dawn threshold from below", () => {
        expect(
          s.isDawn({
            currentElevation: -5,
            previousElevation: -7,
            twilight: "civil",
          }),
        ).toBe(true);
      });

      it("should return false when elevation stays below threshold", () => {
        expect(
          s.isDawn({
            currentElevation: -8,
            previousElevation: -10,
            twilight: "civil",
          }),
        ).toBe(false);
      });

      it("should return false when elevation stays above threshold", () => {
        expect(
          s.isDawn({
            currentElevation: -4,
            previousElevation: -5,
            twilight: "civil",
          }),
        ).toBe(false);
      });

      it("should return false when crossing threshold from above (dusk direction)", () => {
        expect(
          s.isDawn({
            currentElevation: -7,
            previousElevation: -5,
            twilight: "civil",
          }),
        ).toBe(false);
      });

      it("should work for nautical twilight (-12°)", () => {
        expect(
          s.isDawn({
            currentElevation: -11,
            previousElevation: -13,
            twilight: "nautical",
          }),
        ).toBe(true);
      });

      it("should work for astronomical twilight (-18°)", () => {
        expect(
          s.isDawn({
            currentElevation: -17,
            previousElevation: -19,
            twilight: "astronomical",
          }),
        ).toBe(true);
      });
    });

    describe("isDusk", () => {
      it("should return true when crossing dusk threshold from above", () => {
        expect(
          s.isDusk({
            currentElevation: -7,
            previousElevation: -5,
            twilight: "civil",
          }),
        ).toBe(true);
      });

      it("should return false when elevation stays above threshold", () => {
        expect(
          s.isDusk({
            currentElevation: -4,
            previousElevation: -5,
            twilight: "civil",
          }),
        ).toBe(false);
      });

      it("should return false when elevation stays below threshold", () => {
        expect(
          s.isDusk({
            currentElevation: -8,
            previousElevation: -10,
            twilight: "civil",
          }),
        ).toBe(false);
      });

      it("should return false when crossing threshold from below (dawn direction)", () => {
        expect(
          s.isDusk({
            currentElevation: -5,
            previousElevation: -7,
            twilight: "civil",
          }),
        ).toBe(false);
      });

      it("should work for nautical twilight (-12°)", () => {
        expect(
          s.isDusk({
            currentElevation: -13,
            previousElevation: -11,
            twilight: "nautical",
          }),
        ).toBe(true);
      });

      it("should work for astronomical twilight (-18°)", () => {
        expect(
          s.isDusk({
            currentElevation: -19,
            previousElevation: -17,
            twilight: "astronomical",
          }),
        ).toBe(true);
      });
    });

    describe("helper dawn functions", () => {
      it("isAstronomicalDawn should detect astronomical dawn", () => {
        expect(
          s.isAstronomicalDawn({
            currentElevation: -17,
            previousElevation: -19,
          }),
        ).toBe(true);

        expect(
          s.isAstronomicalDawn({
            currentElevation: -19,
            previousElevation: -20,
          }),
        ).toBe(false);
      });

      it("isNauticalDawn should detect nautical dawn", () => {
        expect(
          s.isNauticalDawn({
            currentElevation: -11,
            previousElevation: -13,
          }),
        ).toBe(true);

        expect(
          s.isNauticalDawn({
            currentElevation: -13,
            previousElevation: -14,
          }),
        ).toBe(false);
      });

      it("isCivilDawn should detect civil dawn", () => {
        expect(
          s.isCivilDawn({
            currentElevation: -5,
            previousElevation: -7,
          }),
        ).toBe(true);

        expect(
          s.isCivilDawn({
            currentElevation: -7,
            previousElevation: -8,
          }),
        ).toBe(false);
      });
    });

    describe("helper dusk functions", () => {
      it("isAstronomicalDusk should detect astronomical dusk", () => {
        expect(
          s.isAstronomicalDusk({
            currentElevation: -19,
            previousElevation: -17,
          }),
        ).toBe(true);

        expect(
          s.isAstronomicalDusk({
            currentElevation: -17,
            previousElevation: -19,
          }),
        ).toBe(false);
      });

      it("isNauticalDusk should detect nautical dusk", () => {
        expect(
          s.isNauticalDusk({
            currentElevation: -13,
            previousElevation: -11,
          }),
        ).toBe(true);

        expect(
          s.isNauticalDusk({
            currentElevation: -11,
            previousElevation: -13,
          }),
        ).toBe(false);
      });

      it("isCivilDusk should detect civil dusk", () => {
        expect(
          s.isCivilDusk({
            currentElevation: -7,
            previousElevation: -5,
          }),
        ).toBe(true);

        expect(
          s.isCivilDusk({
            currentElevation: -5,
            previousElevation: -7,
          }),
        ).toBe(false);
      });
    });
  }); // private utility methods
});
