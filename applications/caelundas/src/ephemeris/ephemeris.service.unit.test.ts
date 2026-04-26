import moment from "moment-timezone";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    computeAllEphemerides,
    getAzimuthElevationEphemerisByBody,
    getAzimuthElevationFromEphemeris,
    getCoordinateEphemerisByBody,
    getCoordinateFromEphemeris,
    getDiameterEphemerisByBody,
    getDiameterFromEphemeris,
    getDistanceEphemerisByBody,
    getDistanceFromEphemeris,
    getIlluminationEphemerisByBody,
    getIlluminationFromEphemeris,
} from "./ephemeris.service";

import type {
    AzimuthElevationEphemeris,
    CoordinateEphemeris,
    DiameterEphemeris,
    DistanceEphemeris,
    IlluminationEphemeris,
} from "./ephemeris.types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("sweph", () => ({
  set_ephe_path: vi.fn(),
  constants: {
    SE_GREG_CAL: 1,
    SE_ECL2HOR: 0,
    SE_NODBIT_OSCU: 2,
    SEFLG_SWIEPH: 2,
    SEFLG_SPEED: 256,
    SE_SUN: 0,
    SE_MOON: 1,
    SE_MERCURY: 2,
    SE_VENUS: 3,
    SE_MARS: 4,
    SE_JUPITER: 5,
    SE_SATURN: 6,
    SE_URANUS: 7,
    SE_NEPTUNE: 8,
    SE_PLUTO: 9,
    SE_CHIRON: 15,
    SE_MEAN_APOG: 12,
    SE_CERES: 17,
    SE_PALLAS: 18,
    SE_JUNO: 19,
    SE_VESTA: 20,
    SE_TRUE_NODE: 11,
    SE_OSCU_APOG: 13,
  },
  utc_to_jd: vi.fn().mockReturnValue({
    flag: 0,
    data: [2_460_395.5, 2_460_395.499_306],
    error: "",
  }),
  calc: vi.fn().mockReturnValue({
    flag: 258,
    data: [120.5, -1.2, 1.01, 0, 0, 0],
    error: "",
  }),
  nod_aps_ut: vi.fn().mockReturnValue({
    flag: 258,
    data: {
      ascending: [45, 0, 0, 0, 0, 0],
      descending: [225, 0, 0, 0, 0, 0],
      perihelion: [90, 0, 0, 0, 0, 0],
      aphelion: [270, 0, 0, 0, 0, 0],
    },
    error: "",
  }),
  azalt: vi.fn().mockReturnValue([180, 45, 44.8]),
  pheno_ut: vi.fn().mockReturnValue({
    flag: 258,
    data: [0, 0.75, 0, 0.5, 0, 0],
    error: "",
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStart(): moment.Moment {
  return moment.utc("2024-03-21T00:00:00.000Z");
}

function makeEnd(): moment.Moment {
  return moment.utc("2024-03-21T00:01:00.000Z"); // two minutes → 2 timestamps
}

// ---------------------------------------------------------------------------
// Accessor tests (pure logic, no mocks needed)
// ---------------------------------------------------------------------------

describe("ephemeris.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // #region Accessor: getCoordinateFromEphemeris

  describe("getCoordinateFromEphemeris", () => {
    const ts = "2024-03-21T00:00:00.000Z";
    const ephemeris: CoordinateEphemeris = {
      [ts]: { longitude: 120.5, latitude: -1.2 },
    };

    it("returns longitude for a known timestamp", () => {
      expect(getCoordinateFromEphemeris(ephemeris, ts, "longitude")).toBe(
        120.5,
      );
    });

    it("returns latitude for a known timestamp", () => {
      expect(getCoordinateFromEphemeris(ephemeris, ts, "latitude")).toBe(-1.2);
    });

    it("throws when timestamp is missing", () => {
      expect(() =>
        getCoordinateFromEphemeris(ephemeris, "bad-ts", "longitude"),
      ).toThrow("Missing longitude at bad-ts");
    });
  });

  // #region Accessor: getAzimuthElevationFromEphemeris

  describe("getAzimuthElevationFromEphemeris", () => {
    const ts = "2024-03-21T00:00:00.000Z";
    const ephemeris: AzimuthElevationEphemeris = {
      [ts]: { azimuth: 180, elevation: 44.8 },
    };

    it("returns azimuth for a known timestamp", () => {
      expect(
        getAzimuthElevationFromEphemeris(ephemeris, ts, "azimuth"),
      ).toBe(180);
    });

    it("returns elevation for a known timestamp", () => {
      expect(
        getAzimuthElevationFromEphemeris(ephemeris, ts, "elevation"),
      ).toBe(44.8);
    });

    it("throws when timestamp is missing", () => {
      expect(() =>
        getAzimuthElevationFromEphemeris(ephemeris, "bad-ts", "azimuth"),
      ).toThrow("Missing azimuth at bad-ts");
    });
  });

  // #region Accessor: getIlluminationFromEphemeris

  describe("getIlluminationFromEphemeris", () => {
    const ts = "2024-03-21T00:00:00.000Z";
    const ephemeris: IlluminationEphemeris = {
      [ts]: { illumination: 75 },
    };

    it("returns illumination for a known timestamp", () => {
      expect(getIlluminationFromEphemeris(ephemeris, ts, "illumination")).toBe(
        75,
      );
    });

    it("throws when timestamp is missing", () => {
      expect(() =>
        getIlluminationFromEphemeris(ephemeris, "bad-ts", "illumination"),
      ).toThrow("Missing illumination at bad-ts");
    });
  });

  // #region Accessor: getDistanceFromEphemeris

  describe("getDistanceFromEphemeris", () => {
    const ts = "2024-03-21T00:00:00.000Z";
    const ephemeris: DistanceEphemeris = {
      [ts]: { distance: 1.01 },
    };

    it("returns distance for a known timestamp", () => {
      expect(getDistanceFromEphemeris(ephemeris, ts, "distance")).toBe(1.01);
    });

    it("throws when timestamp is missing", () => {
      expect(() =>
        getDistanceFromEphemeris(ephemeris, "bad-ts", "distance"),
      ).toThrow("Missing distance at bad-ts");
    });
  });

  // #region Accessor: getDiameterFromEphemeris

  describe("getDiameterFromEphemeris", () => {
    const ts = "2024-03-21T00:00:00.000Z";
    const ephemeris: DiameterEphemeris = {
      [ts]: { diameter: 0.5334 },
    };

    it("returns diameter for a known timestamp", () => {
      expect(getDiameterFromEphemeris(ephemeris, ts, "diameter")).toBe(0.5334);
    });

    it("throws when timestamp is missing", () => {
      expect(() =>
        getDiameterFromEphemeris(ephemeris, "bad-ts", "diameter"),
      ).toThrow("Missing diameter at bad-ts");
    });
  });

  // #region getCoordinateEphemerisByBody

  describe("getCoordinateEphemerisByBody", () => {
    it("returns coordinate ephemeris for a planet body", () => {
      const result = getCoordinateEphemerisByBody({
        bodies: ["sun"],
        start: makeStart(),
        end: makeEnd(),
        timezone: "UTC",
      });

      const sunEphemeris = result["sun"];
      expect(sunEphemeris).toBeDefined();
      const timestamps = Object.keys(sunEphemeris ?? {});
      expect(timestamps.length).toBeGreaterThanOrEqual(2);

      const first = sunEphemeris?.[timestamps[0] ?? ""];
      expect(first).toHaveProperty("longitude");
      expect(first).toHaveProperty("latitude");
    });

    it("returns coordinate ephemeris for north lunar node", () => {
      const result = getCoordinateEphemerisByBody({
        bodies: ["north lunar node"],
        start: makeStart(),
        end: makeEnd(),
        timezone: "UTC",
      });

      const nodeEphemeris = result["north lunar node"];
      expect(nodeEphemeris).toBeDefined();
      const keys = Object.keys(nodeEphemeris ?? {});
      expect(keys.length).toBeGreaterThanOrEqual(2);
      // Nodes always have latitude 0
      for (const key of keys) {
        expect(nodeEphemeris?.[key]?.latitude).toBe(0);
      }
    });

    it("returns coordinate ephemeris for south lunar node (longitude + 180)", () => {
      const result = getCoordinateEphemerisByBody({
        bodies: ["south lunar node"],
        start: makeStart(),
        end: makeEnd(),
        timezone: "UTC",
      });

      const nodeEphemeris = result["south lunar node"];
      expect(nodeEphemeris).toBeDefined();
      // All latitudes must be 0 for nodes
      for (const val of Object.values(nodeEphemeris ?? {})) {
        expect(val.latitude).toBe(0);
      }
    });

    it("returns coordinate ephemeris for lunar perigee node", () => {
      const result = getCoordinateEphemerisByBody({
        bodies: ["lunar perigee"],
        start: makeStart(),
        end: makeEnd(),
        timezone: "UTC",
      });

      const nodeEphemeris = result["lunar perigee"];
      expect(nodeEphemeris).toBeDefined();
    });

    it("throws when calc returns a negative flag", async () => {
      const { calc } = await import("sweph");
      vi.mocked(calc).mockReturnValueOnce({
        flag: -1,
        data: [0, 0, 0, 0, 0, 0],
        error: "internal error",
      });

      expect(() =>
        getCoordinateEphemerisByBody({
          bodies: ["sun"],
          start: makeStart(),
          end: makeEnd(),
          timezone: "UTC",
        }),
      ).toThrow("calc failed for sun");
    });
  });

  // #region getAzimuthElevationEphemerisByBody

  describe("getAzimuthElevationEphemerisByBody", () => {
    it("returns azimuth and elevation for sun", () => {
      const result = getAzimuthElevationEphemerisByBody({
        bodies: ["sun"],
        coordinates: [-74.006, 40.7128],
        start: makeStart(),
        end: makeEnd(),
        timezone: "UTC",
      });

      const sunEphemeris = result["sun"];
      expect(sunEphemeris).toBeDefined();
      const timestamps = Object.keys(sunEphemeris ?? {});
      expect(timestamps.length).toBeGreaterThanOrEqual(2);

      const first = sunEphemeris?.[timestamps[0] ?? ""];
      expect(first).toHaveProperty("azimuth", 180);
      expect(first).toHaveProperty("elevation", 44.8);
    });
  });

  // #region getIlluminationEphemerisByBody

  describe("getIlluminationEphemerisByBody", () => {
    it("returns 100 illumination for sun at every timestamp", () => {
      const result = getIlluminationEphemerisByBody({
        bodies: ["sun"],
        coordinates: [-74.006, 40.7128],
        start: makeStart(),
        end: makeEnd(),
        timezone: "UTC",
      });

      const sunEphemeris = result["sun"];
      expect(sunEphemeris).toBeDefined();
      for (const val of Object.values(sunEphemeris ?? {})) {
        expect(val.illumination).toBe(100);
      }
    });

    it("returns pheno_ut phase × 100 for moon", () => {
      const result = getIlluminationEphemerisByBody({
        bodies: ["moon"],
        coordinates: [-74.006, 40.7128],
        start: makeStart(),
        end: makeEnd(),
        timezone: "UTC",
      });

      const moonEphemeris = result["moon"];
      expect(moonEphemeris).toBeDefined();
      // pheno_ut mock returns data[1] = 0.75 → illumination = 75
      for (const val of Object.values(moonEphemeris ?? {})) {
        expect(val.illumination).toBe(75);
      }
    });
  });

  // #region getDiameterEphemerisByBody

  describe("getDiameterEphemerisByBody", () => {
    it("returns diameter from pheno_ut data[3] for sun", () => {
      const result = getDiameterEphemerisByBody({
        bodies: ["sun"],
        start: makeStart(),
        end: makeEnd(),
        timezone: "UTC",
      });

      const sunEphemeris = result["sun"];
      expect(sunEphemeris).toBeDefined();
      // pheno_ut mock returns data[3] = 0.5
      for (const val of Object.values(sunEphemeris ?? {})) {
        expect(val.diameter).toBe(0.5);
      }
    });
  });

  // #region getDistanceEphemerisByBody

  describe("getDistanceEphemerisByBody", () => {
    it("returns distance from calc data[2]", () => {
      const result = getDistanceEphemerisByBody({
        bodies: ["sun"],
        start: makeStart(),
        end: makeEnd(),
        timezone: "UTC",
      });

      const sunEphemeris = result["sun"];
      expect(sunEphemeris).toBeDefined();
      // calc mock returns data[2] = 1.01
      for (const val of Object.values(sunEphemeris ?? {})) {
        expect(val.distance).toBe(1.01);
      }
    });
  });

  // #region computeAllEphemerides

  describe("computeAllEphemerides", () => {
    it("returns all five ephemeris types", () => {
      const result = computeAllEphemerides({
        coordinateBodies: ["sun", "moon"],
        azimuthElevationBodies: ["sun", "moon"],
        illuminationBodies: ["sun", "moon"],
        diameterBodies: ["sun", "moon"],
        distanceBodies: ["sun"],
        coordinates: [-74.006, 40.7128],
        start: makeStart(),
        end: makeEnd(),
      });

      expect(result).toHaveProperty("coordinateEphemerisByBody");
      expect(result).toHaveProperty("azimuthElevationEphemerisByBody");
      expect(result).toHaveProperty("illuminationEphemerisByBody");
      expect(result).toHaveProperty("diameterEphemerisByBody");
      expect(result).toHaveProperty("distanceEphemerisByBody");
    });

    it("populates coordinate ephemeris for all requested bodies", () => {
      const result = computeAllEphemerides({
        coordinateBodies: ["sun", "moon"],
        azimuthElevationBodies: ["sun"],
        illuminationBodies: ["sun"],
        diameterBodies: ["sun"],
        distanceBodies: ["sun"],
        coordinates: [-74.006, 40.7128],
        start: makeStart(),
        end: makeEnd(),
      });

      expect(result.coordinateEphemerisByBody["sun"]).toBeDefined();
      expect(result.coordinateEphemerisByBody["moon"]).toBeDefined();
    });

    it("sets sun illumination to 100 in single-pass computation", () => {
      const result = computeAllEphemerides({
        coordinateBodies: ["sun"],
        azimuthElevationBodies: ["sun"],
        illuminationBodies: ["sun"],
        diameterBodies: ["sun"],
        distanceBodies: ["sun"],
        coordinates: [-74.006, 40.7128],
        start: makeStart(),
        end: makeEnd(),
      });

      const illumination = result.illuminationEphemerisByBody["sun"];
      expect(illumination).toBeDefined();
      for (const val of Object.values(illumination ?? {})) {
        expect(val.illumination).toBe(100);
      }
    });

    it("skips azimuth/illumination/diameter/distance entries when not requested", () => {
      const result = computeAllEphemerides({
        coordinateBodies: ["sun"],
        azimuthElevationBodies: [],
        illuminationBodies: [],
        diameterBodies: [],
        distanceBodies: [],
        coordinates: [-74.006, 40.7128],
        start: makeStart(),
        end: makeEnd(),
      });

      expect(Object.keys(result.azimuthElevationEphemerisByBody)).toHaveLength(
        0,
      );
      expect(Object.keys(result.illuminationEphemerisByBody)).toHaveLength(0);
      expect(Object.keys(result.diameterEphemerisByBody)).toHaveLength(0);
      expect(Object.keys(result.distanceEphemerisByBody)).toHaveLength(0);
    });

    it("handles node bodies in coordinateBodies (no SE constant needed)", () => {
      const result = computeAllEphemerides({
        coordinateBodies: ["north lunar node", "south lunar node"],
        azimuthElevationBodies: [],
        illuminationBodies: [],
        diameterBodies: [],
        distanceBodies: [],
        coordinates: [-74.006, 40.7128],
        start: makeStart(),
        end: makeEnd(),
      });

      const north = result.coordinateEphemerisByBody["north lunar node"];
      const south = result.coordinateEphemerisByBody["south lunar node"];
      expect(north).toBeDefined();
      expect(south).toBeDefined();
      for (const val of Object.values(north ?? {})) {
        expect(val.latitude).toBe(0);
      }
    });
  });
});
