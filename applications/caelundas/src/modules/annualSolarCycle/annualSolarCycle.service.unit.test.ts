import { MARGIN_MINUTES } from "@caelundas/src/modules/caelundas/caelundas.constants";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { LoggerService } from "@caelundas/src/modules/logger/logger.service";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Test } from "@nestjs/testing";
import moment, { type Moment } from "moment-timezone";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { AnnualSolarCycleService } from "./annualSolarCycle.service";

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type {
  CoordinateEphemeris,
  DistanceEphemeris,
} from "@caelundas/src/modules/ephemeris/ephemeris.types";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

describe("AnnualSolarCycleService", () => {
  let service: AnnualSolarCycleService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LoggerService,
        AnnualSolarCycleService,
        EphemerisService,
        MathService,
        ProgressiveUtilities,
      ],
    }).compile();
    service = await module.resolve(AnnualSolarCycleService);
  });

  // Helper to create coordinate ephemeris
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

  // Helper to create distance ephemeris
  function createDistanceEphemeris(
    currentMinute: Moment,
    distances: number[],
  ): DistanceEphemeris {
    const ephemeris: DistanceEphemeris = {};
    const totalMinutes = MARGIN_MINUTES * 2 + 1;

    for (let i = 0; i < totalMinutes; i++) {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - i, "minutes");
      const distance = distances[i] ?? distances.at(-1) ?? 0;
      ephemeris[minute.toISOString()] = {
        distance,
      };
    }

    return ephemeris;
  }

  describe("Solstice and Equinox Events", () => {
    it("should create vernal equinox event with correct structure", () => {
      const timestamp = moment.utc("2024-03-20T03:06:00.000Z");

      const event = service.buildVernalEquinoxEvent(timestamp);

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
      const timestamp = moment.utc("2024-06-20T20:50:00.000Z");

      const event = service.buildSummerSolsticeEvent(timestamp);

      expect(event.summary).toBe("🌞 Summer Solstice");
      expect(event.description).toBe("Summer Solstice");
      expect(event.categories).toContain("Annual Solar Cycle");
    });

    it("should create autumnal equinox event with correct structure", () => {
      const timestamp = moment.utc("2024-09-22T12:43:00.000Z");

      const event = service.buildAutumnalEquinoxEvent(timestamp);

      expect(event.summary).toBe("🍂 Autumnal Equinox");
      expect(event.description).toBe("Autumnal Equinox");
      expect(event.categories).toContain("Annual Solar Cycle");
    });

    it("should create winter solstice event with correct structure", () => {
      const timestamp = moment.utc("2024-12-21T09:20:00.000Z");

      const event = service.buildWinterSolsticeEvent(timestamp);

      expect(event.summary).toBe("☃️ Winter Solstice");
      expect(event.description).toBe("Winter Solstice");
      expect(event.categories).toContain("Annual Solar Cycle");
    });
  });

  describe("Cross-Quarter Day Events", () => {
    it("should create Imbolc event with correct structure", () => {
      const timestamp = moment.utc("2024-02-04T12:00:00.000Z");

      const event = service.buildImbolcEvent(timestamp);

      expect(event.summary).toBe("🐑 Imbolc");
      expect(event.description).toBe("Imbolc");
      expect(event.categories).toContain("Annual Solar Cycle");
    });

    it("should create Beltane event with correct structure", () => {
      const timestamp = moment.utc("2024-05-05T12:00:00.000Z");

      const event = service.buildBeltaneEvent(timestamp);

      expect(event.summary).toBe("🐦‍🔥 Beltane");
      expect(event.description).toBe("Beltane");
      expect(event.categories).toContain("Annual Solar Cycle");
    });

    it("should create Lammas event with correct structure", () => {
      const timestamp = moment.utc("2024-08-07T12:00:00.000Z");

      const event = service.buildLammasEvent(timestamp);

      expect(event.summary).toBe("🌾 Lammas");
      expect(event.description).toBe("Lammas");
      expect(event.categories).toContain("Annual Solar Cycle");
    });

    it("should create Samhain event with correct structure", () => {
      const timestamp = moment.utc("2024-11-07T12:00:00.000Z");

      const event = service.buildSamhainEvent(timestamp);

      expect(event.summary).toBe("🎃 Samhain");
      expect(event.description).toBe("Samhain");
      expect(event.categories).toContain("Annual Solar Cycle");
    });
  });

  describe("Hexadecan Events", () => {
    it("should create first hexadecan event with correct structure", () => {
      const timestamp = moment.utc("2024-03-27T12:00:00.000Z");

      const event = service.buildFirstHexadecanEvent(timestamp);

      expect(event.summary).toBe("🌳 First Hexadecan");
      expect(event.description).toBe("First Hexadecan");
      expect(event.categories).toContain("Annual Solar Cycle");
    });

    it("should create third hexadecan event with correct structure", () => {
      const timestamp = moment.utc("2024-04-12T12:00:00.000Z");

      const event = service.buildThirdHexadecanEvent(timestamp);

      expect(event.summary).toBe("🌻 Third Hexadecan");
      expect(event.description).toBe("Third Hexadecan");
    });

    it("should create fifth hexadecan event with correct structure", () => {
      const timestamp = moment.utc("2024-06-28T12:00:00.000Z");

      const event = service.buildFifthHexadecanEvent(timestamp);

      expect(event.summary).toBe("⛱️ Fifth Hexadecan");
      expect(event.description).toBe("Fifth Hexadecan");
    });

    it("should create seventh hexadecan event with correct structure", () => {
      const timestamp = moment.utc("2024-08-14T12:00:00.000Z");

      const event = service.buildSeventhHexadecanEvent(timestamp);

      expect(event.summary).toBe("🎑 Seventh Hexadecan");
      expect(event.description).toBe("Seventh Hexadecan");
    });

    it("should create ninth hexadecan event with correct structure", () => {
      const timestamp = moment.utc("2024-09-30T12:00:00.000Z");

      const event = service.buildNinthHexadecanEvent(timestamp);

      expect(event.summary).toBe("🍁 Ninth Hexadecan");
      expect(event.description).toBe("Ninth Hexadecan");
    });

    it("should create eleventh hexadecan event with correct structure", () => {
      const timestamp = moment.utc("2024-11-14T12:00:00.000Z");

      const event = service.buildEleventhHexadecanEvent(timestamp);

      expect(event.summary).toBe("🧤 Eleventh Hexadecan");
      expect(event.description).toBe("Eleventh Hexadecan");
    });

    it("should create thirteenth hexadecan event with correct structure", () => {
      const timestamp = moment.utc("2024-12-29T12:00:00.000Z");

      const event = service.buildThirteenthHexadecanEvent(timestamp);

      expect(event.summary).toBe("❄️ Thirteenth Hexadecan");
      expect(event.description).toBe("Thirteenth Hexadecan");
    });

    it("should create fifteenth hexadecan event with correct structure", () => {
      const timestamp = moment.utc("2024-02-12T12:00:00.000Z");

      const event = service.buildFifteenthHexadecanEvent(timestamp);

      expect(event.summary).toBe("🌨️ Fifteenth Hexadecan");
      expect(event.description).toBe("Fifteenth Hexadecan");
    });
  });

  describe("Solar Apsis Events", () => {
    it("should create aphelion event with correct structure", () => {
      const timestamp = moment.utc("2024-07-05T12:00:00.000Z");

      const event = service.buildAphelionEvent(timestamp);

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
      const timestamp = moment.utc("2024-01-03T12:00:00.000Z");

      const event = service.buildPerihelionEvent(timestamp);

      expect(event.summary).toBe("☀️ 🔥 Solar Perihelion");
      expect(event.description).toBe("Solar Perihelion");
      expect(event.categories).toContain("Perihelion");
    });
  });

  describe("getAnnualSolarCycleEvents/getSolarApsisEvents", () => {
    it("should return empty array when no annual solar cycle events occur", () => {
      const currentMinute = moment.utc("2024-03-15T12:00:00.000Z");

      // No event: sun at some random longitude
      const longitudes = Array.from<number>({
        length: MARGIN_MINUTES * 2 + 1,
      }).fill(10);

      const sunCoordinateEphemeris = createCoordinateEphemeris(
        currentMinute,
        longitudes,
      );

      const events = service.getAnnualSolarCycleEvents({
        sunCoordinateEphemeris,
        minute: currentMinute,
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
        distances.push(1.016 + i * 0.000_001);
      }
      distances.push(1.0167); // Current (maximum)
      for (let i = 0; i < MARGIN_MINUTES; i++) {
        distances.push(1.0167 - (i + 1) * 0.000_001);
      }

      const sunDistanceEphemeris = createDistanceEphemeris(
        currentMinute,
        distances,
      );

      const events = service.getSolarApsisEvents({
        minute: currentMinute,
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
        distances.push(0.9833 - i * 0.000_001);
      }
      distances.push(0.9832); // Current (minimum)
      for (let i = 0; i < MARGIN_MINUTES; i++) {
        distances.push(0.9832 + (i + 1) * 0.000_001);
      }

      const sunDistanceEphemeris = createDistanceEphemeris(
        currentMinute,
        distances,
      );

      const events = service.getSolarApsisEvents({
        minute: currentMinute,
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
        distances.push(1 + i * 0.000_001);
      }

      const sunDistanceEphemeris = createDistanceEphemeris(
        currentMinute,
        distances,
      );

      const events = service.getSolarApsisEvents({
        minute: currentMinute,
        sunDistanceEphemeris,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("service.detectProgressive", () => {
    it("should create advancing progressive event from aphelion to perihelion", () => {
      const aphelionEvent: Event = {
        start: moment.utc("2024-07-05T12:00:00.000Z"),
        end: moment.utc("2024-07-05T12:00:00.000Z"),
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
        start: moment.utc("2025-01-03T12:00:00.000Z"),
        end: moment.utc("2025-01-03T12:00:00.000Z"),
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

      const progressiveEvents = service.detectProgressive([
        aphelionEvent,
        perihelionEvent,
      ]);

      expect(progressiveEvents.length).toBeGreaterThanOrEqual(1);
      const advancingDuration = progressiveEvents.find((e) =>
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

    it("should create retreating progressive event from perihelion to aphelion", () => {
      const perihelionEvent: Event = {
        start: moment.utc("2024-01-03T12:00:00.000Z"),
        end: moment.utc("2024-01-03T12:00:00.000Z"),
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
        start: moment.utc("2024-07-05T12:00:00.000Z"),
        end: moment.utc("2024-07-05T12:00:00.000Z"),
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

      const progressiveEvents = service.detectProgressive([
        perihelionEvent,
        aphelionEvent,
      ]);

      expect(progressiveEvents.length).toBeGreaterThanOrEqual(1);
      const retreatingDuration = progressiveEvents.find((e) =>
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
      const progressiveEvents = service.detectProgressive([]);

      expect(progressiveEvents).toHaveLength(0);
    });

    it("should handle full year cycle with both advancing and retreating", () => {
      const perihelion1: Event = {
        start: moment.utc("2024-01-03T12:00:00.000Z"),
        end: moment.utc("2024-01-03T12:00:00.000Z"),
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
        start: moment.utc("2024-07-05T12:00:00.000Z"),
        end: moment.utc("2024-07-05T12:00:00.000Z"),
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
        start: moment.utc("2025-01-03T12:00:00.000Z"),
        end: moment.utc("2025-01-03T12:00:00.000Z"),
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

      const progressiveEvents = service.detectProgressive([
        perihelion1,
        aphelion,
        perihelion2,
      ]);

      // Should have both retreating (peri→aph) and advancing (aph→peri)
      expect(progressiveEvents.length).toBeGreaterThanOrEqual(2);

      const retreating = progressiveEvents.find((e) =>
        e.description.includes("Retreating"),
      );
      const advancing = progressiveEvents.find((e) =>
        e.description.includes("Advancing"),
      );

      expect(retreating).toBeDefined();
      expect(advancing).toBeDefined();
    });

    it("should filter out non-annual solar cycle events", () => {
      const nonApsisEvent: Event = {
        start: moment.utc("2024-01-03T12:00:00.000Z"),
        end: moment.utc("2024-01-03T12:00:00.000Z"),
        summary: "Some other event",
        description: "Not an apsis event",
        categories: ["Astronomy", "Something Else"],
      };

      const progressiveEvents = service.detectProgressive([nonApsisEvent]);

      expect(progressiveEvents).toHaveLength(0);
    });
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});

describe("annualSolarCycle.utilities", () => {
  let service: AnnualSolarCycleService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LoggerService,
        AnnualSolarCycleService,
        EphemerisService,
        MathService,
        ProgressiveUtilities,
      ],
    }).compile();
    service = await module.resolve(AnnualSolarCycleService);
  });

  describe("isVernalEquinox", () => {
    it("should return true when crossing 0° (from Pisces to Aries)", () => {
      // Vernal equinox: crossing from >180 (after autumnal) back to <180
      // This happens at 0° when going from ~359° to ~1°
      const result = service.isVernalEquinox({
        currentLongitude: 1, // Just entered Aries
        previousLongitude: 359, // Was in Pisces
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing the boundary", () => {
      const result = service.isVernalEquinox({
        currentLongitude: 10,
        previousLongitude: 5,
      });

      expect(result).toBe(false);
    });
  });

  describe("isFirstHexadecan (22.5°)", () => {
    it("should return true when crossing 22.5°", () => {
      const result = service.isFirstHexadecan({
        currentLongitude: 23,
        previousLongitude: 22,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = service.isFirstHexadecan({
        currentLongitude: 21,
        previousLongitude: 20,
      });

      expect(result).toBe(false);
    });
  });

  describe("isBeltane (45°)", () => {
    it("should return true when crossing 45°", () => {
      const result = service.isBeltane({
        currentLongitude: 46,
        previousLongitude: 44,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = service.isBeltane({
        currentLongitude: 44,
        previousLongitude: 43,
      });

      expect(result).toBe(false);
    });
  });

  describe("isThirdHexadecan (67.5°)", () => {
    it("should return true when crossing 67.5°", () => {
      const result = service.isThirdHexadecan({
        currentLongitude: 68,
        previousLongitude: 67,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = service.isThirdHexadecan({
        currentLongitude: 66,
        previousLongitude: 65,
      });

      expect(result).toBe(false);
    });
  });

  describe("isSummerSolstice (90°)", () => {
    it("should return true when crossing 90°", () => {
      const result = service.isSummerSolstice({
        currentLongitude: 91,
        previousLongitude: 89,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = service.isSummerSolstice({
        currentLongitude: 88,
        previousLongitude: 87,
      });

      expect(result).toBe(false);
    });
  });

  describe("isFifthHexadecan (112.5°)", () => {
    it("should return true when crossing 112.5°", () => {
      const result = service.isFifthHexadecan({
        currentLongitude: 113,
        previousLongitude: 112,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = service.isFifthHexadecan({
        currentLongitude: 111,
        previousLongitude: 110,
      });

      expect(result).toBe(false);
    });
  });

  describe("isLammas (135°)", () => {
    it("should return true when crossing 135°", () => {
      const result = service.isLammas({
        currentLongitude: 136,
        previousLongitude: 134,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = service.isLammas({
        currentLongitude: 133,
        previousLongitude: 132,
      });

      expect(result).toBe(false);
    });
  });

  describe("isSeventhHexadecan (157.5°)", () => {
    it("should return true when crossing 157.5°", () => {
      const result = service.isSeventhHexadecan({
        currentLongitude: 158,
        previousLongitude: 157,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = service.isSeventhHexadecan({
        currentLongitude: 156,
        previousLongitude: 155,
      });

      expect(result).toBe(false);
    });
  });

  describe("isAutumnalEquinox (180°)", () => {
    it("should return true when crossing 180°", () => {
      const result = service.isAutumnalEquinox({
        currentLongitude: 181,
        previousLongitude: 179,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = service.isAutumnalEquinox({
        currentLongitude: 178,
        previousLongitude: 177,
      });

      expect(result).toBe(false);
    });
  });

  describe("isNinthHexadecan (202.5°)", () => {
    it("should return true when crossing 202.5°", () => {
      const result = service.isNinthHexadecan({
        currentLongitude: 203,
        previousLongitude: 202,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = service.isNinthHexadecan({
        currentLongitude: 201,
        previousLongitude: 200,
      });

      expect(result).toBe(false);
    });
  });

  describe("isSamhain (225°)", () => {
    it("should return true when crossing 225°", () => {
      const result = service.isSamhain({
        currentLongitude: 226,
        previousLongitude: 224,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = service.isSamhain({
        currentLongitude: 223,
        previousLongitude: 222,
      });

      expect(result).toBe(false);
    });
  });

  describe("isEleventhHexadecan (247.5°)", () => {
    it("should return true when crossing 247.5°", () => {
      const result = service.isEleventhHexadecan({
        currentLongitude: 248,
        previousLongitude: 247,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = service.isEleventhHexadecan({
        currentLongitude: 246,
        previousLongitude: 245,
      });

      expect(result).toBe(false);
    });
  });

  describe("isWinterSolstice (270°)", () => {
    it("should return true when crossing 270°", () => {
      const result = service.isWinterSolstice({
        currentLongitude: 271,
        previousLongitude: 269,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = service.isWinterSolstice({
        currentLongitude: 268,
        previousLongitude: 267,
      });

      expect(result).toBe(false);
    });
  });

  describe("isThirteenthHexadecan (292.5°)", () => {
    it("should return true when crossing 292.5°", () => {
      const result = service.isThirteenthHexadecan({
        currentLongitude: 293,
        previousLongitude: 292,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = service.isThirteenthHexadecan({
        currentLongitude: 291,
        previousLongitude: 290,
      });

      expect(result).toBe(false);
    });
  });

  describe("isImbolc (315°)", () => {
    it("should return true when crossing 315°", () => {
      const result = service.isImbolc({
        currentLongitude: 316,
        previousLongitude: 314,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = service.isImbolc({
        currentLongitude: 313,
        previousLongitude: 312,
      });

      expect(result).toBe(false);
    });
  });

  describe("isFifteenthHexadecan (337.5°)", () => {
    it("should return true when crossing 337.5°", () => {
      const result = service.isFifteenthHexadecan({
        currentLongitude: 338,
        previousLongitude: 337,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = service.isFifteenthHexadecan({
        currentLongitude: 336,
        previousLongitude: 335,
      });

      expect(result).toBe(false);
    });
  });
});
