import { MARGIN_MINUTES } from "@caelundas/src/constants";
import { EphemerisService } from "@caelundas/src/ephemeris/ephemeris.service";
import { MathService } from "@caelundas/src/math/math.service";
import { symbolByLunarPhase } from "@caelundas/src/symbols";
import moment, { type Moment } from "moment-timezone";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MonthlyLunarCycleService } from "./monthly-lunar-cycle.service";

import type { Event } from "@caelundas/src/calendar/calendar.types";
import type { IlluminationEphemeris } from "@caelundas/src/ephemeris/ephemeris.types";
import type { LunarPhase } from "@caelundas/src/types";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

interface ServicePrivate {
  isNewMoon: (args: {
    currentIllumination: number;
    previousIlluminations: number[];
    nextIlluminations: number[];
  }) => boolean;
  isFullMoon: (args: {
    currentIllumination: number;
    previousIlluminations: number[];
    nextIlluminations: number[];
  }) => boolean;
  isLunarPhase: (args: {
    currentIllumination: number;
    previousIlluminations: number[];
    nextIlluminations: number[];
    lunarPhase: LunarPhase;
  }) => boolean;
}

const mathService = new MathService();
const ephemerisService = new EphemerisService(mathService);
const service = new MonthlyLunarCycleService(ephemerisService);
const s = service as unknown as ServicePrivate;

