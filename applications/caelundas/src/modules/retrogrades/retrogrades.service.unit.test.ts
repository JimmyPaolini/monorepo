import { MARGIN_MINUTES } from "@caelundas/src/modules/caelundas/caelundas.constants";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { LoggerService } from "@caelundas/src/modules/logger/logger.service";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Test } from "@nestjs/testing";
import moment, { type Moment } from "moment-timezone";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { RetrogradesService } from "./retrogrades.service";

import type { RetrogradeBody } from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { CoordinateEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

describe("RetrogradesService", () => {
  let service: RetrogradesService;
  let s: ServicePrivate;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LoggerService,
        RetrogradesService,
        EphemerisService,
        MathService,
        ProgressiveUtilities,
      ],
    }).compile();
    service = await module.resolve(RetrogradesService);
    s = service as unknown as ServicePrivate;
  });

  // Helper to create ephemeris data with margin
  function createCoordinateEphemeris(
    currentMinute: Moment,
    longitudes: number[],
  ): CoordinateEphemeris {
    const ephemeris: CoordinateEphemeris = {};
    const totalMinutes = MARGIN_MINUTES * 2 + 1;

    for (let i = 0; i < totalMinutes; i++) {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - i, "minutes");
      const longitude = longitudes[i] ?? longitudes.at(-1) ?? 0;
      ephemeris[minute.toISOString()] = {
        longitude,
        latitude: 0,
      };
    }

    return ephemeris;
  }

  describe("service.detect", () => {
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
        longitudes,
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

      const events = service.detect({
        coordinateEphemerisByBody,
        minute: currentMinute,
      });

      const mercuryRetrograde = events.find(
        (e) =>
          e.description.includes("Mercury") &&
          e.description.includes("Retrograde"),
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
        directLongitudes,
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

      const events = service.detect({
        coordinateEphemerisByBody,
        minute: currentMinute,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("getRetrogradeEvent", () => {
    it("should create a retrograde event with correct structure", () => {
      const timestamp = moment.utc("2024-04-01T12:00:00.000Z");

      const event = service.buildRetrogradeEvent({
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
      const timestamp = moment.utc("2024-04-25T12:00:00.000Z");

      const event = service.buildRetrogradeEvent({
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
      const timestamp = moment.utc("2024-07-22T12:00:00.000Z");

      const event = service.buildRetrogradeEvent({
        body: "venus",
        timestamp,
        direction: "retrograde",
      });

      expect(event.summary).toBe("♀️ ↩️ Venus Stationary Retrograde");
    });

    it("should use correct symbol for Mars", () => {
      const timestamp = moment.utc("2024-12-06T12:00:00.000Z");

      const event = service.buildRetrogradeEvent({
        body: "mars",
        timestamp,
        direction: "retrograde",
      });

      expect(event.summary).toBe("♂️ ↩️ Mars Stationary Retrograde");
    });

    it("should use correct symbol for Jupiter", () => {
      const timestamp = moment.utc("2024-10-09T12:00:00.000Z");

      const event = service.buildRetrogradeEvent({
        body: "jupiter",
        timestamp,
        direction: "retrograde",
      });

      expect(event.summary).toBe("♃ ↩️ Jupiter Stationary Retrograde");
    });

    it("should use correct symbol for Saturn", () => {
      const timestamp = moment.utc("2024-06-29T12:00:00.000Z");

      const event = service.buildRetrogradeEvent({
        body: "saturn",
        timestamp,
        direction: "retrograde",
      });

      expect(event.summary).toBe("♄ ↩️ Saturn Stationary Retrograde");
    });
  });

  describe("service.detectProgressive", () => {
    it("should create progressive event from retrograde to direct", () => {
      const retrogradeEvent: Event = {
        start: moment.utc("2024-04-01T12:00:00.000Z"),
        end: moment.utc("2024-04-01T12:00:00.000Z"),
        summary: "☿ ↩️ Mercury Stationary Retrograde",
        description: "Mercury Stationary Retrograde",
        categories: ["Astronomy", "Astrology", "Direction", "Retrograde"],
      };
      const directEvent: Event = {
        start: moment.utc("2024-04-25T12:00:00.000Z"),
        end: moment.utc("2024-04-25T12:00:00.000Z"),
        summary: "☿ ↪️ Mercury Stationary Direct",
        description: "Mercury Stationary Direct",
        categories: ["Astronomy", "Astrology", "Direction", "Direct"],
      };

      const progressiveEvents = service.detectProgressive([
        retrogradeEvent,
        directEvent,
      ]);

      // Should create progressive events for each planet that has retrograde/direct pairs
      expect(progressiveEvents.length).toBeGreaterThanOrEqual(1);

      const mercuryDuration = progressiveEvents.find(
        (e) =>
          e.description.includes("Mercury") &&
          e.description.includes("Retrograde"),
      );
      expect(mercuryDuration).toBeDefined();
      if (mercuryDuration) {
        expect(mercuryDuration.start).toEqual(retrogradeEvent.start);
        expect(mercuryDuration.end).toEqual(directEvent.start);
        expect(mercuryDuration.summary).toContain("Retrograde");
      }
    });

    it("should return empty array when no direction events provided", () => {
      const progressiveEvents = service.detectProgressive([]);

      expect(progressiveEvents).toHaveLength(0);
    });

    it("should handle multiple planets retrograde periods", () => {
      const mercuryRetrograde: Event = {
        start: moment.utc("2024-04-01T12:00:00.000Z"),
        end: moment.utc("2024-04-01T12:00:00.000Z"),
        summary: "☿ ↩️ Mercury Stationary Retrograde",
        description: "Mercury Stationary Retrograde",
        categories: ["Astronomy", "Astrology", "Direction", "Retrograde"],
      };
      const mercuryDirect: Event = {
        start: moment.utc("2024-04-25T12:00:00.000Z"),
        end: moment.utc("2024-04-25T12:00:00.000Z"),
        summary: "☿ ↪️ Mercury Stationary Direct",
        description: "Mercury Stationary Direct",
        categories: ["Astronomy", "Astrology", "Direction", "Direct"],
      };
      const venusRetrograde: Event = {
        start: moment.utc("2024-07-22T12:00:00.000Z"),
        end: moment.utc("2024-07-22T12:00:00.000Z"),
        summary: "♀️ ↩️ Venus Stationary Retrograde",
        description: "Venus Stationary Retrograde",
        categories: ["Astronomy", "Astrology", "Direction", "Retrograde"],
      };
      const venusDirect: Event = {
        start: moment.utc("2024-09-03T12:00:00.000Z"),
        end: moment.utc("2024-09-03T12:00:00.000Z"),
        summary: "♀️ ↪️ Venus Stationary Direct",
        description: "Venus Stationary Direct",
        categories: ["Astronomy", "Astrology", "Direction", "Direct"],
      };

      const progressiveEvents = service.detectProgressive([
        mercuryRetrograde,
        mercuryDirect,
        venusRetrograde,
        venusDirect,
      ]);

      // Should have progressive events for both Mercury and Venus
      expect(progressiveEvents.length).toBeGreaterThanOrEqual(2);
    });
  });

  interface ServicePrivate {
    isRetrograde: (args: {
      currentLongitude: number;
      previousLongitudes: number[];
      nextLongitudes: number[];
    }) => boolean;
    isDirect: (args: {
      currentLongitude: number;
      previousLongitudes: number[];
      nextLongitudes: number[];
    }) => boolean;
  }

  describe("isRetrograde", () => {
    it("should return true when planet stations retrograde", () => {
      const result = s.isRetrograde({
        currentLongitude: 100,
        previousLongitudes: [98, 99], // Was increasing (direct motion)
        nextLongitudes: [100, 99], // Will be same or decreasing (retrograde)
      });

      expect(result).toBe(true);
    });

    it("should return false when planet continues direct motion", () => {
      const result = s.isRetrograde({
        currentLongitude: 100,
        previousLongitudes: [98, 99],
        nextLongitudes: [101, 102],
      });

      expect(result).toBe(false);
    });

    it("should return false when planet is already retrograde", () => {
      const result = s.isRetrograde({
        currentLongitude: 100,
        previousLongitudes: [102, 101], // Was decreasing (already retrograde)
        nextLongitudes: [99, 98],
      });

      expect(result).toBe(false);
    });

    it("should handle 0/360 boundary crossing correctly", () => {
      const result = s.isRetrograde({
        currentLongitude: 5,
        previousLongitudes: [358, 360], // Effectively 358, 0 - was direct
        nextLongitudes: [5, 4], // Will be retrograde
      });

      expect(result).toBe(true);
    });

    it("should return false when not all previous longitudes indicate direct motion", () => {
      const result = s.isRetrograde({
        currentLongitude: 100,
        previousLongitudes: [101, 99], // Mixed - not all direct
        nextLongitudes: [100, 99],
      });

      expect(result).toBe(false);
    });

    it("should return false when not all next longitudes indicate retrograde", () => {
      const result = s.isRetrograde({
        currentLongitude: 100,
        previousLongitudes: [98, 99],
        nextLongitudes: [99, 101], // Mixed - not all retrograde
      });

      expect(result).toBe(false);
    });
  });

  describe("isDirect", () => {
    it("should return true when planet stations direct", () => {
      const result = s.isDirect({
        currentLongitude: 100,
        previousLongitudes: [102, 101], // Was decreasing (retrograde motion)
        nextLongitudes: [100, 101], // Will be same or increasing (direct)
      });

      expect(result).toBe(true);
    });

    it("should return false when planet continues retrograde motion", () => {
      const result = s.isDirect({
        currentLongitude: 100,
        previousLongitudes: [102, 101],
        nextLongitudes: [99, 98],
      });

      expect(result).toBe(false);
    });

    it("should return false when planet is already direct", () => {
      const result = s.isDirect({
        currentLongitude: 100,
        previousLongitudes: [98, 99], // Was increasing (already direct)
        nextLongitudes: [101, 102],
      });

      expect(result).toBe(false);
    });

    it("should handle 0/360 boundary crossing correctly", () => {
      const result = s.isDirect({
        currentLongitude: 355,
        previousLongitudes: [358, 357], // Was retrograde
        nextLongitudes: [355, 356], // Will be direct
      });

      expect(result).toBe(true);
    });

    it("should return false when not all previous longitudes indicate retrograde motion", () => {
      const result = s.isDirect({
        currentLongitude: 100,
        previousLongitudes: [99, 101], // Mixed - not all retrograde
        nextLongitudes: [100, 101],
      });

      expect(result).toBe(false);
    });

    it("should return false when not all next longitudes indicate direct motion", () => {
      const result = s.isDirect({
        currentLongitude: 100,
        previousLongitudes: [102, 101],
        nextLongitudes: [101, 99], // Mixed - not all direct
      });

      expect(result).toBe(false);
    });
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
