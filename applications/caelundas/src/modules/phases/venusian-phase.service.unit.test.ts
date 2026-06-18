import { symbolByVenusianPhase } from "@caelundas/src/modules/caelundas/caelundas.symbol-constants";
import moment from "moment-timezone";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../logger/logger.service";

import {
  VENUS_EVENING_VISIBILITY_DESCRIPTION,
  VENUS_MORNING_VISIBILITY_DESCRIPTION,
} from "./phases.constants";
import { VenusianPhaseService } from "./venusian-phase.service";

import type { PhaseParameters } from "./phases.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

const createTimestamp = (): moment.Moment =>
  moment.utc("2024-01-15T06:00:00.000Z");

const createPhaseParameters = (): PhaseParameters => ({
  currentDistance: 1,
  currentIllumination: 50,
  currentLongitudePlanet: 100,
  currentLongitudeSun: 90,
  nextDistances: [1, 1],
  nextIlluminations: [50, 50],
  nextLongitudePlanet: 101,
  nextLongitudeSun: 91,
  previousDistances: [1, 1],
  previousIlluminations: [50, 50],
  previousLongitudePlanet: 99,
  previousLongitudeSun: 89,
});

const createPhaseCalculationServiceStub = (): {
  filterByCategory: ReturnType<typeof vi.fn>;
  formatTimeZoneIso: ReturnType<typeof vi.fn>;
  gatherPhaseParameters: ReturnType<typeof vi.fn>;
  isEasternBrightest: ReturnType<typeof vi.fn>;
  isEasternElongation: ReturnType<typeof vi.fn>;
  isEveningRise: ReturnType<typeof vi.fn>;
  isEveningSet: ReturnType<typeof vi.fn>;
  isMorningRise: ReturnType<typeof vi.fn>;
  isMorningSet: ReturnType<typeof vi.fn>;
  isWesternBrightest: ReturnType<typeof vi.fn>;
  isWesternElongation: ReturnType<typeof vi.fn>;
} => ({
  filterByCategory: vi.fn((events: Event[], category: string) =>
    events.filter((event) => event.categories.includes(category)),
  ),
  formatTimeZoneIso: vi.fn(() => "2024-01-15T01:00:00-05:00"),
  gatherPhaseParameters: vi.fn(() => createPhaseParameters()),
  isEasternBrightest: vi.fn(() => false),
  isEasternElongation: vi.fn(() => false),
  isEveningRise: vi.fn(() => false),
  isEveningSet: vi.fn(() => false),
  isMorningRise: vi.fn(() => false),
  isMorningSet: vi.fn(() => false),
  isWesternBrightest: vi.fn(() => false),
  isWesternElongation: vi.fn(() => false),
});

const createProgressiveUtilitiesStub = (): {
  pairProgressiveEvents: ReturnType<typeof vi.fn>;
} => ({
  pairProgressiveEvents: vi.fn(() => []),
});

