import { MARGIN_MINUTES } from "@caelundas/src/caelundas.constants";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Test } from "@nestjs/testing";
import moment, { type Moment } from "moment-timezone";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { EclipsesService } from "./eclipses.service";

import type { EclipsePhase } from "@caelundas/src/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type {
  CoordinateEphemeris,
  DiameterEphemeris,
} from "@caelundas/src/modules/ephemeris/ephemeris.types";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

interface EclipseArgs {
  currentDiameterMoon: number;
  currentDiameterSun: number;
  currentLatitudeMoon: number;
  currentLatitudeSun: number;
  currentLongitudeMoon: number;
  currentLongitudeSun: number;
}
type EclipseFullArgs = EclipseArgs & {
  nextLongitudeMoon: number;
  nextLongitudeSun: number;
  previousLongitudeMoon: number;
  previousLongitudeSun: number;
};
interface ServicePrivate {
  isSolarEclipse: (args: EclipseFullArgs) => EclipsePhase | null;
  isSolarEclipseActive: (args: EclipseArgs) => boolean;
  isLunarEclipse: (args: EclipseFullArgs) => EclipsePhase | null;
  isLunarEclipseActive: (args: EclipseArgs) => boolean;
}

describe("EclipsesService", () => {
  let service: EclipsesService;
  let s: ServicePrivate;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EclipsesService,
        EphemerisService,
        MathService,
        ProgressiveUtilities,
      ],
    }).compile();
    service = module.get(EclipsesService);
    s = service as unknown as ServicePrivate;
  });

  // Helper to create coordinate ephemeris
  function createCoordinateEphemeris(
    currentMinute: Moment,
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
    currentMinute: Moment,
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

  describe("service.detect", () => {
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

      const events = service.detect({
        minute: currentMinute,
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
      const timestamp = moment.utc("2024-04-08T18:00:00.000Z");

      const event = service.buildSolarEclipseEvent({
        date: timestamp,
        frame: "geocentric",
        phase: "beginning",
      });

      expect(event.summary).toBe("🌐 ☀️🐉▶️ Solar Eclipse begins");
      expect(event.description).toBe("Solar Eclipse begins (Geocentric)");
      expect(event.start).toEqual(timestamp);
      expect(event.end).toEqual(timestamp);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Astrology");
      expect(event.categories).toContain("Eclipse");
      expect(event.categories).toContain("Solar");
      expect(event.categories).toContain("Geocentric");
    });

    it("should create a solar eclipse maximum event with correct structure", () => {
      const timestamp = moment.utc("2024-04-08T18:30:00.000Z");

      const event = service.buildSolarEclipseEvent({
        date: timestamp,
        frame: "geocentric",
        phase: "maximum",
      });

      expect(event.summary).toBe("🌐 ☀️🐉🎯 Solar Eclipse maximum");
      expect(event.description).toBe("Solar Eclipse maximum (Geocentric)");
      expect(event.categories).toContain("Solar");
    });

    it("should create a solar eclipse ending event with correct structure", () => {
      const timestamp = moment.utc("2024-04-08T19:00:00.000Z");

      const event = service.buildSolarEclipseEvent({
        date: timestamp,
        frame: "geocentric",
        phase: "ending",
      });

      expect(event.summary).toBe("🌐 ☀️🐉◀️ Solar Eclipse ends");
      expect(event.description).toBe("Solar Eclipse ends (Geocentric)");
      expect(event.categories).toContain("Solar");
    });
  });

  describe("getLunarEclipseEvent", () => {
    it("should create a lunar eclipse beginning event with correct structure", () => {
      const timestamp = moment.utc("2024-09-18T02:00:00.000Z");

      const event = service.buildLunarEclipseEvent({
        date: timestamp,
        frame: "geocentric",
        phase: "beginning",
      });

      expect(event.summary).toBe("🌐 🌙🐉▶️ Lunar Eclipse begins");
      expect(event.description).toBe("Lunar Eclipse begins (Geocentric)");
      expect(event.start).toEqual(timestamp);
      expect(event.end).toEqual(timestamp);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Astrology");
      expect(event.categories).toContain("Eclipse");
      expect(event.categories).toContain("Lunar");
      expect(event.categories).toContain("Geocentric");
    });

    it("should create a lunar eclipse maximum event with correct structure", () => {
      const timestamp = moment.utc("2024-09-18T02:30:00.000Z");

      const event = service.buildLunarEclipseEvent({
        date: timestamp,
        frame: "geocentric",
        phase: "maximum",
      });

      expect(event.summary).toBe("🌐 🌙🐉🎯 Lunar Eclipse maximum");
      expect(event.description).toBe("Lunar Eclipse maximum (Geocentric)");
      expect(event.categories).toContain("Lunar");
    });

    it("should create a lunar eclipse ending event with correct structure", () => {
      const timestamp = moment.utc("2024-09-18T03:00:00.000Z");

      const event = service.buildLunarEclipseEvent({
        date: timestamp,
        frame: "geocentric",
        phase: "ending",
      });

      expect(event.summary).toBe("🌐 🌙🐉◀️ Lunar Eclipse ends");
      expect(event.description).toBe("Lunar Eclipse ends (Geocentric)");
      expect(event.categories).toContain("Lunar");
    });
  });

  describe("service.detectProgressive", () => {
    it("should create solar eclipse progressive event from beginning to ending", () => {
      const beginningEvent: Event = {
        start: moment.utc("2024-04-08T18:00:00.000Z"),
        end: moment.utc("2024-04-08T18:00:00.000Z"),
        summary: "🌐 ☀️🐉▶️ Solar Eclipse begins",
        description: "Solar Eclipse begins (Geocentric)",
        categories: [
          "Astronomy",
          "Astrology",
          "Eclipse",
          "Solar",
          "Geocentric",
        ],
      };
      const endingEvent: Event = {
        start: moment.utc("2024-04-08T19:00:00.000Z"),
        end: moment.utc("2024-04-08T19:00:00.000Z"),
        summary: "🌐 ☀️🐉◀️ Solar Eclipse ends",
        description: "Solar Eclipse ends (Geocentric)",
        categories: [
          "Astronomy",
          "Astrology",
          "Eclipse",
          "Solar",
          "Geocentric",
        ],
      };

      const progressiveEvents = service.detectProgressive([
        beginningEvent,
        endingEvent,
      ]);

      expect(progressiveEvents.length).toBeGreaterThanOrEqual(1);
      const solarDuration = progressiveEvents.find(
        (e) =>
          e.description.includes("Solar Eclipse") &&
          !e.description.includes("begins") &&
          !e.description.includes("ends"),
      );
      expect(solarDuration).toBeDefined();
      if (solarDuration) {
        expect(solarDuration.start).toEqual(beginningEvent.start);
        expect(solarDuration.end).toEqual(endingEvent.start);
        expect(solarDuration.summary).toBe(
          "🌐 ☀️🐉 Solar Eclipse (Geocentric)",
        );
        expect(solarDuration.description).toBe("Solar Eclipse (Geocentric)");
        expect(solarDuration.categories).toContain("Solar");
      }
    });

    it("should create lunar eclipse progressive event from beginning to ending", () => {
      const beginningEvent: Event = {
        start: moment.utc("2024-09-18T02:00:00.000Z"),
        end: moment.utc("2024-09-18T02:00:00.000Z"),
        summary: "� 🌙🐉▶️ Lunar Eclipse begins",
        description: "Lunar Eclipse begins (Geocentric)",
        categories: [
          "Astronomy",
          "Astrology",
          "Eclipse",
          "Lunar",
          "Geocentric",
        ],
      };
      const endingEvent: Event = {
        start: moment.utc("2024-09-18T03:00:00.000Z"),
        end: moment.utc("2024-09-18T03:00:00.000Z"),
        summary: "🌐 🌙🐉◀️ Lunar Eclipse ends",
        description: "Lunar Eclipse ends (Geocentric)",
        categories: [
          "Astronomy",
          "Astrology",
          "Eclipse",
          "Lunar",
          "Geocentric",
        ],
      };

      const progressiveEvents = service.detectProgressive([
        beginningEvent,
        endingEvent,
      ]);

      expect(progressiveEvents.length).toBeGreaterThanOrEqual(1);
      const lunarDuration = progressiveEvents.find(
        (e) =>
          e.description.includes("Lunar Eclipse") &&
          !e.description.includes("begins") &&
          !e.description.includes("ends"),
      );
      expect(lunarDuration).toBeDefined();
      if (lunarDuration) {
        expect(lunarDuration.start).toEqual(beginningEvent.start);
        expect(lunarDuration.end).toEqual(endingEvent.start);
        expect(lunarDuration.summary).toBe(
          "🌐 🌙🐉 Lunar Eclipse (Geocentric)",
        );
        expect(lunarDuration.description).toBe("Lunar Eclipse (Geocentric)");
        expect(lunarDuration.categories).toContain("Lunar");
      }
    });

    it("should return empty array when no eclipse events provided", () => {
      const progressiveEvents = service.detectProgressive([]);

      expect(progressiveEvents).toHaveLength(0);
    });

    it("should handle both solar and lunar eclipses together", () => {
      const solarBegin: Event = {
        start: moment.utc("2024-04-08T18:00:00.000Z"),
        end: moment.utc("2024-04-08T18:00:00.000Z"),
        summary: "🌐 ☀️🐉▶️ Solar Eclipse begins",
        description: "Solar Eclipse begins (Geocentric)",
        categories: [
          "Astronomy",
          "Astrology",
          "Eclipse",
          "Solar",
          "Geocentric",
        ],
      };
      const solarEnd: Event = {
        start: moment.utc("2024-04-08T19:00:00.000Z"),
        end: moment.utc("2024-04-08T19:00:00.000Z"),
        summary: "🌐 ☀️🐉◀️ Solar Eclipse ends",
        description: "Solar Eclipse ends (Geocentric)",
        categories: [
          "Astronomy",
          "Astrology",
          "Eclipse",
          "Solar",
          "Geocentric",
        ],
      };
      const lunarBegin: Event = {
        start: moment.utc("2024-09-18T02:00:00.000Z"),
        end: moment.utc("2024-09-18T02:00:00.000Z"),
        summary: "🌐 🌙🐉▶️ Lunar Eclipse begins",
        description: "Lunar Eclipse begins (Geocentric)",
        categories: [
          "Astronomy",
          "Astrology",
          "Eclipse",
          "Lunar",
          "Geocentric",
        ],
      };
      const lunarEnd: Event = {
        start: moment.utc("2024-09-18T03:00:00.000Z"),
        end: moment.utc("2024-09-18T03:00:00.000Z"),
        summary: "🌐 🌙🐉◀️ Lunar Eclipse ends",
        description: "Lunar Eclipse ends (Geocentric)",
        categories: [
          "Astronomy",
          "Astrology",
          "Eclipse",
          "Lunar",
          "Geocentric",
        ],
      };

      const progressiveEvents = service.detectProgressive([
        solarBegin,
        solarEnd,
        lunarBegin,
        lunarEnd,
      ]);

      // Should have progressive events for both solar and lunar
      expect(progressiveEvents.length).toBeGreaterThanOrEqual(2);

      const solarDuration = progressiveEvents.find((e) =>
        e.categories.includes("Solar"),
      );
      const lunarDuration = progressiveEvents.find((e) =>
        e.categories.includes("Lunar"),
      );

      expect(solarDuration).toBeDefined();
      expect(lunarDuration).toBeDefined();
    });

    it("should filter out non-eclipse events", () => {
      const nonEclipseEvent: Event = {
        start: moment.utc("2024-04-08T18:00:00.000Z"),
        end: moment.utc("2024-04-08T18:00:00.000Z"),
        summary: "Some other event",
        description: "Not an eclipse",
        categories: ["Astronomy", "Something Else"],
      };

      const progressiveEvents = service.detectProgressive([nonEclipseEvent]);

      expect(progressiveEvents).toHaveLength(0);
    });
  });

  describe("private utility methods", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    const defaultDiameters = {
      currentDiameterMoon: 0.5,
      currentDiameterSun: 0.5,
    };

    describe("isSolarEclipse", () => {
      it("should return 'maximum' at solar eclipse maximum", () => {
        const result = s.isSolarEclipse({
          ...defaultDiameters,
          currentLatitudeMoon: 0,
          currentLatitudeSun: 0,
          currentLongitudeMoon: 100,
          currentLongitudeSun: 100,
          previousLongitudeMoon: 99,
          previousLongitudeSun: 100,
          nextLongitudeMoon: 101,
          nextLongitudeSun: 100,
        });
        expect(result).toBe("maximum");
      });

      it("should return 'beginning' when eclipse starts", () => {
        const diameter = 0.5 + 0.5;
        const result = s.isSolarEclipse({
          ...defaultDiameters,
          currentLatitudeMoon: 0,
          currentLatitudeSun: 0,
          currentLongitudeMoon: 100 + diameter * 0.5,
          currentLongitudeSun: 100,
          previousLongitudeMoon: 100 + diameter * 1.5,
          previousLongitudeSun: 100,
          nextLongitudeMoon: 100 + diameter * 0.3,
          nextLongitudeSun: 100,
        });
        expect(result).toBe("beginning");
      });

      it("should return 'ending' when eclipse ends", () => {
        const diameter = 0.5 + 0.5;
        const result = s.isSolarEclipse({
          ...defaultDiameters,
          currentLatitudeMoon: 0,
          currentLatitudeSun: 0,
          currentLongitudeMoon: 100 + diameter * 0.5,
          currentLongitudeSun: 100,
          previousLongitudeMoon: 100 + diameter * 0.3,
          previousLongitudeSun: 100,
          nextLongitudeMoon: 100 + diameter * 1.5,
          nextLongitudeSun: 100,
        });
        expect(result).toBe("ending");
      });

      it("should return null when latitude too far for eclipse", () => {
        const result = s.isSolarEclipse({
          ...defaultDiameters,
          currentLatitudeMoon: 5,
          currentLatitudeSun: 0,
          currentLongitudeMoon: 100,
          currentLongitudeSun: 100,
          previousLongitudeMoon: 99,
          previousLongitudeSun: 100,
          nextLongitudeMoon: 101,
          nextLongitudeSun: 100,
        });
        expect(result).toBeNull();
      });

      it("should return null when not at conjunction", () => {
        const result = s.isSolarEclipse({
          ...defaultDiameters,
          currentLatitudeMoon: 0,
          currentLatitudeSun: 0,
          currentLongitudeMoon: 190,
          currentLongitudeSun: 100,
          previousLongitudeMoon: 189,
          previousLongitudeSun: 100,
          nextLongitudeMoon: 191,
          nextLongitudeSun: 100,
        });
        expect(result).toBeNull();
      });
    });

    describe("isLunarEclipse", () => {
      it("should return 'maximum' at lunar eclipse maximum", () => {
        const result = s.isLunarEclipse({
          ...defaultDiameters,
          currentLatitudeMoon: 0,
          currentLatitudeSun: 0,
          currentLongitudeMoon: 280,
          currentLongitudeSun: 100,
          previousLongitudeMoon: 279,
          previousLongitudeSun: 100,
          nextLongitudeMoon: 281,
          nextLongitudeSun: 100,
        });
        expect(result).toBe("maximum");
      });

      it("should return 'beginning' when lunar eclipse starts", () => {
        const diameter = 0.5 + 0.5;
        const oppositionThreshold = 180 - diameter;
        const result = s.isLunarEclipse({
          ...defaultDiameters,
          currentLatitudeMoon: 0,
          currentLatitudeSun: 0,
          currentLongitudeMoon: 100 + oppositionThreshold + 0.5,
          currentLongitudeSun: 100,
          previousLongitudeMoon: 100 + oppositionThreshold - 0.5,
          previousLongitudeSun: 100,
          nextLongitudeMoon: 100 + oppositionThreshold + 1,
          nextLongitudeSun: 100,
        });
        expect(result).toBe("beginning");
      });

      it("should return 'ending' when lunar eclipse ends", () => {
        const diameter = 0.5 + 0.5;
        const oppositionThreshold = 180 - diameter;
        const result = s.isLunarEclipse({
          ...defaultDiameters,
          currentLatitudeMoon: 0,
          currentLatitudeSun: 0,
          currentLongitudeMoon: 100 + oppositionThreshold + 0.5,
          currentLongitudeSun: 100,
          previousLongitudeMoon: 100 + oppositionThreshold + 1,
          previousLongitudeSun: 100,
          nextLongitudeMoon: 100 + oppositionThreshold - 0.5,
          nextLongitudeSun: 100,
        });
        expect(result).toBe("ending");
      });

      it("should return null when latitude too far for eclipse", () => {
        const result = s.isLunarEclipse({
          ...defaultDiameters,
          currentLatitudeMoon: 5,
          currentLatitudeSun: 0,
          currentLongitudeMoon: 280,
          currentLongitudeSun: 100,
          previousLongitudeMoon: 279,
          previousLongitudeSun: 100,
          nextLongitudeMoon: 281,
          nextLongitudeSun: 100,
        });
        expect(result).toBeNull();
      });

      it("should return null when not at opposition", () => {
        const result = s.isLunarEclipse({
          ...defaultDiameters,
          currentLatitudeMoon: 0,
          currentLatitudeSun: 0,
          currentLongitudeMoon: 150,
          currentLongitudeSun: 100,
          previousLongitudeMoon: 149,
          previousLongitudeSun: 100,
          nextLongitudeMoon: 151,
          nextLongitudeSun: 100,
        });
        expect(result).toBeNull();
      });
    });

    describe("active-state helpers", () => {
      it("should report active solar eclipse overlap", () => {
        const active = s.isSolarEclipseActive({
          ...defaultDiameters,
          currentLatitudeMoon: 0,
          currentLatitudeSun: 0,
          currentLongitudeMoon: 100.4,
          currentLongitudeSun: 100,
        });
        expect(active).toBe(true);
      });

      it("should report inactive solar eclipse overlap", () => {
        const active = s.isSolarEclipseActive({
          ...defaultDiameters,
          currentLatitudeMoon: 5,
          currentLatitudeSun: 0,
          currentLongitudeMoon: 100,
          currentLongitudeSun: 100,
        });
        expect(active).toBe(false);
      });

      it("should report active lunar eclipse overlap", () => {
        const active = s.isLunarEclipseActive({
          ...defaultDiameters,
          currentLatitudeMoon: 0,
          currentLatitudeSun: 0,
          currentLongitudeMoon: 279.5,
          currentLongitudeSun: 100,
        });
        expect(active).toBe(true);
      });

      it("should report inactive lunar eclipse overlap", () => {
        const active = s.isLunarEclipseActive({
          ...defaultDiameters,
          currentLatitudeMoon: 0,
          currentLatitudeSun: 0,
          currentLongitudeMoon: 250,
          currentLongitudeSun: 100,
        });
        expect(active).toBe(false);
      });
    });
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
