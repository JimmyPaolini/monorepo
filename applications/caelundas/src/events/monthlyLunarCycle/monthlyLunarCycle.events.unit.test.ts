import moment from "moment-timezone";
import { describe, expect, it, vi } from "vitest";

import { MARGIN_MINUTES } from "../../calendar.utilities";
import { symbolByLunarPhase } from "../../symbols";

import {
  getMonthlyLunarCycleDurationEvents,
  getMonthlyLunarCycleEvent,
  getMonthlyLunarCycleEvents,
} from "./monthlyLunarCycle.events";

import type { Event } from "../../calendar.utilities";
import type { IlluminationEphemeris } from "../../ephemeris/ephemeris.types";
import type { LunarPhase } from "../../types";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

describe("monthlyLunarCycle.events", () => {
  // Helper to create illumination ephemeris with margin
  function createIlluminationEphemeris(
    currentMinute: moment.Moment,
    illuminations: number[],
  ): IlluminationEphemeris {
    const ephemeris: IlluminationEphemeris = {};
    const totalMinutes = MARGIN_MINUTES * 2 + 1;

    for (let i = 0; i < totalMinutes; i++) {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - i, "minutes");
      const illumination =
        illuminations[i] ?? illuminations[illuminations.length - 1] ?? 0;
      ephemeris[minute.toISOString()] = {
        illumination,
      };
    }

    return ephemeris;
  }

  describe("getMonthlyLunarCycleEvents", () => {
    it("should return empty array when no lunar phase events occur", () => {
      const currentMinute = moment.utc("2024-03-15T12:00:00.000Z");

      // Illumination staying constant (no phase change)
      const constantIlluminations: number[] = new Array<number>(
        MARGIN_MINUTES * 2 + 1,
      ).fill(0.5);

      const moonIlluminationEphemeris = createIlluminationEphemeris(
        currentMinute,
        constantIlluminations,
      );

      const events = getMonthlyLunarCycleEvents({
        currentMinute,
        moonIlluminationEphemeris,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("getMonthlyLunarCycleEvent", () => {
    it("should create a new moon event with correct structure", () => {
      const date = new Date("2024-03-10T09:00:00.000Z");

      const event = getMonthlyLunarCycleEvent({ date, lunarPhase: "new" });

      expect(event.summary).toBe(`🌙 ${symbolByLunarPhase.new} New Moon`);
      expect(event.description).toBe("New Moon");
      expect(event.start).toEqual(date);
      expect(event.end).toEqual(date);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Astrology");
      expect(event.categories).toContain("Monthly Lunar Cycle");
      expect(event.categories).toContain("Lunar");
      expect(event.categories).toContain("New");
    });

    it("should create a full moon event with correct structure", () => {
      const date = new Date("2024-03-25T07:00:00.000Z");

      const event = getMonthlyLunarCycleEvent({ date, lunarPhase: "full" });

      expect(event.summary).toBe(`🌙 ${symbolByLunarPhase.full} Full Moon`);
      expect(event.description).toBe("Full Moon");
      expect(event.categories).toContain("Full");
    });

    it("should create a first quarter event with correct structure", () => {
      const date = new Date("2024-03-17T04:11:00.000Z");

      const event = getMonthlyLunarCycleEvent({
        date,
        lunarPhase: "first quarter",
      });

      expect(event.summary).toBe(
        `🌙 ${symbolByLunarPhase["first quarter"]} First Quarter Moon`,
      );
      expect(event.description).toBe("First Quarter Moon");
      expect(event.categories).toContain("First Quarter");
    });

    it("should create a last quarter event with correct structure", () => {
      const date = new Date("2024-04-02T03:15:00.000Z");

      const event = getMonthlyLunarCycleEvent({
        date,
        lunarPhase: "last quarter",
      });

      expect(event.summary).toBe(
        `🌙 ${symbolByLunarPhase["last quarter"]} Last Quarter Moon`,
      );
      expect(event.description).toBe("Last Quarter Moon");
      expect(event.categories).toContain("Last Quarter");
    });

    it("should create a waxing crescent event with correct structure", () => {
      const date = new Date("2024-03-13T12:00:00.000Z");

      const event = getMonthlyLunarCycleEvent({
        date,
        lunarPhase: "waxing crescent",
      });

      expect(event.summary).toBe(
        `🌙 ${symbolByLunarPhase["waxing crescent"]} Waxing Crescent Moon`,
      );
      expect(event.description).toBe("Waxing Crescent Moon");
      expect(event.categories).toContain("Waxing Crescent");
    });

    it("should create a waxing gibbous event with correct structure", () => {
      const date = new Date("2024-03-21T12:00:00.000Z");

      const event = getMonthlyLunarCycleEvent({
        date,
        lunarPhase: "waxing gibbous",
      });

      expect(event.summary).toBe(
        `🌙 ${symbolByLunarPhase["waxing gibbous"]} Waxing Gibbous Moon`,
      );
      expect(event.description).toBe("Waxing Gibbous Moon");
      expect(event.categories).toContain("Waxing Gibbous");
    });

    it("should create a waning gibbous event with correct structure", () => {
      const date = new Date("2024-03-28T12:00:00.000Z");

      const event = getMonthlyLunarCycleEvent({
        date,
        lunarPhase: "waning gibbous",
      });

      expect(event.summary).toBe(
        `🌙 ${symbolByLunarPhase["waning gibbous"]} Waning Gibbous Moon`,
      );
      expect(event.description).toBe("Waning Gibbous Moon");
      expect(event.categories).toContain("Waning Gibbous");
    });

    it("should create a waning crescent event with correct structure", () => {
      const date = new Date("2024-04-05T12:00:00.000Z");

      const event = getMonthlyLunarCycleEvent({
        date,
        lunarPhase: "waning crescent",
      });

      expect(event.summary).toBe(
        `🌙 ${symbolByLunarPhase["waning crescent"]} Waning Crescent Moon`,
      );
      expect(event.description).toBe("Waning Crescent Moon");
      expect(event.categories).toContain("Waning Crescent");
    });
  });

  describe("writeMonthlyLunarCycleEvents", () => {
    it("should write events to file and database", async () => {
      const fs = await import("fs");

      const events = [
        getMonthlyLunarCycleEvent({
          date: new Date("2024-03-10T09:00:00.000Z"),
          lunarPhase: "new",
        }),
      ];
      const start = new Date("2024-03-01T00:00:00.000Z");
      const end = new Date("2024-03-31T23:59:59.000Z");

      const { writeMonthlyLunarCycleEvents } =
        await import("./monthlyLunarCycle.events");

      writeMonthlyLunarCycleEvents({
        monthlyLunarCycleEvents: events,
        start,
        end,
      });

      expect(fs.default.writeFileSync).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Writing"),
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Wrote"),
      );
    });

    it("should not write when events array is empty", async () => {
      const fs = await import("fs");

      const start = new Date("2024-03-01T00:00:00.000Z");
      const end = new Date("2024-03-31T23:59:59.000Z");

      const { writeMonthlyLunarCycleEvents } =
        await import("./monthlyLunarCycle.events");

      writeMonthlyLunarCycleEvents({
        monthlyLunarCycleEvents: [],
        start,
        end,
      });

      expect(fs.default.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe("getMonthlyLunarCycleDurationEvents", () => {
    it("should create duration events between consecutive lunar phases", () => {
      const newMoon: Event = {
        start: new Date("2024-03-10T09:00:00.000Z"),
        end: new Date("2024-03-10T09:00:00.000Z"),
        summary: "🌙 🌑 New Moon",
        description: "New Moon",
        categories: [
          "Astronomy",
          "Astrology",
          "Monthly Lunar Cycle",
          "Lunar",
          "New",
        ],
      };
      const waxingCrescent: Event = {
        start: new Date("2024-03-13T12:00:00.000Z"),
        end: new Date("2024-03-13T12:00:00.000Z"),
        summary: "🌙 🌒 Waxing Crescent Moon",
        description: "Waxing Crescent Moon",
        categories: [
          "Astronomy",
          "Astrology",
          "Monthly Lunar Cycle",
          "Lunar",
          "Waxing Crescent",
        ],
      };
      const firstQuarter: Event = {
        start: new Date("2024-03-17T04:11:00.000Z"),
        end: new Date("2024-03-17T04:11:00.000Z"),
        summary: "🌙 🌓 First Quarter Moon",
        description: "First Quarter Moon",
        categories: [
          "Astronomy",
          "Astrology",
          "Monthly Lunar Cycle",
          "Lunar",
          "First Quarter",
        ],
      };

      const durationEvents = getMonthlyLunarCycleDurationEvents([
        newMoon,
        waxingCrescent,
        firstQuarter,
      ]);

      // Should have duration events between phases
      expect(durationEvents.length).toBe(2);

      expect(durationEvents[0]).toBeDefined();
      expect(durationEvents[1]).toBeDefined();

      // First duration: New → Waxing Crescent
      expect(durationEvents[0]?.start).toEqual(newMoon.start);
      expect(durationEvents[0]?.end).toEqual(waxingCrescent.start);
      expect(durationEvents[0]?.description).toBe("New Moon");

      // Second duration: Waxing Crescent → First Quarter
      expect(durationEvents[1]?.start).toEqual(waxingCrescent.start);
      expect(durationEvents[1]?.end).toEqual(firstQuarter.start);
      expect(durationEvents[1]?.description).toBe("Waxing Crescent Moon");
    });

    it("should return empty array when no lunar cycle events provided", () => {
      const durationEvents = getMonthlyLunarCycleDurationEvents([]);

      expect(durationEvents).toHaveLength(0);
    });

    it("should filter out non-lunar cycle events", () => {
      const nonLunarEvent: Event = {
        start: new Date("2024-03-10T09:00:00.000Z"),
        end: new Date("2024-03-10T09:00:00.000Z"),
        summary: "Some other event",
        description: "Not a lunar event",
        categories: ["Astronomy", "Something Else"],
      };

      const durationEvents = getMonthlyLunarCycleDurationEvents([
        nonLunarEvent,
      ]);

      expect(durationEvents).toHaveLength(0);
    });

    it("should handle full lunar cycle", () => {
      const phases: { phase: LunarPhase; date: string }[] = [
        { phase: "new", date: "2024-03-10T09:00:00.000Z" },
        { phase: "waxing crescent", date: "2024-03-13T12:00:00.000Z" },
        { phase: "first quarter", date: "2024-03-17T04:11:00.000Z" },
        { phase: "waxing gibbous", date: "2024-03-21T12:00:00.000Z" },
        { phase: "full", date: "2024-03-25T07:00:00.000Z" },
        { phase: "waning gibbous", date: "2024-03-28T12:00:00.000Z" },
        { phase: "last quarter", date: "2024-04-02T03:15:00.000Z" },
        { phase: "waning crescent", date: "2024-04-05T12:00:00.000Z" },
      ];

      const events = phases.map(({ phase, date }) =>
        getMonthlyLunarCycleEvent({
          date: new Date(date),
          lunarPhase: phase,
        }),
      );

      const durationEvents = getMonthlyLunarCycleDurationEvents(events);

      // Should have 7 duration events (between 8 phases)
      expect(durationEvents.length).toBe(7);
    });

    it("should warn and skip events with invalid categories", () => {
      const invalidEvent: Event = {
        start: new Date("2024-03-10T09:00:00.000Z"),
        end: new Date("2024-03-10T09:00:00.000Z"),
        summary: "Invalid event",
        description: "Invalid",
        categories: ["Monthly Lunar Cycle"], // Missing lunar phase category
      };
      const validEvent: Event = {
        start: new Date("2024-03-13T12:00:00.000Z"),
        end: new Date("2024-03-13T12:00:00.000Z"),
        summary: "🌙 🌒 Waxing Crescent Moon",
        description: "Waxing Crescent Moon",
        categories: [
          "Astronomy",
          "Astrology",
          "Monthly Lunar Cycle",
          "Lunar",
          "Waxing Crescent",
        ],
      };

      const durationEvents = getMonthlyLunarCycleDurationEvents([
        invalidEvent,
        validEvent,
      ]);

      // Should skip the invalid event
      expect(durationEvents).toHaveLength(0);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Could not extract lunar phase"),
      );
    });
  });
});
