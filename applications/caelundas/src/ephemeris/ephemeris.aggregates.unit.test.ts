import moment from "moment-timezone";
import { describe, expect, it, vi } from "vitest";

import { getEphemerides } from "./ephemeris.aggregates";

import type { Body } from "../types";
import type {
  AzimuthElevationEphemeris,
  CoordinateEphemeris,
  DiameterEphemeris,
  DistanceEphemeris,
  IlluminationEphemeris,
} from "./ephemeris.types";

// Mock the ephemeris service
vi.mock("./ephemeris.service", () => ({
  computeAllEphemerides: vi.fn(),
}));

describe("ephemeris.aggregates", () => {
  const coordinates: [number, number] = [-74.006, 40.7128];
  const start = moment.utc("2024-03-21T00:00:00.000Z");
  const end = moment.utc("2024-03-21T01:00:00.000Z");
  const timezone = "America/New_York";

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
    it("should fetch all ephemeris types", async () => {
      const { computeAllEphemerides } = await import("./ephemeris.service");
      vi.mocked(computeAllEphemerides).mockReturnValue(mockResult);

      const result = getEphemerides({ coordinates, start, end, timezone });

      expect(result).toHaveProperty("coordinateEphemerisByBody");
      expect(result).toHaveProperty("azimuthElevationEphemerisByBody");
      expect(result).toHaveProperty("illuminationEphemerisByBody");
      expect(result).toHaveProperty("diameterEphemerisByBody");
      expect(result).toHaveProperty("distanceEphemerisByBody");

      expect(computeAllEphemerides).toHaveBeenCalledWith(
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

    it("should return properly structured ephemeris data", async () => {
      const { computeAllEphemerides } = await import("./ephemeris.service");
      vi.mocked(computeAllEphemerides).mockReturnValue(mockResult);

      const result = getEphemerides({ coordinates, start, end, timezone });

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

    it("should pass coordinates to the ephemeris computation", async () => {
      const { computeAllEphemerides } = await import("./ephemeris.service");
      vi.mocked(computeAllEphemerides).mockReturnValue(mockResult);

      const testCoordinates: [number, number] = [-118.2437, 34.0522]; // Los Angeles
      getEphemerides({ coordinates: testCoordinates, start, end, timezone });

      expect(computeAllEphemerides).toHaveBeenCalledWith(
        expect.objectContaining({ coordinates: testCoordinates }),
      );
    });

    it("should pass date range to the ephemeris computation", async () => {
      const { computeAllEphemerides } = await import("./ephemeris.service");
      vi.mocked(computeAllEphemerides).mockReturnValue(mockResult);

      const customStart = moment.utc("2024-06-21T00:00:00.000Z");
      const customEnd = moment.utc("2024-06-22T00:00:00.000Z");
      getEphemerides({
        coordinates,
        start: customStart,
        end: customEnd,
        timezone,
      });

      expect(computeAllEphemerides).toHaveBeenCalledWith(
        expect.objectContaining({ start: customStart, end: customEnd }),
      );
    });

    it("should return successfully for any timezone", async () => {
      const { computeAllEphemerides } = await import("./ephemeris.service");
      vi.mocked(computeAllEphemerides).mockReturnValue(mockResult);

      const result = getEphemerides({
        coordinates,
        start,
        end,
        timezone: "Europe/London",
      });

      expect(result).toHaveProperty("coordinateEphemerisByBody");
    });
  });
});
