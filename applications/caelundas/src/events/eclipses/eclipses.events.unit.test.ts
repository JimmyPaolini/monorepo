import moment from "moment-timezone";
import { describe, expect, it, vi } from "vitest";

import { MARGIN_MINUTES } from "../../calendar.utilities";

import {
  getEclipseDurationEvents,
  getEclipseEvents,
  getLunarEclipseEvent,
  getSolarEclipseEvent,
} from "./eclipses.events";

import type { Event } from "../../calendar.utilities";
import type {
  CoordinateEphemeris,
  DiameterEphemeris,
} from "../../ephemeris/ephemeris.types";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

describe("eclipses.events", () => {
  // Helper to create coordinate ephemeris
  function createCoordinateEphemeris(
    currentMinute: moment.Moment,
    longitudes: number[],
    latitudes: number[],
  ): CoordinateEphemeris {
    const ephemeris: CoordinateEphemeris = {};
    const totalMinutes = MARGIN_MINUTES * 2 + 1;

    for (let i = 0; i < totalMinutes; i++) {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - i, "minutes");
      ephemeris[minute.toISOString()] = {
        longitude: longitudes[i] ?? longitudes.at(-1) ?? 0,
        latitude: latitudes[i] ?? latitudes.at(-1) ?? 0,
      };
    }

    return ephemeris;
  }

  // Helper to create diameter ephemeris
  function createDiameterEphemeris(
    currentMinute: moment.Moment,
    diameters: number[],
  ): DiameterEphemeris {
    const ephemeris: DiameterEphemeris = {};
    const totalMinutes = MARGIN_MINUTES * 2 + 1;

    for (let i = 0; i < totalMinutes; i++) {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - i, "minutes");
      ephemeris[minute.toISOString()] = {
        diameter: diameters[i] ?? diameters.at(-1) ?? 0,
      };
    }

    return ephemeris;
  }

  describe("getEclipseEvents", () => {
    it("should return empty array when no eclipse occurs", () => {
      const currentMinute = moment.utc("2024-03-01T12:00:00.000Z");

      // No eclipse: sun and moon far apart
      const sunLongitudes = Array.from<number>({
        length: MARGIN_MINUTES * 2 + 1,
      }).fill(0);
      const moonLongitudes = Array.from<number>({
        length: MARGIN_MINUTES * 2 + 1,
      }).fill(90);
      const sunLatitudes = Array.from<number>({
        length: MARGIN_MINUTES * 2 + 1,
      }).fill(0);
      const moonLatitudes = Array.from<number>({
        length: MARGIN_MINUTES * 2 + 1,
      }).fill(5);
      const sunDiameters = Array.from<number>({
        length: MARGIN_MINUTES * 2 + 1,
      }).fill(0.533);
      const moonDiameters = Array.from<number>({
        length: MARGIN_MINUTES * 2 + 1,
      }).fill(0.518);

      const moonCoordinateEphemeris = createCoordinateEphemeris(
        currentMinute,
        moonLongitudes,
        moonLatitudes,
      );
      const sunCoordinateEphemeris = createCoordinateEphemeris(
        currentMinute,
        sunLongitudes,
        sunLatitudes,
      );
      const moonDiameterEphemeris = createDiameterEphemeris(
        currentMinute,
        moonDiameters,
      );
      const sunDiameterEphemeris = createDiameterEphemeris(
        currentMinute,
        sunDiameters,
      );

      const events = getEclipseEvents({
        currentMinute,
        moonCoordinateEphemeris,
        moonDiameterEphemeris,
        sunCoordinateEphemeris,
        sunDiameterEphemeris,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("getSolarEclipseEvent", () => {
    it("should create a solar eclipse beginning event with correct structure", () => {
      const timestamp = new Date("2024-04-08T18:00:00.000Z");

      const event = getSolarEclipseEvent({
        date: timestamp,
        phase: "beginning",
      });

      expect(event.summary).toBe("☀️🐉▶️ Solar Eclipse begins");
      expect(event.description).toBe("Solar Eclipse begins");
      expect(event.start).toEqual(timestamp);
      expect(event.end).toEqual(timestamp);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Astrology");
      expect(event.categories).toContain("Eclipse");
      expect(event.categories).toContain("Solar");
    });

    it("should create a solar eclipse maximum event with correct structure", () => {
      const timestamp = new Date("2024-04-08T18:30:00.000Z");

      const event = getSolarEclipseEvent({
        date: timestamp,
        phase: "maximum",
      });

      expect(event.summary).toBe("☀️🐉🎯 Solar Eclipse maximum");
      expect(event.description).toBe("Solar Eclipse maximum");
      expect(event.categories).toContain("Solar");
    });

    it("should create a solar eclipse ending event with correct structure", () => {
      const timestamp = new Date("2024-04-08T19:00:00.000Z");

      const event = getSolarEclipseEvent({
        date: timestamp,
        phase: "ending",
      });

      expect(event.summary).toBe("☀️🐉◀️ Solar Eclipse ends");
      expect(event.description).toBe("Solar Eclipse ends");
      expect(event.categories).toContain("Solar");
    });
  });

  describe("getLunarEclipseEvent", () => {
    it("should create a lunar eclipse beginning event with correct structure", () => {
      const timestamp = new Date("2024-09-18T02:00:00.000Z");

      const event = getLunarEclipseEvent({
        date: timestamp,
        phase: "beginning",
      });

      expect(event.summary).toBe("🌙🐉▶️ Lunar Eclipse begins");
      expect(event.description).toBe("Lunar Eclipse begins");
      expect(event.start).toEqual(timestamp);
      expect(event.end).toEqual(timestamp);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Astrology");
      expect(event.categories).toContain("Eclipse");
      expect(event.categories).toContain("Lunar");
    });

    it("should create a lunar eclipse maximum event with correct structure", () => {
      const timestamp = new Date("2024-09-18T02:30:00.000Z");

      const event = getLunarEclipseEvent({
        date: timestamp,
        phase: "maximum",
      });

      expect(event.summary).toBe("🌙🐉🎯 Lunar Eclipse maximum");
      expect(event.description).toBe("Lunar Eclipse maximum");
      expect(event.categories).toContain("Lunar");
    });

    it("should create a lunar eclipse ending event with correct structure", () => {
      const timestamp = new Date("2024-09-18T03:00:00.000Z");

      const event = getLunarEclipseEvent({
        date: timestamp,
        phase: "ending",
      });

      expect(event.summary).toBe("🌙🐉◀️ Lunar Eclipse ends");
      expect(event.description).toBe("Lunar Eclipse ends");
      expect(event.categories).toContain("Lunar");
    });
  });

  describe("getEclipseDurationEvents", () => {
    it("should create solar eclipse duration event from beginning to ending", () => {
      const beginningEvent: Event = {
        start: new Date("2024-04-08T18:00:00.000Z"),
        end: new Date("2024-04-08T18:00:00.000Z"),
        summary: "☀️🐉▶️ Solar Eclipse begins",
        description: "Solar Eclipse begins",
        categories: ["Astronomy", "Astrology", "Eclipse", "Solar"],
      };
      const endingEvent: Event = {
        start: new Date("2024-04-08T19:00:00.000Z"),
        end: new Date("2024-04-08T19:00:00.000Z"),
        summary: "☀️🐉◀️ Solar Eclipse ends",
        description: "Solar Eclipse ends",
        categories: ["Astronomy", "Astrology", "Eclipse", "Solar"],
      };

      const durationEvents = getEclipseDurationEvents([
        beginningEvent,
        endingEvent,
      ]);

      expect(durationEvents.length).toBeGreaterThanOrEqual(1);
      const solarDuration = durationEvents.find(
        (e) =>
          e.description.includes("Solar Eclipse") &&
          !e.description.includes("begins") &&
          !e.description.includes("ends"),
      );
      expect(solarDuration).toBeDefined();
      if (solarDuration) {
        expect(solarDuration.start).toEqual(beginningEvent.start);
        expect(solarDuration.end).toEqual(endingEvent.start);
        expect(solarDuration.summary).toBe("☀️🐉 Solar Eclipse");
        expect(solarDuration.description).toBe("Solar Eclipse");
        expect(solarDuration.categories).toContain("Solar");
      }
    });

    it("should create lunar eclipse duration event from beginning to ending", () => {
      const beginningEvent: Event = {
        start: new Date("2024-09-18T02:00:00.000Z"),
        end: new Date("2024-09-18T02:00:00.000Z"),
        summary: "🌙🐉▶️ Lunar Eclipse begins",
        description: "Lunar Eclipse begins",
        categories: ["Astronomy", "Astrology", "Eclipse", "Lunar"],
      };
      const endingEvent: Event = {
        start: new Date("2024-09-18T03:00:00.000Z"),
        end: new Date("2024-09-18T03:00:00.000Z"),
        summary: "🌙🐉◀️ Lunar Eclipse ends",
        description: "Lunar Eclipse ends",
        categories: ["Astronomy", "Astrology", "Eclipse", "Lunar"],
      };

      const durationEvents = getEclipseDurationEvents([
        beginningEvent,
        endingEvent,
      ]);

      expect(durationEvents.length).toBeGreaterThanOrEqual(1);
      const lunarDuration = durationEvents.find(
        (e) =>
          e.description.includes("Lunar Eclipse") &&
          !e.description.includes("begins") &&
          !e.description.includes("ends"),
      );
      expect(lunarDuration).toBeDefined();
      if (lunarDuration) {
        expect(lunarDuration.start).toEqual(beginningEvent.start);
        expect(lunarDuration.end).toEqual(endingEvent.start);
        expect(lunarDuration.summary).toBe("🌙🐉 Lunar Eclipse");
        expect(lunarDuration.description).toBe("Lunar Eclipse");
        expect(lunarDuration.categories).toContain("Lunar");
      }
    });

    it("should return empty array when no eclipse events provided", () => {
      const durationEvents = getEclipseDurationEvents([]);

      expect(durationEvents).toHaveLength(0);
    });

    it("should handle both solar and lunar eclipses together", () => {
      const solarBegin: Event = {
        start: new Date("2024-04-08T18:00:00.000Z"),
        end: new Date("2024-04-08T18:00:00.000Z"),
        summary: "☀️🐉▶️ Solar Eclipse begins",
        description: "Solar Eclipse begins",
        categories: ["Astronomy", "Astrology", "Eclipse", "Solar"],
      };
      const solarEnd: Event = {
        start: new Date("2024-04-08T19:00:00.000Z"),
        end: new Date("2024-04-08T19:00:00.000Z"),
        summary: "☀️🐉◀️ Solar Eclipse ends",
        description: "Solar Eclipse ends",
        categories: ["Astronomy", "Astrology", "Eclipse", "Solar"],
      };
      const lunarBegin: Event = {
        start: new Date("2024-09-18T02:00:00.000Z"),
        end: new Date("2024-09-18T02:00:00.000Z"),
        summary: "🌙🐉▶️ Lunar Eclipse begins",
        description: "Lunar Eclipse begins",
        categories: ["Astronomy", "Astrology", "Eclipse", "Lunar"],
      };
      const lunarEnd: Event = {
        start: new Date("2024-09-18T03:00:00.000Z"),
        end: new Date("2024-09-18T03:00:00.000Z"),
        summary: "🌙🐉◀️ Lunar Eclipse ends",
        description: "Lunar Eclipse ends",
        categories: ["Astronomy", "Astrology", "Eclipse", "Lunar"],
      };

      const durationEvents = getEclipseDurationEvents([
        solarBegin,
        solarEnd,
        lunarBegin,
        lunarEnd,
      ]);

      // Should have duration events for both solar and lunar
      expect(durationEvents.length).toBeGreaterThanOrEqual(2);

      const solarDuration = durationEvents.find((e) =>
        e.categories.includes("Solar"),
      );
      const lunarDuration = durationEvents.find((e) =>
        e.categories.includes("Lunar"),
      );

      expect(solarDuration).toBeDefined();
      expect(lunarDuration).toBeDefined();
    });

    it("should filter out non-eclipse events", () => {
      const nonEclipseEvent: Event = {
        start: new Date("2024-04-08T18:00:00.000Z"),
        end: new Date("2024-04-08T18:00:00.000Z"),
        summary: "Some other event",
        description: "Not an eclipse",
        categories: ["Astronomy", "Something Else"],
      };

      const durationEvents = getEclipseDurationEvents([nonEclipseEvent]);

      expect(durationEvents).toHaveLength(0);
    });
  });
});
