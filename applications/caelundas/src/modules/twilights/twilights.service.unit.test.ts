import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { LoggerService } from "@caelundas/src/modules/logger/logger.service";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Test } from "@nestjs/testing";
import moment from "moment-timezone";
import { beforeAll, describe, expect, it } from "vitest";

import { TwilightsBuilderService } from "./twilights-builder.service";
import { TwilightsComposerService } from "./twilights-composer.service";
import { TwilightsDetectorService } from "./twilights-detector.service";
import { TwilightsService } from "./twilights.service";

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { AzimuthElevationEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";

describe("TwilightsService", () => {
  let service: TwilightsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LoggerService,
        TwilightsBuilderService,
        TwilightsComposerService,
        TwilightsDetectorService,
        TwilightsService,
        EphemerisService,
        MathService,
        ProgressiveUtilities,
      ],
    }).compile();
    service = await module.resolve(TwilightsService);
  });

  describe("service.detect", () => {
    it("detects civil dawn transition", () => {
      const currentMinute = moment.utc("2024-03-21T06:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [currentMinute.toISOString()]: { azimuth: 86, elevation: -5.9 },
        [previousMinute.toISOString()]: { azimuth: 85, elevation: -6.1 },
      };

      const events = service.detect({
        minute: currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.description).toBe("Civil Dawn");
    });

    it("returns no transition when no threshold crossing occurs", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");
      const sunAzimuthElevationEphemeris: AzimuthElevationEphemeris = {
        [currentMinute.toISOString()]: { azimuth: 161, elevation: 45 },
        [previousMinute.toISOString()]: { azimuth: 160, elevation: 44 },
      };

      const events = service.detect({
        minute: currentMinute,
        sunAzimuthElevationEphemeris,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("service.detectProgressive", () => {
    it("builds Daylight and Night progressive spans", () => {
      const astronomicalDawn: Event = {
        categories: ["Astronomy", "Astrology", "Twilight", "Astronomical Dawn"],
        description: "Astronomical Dawn",
        end: moment.utc("2024-03-22T05:00:00.000Z"),
        start: moment.utc("2024-03-22T05:00:00.000Z"),
        summary: "🌠 Astronomical Dawn",
      };
      const civilDawn: Event = {
        categories: ["Astronomy", "Astrology", "Twilight", "Civil Dawn"],
        description: "Civil Dawn",
        end: moment.utc("2024-03-21T06:00:00.000Z"),
        start: moment.utc("2024-03-21T06:00:00.000Z"),
        summary: "🌄 Civil Dawn",
      };
      const civilDusk: Event = {
        categories: ["Astronomy", "Astrology", "Twilight", "Civil Dusk"],
        description: "Civil Dusk",
        end: moment.utc("2024-03-21T19:00:00.000Z"),
        start: moment.utc("2024-03-21T19:00:00.000Z"),
        summary: "🌇 Civil Dusk",
      };
      const astronomicalDusk: Event = {
        categories: ["Astronomy", "Astrology", "Twilight", "Astronomical Dusk"],
        description: "Astronomical Dusk",
        end: moment.utc("2024-03-21T20:00:00.000Z"),
        start: moment.utc("2024-03-21T20:00:00.000Z"),
        summary: "🌌 Astronomical Dusk",
      };

      const events = service.detectProgressive([
        civilDawn,
        civilDusk,
        astronomicalDusk,
        astronomicalDawn,
      ]);

      expect(events.some((event) => event.description === "Daylight")).toBe(
        true,
      );
      expect(events.some((event) => event.description === "Night")).toBe(true);
    });
  });

  describe("public constants", () => {
    it("exposes twilight thresholds and constants", () => {
      expect(TwilightsService.twilights).toEqual([
        "civil",
        "nautical",
        "astronomical",
      ]);
      expect(TwilightsService.degreesByTwilight.civil).toBe(6);
      expect(TwilightsService.degreesByTwilight.nautical).toBe(12);
      expect(TwilightsService.degreesByTwilight.astronomical).toBe(18);
      expect(TwilightsService.sunRadiusDegrees).toBeCloseTo(16 / 60, 5);
    });
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
