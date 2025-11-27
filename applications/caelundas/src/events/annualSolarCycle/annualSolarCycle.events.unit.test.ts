import moment from "moment-timezone";
import { describe, expect, it, vi } from "vitest";

import { MARGIN_MINUTES } from "../../calendar.utilities";

import {
  getAnnualSolarCycleEvents,
  getAphelionEvent,
  getAutumnalEquinoxEvent,
  getBeltaneEvent,
  getEleventhHexadecanEvent,
  getFifteenthHexadecanEvent,
  getFifthHexadecanEvent,
  getFirstHexadecanEvent,
  getImbolcEvent,
  getLammasEvent,
  getNinthHexadecanEvent,
  getPerihelionEvent,
  getSamhainEvent,
  getSeventhHexadecanEvent,
  getSolarApsisDurationEvents,
  getSolarApsisEvents,
  getSummerSolsticeEvent,
  getThirdHexadecanEvent,
  getThirteenthHexadecanEvent,
  getVernalEquinoxEvent,
  getWinterSolsticeEvent,
} from "./annualSolarCycle.events";

import type { Event } from "../../calendar.utilities";
import type {
  CoordinateEphemeris,
  DistanceEphemeris,
} from "../../ephemeris/ephemeris.types";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

describe("annualSolarCycle.events", () => {
  // Helper to create coordinate ephemeris
  function createCoordinateEphemeris(
    currentMinute: moment.Moment,
    longitudes: number[],
  ): CoordinateEphemeris {
    const ephemeris: CoordinateEphemeris = {};
    const totalMinutes = MARGIN_MINUTES * 2 + 1;

    for (let i = 0; i < totalMinutes; i++) {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - i, "minutes");
      const longitude = longitudes[i] ?? longitudes[longitudes.length - 1] ?? 0;
      ephemeris[minute.toISOString()] = {
        longitude,
        latitude: 0,
      };
    }

    return ephemeris;
  }

  // Helper to create distance ephemeris
  function createDistanceEphemeris(
    currentMinute: moment.Moment,
    distances: number[],
  ): DistanceEphemeris {
    const ephemeris: DistanceEphemeris = {};
    const totalMinutes = MARGIN_MINUTES * 2 + 1;

    for (let i = 0; i < totalMinutes; i++) {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - i, "minutes");
      const distance = distances[i] ?? distances[distances.length - 1] ?? 0;
      ephemeris[minute.toISOString()] = {
        distance,
      };
    }

    return ephemeris;
  }

  describe("Solstice and Equinox Events", () => {
    it("should create vernal equinox event with correct structure", () => {
      const timestamp = new Date("2024-03-20T03:06:00.000Z");

      const event = getVernalEquinoxEvent(timestamp);

      expect(event.summary).toBe("🌸 Vernal Equinox");
      expect(event.description).toBe("Vernal Equinox");
      expect(event.start).toEqual(timestamp);
      expect(event.end).toEqual(timestamp);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Astrology");
      expect(event.categories).toContain("Annual Solar Cycle");
      expect(event.categories).toContain("Solar");
    });

    it("should create summer solstice event with correct structure", () => {
      const timestamp = new Date("2024-06-20T20:50:00.000Z");

      const event = getSummerSolsticeEvent(timestamp);

      expect(event.summary).toBe("🌞 Summer Solstice");
      expect(event.description).toBe("Summer Solstice");
      expect(event.categories).toContain("Annual Solar Cycle");
    });

    it("should create autumnal equinox event with correct structure", () => {
      const timestamp = new Date("2024-09-22T12:43:00.000Z");

      const event = getAutumnalEquinoxEvent(timestamp);

      expect(event.summary).toBe("🍂 Autumnal Equinox");
      expect(event.description).toBe("Autumnal Equinox");
      expect(event.categories).toContain("Annual Solar Cycle");
    });

    it("should create winter solstice event with correct structure", () => {
      const timestamp = new Date("2024-12-21T09:20:00.000Z");

      const event = getWinterSolsticeEvent(timestamp);

      expect(event.summary).toBe("☃️ Winter Solstice");
      expect(event.description).toBe("Winter Solstice");
      expect(event.categories).toContain("Annual Solar Cycle");
    });
  });

  describe("Cross-Quarter Day Events", () => {
    it("should create Imbolc event with correct structure", () => {
      const timestamp = new Date("2024-02-04T12:00:00.000Z");

      const event = getImbolcEvent(timestamp);

      expect(event.summary).toBe("🐑 Imbolc");
      expect(event.description).toBe("Imbolc");
      expect(event.categories).toContain("Annual Solar Cycle");
    });

    it("should create Beltane event with correct structure", () => {
      const timestamp = new Date("2024-05-05T12:00:00.000Z");

      const event = getBeltaneEvent(timestamp);

      expect(event.summary).toBe("🐦‍🔥 Beltane");
      expect(event.description).toBe("Beltane");
      expect(event.categories).toContain("Annual Solar Cycle");
    });

    it("should create Lammas event with correct structure", () => {
      const timestamp = new Date("2024-08-07T12:00:00.000Z");

      const event = getLammasEvent(timestamp);

      expect(event.summary).toBe("🌾 Lammas");
      expect(event.description).toBe("Lammas");
      expect(event.categories).toContain("Annual Solar Cycle");
    });

    it("should create Samhain event with correct structure", () => {
      const timestamp = new Date("2024-11-07T12:00:00.000Z");

      const event = getSamhainEvent(timestamp);

      expect(event.summary).toBe("🎃 Samhain");
      expect(event.description).toBe("Samhain");
      expect(event.categories).toContain("Annual Solar Cycle");
    });
  });

  describe("Hexadecan Events", () => {
    it("should create first hexadecan event with correct structure", () => {
      const timestamp = new Date("2024-03-27T12:00:00.000Z");

      const event = getFirstHexadecanEvent(timestamp);

      expect(event.summary).toBe("🌳 First Hexadecan");
      expect(event.description).toBe("First Hexadecan");
      expect(event.categories).toContain("Annual Solar Cycle");
    });

    it("should create third hexadecan event with correct structure", () => {
      const timestamp = new Date("2024-04-12T12:00:00.000Z");

      const event = getThirdHexadecanEvent(timestamp);

      expect(event.summary).toBe("🌻 Third Hexadecan");
      expect(event.description).toBe("Third Hexadecan");
    });

    it("should create fifth hexadecan event with correct structure", () => {
      const timestamp = new Date("2024-06-28T12:00:00.000Z");

      const event = getFifthHexadecanEvent(timestamp);

      expect(event.summary).toBe("⛱️ Fifth Hexadecan");
      expect(event.description).toBe("Fifth Hexadecan");
    });

    it("should create seventh hexadecan event with correct structure", () => {
      const timestamp = new Date("2024-08-14T12:00:00.000Z");

      const event = getSeventhHexadecanEvent(timestamp);

      expect(event.summary).toBe("🎑 Seventh Hexadecan");
      expect(event.description).toBe("Seventh Hexadecan");
    });

    it("should create ninth hexadecan event with correct structure", () => {
      const timestamp = new Date("2024-09-30T12:00:00.000Z");

      const event = getNinthHexadecanEvent(timestamp);

      expect(event.summary).toBe("🍁 Ninth Hexadecan");
      expect(event.description).toBe("Ninth Hexadecan");
    });

    it("should create eleventh hexadecan event with correct structure", () => {
      const timestamp = new Date("2024-11-14T12:00:00.000Z");

      const event = getEleventhHexadecanEvent(timestamp);

      expect(event.summary).toBe("🧤 Eleventh Hexadecan");
      expect(event.description).toBe("Eleventh Hexadecan");
    });

    it("should create thirteenth hexadecan event with correct structure", () => {
      const timestamp = new Date("2024-12-29T12:00:00.000Z");

      const event = getThirteenthHexadecanEvent(timestamp);

      expect(event.summary).toBe("❄️ Thirteenth Hexadecan");
      expect(event.description).toBe("Thirteenth Hexadecan");
    });

    it("should create fifteenth hexadecan event with correct structure", () => {
      const timestamp = new Date("2024-02-12T12:00:00.000Z");

      const event = getFifteenthHexadecanEvent(timestamp);

      expect(event.summary).toBe("🌨️ Fifteenth Hexadecan");
      expect(event.description).toBe("Fifteenth Hexadecan");
    });
  });

  describe("Solar Apsis Events", () => {
    it("should create aphelion event with correct structure", () => {
      const timestamp = new Date("2024-07-05T12:00:00.000Z");

      const event = getAphelionEvent(timestamp);

      expect(event.summary).toBe("☀️ ❄️ Solar Aphelion");
      expect(event.description).toBe("Solar Aphelion");
      expect(event.start).toEqual(timestamp);
      expect(event.end).toEqual(timestamp);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Astrology");
      expect(event.categories).toContain("Annual Solar Cycle");
      expect(event.categories).toContain("Solar");
      expect(event.categories).toContain("Aphelion");
    });

    it("should create perihelion event with correct structure", () => {
      const timestamp = new Date("2024-01-03T12:00:00.000Z");

      const event = getPerihelionEvent(timestamp);

      expect(event.summary).toBe("☀️ 🔥 Solar Perihelion");
      expect(event.description).toBe("Solar Perihelion");
      expect(event.categories).toContain("Perihelion");
    });
  });

  describe("getAnnualSolarCycleEvents", () => {
    it("should return empty array when no annual solar cycle events occur", () => {
      const currentMinute = moment.utc("2024-03-15T12:00:00.000Z");

      // No event: sun at some random longitude
      const longitudes: number[] = new Array<number>(
        MARGIN_MINUTES * 2 + 1,
      ).fill(10);

      const sunCoordinateEphemeris = createCoordinateEphemeris(
        currentMinute,
        longitudes,
      );

      const events = getAnnualSolarCycleEvents({
        sunCoordinateEphemeris,
        currentMinute,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("getSolarApsisEvents", () => {
    it("should detect aphelion when distance is at maximum", () => {
      const currentMinute = moment.utc("2024-07-05T12:00:00.000Z");

      // Distance increasing then decreasing (maximum at current)
      const distances: number[] = [];
      for (let i = 0; i < MARGIN_MINUTES; i++) {
        distances.push(1.016 + i * 0.000001);
      }
      distances.push(1.0167); // Current (maximum)
      for (let i = 0; i < MARGIN_MINUTES; i++) {
        distances.push(1.0167 - (i + 1) * 0.000001);
      }

      const sunDistanceEphemeris = createDistanceEphemeris(
        currentMinute,
        distances,
      );

      const events = getSolarApsisEvents({
        currentMinute,
        sunDistanceEphemeris,
      });

      expect(events.length).toBeGreaterThanOrEqual(1);
      const aphelionEvent = events.find((e) =>
        e.description.includes("Aphelion"),
      );
      expect(aphelionEvent).toBeDefined();
      if (aphelionEvent) {
        expect(aphelionEvent.summary).toBe("☀️ ❄️ Solar Aphelion");
      }
    });

    it("should detect perihelion when distance is at minimum", () => {
      const currentMinute = moment.utc("2024-01-03T12:00:00.000Z");

      // Distance decreasing then increasing (minimum at current)
      const distances: number[] = [];
      for (let i = 0; i < MARGIN_MINUTES; i++) {
        distances.push(0.9833 - i * 0.000001);
      }
      distances.push(0.9832); // Current (minimum)
      for (let i = 0; i < MARGIN_MINUTES; i++) {
        distances.push(0.9832 + (i + 1) * 0.000001);
      }

      const sunDistanceEphemeris = createDistanceEphemeris(
        currentMinute,
        distances,
      );

      const events = getSolarApsisEvents({
        currentMinute,
        sunDistanceEphemeris,
      });

      expect(events.length).toBeGreaterThanOrEqual(1);
      const perihelionEvent = events.find((e) =>
        e.description.includes("Perihelion"),
      );
      expect(perihelionEvent).toBeDefined();
      if (perihelionEvent) {
        expect(perihelionEvent.summary).toBe("☀️ 🔥 Solar Perihelion");
      }
    });

    it("should return empty array when no apsis events occur", () => {
      const currentMinute = moment.utc("2024-04-15T12:00:00.000Z");

      // Distance constantly increasing (no extrema)
      const distances: number[] = [];
      for (let i = 0; i < MARGIN_MINUTES * 2 + 1; i++) {
        distances.push(1.0 + i * 0.000001);
      }

      const sunDistanceEphemeris = createDistanceEphemeris(
        currentMinute,
        distances,
      );

      const events = getSolarApsisEvents({
        currentMinute,
        sunDistanceEphemeris,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("getSolarApsisDurationEvents", () => {
    it("should create advancing duration event from aphelion to perihelion", () => {
      const aphelionEvent: Event = {
        start: new Date("2024-07-05T12:00:00.000Z"),
        end: new Date("2024-07-05T12:00:00.000Z"),
        summary: "☀️ ❄️ Solar Aphelion",
        description: "Solar Aphelion",
        categories: [
          "Astronomy",
          "Astrology",
          "Annual Solar Cycle",
          "Solar",
          "Aphelion",
        ],
      };
      const perihelionEvent: Event = {
        start: new Date("2025-01-03T12:00:00.000Z"),
        end: new Date("2025-01-03T12:00:00.000Z"),
        summary: "☀️ 🔥 Solar Perihelion",
        description: "Solar Perihelion",
        categories: [
          "Astronomy",
          "Astrology",
          "Annual Solar Cycle",
          "Solar",
          "Perihelion",
        ],
      };

      const durationEvents = getSolarApsisDurationEvents([
        aphelionEvent,
        perihelionEvent,
      ]);

      expect(durationEvents.length).toBeGreaterThanOrEqual(1);
      const advancingDuration = durationEvents.find((e) =>
        e.description.includes("Advancing"),
      );
      expect(advancingDuration).toBeDefined();
      if (advancingDuration) {
        expect(advancingDuration.start).toEqual(aphelionEvent.start);
        expect(advancingDuration.end).toEqual(perihelionEvent.start);
        expect(advancingDuration.summary).toBe("☀️ 🔥 Solar Advancing");
        expect(advancingDuration.description).toBe(
          "Solar Advancing (Aphelion to Perihelion)",
        );
        expect(advancingDuration.categories).toContain("Advancing");
      }
    });

    it("should create retreating duration event from perihelion to aphelion", () => {
      const perihelionEvent: Event = {
        start: new Date("2024-01-03T12:00:00.000Z"),
        end: new Date("2024-01-03T12:00:00.000Z"),
        summary: "☀️ 🔥 Solar Perihelion",
        description: "Solar Perihelion",
        categories: [
          "Astronomy",
          "Astrology",
          "Annual Solar Cycle",
          "Solar",
          "Perihelion",
        ],
      };
      const aphelionEvent: Event = {
        start: new Date("2024-07-05T12:00:00.000Z"),
        end: new Date("2024-07-05T12:00:00.000Z"),
        summary: "☀️ ❄️ Solar Aphelion",
        description: "Solar Aphelion",
        categories: [
          "Astronomy",
          "Astrology",
          "Annual Solar Cycle",
          "Solar",
          "Aphelion",
        ],
      };

      const durationEvents = getSolarApsisDurationEvents([
        perihelionEvent,
        aphelionEvent,
      ]);

      expect(durationEvents.length).toBeGreaterThanOrEqual(1);
      const retreatingDuration = durationEvents.find((e) =>
        e.description.includes("Retreating"),
      );
      expect(retreatingDuration).toBeDefined();
      if (retreatingDuration) {
        expect(retreatingDuration.start).toEqual(perihelionEvent.start);
        expect(retreatingDuration.end).toEqual(aphelionEvent.start);
        expect(retreatingDuration.summary).toBe("☀️ ❄️ Solar Retreating");
        expect(retreatingDuration.description).toBe(
          "Solar Retreating (Perihelion to Aphelion)",
        );
        expect(retreatingDuration.categories).toContain("Retreating");
      }
    });

    it("should return empty array when no apsis events provided", () => {
      const durationEvents = getSolarApsisDurationEvents([]);

      expect(durationEvents).toHaveLength(0);
    });

    it("should handle full year cycle with both advancing and retreating", () => {
      const perihelion1: Event = {
        start: new Date("2024-01-03T12:00:00.000Z"),
        end: new Date("2024-01-03T12:00:00.000Z"),
        summary: "☀️ 🔥 Solar Perihelion",
        description: "Solar Perihelion",
        categories: [
          "Astronomy",
          "Astrology",
          "Annual Solar Cycle",
          "Solar",
          "Perihelion",
        ],
      };
      const aphelion: Event = {
        start: new Date("2024-07-05T12:00:00.000Z"),
        end: new Date("2024-07-05T12:00:00.000Z"),
        summary: "☀️ ❄️ Solar Aphelion",
        description: "Solar Aphelion",
        categories: [
          "Astronomy",
          "Astrology",
          "Annual Solar Cycle",
          "Solar",
          "Aphelion",
        ],
      };
      const perihelion2: Event = {
        start: new Date("2025-01-03T12:00:00.000Z"),
        end: new Date("2025-01-03T12:00:00.000Z"),
        summary: "☀️ 🔥 Solar Perihelion",
        description: "Solar Perihelion",
        categories: [
          "Astronomy",
          "Astrology",
          "Annual Solar Cycle",
          "Solar",
          "Perihelion",
        ],
      };

      const durationEvents = getSolarApsisDurationEvents([
        perihelion1,
        aphelion,
        perihelion2,
      ]);

      // Should have both retreating (peri→aph) and advancing (aph→peri)
      expect(durationEvents.length).toBeGreaterThanOrEqual(2);

      const retreating = durationEvents.find((e) =>
        e.description.includes("Retreating"),
      );
      const advancing = durationEvents.find((e) =>
        e.description.includes("Advancing"),
      );

      expect(retreating).toBeDefined();
      expect(advancing).toBeDefined();
    });

    it("should filter out non-annual solar cycle events", () => {
      const nonApsisEvent: Event = {
        start: new Date("2024-01-03T12:00:00.000Z"),
        end: new Date("2024-01-03T12:00:00.000Z"),
        summary: "Some other event",
        description: "Not an apsis event",
        categories: ["Astronomy", "Something Else"],
      };

      const durationEvents = getSolarApsisDurationEvents([nonApsisEvent]);

      expect(durationEvents).toHaveLength(0);
    });
  });

  describe("writeAnnualSolarCycleEvents", () => {
    it("should write events to file and database", async () => {
      const fs = await import("fs");
      const { writeAnnualSolarCycleEvents, getVernalEquinoxEvent } =
        await import("./annualSolarCycle.events");

      const events = [
        getVernalEquinoxEvent(new Date("2024-03-20T03:06:00.000Z")),
      ];
      const start = new Date("2024-03-01T00:00:00.000Z");
      const end = new Date("2024-03-31T23:59:59.000Z");

      writeAnnualSolarCycleEvents({
        annualSolarCycleEvents: events,
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
      const { writeAnnualSolarCycleEvents } =
        await import("./annualSolarCycle.events");

      const start = new Date("2024-03-01T00:00:00.000Z");
      const end = new Date("2024-03-31T23:59:59.000Z");

      writeAnnualSolarCycleEvents({
        annualSolarCycleEvents: [],
        start,
        end,
      });

      expect(fs.default.writeFileSync).not.toHaveBeenCalled();
    });
  });
});
