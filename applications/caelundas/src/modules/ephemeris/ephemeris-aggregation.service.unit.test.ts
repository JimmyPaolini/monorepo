import moment from "moment-timezone";
import { describe, expect, it, vi } from "vitest";

import { EphemerisAggregationService } from "./ephemeris-aggregation.service";

import type { EphemerisConstantsService } from "./ephemeris-constants.service";
import type { EphemerisCoordinateService } from "./ephemeris-coordinate.service";
import type { EphemerisHorizonService } from "./ephemeris-horizon.service";
import type { EphemerisPhenomenaService } from "./ephemeris-phenomena.service";
import type { EphemerisTimeService } from "./ephemeris-time.service";

describe("EphemerisAggregationService", () => {
  const constantsService = {
    getSwissEphemerisConstantForBody: vi.fn().mockReturnValue(0),
    isNode: vi.fn(
      (body: string) => body.includes("node") || body === "lunar perigee",
    ),
  };
  const coordinateService = {
    computeNodeBodyMinutes: vi.fn().mockReturnValue({
      "2024-03-21T00:00:00.000Z": { latitude: 0, longitude: 45 },
    }),
    getBodyCoordinatesWithDistance: vi.fn().mockReturnValue({
      distance: 1.01,
      latitude: -1.2,
      longitude: 120.5,
    }),
  };
  const horizonService = {
    computeAzimuthElevationForMinute: vi.fn().mockReturnValue({
      azimuth: 180,
      elevation: 44.8,
    }),
  };
  const phenomenaService = {
    computePhenoForMinute: vi.fn(),
  };
  const timeService = {
    dateToJulianDays: vi.fn().mockReturnValue({
      julianDayEphemerisTime: 2_460_395.5,
      julianDayUniversalTime: 2_460_395.499_306,
    }),
    generateMinutes: vi.fn((start: moment.Moment, end: moment.Moment) => {
      const values: moment.Moment[] = [];
      let current = start.clone();
      while (current.valueOf() <= end.valueOf()) {
        values.push(current.clone());
        current = current.clone().add(1, "minute");
      }
      return values;
    }),
  };

  const service = new EphemerisAggregationService(
    constantsService as unknown as EphemerisConstantsService,
    coordinateService as unknown as EphemerisCoordinateService,
    horizonService as unknown as EphemerisHorizonService,
    phenomenaService as unknown as EphemerisPhenomenaService,
    timeService as unknown as EphemerisTimeService,
  );

  describe("buildEphemerisFeatureSets", () => {
    it("creates body lookup sets", () => {
      const result = service.buildEphemerisFeatureSets({
        azimuthElevationBodies: ["sun"],
        diameterBodies: ["moon"],
        distanceBodies: ["sun"],
        illuminationBodies: ["moon"],
      });

      expect(result.azimuthElevationSet.has("sun")).toBe(true);
      expect(result.diameterSet.has("moon")).toBe(true);
      expect(result.distanceSet.has("sun")).toBe(true);
      expect(result.illuminationSet.has("moon")).toBe(true);
    });
  });

  describe("buildEphemerisEntries", () => {
    it("creates empty entry arrays", () => {
      const result = service.buildEphemerisEntries();

      expect(result.azimuthEntries).toHaveLength(0);
      expect(result.coordinateEntries).toHaveLength(0);
      expect(result.diameterEntries).toHaveLength(0);
      expect(result.distanceEntries).toHaveLength(0);
      expect(result.illuminationEntries).toHaveLength(0);
    });
  });

  describe("accumulateBodyEphemeris", () => {
    it("accumulates node coordinates through node path", () => {
      const allEntries = service.buildEphemerisEntries();
      const featureSets = service.buildEphemerisFeatureSets({
        azimuthElevationBodies: [],
        diameterBodies: [],
        distanceBodies: [],
        illuminationBodies: [],
      });

      service.accumulateBodyEphemeris({
        allEntries,
        body: "north lunar node",
        end: moment.utc("2024-03-21T00:01:00.000Z"),
        featureSets,
        observerLatitude: 40.7128,
        observerLongitude: -74.006,
        start: moment.utc("2024-03-21T00:00:00.000Z"),
      });

      expect(allEntries.coordinateEntries).toHaveLength(1);
      expect(coordinateService.computeNodeBodyMinutes).toHaveBeenCalledOnce();
    });

    it("accumulates non-node coordinate and requested feature entries", () => {
      const allEntries = service.buildEphemerisEntries();
      const featureSets = service.buildEphemerisFeatureSets({
        azimuthElevationBodies: ["sun"],
        diameterBodies: ["sun"],
        distanceBodies: ["sun"],
        illuminationBodies: ["sun"],
      });

      service.accumulateBodyEphemeris({
        allEntries,
        body: "sun",
        end: moment.utc("2024-03-21T00:01:00.000Z"),
        featureSets,
        observerLatitude: 40.7128,
        observerLongitude: -74.006,
        start: moment.utc("2024-03-21T00:00:00.000Z"),
      });

      expect(allEntries.coordinateEntries).toHaveLength(1);
      expect(allEntries.azimuthEntries).toHaveLength(1);
      expect(allEntries.diameterEntries).toHaveLength(1);
      expect(allEntries.distanceEntries).toHaveLength(1);
      expect(allEntries.illuminationEntries).toHaveLength(1);
    });
  });

  describe("entriesToEphemerides", () => {
    it("converts entries arrays into by-body records", () => {
      const entries = service.buildEphemerisEntries();
      entries.coordinateEntries.push([
        "sun",
        { "2024-03-21T00:00:00.000Z": { latitude: -1.2, longitude: 120.5 } },
      ]);

      const result = service.entriesToEphemerides(entries);

      expect(result.coordinateEphemerisByBody.sun).toBeDefined();
    });
  });
});
