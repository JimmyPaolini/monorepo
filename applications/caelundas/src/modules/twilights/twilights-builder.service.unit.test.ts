import moment from "moment-timezone";
import { beforeEach, describe, expect, it } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { TwilightsBuilderService } from "./twilights-builder.service";

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

describe("TwilightsBuilderService", () => {
  let service: TwilightsBuilderService;

  const beginningEvent: Event = {
    categories: ["Twilight"],
    description: "Beginning",
    end: moment.utc("2024-03-21T05:00:00.000Z"),
    start: moment.utc("2024-03-21T05:00:00.000Z"),
    summary: "Beginning",
  };
  const endingEvent: Event = {
    categories: ["Twilight"],
    description: "Ending",
    end: moment.utc("2024-03-21T06:00:00.000Z"),
    start: moment.utc("2024-03-21T06:00:00.000Z"),
    summary: "Ending",
  };

  beforeEach(() => {
    service = new TwilightsBuilderService(new LoggerService());
  });

  describe("transition events", () => {
    it("builds Civil Dawn event", () => {
      const date = moment.utc("2024-03-21T06:00:00.000Z");
      const event = service.buildCivilDawnEvent(date);

      expect(event.summary).toBe("🌄 Civil Dawn");
      expect(event.description).toBe("Civil Dawn");
      expect(event.start).toEqual(date);
      expect(event.end).toEqual(date);
      expect(event.categories).toEqual([
        "Astronomy",
        "Astrology",
        "Twilight",
        "Civil Dawn",
      ]);
    });

    it("builds Astronomical Dusk event", () => {
      const date = moment.utc("2024-03-21T20:00:00.000Z");
      const event = service.buildAstronomicalDuskEvent(date);

      expect(event.summary).toBe("🌌 Astronomical Dusk");
      expect(event.description).toBe("Astronomical Dusk");
      expect(event.categories).toContain("Twilight");
      expect(event.categories).toContain("Astronomical Dusk");
    });

    it("builds Nautical Dawn event", () => {
      const date = moment.utc("2024-03-21T05:30:00.000Z");
      const event = service.buildNauticalDawnEvent(date);

      expect(event.summary).toBe("🌅 Nautical Dawn");
      expect(event.description).toBe("Nautical Dawn");
      expect(event.categories).toContain("Nautical Dawn");
    });
  });

  describe("duration events", () => {
    it("builds Daylight duration event", () => {
      const event = service.getDaylightDurationEvent(
        beginningEvent,
        endingEvent,
      );

      expect(event.summary).toBe("☀️ Daylight");
      expect(event.description).toBe("Daylight");
      expect(event.start).toEqual(beginningEvent.start);
      expect(event.end).toEqual(endingEvent.start);
      expect(event.categories).toContain("Daylight");
    });

    it("builds Night duration event", () => {
      const event = service.getNightDurationEvent(beginningEvent, endingEvent);

      expect(event.summary).toBe("🌃 Night");
      expect(event.description).toBe("Night");
      expect(event.categories).toContain("Night");
    });

    it("builds Astronomical Twilight (Morning) duration event", () => {
      const event = service.getAstronomicalTwilightMorningDurationEvent(
        beginningEvent,
        endingEvent,
      );

      expect(event.description).toBe("Astronomical Twilight (Morning)");
      expect(event.categories).toContain("Astronomical Twilight");
      expect(event.categories).toContain("Morning");
    });

    it("builds Nautical Twilight (Evening) duration event", () => {
      const event = service.getNauticalTwilightEveningDurationEvent(
        beginningEvent,
        endingEvent,
      );

      expect(event.description).toBe("Nautical Twilight (Evening)");
      expect(event.categories).toContain("Nautical Twilight");
      expect(event.categories).toContain("Evening");
    });
  });
});