describe("monthlyLunarCycle.events", () => {
  // Helper to create illumination ephemeris with margin
  function createIlluminationEphemeris(
    currentMinute: Moment,
    illuminations: number[],
  ): IlluminationEphemeris {
    const ephemeris: IlluminationEphemeris = {};
    const totalMinutes = MARGIN_MINUTES * 2 + 1;

    for (let i = 0; i < totalMinutes; i++) {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - i, "minutes");
      const illumination = illuminations[i] ?? illuminations.at(-1) ?? 0;
      ephemeris[minute.toISOString()] = {
        illumination,
      };
    }

    return ephemeris;
  }

  describe("service.detect", () => {
    it("should return empty array when no lunar phase events occur", () => {
      const currentMinute = moment.utc("2024-03-15T12:00:00.000Z");

      // Illumination staying constant (no phase change)
      const constantIlluminations = Array.from<number>({
        length: MARGIN_MINUTES * 2 + 1,
      }).fill(0.5);

      const moonIlluminationEphemeris = createIlluminationEphemeris(
        currentMinute,
        constantIlluminations,
      );

      const events = service.detect({
        minute: currentMinute,
        moonIlluminationEphemeris,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("getMonthlyLunarCycleEvent", () => {
    it("should create a new moon event with correct structure", () => {
      const date = moment.utc("2024-03-10T09:00:00.000Z");

      const event = service.buildMonthlyLunarCycleEvent({
        date,
        lunarPhase: "new",
      });

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
      const date = moment.utc("2024-03-25T07:00:00.000Z");

      const event = service.buildMonthlyLunarCycleEvent({
        date,
        lunarPhase: "full",
      });

      expect(event.summary).toBe(`🌙 ${symbolByLunarPhase.full} Full Moon`);
      expect(event.description).toBe("Full Moon");
      expect(event.categories).toContain("Full");
    });

    it("should create a first quarter event with correct structure", () => {
      const date = moment.utc("2024-03-17T04:11:00.000Z");

      const event = service.buildMonthlyLunarCycleEvent({
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
      const date = moment.utc("2024-04-02T03:15:00.000Z");

      const event = service.buildMonthlyLunarCycleEvent({
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
      const date = moment.utc("2024-03-13T12:00:00.000Z");

      const event = service.buildMonthlyLunarCycleEvent({
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
      const date = moment.utc("2024-03-21T12:00:00.000Z");

      const event = service.buildMonthlyLunarCycleEvent({
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
      const date = moment.utc("2024-03-28T12:00:00.000Z");

      const event = service.buildMonthlyLunarCycleEvent({
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
      const date = moment.utc("2024-04-05T12:00:00.000Z");

      const event = service.buildMonthlyLunarCycleEvent({
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

  describe("service.detectProgressive", () => {
    it("should create progressive events between consecutive lunar phases", () => {
      const newMoon: Event = {
        start: moment.utc("2024-03-10T09:00:00.000Z"),
        end: moment.utc("2024-03-10T09:00:00.000Z"),
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
        start: moment.utc("2024-03-13T12:00:00.000Z"),
        end: moment.utc("2024-03-13T12:00:00.000Z"),
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
        start: moment.utc("2024-03-17T04:11:00.000Z"),
        end: moment.utc("2024-03-17T04:11:00.000Z"),
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

      const progressiveEvents = service.detectProgressive([
        newMoon,
        waxingCrescent,
        firstQuarter,
      ]);

      // Should have progressive events between phases
      expect(progressiveEvents.length).toBe(2);

      expect(progressiveEvents[0]).toBeDefined();
      expect(progressiveEvents[1]).toBeDefined();

      // First duration: New → Waxing Crescent
      expect(progressiveEvents[0]?.start).toEqual(newMoon.start);
      expect(progressiveEvents[0]?.end).toEqual(waxingCrescent.start);
      expect(progressiveEvents[0]?.description).toBe("New Moon");

      // Second duration: Waxing Crescent → First Quarter
      expect(progressiveEvents[1]?.start).toEqual(waxingCrescent.start);
      expect(progressiveEvents[1]?.end).toEqual(firstQuarter.start);
      expect(progressiveEvents[1]?.description).toBe("Waxing Crescent Moon");
    });

    it("should return empty array when no lunar cycle events provided", () => {
      const progressiveEvents = service.detectProgressive([]);

      expect(progressiveEvents).toHaveLength(0);
    });

    it("should filter out non-lunar cycle events", () => {
      const nonLunarEvent: Event = {
        start: moment.utc("2024-03-10T09:00:00.000Z"),
        end: moment.utc("2024-03-10T09:00:00.000Z"),
        summary: "Some other event",
        description: "Not a lunar event",
        categories: ["Astronomy", "Something Else"],
      };

      const progressiveEvents = service.detectProgressive([nonLunarEvent]);

      expect(progressiveEvents).toHaveLength(0);
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
        service.buildMonthlyLunarCycleEvent({
          date: moment.utc(date),
          lunarPhase: phase,
        }),
      );

      const progressiveEvents = service.detectProgressive(events);

      // Should have 7 progressive events (between 8 phases)
      expect(progressiveEvents.length).toBe(7);
    });

    it("should warn and skip events with invalid categories", () => {
      const invalidEvent: Event = {
        start: moment.utc("2024-03-10T09:00:00.000Z"),
        end: moment.utc("2024-03-10T09:00:00.000Z"),
        summary: "Invalid event",
        description: "Invalid",
        categories: ["Monthly Lunar Cycle"], // Missing lunar phase category
      };
      const validEvent: Event = {
        start: moment.utc("2024-03-13T12:00:00.000Z"),
        end: moment.utc("2024-03-13T12:00:00.000Z"),
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

      const progressiveEvents = service.detectProgressive([
        invalidEvent,
        validEvent,
      ]);

      // Should skip the invalid event
      expect(progressiveEvents).toHaveLength(0);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Could not extract lunar phase"),
      );
    });
  });

  describe("private utility methods", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    describe("illuminationByPhase", () => {
      it("should have correct illumination values for all phases", () => {
        expect(MonthlyLunarCycleService.illuminationByPhase.new).toBe(0);
        expect(
          MonthlyLunarCycleService.illuminationByPhase["waxing crescent"],
        ).toBe(0.25);
        expect(
          MonthlyLunarCycleService.illuminationByPhase["first quarter"],
        ).toBe(0.5);
        expect(
          MonthlyLunarCycleService.illuminationByPhase["waxing gibbous"],
        ).toBe(0.75);
        expect(MonthlyLunarCycleService.illuminationByPhase.full).toBe(1);
        expect(
          MonthlyLunarCycleService.illuminationByPhase["waning gibbous"],
        ).toBe(0.75);
        expect(
          MonthlyLunarCycleService.illuminationByPhase["last quarter"],
        ).toBe(0.5);
        expect(
          MonthlyLunarCycleService.illuminationByPhase["waning crescent"],
        ).toBe(0.25);
      });
    });

    describe("isNewMoon", () => {
      it("should return true at new moon (minimum illumination)", () => {
        const result = s.isNewMoon({
          currentIllumination: 1,
          previousIlluminations: [5, 3],
          nextIlluminations: [3, 5],
        });

        expect(result).toBe(true);
      });

      it("should return false when illumination is not minimum", () => {
        const result = s.isNewMoon({
          currentIllumination: 10,
          previousIlluminations: [5, 8],
          nextIlluminations: [12, 15],
        });

        expect(result).toBe(false);
      });

      it("should return false when illumination is above 50", () => {
        const result = s.isNewMoon({
          currentIllumination: 55,
          previousIlluminations: [60, 58],
          nextIlluminations: [58, 60],
        });

        expect(result).toBe(false);
      });

      it("should handle edge case where current equals next minimum", () => {
        const result = s.isNewMoon({
          currentIllumination: 2,
          previousIlluminations: [5, 3],
          nextIlluminations: [2, 5],
        });

        expect(result).toBe(true);
      });
    });

    describe("isFullMoon", () => {
      it("should return true at full moon (maximum illumination)", () => {
        const result = s.isFullMoon({
          currentIllumination: 99,
          previousIlluminations: [95, 97],
          nextIlluminations: [97, 95],
        });

        expect(result).toBe(true);
      });

      it("should return false when illumination is not maximum", () => {
        const result = s.isFullMoon({
          currentIllumination: 80,
          previousIlluminations: [75, 78],
          nextIlluminations: [85, 90],
        });

        expect(result).toBe(false);
      });

      it("should return false when illumination is below 50", () => {
        const result = s.isFullMoon({
          currentIllumination: 45,
          previousIlluminations: [40, 42],
          nextIlluminations: [42, 40],
        });

        expect(result).toBe(false);
      });

      it("should handle edge case where current equals next maximum", () => {
        const result = s.isFullMoon({
          currentIllumination: 98,
          previousIlluminations: [95, 97],
          nextIlluminations: [98, 95],
        });

        expect(result).toBe(true);
      });
    });

    describe("isLunarPhase", () => {
      describe("new moon phase", () => {
        it("should delegate to isNewMoon", () => {
          const result = s.isLunarPhase({
            currentIllumination: 1,
            previousIlluminations: [5, 3],
            nextIlluminations: [3, 5],
            lunarPhase: "new",
          });

          expect(result).toBe(true);
        });
      });

      describe("full moon phase", () => {
        it("should delegate to isFullMoon", () => {
          const result = s.isLunarPhase({
            currentIllumination: 99,
            previousIlluminations: [95, 97],
            nextIlluminations: [97, 95],
            lunarPhase: "full",
          });

          expect(result).toBe(true);
        });
      });

      describe("waxing crescent", () => {
        it("should return true when crossing 25% threshold while waxing", () => {
          const result = s.isLunarPhase({
            currentIllumination: 26,
            previousIlluminations: [24],
            nextIlluminations: [28],
            lunarPhase: "waxing crescent",
          });

          expect(result).toBe(true);
        });

        it("should return false when waning", () => {
          const result = s.isLunarPhase({
            currentIllumination: 24,
            previousIlluminations: [26],
            nextIlluminations: [22],
            lunarPhase: "waxing crescent",
          });

          expect(result).toBe(false);
        });
      });

      describe("first quarter", () => {
        it("should return true when crossing 50% threshold while waxing", () => {
          const result = s.isLunarPhase({
            currentIllumination: 51,
            previousIlluminations: [49],
            nextIlluminations: [53],
            lunarPhase: "first quarter",
          });

          expect(result).toBe(true);
        });

        it("should return false when not crossing threshold", () => {
          const result = s.isLunarPhase({
            currentIllumination: 55,
            previousIlluminations: [52],
            nextIlluminations: [58],
            lunarPhase: "first quarter",
          });

          expect(result).toBe(false);
        });
      });

      describe("waxing gibbous", () => {
        it("should return true when crossing 75% threshold while waxing", () => {
          const result = s.isLunarPhase({
            currentIllumination: 76,
            previousIlluminations: [74],
            nextIlluminations: [78],
            lunarPhase: "waxing gibbous",
          });

          expect(result).toBe(true);
        });
      });

      describe("waning gibbous", () => {
        it("should return true when crossing 75% threshold while waning", () => {
          const result = s.isLunarPhase({
            currentIllumination: 74,
            previousIlluminations: [76],
            nextIlluminations: [72],
            lunarPhase: "waning gibbous",
          });

          expect(result).toBe(true);
        });

        it("should return false when waxing", () => {
          const result = s.isLunarPhase({
            currentIllumination: 76,
            previousIlluminations: [74],
            nextIlluminations: [78],
            lunarPhase: "waning gibbous",
          });

          expect(result).toBe(false);
        });
      });

      describe("last quarter", () => {
        it("should return true when crossing 50% threshold while waning", () => {
          const result = s.isLunarPhase({
            currentIllumination: 49,
            previousIlluminations: [51],
            nextIlluminations: [47],
            lunarPhase: "last quarter",
          });

          expect(result).toBe(true);
        });
      });

      describe("waning crescent", () => {
        it("should return true when crossing 25% threshold while waning", () => {
          const result = s.isLunarPhase({
            currentIllumination: 24,
            previousIlluminations: [26],
            nextIlluminations: [22],
            lunarPhase: "waning crescent",
          });

          expect(result).toBe(true);
        });
      });
    });
  }); // private utility methods
});
