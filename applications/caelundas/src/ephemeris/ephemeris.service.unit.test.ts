import moment from "moment-timezone";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAzimuthElevationEphemeris,
  getAzimuthElevationEphemerisByBody,
  getCoordinateEphemerisByBody,
  getCoordinatesEphemeris,
  getDiameterEphemeris,
  getDiameterEphemerisByBody,
  getDistanceEphemeris,
  getDistanceEphemerisByBody,
  getIlluminationEphemeris,
  getIlluminationEphemerisByBody,
  getNodeCoordinatesEphemeris,
  getOrbitEphemeris,
} from "./ephemeris.service";

// Mock dependencies
vi.mock("../database.utilities", () => ({
  upsertEphemerisValues: vi.fn(),
  getEphemerisRecords: vi.fn(),
}));

vi.mock("../fetch.utilities", () => ({
  fetchWithRetry: vi.fn(),
}));

describe("ephemeris.service", () => {
  const start = new Date("2024-03-21T00:00:00.000Z");
  const end = new Date("2024-03-21T01:00:00.000Z");
  const timezone = "America/New_York";
  const coordinates: [number, number] = [-74.006, 40.7128];

  // Reset and setup default mock behavior before each test
  beforeEach(async () => {
    const { getEphemerisRecords } = await import("../database.utilities");
    vi.mocked(getEphemerisRecords).mockResolvedValue([]);
  });

  describe("getCoordinatesEphemeris", () => {
    it("should parse coordinate ephemeris data correctly", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockResponse = `$$SOE
2024-Mar-21 00:00    120.5  -5.2
2024-Mar-21 00:01    120.6  -5.1
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

      const result = await getCoordinatesEphemeris({
        body: "sun",
        start,
        end,
        timezone,
      });

      expect(result).toBeDefined();
      expect(Object.keys(result)).toHaveLength(2);
      const firstKey = Object.keys(result)[0];
      expect(result[firstKey]).toHaveProperty("longitude");
      expect(result[firstKey]).toHaveProperty("latitude");
      expect(result[firstKey].longitude).toBe(120.5);
      expect(result[firstKey].latitude).toBe(-5.2);
    });

    it("should handle planets, asteroids, and comets", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockResponse = `$$SOE
2024-Mar-21 00:00    120.5  -5.2
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

      // Test planet
      await getCoordinatesEphemeris({
        body: "mars",
        start,
        end,
        timezone,
      });

      // Test asteroid
      await getCoordinatesEphemeris({
        body: "chiron",
        start,
        end,
        timezone,
      });

      // Test comet
      await getCoordinatesEphemeris({
        body: "halley",
        start,
        end,
        timezone,
      });

      expect(fetchWithRetry).toHaveBeenCalledTimes(3);
    });

    it("should use database cache when available", async () => {
      const { getEphemerisRecords } = await import("../database.utilities");
      const { fetchWithRetry } = await import("../fetch.utilities");

      const mockRecords = [
        {
          body: "sun" as const,
          timestamp: moment.utc("2024-03-21T00:00:00.000Z").toDate(),
          longitude: 0,
          latitude: 0,
        },
        {
          body: "sun" as const,
          timestamp: moment.utc("2024-03-21T00:01:00.000Z").toDate(),
          longitude: 0.1,
          latitude: 0,
        },
      ];

      vi.mocked(getEphemerisRecords).mockResolvedValue(mockRecords);

      const result = await getCoordinatesEphemeris({
        body: "sun",
        start,
        end: moment.utc("2024-03-21T00:01:00.000Z").toDate(),
        timezone,
      });

      expect(result).toBeDefined();
      expect(fetchWithRetry).not.toHaveBeenCalled();
      expect(Object.keys(result)).toHaveLength(2);
    });
  });

  describe("getNodeCoordinatesEphemeris", () => {
    it("should calculate north lunar node coordinates from orbit data", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockOrbitResponse = `$$SOE
 2024-Mar-21 00:00:00.0000   EC= 5.456093559467E-02 QR= 3.633092318208E+05 IN= 5.145396332510E+00
   OM= 1.445250000000E+02 W = 7.500000000000E+01 Tp=  2460397.100000000000000
   N = 1.336160000000E+01 MA= 1.512000000000E+02 TA= 1.533400000000E+02
   A = 3.844000000000E+05 AD= 4.054907681792E+05 PR= 2.695160000000E+01
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockOrbitResponse);

      const result = await getNodeCoordinatesEphemeris({
        node: "north lunar node",
        start,
        end,
        timezone,
      });

      expect(result).toBeDefined();
      const firstKey = Object.keys(result)[0];
      expect(result[firstKey]).toHaveProperty("longitude");
      expect(result[firstKey]).toHaveProperty("latitude");
      expect(result[firstKey].latitude).toBe(0); // Nodes always have 0 latitude
      expect(result[firstKey].longitude).toBe(144.525); // OM value
    });

    it("should calculate south lunar node coordinates (opposite of north)", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockOrbitResponse = `$$SOE
 2024-Mar-21 00:00:00.0000   EC= 5.456093559467E-02 QR= 3.633092318208E+05 IN= 5.145396332510E+00
   OM= 1.445250000000E+02 W = 7.500000000000E+01 Tp=  2460397.100000000000000
   N = 1.336160000000E+01 MA= 1.512000000000E+02 TA= 1.533400000000E+02
   A = 3.844000000000E+05 AD= 4.054907681792E+05 PR= 2.695160000000E+01
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockOrbitResponse);

      const result = await getNodeCoordinatesEphemeris({
        node: "south lunar node",
        start,
        end,
        timezone,
      });

      const firstKey = Object.keys(result)[0];
      expect(result[firstKey].longitude).toBe(324.525); // OM + 180
      expect(result[firstKey].latitude).toBe(0);
    });

    it("should calculate lunar perigee coordinates (OM + W)", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockOrbitResponse = `$$SOE
 2024-Mar-21 00:00:00.0000   EC= 5.456093559467E-02 QR= 3.633092318208E+05 IN= 5.145396332510E+00
   OM= 1.445250000000E+02 W = 7.500000000000E+01 Tp=  2460397.100000000000000
   N = 1.336160000000E+01 MA= 1.512000000000E+02 TA= 1.533400000000E+02
   A = 3.844000000000E+05 AD= 4.054907681792E+05 PR= 2.695160000000E+01
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockOrbitResponse);

      const result = await getNodeCoordinatesEphemeris({
        node: "lunar perigee",
        start,
        end,
        timezone,
      });

      const firstKey = Object.keys(result)[0];
      expect(result[firstKey].longitude).toBeCloseTo(219.525, 2); // OM + W
      expect(result[firstKey].latitude).toBe(0);
    });

    it("should calculate lunar apogee coordinates (OM + W + 180)", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockOrbitResponse = `$$SOE
 2024-Mar-21 00:00:00.0000   EC= 5.456093559467E-02 QR= 3.633092318208E+05 IN= 5.145396332510E+00
   OM= 1.445250000000E+02 W = 7.500000000000E+01 Tp=  2460397.100000000000000
   N = 1.336160000000E+01 MA= 1.512000000000E+02 TA= 1.533400000000E+02
   A = 3.844000000000E+05 AD= 4.054907681792E+05 PR= 2.695160000000E+01
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockOrbitResponse);

      const result = await getNodeCoordinatesEphemeris({
        node: "lunar apogee",
        start,
        end,
        timezone,
      });

      const firstKey = Object.keys(result)[0];
      expect(result[firstKey].longitude).toBeCloseTo(39.525, 2); // OM + W + 180
      expect(result[firstKey].latitude).toBe(0);
    });
  });

  describe("getCoordinateEphemerisByBody", () => {
    it("should fetch coordinate ephemeris for multiple bodies", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockResponse = `$$SOE
2024-Mar-21 00:00    120.5  -5.2
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

      const result = await getCoordinateEphemerisByBody({
        bodies: ["sun", "moon", "mars"],
        start,
        end,
        timezone,
      });

      expect(result).toHaveProperty("sun");
      expect(result).toHaveProperty("moon");
      expect(result).toHaveProperty("mars");
      expect(Object.keys(result)).toHaveLength(3);
    });

    it("should handle lunar nodes correctly", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockOrbitResponse = `$$SOE
 2024-Mar-21 00:00:00.0000   EC= 5.456093559467E-02 QR= 3.633092318208E+05 IN= 5.145396332510E+00
   OM= 1.445250000000E+02 W = 7.500000000000E+01 Tp=  2460397.100000000000000
   N = 1.336160000000E+01 MA= 1.512000000000E+02 TA= 1.533400000000E+02
   A = 3.844000000000E+05 AD= 4.054907681792E+05 PR= 2.695160000000E+01
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockOrbitResponse);

      const result = await getCoordinateEphemerisByBody({
        bodies: ["north lunar node", "lunar perigee"],
        start,
        end,
        timezone,
      });

      expect(result).toHaveProperty("north lunar node");
      expect(result).toHaveProperty("lunar perigee");
    });
  });

  describe("getAzimuthElevationEphemeris", () => {
    it("should parse azimuth elevation data correctly", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockResponse = `$$SOE
 2024-Mar-21 00:00   90.5  45.2
 2024-Mar-21 00:01   91.0  46.0
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

      const result = await getAzimuthElevationEphemeris({
        body: "sun",
        coordinates,
        start,
        end,
        timezone,
      });

      expect(result).toBeDefined();
      const firstKey = Object.keys(result)[0];
      expect(result[firstKey]).toHaveProperty("azimuth");
      expect(result[firstKey]).toHaveProperty("elevation");
      expect(result[firstKey].azimuth).toBe(90.5);
      expect(result[firstKey].elevation).toBe(45.2);
    });

    it("should use coordinates for observer location", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockResponse = `$$SOE
 2024-Mar-21 00:00   90.5  45.2
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

      await getAzimuthElevationEphemeris({
        body: "moon",
        coordinates: [-118.2437, 34.0522], // Los Angeles
        start,
        end,
        timezone,
      });

      expect(fetchWithRetry).toHaveBeenCalledWith(
        expect.stringContaining("SITE_COORD")
      );
    });
  });

  describe("getAzimuthElevationEphemerisByBody", () => {
    it("should fetch azimuth elevation for multiple bodies", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockResponse = `$$SOE
 2024-Mar-21 00:00   90.5  45.2
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

      const result = await getAzimuthElevationEphemerisByBody({
        bodies: ["sun", "moon"],
        coordinates,
        start,
        end,
        timezone,
      });

      expect(result).toHaveProperty("sun");
      expect(result).toHaveProperty("moon");
      expect(Object.keys(result)).toHaveLength(2);
    });
  });

  describe("getIlluminationEphemeris", () => {
    it("should parse illumination fraction correctly", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockResponse = `$$SOE
 2024-Mar-21 00:00   0.567
 2024-Mar-21 00:01   0.568
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

      const result = await getIlluminationEphemeris({
        body: "moon",
        coordinates,
        start,
        end,
        timezone,
      });

      expect(result).toBeDefined();
      const firstKey = Object.keys(result)[0];
      expect(result[firstKey]).toHaveProperty("illumination");
      expect(result[firstKey].illumination).toBe(0.567);
    });

    it("should handle different illumination bodies", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockResponse = `$$SOE
 2024-Mar-21 00:00   0.999
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

      await getIlluminationEphemeris({
        body: "venus",
        coordinates,
        start,
        end,
        timezone,
      });

      await getIlluminationEphemeris({
        body: "mercury",
        coordinates,
        start,
        end,
        timezone,
      });

      await getIlluminationEphemeris({
        body: "mars",
        coordinates,
        start,
        end,
        timezone,
      });

      expect(fetchWithRetry).toHaveBeenCalledTimes(3);
    });
  });

  describe("getIlluminationEphemerisByBody", () => {
    it("should fetch illumination for multiple bodies", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockResponse = `$$SOE
 2024-Mar-21 00:00   0.567
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

      const result = await getIlluminationEphemerisByBody({
        bodies: ["moon", "venus", "mercury"],
        coordinates,
        start,
        end,
        timezone,
      });

      expect(result).toHaveProperty("moon");
      expect(result).toHaveProperty("venus");
      expect(result).toHaveProperty("mercury");
      expect(Object.keys(result)).toHaveLength(3);
    });
  });

  describe("getDiameterEphemeris", () => {
    it("should parse angular diameter and convert from arcseconds", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockResponse = `$$SOE
 2024-Mar-21 00:00   1920.5
 2024-Mar-21 00:01   1920.6
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

      const result = await getDiameterEphemeris({
        body: "sun",
        start,
        end,
        timezone,
      });

      expect(result).toBeDefined();
      const firstKey = Object.keys(result)[0];
      expect(result[firstKey]).toHaveProperty("diameter");
      // 1920.5 arcseconds / 3600 arcseconds per degree
      expect(result[firstKey].diameter).toBeCloseTo(0.53347, 4);
    });

    it("should handle sun and moon bodies", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockResponse = `$$SOE
 2024-Mar-21 00:00   1920.5
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

      await getDiameterEphemeris({
        body: "sun",
        start,
        end,
        timezone,
      });

      await getDiameterEphemeris({
        body: "moon",
        start,
        end,
        timezone,
      });

      expect(fetchWithRetry).toHaveBeenCalledTimes(2);
    });
  });

  describe("getDiameterEphemerisByBody", () => {
    it("should fetch diameter for multiple bodies", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockResponse = `$$SOE
 2024-Mar-21 00:00   1920.5
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

      const result = await getDiameterEphemerisByBody({
        bodies: ["sun", "moon"],
        start,
        end,
        timezone,
      });

      expect(result).toHaveProperty("sun");
      expect(result).toHaveProperty("moon");
      expect(Object.keys(result)).toHaveLength(2);
    });
  });

  describe("getDistanceEphemeris", () => {
    it("should parse distance correctly", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockResponse = `$$SOE
 2024-Mar-21 00:00   1.0001  0.0005
 2024-Mar-21 00:01   1.0002  0.0006
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

      const result = await getDistanceEphemeris({
        body: "sun",
        start,
        end,
        timezone,
      });

      expect(result).toBeDefined();
      const firstKey = Object.keys(result)[0];
      expect(result[firstKey]).toHaveProperty("distance");
      expect(result[firstKey].distance).toBe(1.0001);
    });

    it("should handle sun and inner planets", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockResponse = `$$SOE
 2024-Mar-21 00:00   1.0001  0.0005
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

      await getDistanceEphemeris({
        body: "sun",
        start,
        end,
        timezone,
      });

      await getDistanceEphemeris({
        body: "venus",
        start,
        end,
        timezone,
      });

      await getDistanceEphemeris({
        body: "mercury",
        start,
        end,
        timezone,
      });

      await getDistanceEphemeris({
        body: "mars",
        start,
        end,
        timezone,
      });

      expect(fetchWithRetry).toHaveBeenCalledTimes(4);
    });
  });

  describe("getDistanceEphemerisByBody", () => {
    it("should fetch distance for multiple bodies", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockResponse = `$$SOE
 2024-Mar-21 00:00   1.0001  0.0005
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

      const result = await getDistanceEphemerisByBody({
        bodies: ["sun", "venus", "mercury"],
        start,
        end,
        timezone,
      });

      expect(result).toHaveProperty("sun");
      expect(result).toHaveProperty("venus");
      expect(result).toHaveProperty("mercury");
      expect(Object.keys(result)).toHaveLength(3);
    });
  });

  describe("getOrbitEphemeris", () => {
    it("should parse orbital elements correctly", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockOrbitResponse = `$$SOE
 2024-Mar-21 00:00:00.0000   EC= 5.456093559467E-02 QR= 3.633092318208E+05 IN= 5.145396332510E+00
   OM= 1.445250000000E+02 W = 7.500000000000E+01 Tp=  2460397.100000000000000
   N = 1.336160000000E+01 MA= 1.512000000000E+02 TA= 1.533400000000E+02
   A = 3.844000000000E+05 AD= 4.054907681792E+05 PR= 2.695160000000E+01
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockOrbitResponse);

      const result = await getOrbitEphemeris({
        body: "moon",
        start,
        end,
        timezone,
      });

      expect(result).toBeDefined();
      const firstKey = Object.keys(result)[0];
      expect(result[firstKey]).toHaveProperty("eccentricity");
      expect(result[firstKey]).toHaveProperty("periapsisDistance");
      expect(result[firstKey]).toHaveProperty("inclination");
      expect(result[firstKey]).toHaveProperty("longitudeOfAscendingNode");
      expect(result[firstKey]).toHaveProperty("argumentOfPerifocus");
      expect(result[firstKey]).toHaveProperty("timeOfPeriapsis");
      expect(result[firstKey]).toHaveProperty("meanMotion");
      expect(result[firstKey]).toHaveProperty("meanAnomaly");
      expect(result[firstKey]).toHaveProperty("trueAnomaly");
      expect(result[firstKey]).toHaveProperty("semiMajorAxis");
      expect(result[firstKey]).toHaveProperty("apoapsisDistance");
      expect(result[firstKey]).toHaveProperty("siderealOrbitPeriod");

      expect(result[firstKey].eccentricity).toBeCloseTo(0.05456, 4);
      expect(result[firstKey].inclination).toBeCloseTo(5.1454, 4);
      expect(result[firstKey].longitudeOfAscendingNode).toBe(144.525);
      expect(result[firstKey].argumentOfPerifocus).toBe(75.0);
    });

    it("should handle scientific notation in orbital elements", async () => {
      const { fetchWithRetry } = await import("../fetch.utilities");
      const mockOrbitResponse = `$$SOE
 2024-Mar-21 00:00:00.0000   EC= 5.456093559467E-02 QR= 3.633092318208E+05 IN= 5.145396332510E+00
   OM= 1.445250000000E+02 W = 7.500000000000E+01 Tp=  2.460397100000E+06
   N = 1.336160000000E+01 MA= 1.512000000000E+02 TA= 1.533400000000E+02
   A = 3.844000000000E+05 AD= 4.054907681792E+05 PR= 2.695160000000E+01
$$EOE`;

      vi.mocked(fetchWithRetry).mockResolvedValue(mockOrbitResponse);

      const result = await getOrbitEphemeris({
        body: "moon",
        start,
        end,
        timezone,
      });

      const firstKey = Object.keys(result)[0];
      expect(result[firstKey].timeOfPeriapsis).toBeCloseTo(2460397.1, 1);
    });
  });
});
