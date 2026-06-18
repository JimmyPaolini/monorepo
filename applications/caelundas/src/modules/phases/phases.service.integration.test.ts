import { MARGIN_MINUTES } from "@caelundas/src/modules/caelundas/caelundas.constants";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import moment, { type Moment } from "moment-timezone";
import { describe, expect, it, vi } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { MartianPhaseService } from "./martian-phase.service";
import { MercurianPhaseService } from "./mercurian-phase.service";
import { PhaseCalculationService } from "./phase-calculation.service";
import { PhasesService } from "./phases.service";
import { VenusianPhaseService } from "./venusian-phase.service";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

const mathService = new MathService();
const ephemerisService = new EphemerisService(mathService);
const loggerService = new LoggerService();
const progressiveUtilitiesService = new ProgressiveUtilities(loggerService);
const phaseCalculationService = new PhaseCalculationService(
  loggerService,
  ephemerisService,
  mathService,
);
const venusianPhaseService = new VenusianPhaseService(
  loggerService,
  phaseCalculationService,
  progressiveUtilitiesService,
);
const mercurianPhaseService = new MercurianPhaseService(
  loggerService,
  phaseCalculationService,
  progressiveUtilitiesService,
);
const martianPhaseService = new MartianPhaseService(
  loggerService,
  phaseCalculationService,
  progressiveUtilitiesService,
);
const service = new PhasesService(
  loggerService,
  venusianPhaseService,
  mercurianPhaseService,
  martianPhaseService,
);

