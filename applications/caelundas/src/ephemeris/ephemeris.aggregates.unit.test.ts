import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getEphemerides } from "./ephemeris.aggregates";

// Mock the ephemeris service functions
vi.mock("./ephemeris.service", () => ({
  getCoordinateEphemerisByBody: vi.fn(),
  getAzimuthElevationEphemerisByBody: vi.fn(),
  getIlluminationEphemerisByBody: vi.fn(),
  getDiameterEphemerisByBody: vi.fn(),
  getDistanceEphemerisByBody: vi.fn(),
}));

describe("ephemeris.aggregates", () => {
  const coordinates: [number, number] = [-74.006, 40.7128];
  const start = new Date("2024-03-21T00:00:00.000Z");
  const end = new Date("2024-03-21T01:00:00.000Z");
  const timezone = "America/New_York";

  describe("getEphemerides", () => {
    it("should fetch all ephemeris types", async () => {
      const {
        getCoordinateEphemerisByBody,
        getAzimuthElevationEphemerisByBody,
        getIlluminationEphemerisByBody,
        getDiameterEphemerisByBody,
        getDistanceEphemerisByBody,
      } = await import("./ephemeris.service");

      // Setup mock return values
      vi.mocked(getCoordinateEphemerisByBody).mockResolvedValue({
        sun: { "2024-03-21T00:00:00.000Z": { longitude: 0, latitude: 0 } },
        moon: { "2024-03-21T00:00:00.000Z": { longitude: 120, latitude: 5 } },
      } as any);

      vi.mocked(getAzimuthElevationEphemerisByBody).mockResolvedValue({
        sun: { "2024-03-21T00:00:00.000Z": { azimuth: 90, elevation: 45 } },
        moon: { "2024-03-21T00:00:00.000Z": { azimuth: 180, elevation: 30 } },
      } as any);

      vi.mocked(getIlluminationEphemerisByBody).mockResolvedValue({
        moon: { "2024-03-21T00:00:00.000Z": { illumination: 0.5 } },
        mercury: { "2024-03-21T00:00:00.000Z": { illumination: 0.8 } },
        venus: { "2024-03-21T00:00:00.000Z": { illumination: 0.9 } },
        mars: { "2024-03-21T00:00:00.000Z": { illumination: 0.95 } },
      } as any);

      vi.mocked(getDiameterEphemerisByBody).mockResolvedValue({
        sun: { "2024-03-21T00:00:00.000Z": { diameter: 0.5334 } },
        moon: { "2024-03-21T00:00:00.000Z": { diameter: 0.5181 } },
      } as any);

      vi.mocked(getDistanceEphemerisByBody).mockResolvedValue({
        sun: { "2024-03-21T00:00:00.000Z": { distance: 1.0, range: 0.0 } },
        mercury: { "2024-03-21T00:00:00.000Z": { distance: 0.5, range: 0.0 } },
        venus: { "2024-03-21T00:00:00.000Z": { distance: 0.7, range: 0.0 } },
        mars: { "2024-03-21T00:00:00.000Z": { distance: 1.5, range: 0.0 } },
      } as any);

      const result = await getEphemerides({
        coordinates,
        start,
        end,
        timezone,
      });

      // Verify all ephemeris types were fetched
      expect(result).toHaveProperty("coordinateEphemerisByBody");
      expect(result).toHaveProperty("azimuthElevationEphemerisByBody");
      expect(result).toHaveProperty("illuminationEphemerisByBody");
      expect(result).toHaveProperty("diameterEphemerisByBody");
      expect(result).toHaveProperty("distanceEphemerisByBody");

      // Verify correct bodies were requested for each type
      expect(getCoordinateEphemerisByBody).toHaveBeenCalledWith(
        expect.objectContaining({
          bodies: expect.arrayContaining([
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
          ]),
          start,
          end,
          timezone,
        })
      );

      expect(getAzimuthElevationEphemerisByBody).toHaveBeenCalledWith(
        expect.objectContaining({
          bodies: ["sun", "moon"],
          coordinates,
          start,
          end,
          timezone,
        })
      );

      expect(getIlluminationEphemerisByBody).toHaveBeenCalledWith(
        expect.objectContaining({
          bodies: ["moon", "mercury", "venus", "mars"],
          coordinates,
          start,
          end,
          timezone,
        })
      );

      expect(getDiameterEphemerisByBody).toHaveBeenCalledWith(
        expect.objectContaining({
          bodies: ["sun", "moon"],
          start,
          end,
          timezone,
        })
      );

      expect(getDistanceEphemerisByBody).toHaveBeenCalledWith(
        expect.objectContaining({
          bodies: ["sun", "mercury", "venus", "mars"],
          start,
          end,
          timezone,
        })
      );
    });

    it("should return properly structured ephemeris data", async () => {
      const {
        getCoordinateEphemerisByBody,
        getAzimuthElevationEphemerisByBody,
        getIlluminationEphemerisByBody,
        getDiameterEphemerisByBody,
        getDistanceEphemerisByBody,
      } = await import("./ephemeris.service");

      const mockCoordinates = {
        sun: { "2024-03-21T00:00:00.000Z": { longitude: 0, latitude: 0 } },
      };
      const mockAzimuthElevation = {
        sun: { "2024-03-21T00:00:00.000Z": { azimuth: 90, elevation: 45 } },
      };
      const mockIllumination = {
        moon: { "2024-03-21T00:00:00.000Z": { illumination: 0.5 } },
      };
      const mockDiameter = {
        sun: { "2024-03-21T00:00:00.000Z": { diameter: 0.5334 } },
      };
      const mockDistance = {
        sun: { "2024-03-21T00:00:00.000Z": { distance: 1.0, range: 0.0 } },
      };

      vi.mocked(getCoordinateEphemerisByBody).mockResolvedValue(
        mockCoordinates as any
      );
      vi.mocked(getAzimuthElevationEphemerisByBody).mockResolvedValue(
        mockAzimuthElevation as any
      );
      vi.mocked(getIlluminationEphemerisByBody).mockResolvedValue(
        mockIllumination as any
      );
      vi.mocked(getDiameterEphemerisByBody).mockResolvedValue(
        mockDiameter as any
      );
      vi.mocked(getDistanceEphemerisByBody).mockResolvedValue(
        mockDistance as any
      );

      const result = await getEphemerides({
        coordinates,
        start,
        end,
        timezone,
      });

      expect(result.coordinateEphemerisByBody).toEqual(mockCoordinates);
      expect(result.azimuthElevationEphemerisByBody).toEqual(
        mockAzimuthElevation
      );
      expect(result.illuminationEphemerisByBody).toEqual(mockIllumination);
      expect(result.diameterEphemerisByBody).toEqual(mockDiameter);
      expect(result.distanceEphemerisByBody).toEqual(mockDistance);
    });

    it("should pass coordinates to location-dependent ephemeris fetchers", async () => {
      const {
        getCoordinateEphemerisByBody,
        getAzimuthElevationEphemerisByBody,
        getIlluminationEphemerisByBody,
        getDiameterEphemerisByBody,
        getDistanceEphemerisByBody,
      } = await import("./ephemeris.service");

      vi.mocked(getCoordinateEphemerisByBody).mockResolvedValue({} as any);
      vi.mocked(getAzimuthElevationEphemerisByBody).mockResolvedValue(
        {} as any
      );
      vi.mocked(getIlluminationEphemerisByBody).mockResolvedValue({} as any);
      vi.mocked(getDiameterEphemerisByBody).mockResolvedValue({} as any);
      vi.mocked(getDistanceEphemerisByBody).mockResolvedValue({} as any);

      const testCoordinates: [number, number] = [-118.2437, 34.0522]; // Los Angeles

      await getEphemerides({
        coordinates: testCoordinates,
        start,
        end,
        timezone,
      });

      // Azimuth/elevation and illumination depend on observer location
      expect(getAzimuthElevationEphemerisByBody).toHaveBeenCalledWith(
        expect.objectContaining({
          coordinates: testCoordinates,
        })
      );

      expect(getIlluminationEphemerisByBody).toHaveBeenCalledWith(
        expect.objectContaining({
          coordinates: testCoordinates,
        })
      );

      // Coordinate ephemeris doesn't use observer coordinates
      expect(getCoordinateEphemerisByBody).toHaveBeenCalledWith(
        expect.not.objectContaining({
          coordinates: expect.anything(),
        })
      );
    });

    it("should pass date range to all ephemeris fetchers", async () => {
      const {
        getCoordinateEphemerisByBody,
        getAzimuthElevationEphemerisByBody,
        getIlluminationEphemerisByBody,
        getDiameterEphemerisByBody,
        getDistanceEphemerisByBody,
      } = await import("./ephemeris.service");

      vi.mocked(getCoordinateEphemerisByBody).mockResolvedValue({} as any);
      vi.mocked(getAzimuthElevationEphemerisByBody).mockResolvedValue(
        {} as any
      );
      vi.mocked(getIlluminationEphemerisByBody).mockResolvedValue({} as any);
      vi.mocked(getDiameterEphemerisByBody).mockResolvedValue({} as any);
      vi.mocked(getDistanceEphemerisByBody).mockResolvedValue({} as any);

      const customStart = new Date("2024-06-21T00:00:00.000Z");
      const customEnd = new Date("2024-06-22T00:00:00.000Z");

      await getEphemerides({
        coordinates,
        start: customStart,
        end: customEnd,
        timezone,
      });

      // All fetchers should receive the same date range
      expect(getCoordinateEphemerisByBody).toHaveBeenCalledWith(
        expect.objectContaining({
          start: customStart,
          end: customEnd,
        })
      );

      expect(getAzimuthElevationEphemerisByBody).toHaveBeenCalledWith(
        expect.objectContaining({
          start: customStart,
          end: customEnd,
        })
      );

      expect(getIlluminationEphemerisByBody).toHaveBeenCalledWith(
        expect.objectContaining({
          start: customStart,
          end: customEnd,
        })
      );

      expect(getDiameterEphemerisByBody).toHaveBeenCalledWith(
        expect.objectContaining({
          start: customStart,
          end: customEnd,
        })
      );

      expect(getDistanceEphemerisByBody).toHaveBeenCalledWith(
        expect.objectContaining({
          start: customStart,
          end: customEnd,
        })
      );
    });

    it("should use timezone for all ephemeris fetchers", async () => {
      const {
        getCoordinateEphemerisByBody,
        getAzimuthElevationEphemerisByBody,
        getIlluminationEphemerisByBody,
        getDiameterEphemerisByBody,
        getDistanceEphemerisByBody,
      } = await import("./ephemeris.service");

      vi.mocked(getCoordinateEphemerisByBody).mockResolvedValue({} as any);
      vi.mocked(getAzimuthElevationEphemerisByBody).mockResolvedValue(
        {} as any
      );
      vi.mocked(getIlluminationEphemerisByBody).mockResolvedValue({} as any);
      vi.mocked(getDiameterEphemerisByBody).mockResolvedValue({} as any);
      vi.mocked(getDistanceEphemerisByBody).mockResolvedValue({} as any);

      const customTimezone = "Europe/London";

      await getEphemerides({
        coordinates,
        start,
        end,
        timezone: customTimezone,
      });

      // All fetchers should use the provided timezone
      expect(getCoordinateEphemerisByBody).toHaveBeenCalledWith(
        expect.objectContaining({
          timezone: customTimezone,
        })
      );

      expect(getAzimuthElevationEphemerisByBody).toHaveBeenCalledWith(
        expect.objectContaining({
          timezone: customTimezone,
        })
      );

      expect(getIlluminationEphemerisByBody).toHaveBeenCalledWith(
        expect.objectContaining({
          timezone: customTimezone,
        })
      );

      expect(getDiameterEphemerisByBody).toHaveBeenCalledWith(
        expect.objectContaining({
          timezone: customTimezone,
        })
      );

      expect(getDistanceEphemerisByBody).toHaveBeenCalledWith(
        expect.objectContaining({
          timezone: customTimezone,
        })
      );
    });
  });
});
