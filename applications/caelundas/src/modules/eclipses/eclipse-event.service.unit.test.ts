import { Test } from "@nestjs/testing";
import moment from "moment-timezone";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { EclipseEventService } from "./eclipse-event.service";

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

describe("EclipseEventService", () => {
  let service: EclipseEventService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [EclipseEventService],
    }).compile();

    service = await module.resolve(EclipseEventService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  const logger = new LoggerService();
  const progressiveUtilitiesService = {
    pairProgressiveEvents: vi.fn(),
  };

  const localService = new EclipseEventService(
    logger,
    progressiveUtilitiesService as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildSolarEclipseEvent", () => {
    it("builds geocentric solar eclipse event", () => {
      const timestamp = moment.utc("2024-04-08T18:00:00.000Z");

      const event = localService.buildSolarEclipseEvent({
        date: timestamp,
        frame: "geocentric",
        phase: "beginning",
      });

      expect(event.summary).toBe("🌐 ☀️🐉▶️ Solar Eclipse begins");
      expect(event.description).toBe("Solar Eclipse begins (Geocentric)");
      expect(event.categories).toContain("Solar");
      expect(event.categories).toContain("Geocentric");
      expect(event.start).toEqual(timestamp);
      expect(event.end).toEqual(timestamp);
    });

    it("builds topocentric solar eclipse event", () => {
      const timestamp = moment.utc("2024-04-08T18:00:00.000Z");

      const event = localService.buildSolarEclipseEvent({
        date: timestamp,
        frame: "topocentric",
        phase: "beginning",
      });

      expect(event.summary).toBe("📍 ☀️🐉▶️ Solar Eclipse begins");
      expect(event.description).toBe(
        "Solar Eclipse begins (Topocentric Visibility)",
      );
      expect(event.categories).toContain("Topocentric Visibility");
    });
  });

  describe("buildLunarEclipseEvent", () => {
    it("builds geocentric lunar eclipse event", () => {
      const timestamp = moment.utc("2024-09-18T02:00:00.000Z");

      const event = localService.buildLunarEclipseEvent({
        date: timestamp,
        frame: "geocentric",
        phase: "beginning",
      });

      expect(event.summary).toBe("🌐 🌙🐉▶️ Lunar Eclipse begins");
      expect(event.description).toBe("Lunar Eclipse begins (Geocentric)");
      expect(event.categories).toContain("Lunar");
      expect(event.categories).toContain("Geocentric");
      expect(event.start).toEqual(timestamp);
      expect(event.end).toEqual(timestamp);
    });

    it("builds topocentric lunar eclipse event", () => {
      const timestamp = moment.utc("2024-09-18T02:00:00.000Z");

      const event = localService.buildLunarEclipseEvent({
        date: timestamp,
        frame: "topocentric",
        phase: "beginning",
      });

      expect(event.summary).toBe("📍 🌙🐉▶️ Lunar Eclipse begins");
      expect(event.description).toBe(
        "Lunar Eclipse begins (Topocentric Visibility)",
      );
      expect(event.categories).toContain("Topocentric Visibility");
    });
  });

  describe("detectProgressive", () => {
    it("creates progressive events for geocentric solar and lunar eclipse ranges", () => {
      const solarBeginning: Event = {
        categories: [
          "Astronomy",
          "Astrology",
          "Eclipse",
          "Solar",
          "Geocentric",
        ],
        description: "Solar Eclipse begins (Geocentric)",
        end: moment.utc("2024-04-08T18:00:00.000Z"),
        start: moment.utc("2024-04-08T18:00:00.000Z"),
        summary: "🌐 ☀️🐉▶️ Solar Eclipse begins",
      };
      const solarEnding: Event = {
        categories: [
          "Astronomy",
          "Astrology",
          "Eclipse",
          "Solar",
          "Geocentric",
        ],
        description: "Solar Eclipse ends (Geocentric)",
        end: moment.utc("2024-04-08T19:00:00.000Z"),
        start: moment.utc("2024-04-08T19:00:00.000Z"),
        summary: "🌐 ☀️🐉◀️ Solar Eclipse ends",
      };
      const lunarBeginning: Event = {
        categories: [
          "Astronomy",
          "Astrology",
          "Eclipse",
          "Lunar",
          "Geocentric",
        ],
        description: "Lunar Eclipse begins (Geocentric)",
        end: moment.utc("2024-09-18T02:00:00.000Z"),
        start: moment.utc("2024-09-18T02:00:00.000Z"),
        summary: "🌐 🌙🐉▶️ Lunar Eclipse begins",
      };
      const lunarEnding: Event = {
        categories: [
          "Astronomy",
          "Astrology",
          "Eclipse",
          "Lunar",
          "Geocentric",
        ],
        description: "Lunar Eclipse ends (Geocentric)",
        end: moment.utc("2024-09-18T03:00:00.000Z"),
        start: moment.utc("2024-09-18T03:00:00.000Z"),
        summary: "🌐 🌙🐉◀️ Lunar Eclipse ends",
      };

      progressiveUtilitiesService.pairProgressiveEvents
        .mockReturnValueOnce([[lunarBeginning, lunarEnding]])
        .mockReturnValueOnce([[solarBeginning, solarEnding]])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      const progressiveEvents = localService.detectProgressive([
        solarBeginning,
        solarEnding,
        lunarBeginning,
        lunarEnding,
      ]);

      expect(progressiveEvents).toHaveLength(2);
      const solarDurationEvent = progressiveEvents.find((event) =>
        event.categories.includes("Solar"),
      );
      const lunarDurationEvent = progressiveEvents.find((event) =>
        event.categories.includes("Lunar"),
      );

      expect(solarDurationEvent?.description).toBe(
        "Solar Eclipse (Geocentric)",
      );
      expect(solarDurationEvent?.summary).toBe(
        "🌐 ☀️🐉 Solar Eclipse (Geocentric)",
      );
      expect(lunarDurationEvent?.description).toBe(
        "Lunar Eclipse (Geocentric)",
      );
      expect(lunarDurationEvent?.summary).toBe(
        "🌐 🌙🐉 Lunar Eclipse (Geocentric)",
      );
    });

    it("returns empty array when no eclipse events exist", () => {
      progressiveUtilitiesService.pairProgressiveEvents
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      const result = localService.detectProgressive([
        {
          categories: ["Astronomy"],
          description: "Unrelated",
          end: moment.utc("2024-01-01T00:00:00.000Z"),
          start: moment.utc("2024-01-01T00:00:00.000Z"),
          summary: "Unrelated",
        },
      ]);

      expect(result).toEqual([]);
    });
  });
});