describe("VenusianPhaseService", () => {
  const logger = new LoggerService();
  const phaseCalculationService = createPhaseCalculationServiceStub();
  const progressiveUtilitiesService = createProgressiveUtilitiesStub();

  const service = new VenusianPhaseService(
    logger,
    phaseCalculationService as never,
    progressiveUtilitiesService as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildVenusianPhaseEvent", () => {
    it("builds expected Venus phase event metadata", () => {
      const timestamp = createTimestamp();

      const event = service.buildVenusianPhaseEvent({
        phase: "morning rise",
        timestamp,
      });

      expect(event.summary).toBe(
        `♀️${symbolByVenusianPhase["morning rise"]} Venus Morning Rise`,
      );
      expect(event.description).toBe("Venus Morning Rise");
      expect(event.start).toEqual(timestamp);
      expect(event.end).toEqual(timestamp);
      expect(event.categories).toContain("Venusian");
      expect(event.categories).toContain("Morning Rise");
    });
  });

  describe("getVenusianPhaseEvents", () => {
    it("emits all eight Venus events when all checks pass", () => {
      phaseCalculationService.isMorningRise.mockReturnValue(true);
      phaseCalculationService.isWesternBrightest.mockReturnValue(true);
      phaseCalculationService.isWesternElongation.mockReturnValue(true);
      phaseCalculationService.isMorningSet.mockReturnValue(true);
      phaseCalculationService.isEveningRise.mockReturnValue(true);
      phaseCalculationService.isEasternElongation.mockReturnValue(true);
      phaseCalculationService.isEasternBrightest.mockReturnValue(true);
      phaseCalculationService.isEveningSet.mockReturnValue(true);

      const timestamp = createTimestamp();

      const events = service.getVenusianPhaseEvents({
        minute: timestamp,
        sunCoordinateEphemeris: {},
        venusCoordinateEphemeris: {},
        venusDistanceEphemeris: {},
        venusIlluminationEphemeris: {},
      });

      expect(events).toHaveLength(8);
      expect(events.map((event) => event.description)).toEqual(
        expect.arrayContaining([
          "Venus Morning Rise",
          "Venus Western Brightest",
          "Venus Western Elongation",
          "Venus Morning Set",
          "Venus Evening Rise",
          "Venus Eastern Elongation",
          "Venus Eastern Brightest",
          "Venus Evening Set",
        ]),
      );
    });
  });

  describe("progressive visibility events", () => {
    it("creates venusian morning visibility duration events", () => {
      const morningRise: Event = {
        categories: ["Planetary Phase", "Venusian", "Morning Rise"],
        description: "Venus Morning Rise",
        end: moment.utc("2024-01-01T00:00:00.000Z"),
        start: moment.utc("2024-01-01T00:00:00.000Z"),
        summary: "Venus Morning Rise",
      };
      const morningSet: Event = {
        categories: ["Planetary Phase", "Venusian", "Morning Set"],
        description: "Venus Morning Set",
        end: moment.utc("2024-01-02T00:00:00.000Z"),
        start: moment.utc("2024-01-02T00:00:00.000Z"),
        summary: "Venus Morning Set",
      };
      progressiveUtilitiesService.pairProgressiveEvents.mockReturnValue([
        [morningRise, morningSet],
      ]);

      const events = service.getVenusianMorningProgressiveEvents([
        morningRise,
        morningSet,
      ]);

      expect(events).toHaveLength(1);
      expect(events[0]?.description).toBe(VENUS_MORNING_VISIBILITY_DESCRIPTION);
      expect(events[0]?.start).toEqual(morningRise.start);
      expect(events[0]?.end).toEqual(morningSet.start);
    });

    it("creates venusian evening visibility duration events", () => {
      const eveningRise: Event = {
        categories: ["Planetary Phase", "Venusian", "Evening Rise"],
        description: "Venus Evening Rise",
        end: moment.utc("2024-01-01T00:00:00.000Z"),
        start: moment.utc("2024-01-01T00:00:00.000Z"),
        summary: "Venus Evening Rise",
      };
      const eveningSet: Event = {
        categories: ["Planetary Phase", "Venusian", "Evening Set"],
        description: "Venus Evening Set",
        end: moment.utc("2024-01-02T00:00:00.000Z"),
        start: moment.utc("2024-01-02T00:00:00.000Z"),
        summary: "Venus Evening Set",
      };
      progressiveUtilitiesService.pairProgressiveEvents.mockReturnValue([
        [eveningRise, eveningSet],
      ]);

      const events = service.getVenusianEveningProgressiveEvents([
        eveningRise,
        eveningSet,
      ]);

      expect(events).toHaveLength(1);
      expect(events[0]?.description).toBe(VENUS_EVENING_VISIBILITY_DESCRIPTION);
      expect(events[0]?.start).toEqual(eveningRise.start);
      expect(events[0]?.end).toEqual(eveningSet.start);
    });
  });
});
