import { Test } from "@nestjs/testing";
import moment from "moment-timezone";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";

import { EphemerisAggregatesService } from "./ephemeris.aggregates";
import { EphemerisService } from "./ephemeris.service";

import type {
  AzimuthElevationEphemeris,
  CoordinateEphemeris,
  DiameterEphemeris,
  DistanceEphemeris,
  IlluminationEphemeris,
} from "./ephemeris.types";
import type { Body } from "@caelundas/src/types";

describe("EphemerisAggregatesService", () => {
  const coordinates: [number, number] = [-74.006, 40.7128];
  const start = moment.utc("2024-03-21T00:00:00.000Z");
  const end = moment.utc("2024-03-21T01:00:00.000Z");
  const timezone = "America/New_York";

  let service: EphemerisAggregatesService;
  let ephemerisService: MockProxy<EphemerisService>;

  beforeAll(async () => {
    ephemerisService = mock<EphemerisService>();
    const module = await Test.createTestingModule({
      providers: [
        EphemerisAggregatesService,
        { provide: EphemerisService, useValue: ephemerisService },
      ],
    }).compile();

    service = module.get(EphemerisAggregatesService);
  });

  beforeEach(() => {
    ephemerisService.computeAllEphemerides.mockClear();
  });

  const mockResult = {
    coordinateEphemerisByBody: {
      sun: { "2024-03-21T00:00:00.000Z": { longitude: 0, latitude: 0 } },
      moon: { "2024-03-21T00:00:00.000Z": { longitude: 120, latitude: 5 } },
    } as unknown as Record<Body, CoordinateEphemeris>,
    azimuthElevationEphemerisByBody: {
      sun: { "2024-03-21T00:00:00.000Z": { azimuth: 90, elevation: 45 } },
      moon: { "2024-03-21T00:00:00.000Z": { azimuth: 180, elevation: 30 } },
    } as unknown as Record<Body, AzimuthElevationEphemeris>,
    illuminationEphemerisByBody: {
      moon: { "2024-03-21T00:00:00.000Z": { illumination: 0.5 } },
    } as unknown as Record<Body, IlluminationEphemeris>,
    diameterEphemerisByBody: {
      sun: { "2024-03-21T00:00:00.000Z": { diameter: 0.5334 } },
    } as unknown as Record<Body, DiameterEphemeris>,
    distanceEphemerisByBody: {
      sun: { "2024-03-21T00:00:00.000Z": { distance: 1 } },
    } as unknown as Record<Body, DistanceEphemeris>,
  };

  describe("getEphemerides", () => {
    it("should fetch all ephemeris types", () => {
      ephemerisService.computeAllEphemerides.mockReturnValue(mockResult);

      const result = service.getEphemerides({
        coordinates,
        start,
        end,
        timezone,
      });

      expect(result).toHaveProperty("coordinateEphemerisByBody");
      expect(result).toHaveProperty("azimuthElevationEphemerisByBody");
      expect(result).toHaveProperty("illuminationEphemerisByBody");
      expect(result).toHaveProperty("diameterEphemerisByBody");
      expect(result).toHaveProperty("distanceEphemerisByBody");

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ephemerisService.computeAllEphemerides).toHaveBeenCalledWith(
        expect.objectContaining({
          coordinateBodies: expect.arrayContaining<string>([
            "sun",
            "mercury",
            "venus",
            "moon",
            "mars",
            "jupiter",
            "saturn",
            "uranus",
            "neptune",
            "pluto",
          ]) as string[],
          azimuthElevationBodies: ["sun", "moon"],
          illuminationBodies: ["moon", "mercury", "venus", "mars"],
          diameterBodies: ["sun", "moon"],
          distanceBodies: ["sun", "mercury", "venus", "mars"],
          coordinates,
          start,
          end,
        }),
      );
    });

    it("should return properly structured ephemeris data", () => {
      ephemerisService.computeAllEphemerides.mockReturnValue(mockResult);

      const result = service.getEphemerides({
        coordinates,
        start,
        end,
        timezone,
      });

      expect(result.coordinateEphemerisByBody).toEqual(
        mockResult.coordinateEphemerisByBody,
      );
      expect(result.azimuthElevationEphemerisByBody).toEqual(
        mockResult.azimuthElevationEphemerisByBody,
      );
      expect(result.illuminationEphemerisByBody).toEqual(
        mockResult.illuminationEphemerisByBody,
      );
      expect(result.diameterEphemerisByBody).toEqual(
        mockResult.diameterEphemerisByBody,
      );
      expect(result.distanceEphemerisByBody).toEqual(
        mockResult.distanceEphemerisByBody,
      );
    });

    it("should pass coordinates to the ephemeris computation", () => {
      ephemerisService.computeAllEphemerides.mockReturnValue(mockResult);

      const testCoordinates: [number, number] = [-118.2437, 34.0522]; // Los Angeles
      service.getEphemerides({
        coordinates: testCoordinates,
        start,
        end,
        timezone,
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ephemerisService.computeAllEphemerides).toHaveBeenCalledWith(
        expect.objectContaining({ coordinates: testCoordinates }),
      );
    });

    it("should pass date range to the ephemeris computation", () => {
      ephemerisService.computeAllEphemerides.mockReturnValue(mockResult);

      const customStart = moment.utc("2024-06-21T00:00:00.000Z");
      const customEnd = moment.utc("2024-06-22T00:00:00.000Z");
      service.getEphemerides({
        coordinates,
        start: customStart,
        end: customEnd,
        timezone,
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ephemerisService.computeAllEphemerides).toHaveBeenCalledWith(
        expect.objectContaining({ start: customStart, end: customEnd }),
      );
    });

    it("should return successfully for any timezone", () => {
      ephemerisService.computeAllEphemerides.mockReturnValue(mockResult);

      const result = service.getEphemerides({
        coordinates,
        start,
        end,
        timezone: "Europe/London",
      });

      expect(result).toHaveProperty("coordinateEphemerisByBody");
    });
  });
});