describe("phases.events integration", () => {
  /**
   * Creates mock ephemeris with a configurable longitude step rate.
   *
   * To trigger rise/set transitions the planet and Sun must move at DIFFERENT
   * rates so the angular separation actually crosses the civil-twilight threshold
   * (6°).  Use `step: 0.15` for the inner planet and the default `step: 0.1`
   * for the Sun so the gap changes by 0.05° per minute.
   *
   * Concrete verification (RISE_SET_THRESHOLD = 6°):
   *   Morning Set  – planet west of Sun, gap closing:
   *     planet base=94.0 step=0.15, sun base=100.0 step=0.1
   *     i=-1: |99.9 – 93.85| = 6.05 > 6  ✓   i=0: |100 – 94| = 6.0 ≤ 6  ✓
   *   Evening Rise – planet east of Sun, gap opening:
   *     planet base=106.0 step=0.15, sun base=100.0 step=0.1
   *     i=-1: |105.85 – 99.9| = 5.95 < 6  ✓   i=0: |106 – 100| = 6.0 ≥ 6  ✓
   */
  function createMockEphemeris(
    baseTime: Moment,
    config: {
      distance: number;
      illumination: number;
      longitude: number;
      step?: number;
    },
  ): Record<
    string,
    {
      distance: number;
      illumination: number;
      latitude: number;
      longitude: number;
    }
  > {
    const step = config.step ?? 0.1;
    const ephemeris: Record<
      string,
      {
        distance: number;
        illumination: number;
        latitude: number;
        longitude: number;
      }
    > = {};

    // Create data for MARGIN_MINUTES before, current, and MARGIN_MINUTES after
    for (let index = -MARGIN_MINUTES; index <= MARGIN_MINUTES + 1; index++) {
      const time = baseTime.clone().add(index, "minutes");
      ephemeris[time.toISOString()] = {
        distance: config.distance + index * 0.001,
        illumination: config.illumination + index * 0.01,
        latitude: 0,
        longitude: config.longitude + index * step,
      };
    }

    return ephemeris;
  }

  describe("service.getVenusianPhaseEvents", () => {
    it("should detect Venus Morning Set when angular gap closes through the threshold", () => {
      // Venus west of Sun (morning sky), Venus moves faster than Sun so the gap
      // decreases from 6.05° (i=-1) to 6.0° (i=0) — crosses the 6° threshold ↓
      const currentMinute = moment.utc("2024-01-15T06:00:00.000Z");

      // Venus in morning sky configuration (western elongation)
      const venusEphemeris = createMockEphemeris(currentMinute, {
        distance: 0.7,
        illumination: 40,
        longitude: 94,
        step: 0.15, // Venus moves faster than Sun
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        distance: 1,
        illumination: 100,
        longitude: 100,
        step: 0.1,
      });

      const events = service.getVenusianPhaseEvents({
        minute: currentMinute,
        sunCoordinateEphemeris: sunEphemeris,
        venusCoordinateEphemeris: venusEphemeris,
        venusDistanceEphemeris: venusEphemeris,
        venusIlluminationEphemeris: venusEphemeris,
      });

      const morningSetEvent = events.find((e) =>
        e.categories.includes("Morning Set"),
      );
      expect(morningSetEvent).toBeDefined();
      expect(morningSetEvent?.categories).toContain("Venusian");
      expect(morningSetEvent?.description).toBe("Venus Morning Set");
      expect(morningSetEvent?.start).toEqual(currentMinute);
    });

    it("should detect Venus Evening Rise when angular gap opens through the threshold", () => {
      // Venus east of Sun (evening sky), Venus moves faster than Sun so the gap
      // grows from 5.95° (i=-1) to 6.0° (i=0) — crosses the 6° threshold ↑
      const currentMinute = moment.utc("2024-06-15T18:00:00.000Z");

      // Venus in evening sky configuration (eastern side)
      const venusEphemeris = createMockEphemeris(currentMinute, {
        distance: 0.7,
        illumination: 60,
        longitude: 106,
        step: 0.15, // Venus moves faster than Sun
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        distance: 1,
        illumination: 100,
        longitude: 100,
        step: 0.1,
      });

      const events = service.getVenusianPhaseEvents({
        minute: currentMinute,
        sunCoordinateEphemeris: sunEphemeris,
        venusCoordinateEphemeris: venusEphemeris,
        venusDistanceEphemeris: venusEphemeris,
        venusIlluminationEphemeris: venusEphemeris,
      });

      const eveningRiseEvent = events.find((e) =>
        e.categories.includes("Evening Rise"),
      );
      expect(eveningRiseEvent).toBeDefined();
      expect(eveningRiseEvent?.categories).toContain("Venusian");
      expect(eveningRiseEvent?.description).toBe("Venus Evening Rise");
      expect(eveningRiseEvent?.start).toEqual(currentMinute);
    });

    it("should return no events when the angular gap is constant and far from the threshold", () => {
      // Same step rate for both bodies → constant angle, never crosses threshold
      const currentMinute = moment.utc("2024-03-15T12:00:00.000Z");

      const venusEphemeris = createMockEphemeris(currentMinute, {
        distance: 0.5,
        illumination: 50,
        longitude: 50,
        step: 0.1,
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        distance: 1,
        illumination: 100,
        longitude: 100, // 50° gap — never changes
        step: 0.1,
      });

      const events = service.getVenusianPhaseEvents({
        minute: currentMinute,
        sunCoordinateEphemeris: sunEphemeris,
        venusCoordinateEphemeris: venusEphemeris,
        venusDistanceEphemeris: venusEphemeris,
        venusIlluminationEphemeris: venusEphemeris,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("service.getMercurianPhaseEvents", () => {
    it("should detect Mercury Morning Set when the gap closes through the threshold", () => {
      // Same geometry as Venus Morning Set — Mercury west of Sun, gap 6.05→6.0
      const currentMinute = moment.utc("2024-02-15T06:00:00.000Z");

      const mercuryEphemeris = createMockEphemeris(currentMinute, {
        distance: 0.6,
        illumination: 35,
        longitude: 94,
        step: 0.15,
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        distance: 1,
        illumination: 100,
        longitude: 100,
        step: 0.1,
      });

      const events = service.getMercurianPhaseEvents({
        mercuryCoordinateEphemeris: mercuryEphemeris,
        mercuryDistanceEphemeris: mercuryEphemeris,
        mercuryIlluminationEphemeris: mercuryEphemeris,
        minute: currentMinute,
        sunCoordinateEphemeris: sunEphemeris,
      });

      const morningSetEvent = events.find((e) =>
        e.categories.includes("Morning Set"),
      );
      expect(morningSetEvent).toBeDefined();
      expect(morningSetEvent?.categories).toContain("Mercurian");
      expect(morningSetEvent?.description).toBe("Mercury Morning Set");
      expect(morningSetEvent?.start).toEqual(currentMinute);
    });

    it("should detect Mercury Evening Rise when the gap opens through the threshold", () => {
      // Mercury east of Sun, gap 5.95→6.0
      const currentMinute = moment.utc("2024-04-15T18:00:00.000Z");

      const mercuryEphemeris = createMockEphemeris(currentMinute, {
        distance: 0.8,
        illumination: 70,
        longitude: 106,
        step: 0.15,
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        distance: 1,
        illumination: 100,
        longitude: 100,
        step: 0.1,
      });

      const events = service.getMercurianPhaseEvents({
        mercuryCoordinateEphemeris: mercuryEphemeris,
        mercuryDistanceEphemeris: mercuryEphemeris,
        mercuryIlluminationEphemeris: mercuryEphemeris,
        minute: currentMinute,
        sunCoordinateEphemeris: sunEphemeris,
      });

      const eveningRiseEvent = events.find((e) =>
        e.categories.includes("Evening Rise"),
      );
      expect(eveningRiseEvent).toBeDefined();
      expect(eveningRiseEvent?.categories).toContain("Mercurian");
      expect(eveningRiseEvent?.description).toBe("Mercury Evening Rise");
      expect(eveningRiseEvent?.start).toEqual(currentMinute);
    });

    it("should return no events when the angular gap is constant and far from the threshold", () => {
      const currentMinute = moment.utc("2024-05-15T12:00:00.000Z");

      const mercuryEphemeris = createMockEphemeris(currentMinute, {
        distance: 0.7,
        illumination: 55,
        longitude: 50,
        step: 0.1,
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        distance: 1,
        illumination: 100,
        longitude: 100, // 50° gap — constant
        step: 0.1,
      });

      const events = service.getMercurianPhaseEvents({
        mercuryCoordinateEphemeris: mercuryEphemeris,
        mercuryDistanceEphemeris: mercuryEphemeris,
        mercuryIlluminationEphemeris: mercuryEphemeris,
        minute: currentMinute,
        sunCoordinateEphemeris: sunEphemeris,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("service.getMartianPhaseEvents", () => {
    it("should detect Mars Morning Set when the gap closes through the threshold", () => {
      // Mars west of Sun, gap 6.05→6.0
      const currentMinute = moment.utc("2024-06-01T06:00:00.000Z");

      const marsEphemeris = createMockEphemeris(currentMinute, {
        distance: 1.5,
        illumination: 92,
        longitude: 94,
        step: 0.15,
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        distance: 1,
        illumination: 100,
        longitude: 100,
        step: 0.1,
      });

      const events = service.getMartianPhaseEvents({
        marsCoordinateEphemeris: marsEphemeris,
        marsDistanceEphemeris: marsEphemeris,
        marsIlluminationEphemeris: marsEphemeris,
        minute: currentMinute,
        sunCoordinateEphemeris: sunEphemeris,
      });

      const morningSetEvent = events.find((e) =>
        e.categories.includes("Morning Set"),
      );
      expect(morningSetEvent).toBeDefined();
      expect(morningSetEvent?.categories).toContain("Martian");
      expect(morningSetEvent?.description).toBe("Mars Morning Set");
      expect(morningSetEvent?.start).toEqual(currentMinute);
    });

    it("should detect Mars Evening Rise when the gap opens through the threshold", () => {
      // Mars east of Sun, gap 5.95→6.0
      const currentMinute = moment.utc("2024-08-01T18:00:00.000Z");

      const marsEphemeris = createMockEphemeris(currentMinute, {
        distance: 2,
        illumination: 88,
        longitude: 106,
        step: 0.15,
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        distance: 1,
        illumination: 100,
        longitude: 100,
        step: 0.1,
      });

      const events = service.getMartianPhaseEvents({
        marsCoordinateEphemeris: marsEphemeris,
        marsDistanceEphemeris: marsEphemeris,
        marsIlluminationEphemeris: marsEphemeris,
        minute: currentMinute,
        sunCoordinateEphemeris: sunEphemeris,
      });

      const eveningRiseEvent = events.find((e) =>
        e.categories.includes("Evening Rise"),
      );
      expect(eveningRiseEvent).toBeDefined();
      expect(eveningRiseEvent?.categories).toContain("Martian");
      expect(eveningRiseEvent?.description).toBe("Mars Evening Rise");
      expect(eveningRiseEvent?.start).toEqual(currentMinute);
    });

    it("should return no events when the angular gap is constant and far from the threshold", () => {
      const currentMinute = moment.utc("2024-09-15T12:00:00.000Z");

      const marsEphemeris = createMockEphemeris(currentMinute, {
        distance: 1.8,
        illumination: 90,
        longitude: 50,
        step: 0.1,
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        distance: 1,
        illumination: 100,
        longitude: 100, // 50° gap — constant
        step: 0.1,
      });

      const events = service.getMartianPhaseEvents({
        marsCoordinateEphemeris: marsEphemeris,
        marsDistanceEphemeris: marsEphemeris,
        marsIlluminationEphemeris: marsEphemeris,
        minute: currentMinute,
        sunCoordinateEphemeris: sunEphemeris,
      });

      expect(events).toHaveLength(0);
    });
  });
});
