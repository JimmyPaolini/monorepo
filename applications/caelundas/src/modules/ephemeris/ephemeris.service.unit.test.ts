import { MathService } from "@caelundas/src/modules/math/math.service";
import { Test, type TestingModule } from "@nestjs/testing";
import moment, { type Moment } from "moment-timezone";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { EphemerisService } from "./ephemeris.service";

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
  azalt: vi.fn().mockReturnValue([180, 45, 44.8]),
  calc: vi.fn().mockReturnValue({
    data: [120.5, -1.2, 1.01, 0, 0, 0],
    error: "",
    flag: 258,
  }),
  constants: {
    SE_CERES: 17,
    SE_CHIRON: 15,
    SE_ECL2HOR: 0,
    SE_GREG_CAL: 1,
    SE_JUNO: 19,
    SE_JUPITER: 5,
    SE_MARS: 4,
    SE_MEAN_APOG: 12,
    SE_MERCURY: 2,
    SE_MOON: 1,
    SE_NEPTUNE: 8,
    SE_NODBIT_OSCU: 2,
    SE_OSCU_APOG: 13,
    SE_PALLAS: 18,
    SE_PLUTO: 9,
    SE_SATURN: 6,
    SE_SUN: 0,
    SE_TRUE_NODE: 11,
    SE_URANUS: 7,
    SE_VENUS: 3,
    SE_VESTA: 20,
    SEFLG_SPEED: 256,
    SEFLG_SWIEPH: 2,
  },
  nod_aps_ut: vi.fn().mockReturnValue({
    data: {
      aphelion: [270, 0, 0, 0, 0, 0],
      ascending: [45, 0, 0, 0, 0, 0],
      descending: [225, 0, 0, 0, 0, 0],
      perihelion: [90, 0, 0, 0, 0, 0],
    },
    error: "",
    flag: 258,
  }),
  pheno_ut: vi.fn().mockReturnValue({
    data: [0, 0.75, 0, 0.5, 0, 0],
    error: "",
    flag: 258,
  }),
  set_ephe_path: vi.fn(),
  utc_to_jd: vi.fn().mockReturnValue({
    data: [2_460_395.5, 2_460_395.499_306],
    error: "",
    flag: 0,
  }),
}));

// ---------------------------------------------------------------------------
// Accessor tests (pure logic, no mocks needed)
// ---------------------------------------------------------------------------

describe("EphemerisService", () => {
  function makeStart(): Moment {
    return moment.utc("2024-03-21T00:00:00.000Z");
  }

  function makeEnd(): Moment {
    return moment.utc("2024-03-21T00:01:00.000Z"); // two minutes → 2 timestamps
  }

  let service: EphemerisService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EphemerisService, MathService],
    }).compile();
    service = await module.resolve<EphemerisService>(EphemerisService);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // #region Accessor: getCoordinateFromEphemeris

  describe("getCoordinateFromEphemeris", () => {
    const ts = "2024-03-21T00:00:00.000Z";
    const ephemeris: CoordinateEphemeris = {
      [ts]: { latitude: -1.2, longitude: 120.5 },
    };

    it("returns longitude for a known timestamp", () => {
      expect(
        service.getCoordinateFromEphemeris(ephemeris, ts, "longitude"),
      ).toBe(120.5);
    });

    it("returns latitude for a known timestamp", () => {
      expect(
        service.getCoordinateFromEphemeris(ephemeris, ts, "latitude"),
      ).toBe(-1.2);
    });

    it("throws when timestamp is missing", () => {
      expect(() =>
        service.getCoordinateFromEphemeris(ephemeris, "bad-ts", "longitude"),
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
        service.getAzimuthElevationFromEphemeris(ephemeris, ts, "azimuth"),
      ).toBe(180);
    });

    it("returns elevation for a known timestamp", () => {
      expect(
        service.getAzimuthElevationFromEphemeris(ephemeris, ts, "elevation"),
      ).toBe(44.8);
    });

    it("throws when timestamp is missing", () => {
      expect(() =>
        service.getAzimuthElevationFromEphemeris(
          ephemeris,
          "bad-ts",
          "azimuth",
        ),
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
      expect(
        service.getIlluminationFromEphemeris(ephemeris, ts, "illumination"),
      ).toBe(75);
    });

    it("throws when timestamp is missing", () => {
      expect(() =>
        service.getIlluminationFromEphemeris(
          ephemeris,
          "bad-ts",
          "illumination",
        ),
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
      expect(service.getDistanceFromEphemeris(ephemeris, ts, "distance")).toBe(
        1.01,
      );
    });

    it("throws when timestamp is missing", () => {
      expect(() =>
        service.getDistanceFromEphemeris(ephemeris, "bad-ts", "distance"),
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
      expect(service.getDiameterFromEphemeris(ephemeris, ts, "diameter")).toBe(
        0.5334,
      );
    });

    it("throws when timestamp is missing", () => {
      expect(() =>
        service.getDiameterFromEphemeris(ephemeris, "bad-ts", "diameter"),
      ).toThrow("Missing diameter at bad-ts");
    });
  });

  // #region getCoordinateEphemerisByBody

  describe("getCoordinateEphemerisByBody", () => {
    it("returns coordinate ephemeris for a planet body", () => {
      const result = service.getCoordinateEphemerisByBody({
        bodies: ["sun"],
        end: makeEnd(),
        start: makeStart(),
        timezone: "UTC",
      });

      const sunEphemeris = result.sun;
      expect(sunEphemeris).toBeDefined();
      const timestamps = Object.keys(sunEphemeris);
      expect(timestamps.length).toBeGreaterThanOrEqual(2);

      const first = sunEphemeris[timestamps[0] ?? ""];
      expect(first).toHaveProperty("longitude");
      expect(first).toHaveProperty("latitude");
    });

    it("returns coordinate ephemeris for north lunar node", () => {
      const result = service.getCoordinateEphemerisByBody({
        bodies: ["north lunar node"],
        end: makeEnd(),
        start: makeStart(),
        timezone: "UTC",
      });

      const nodeEphemeris = result["north lunar node"];
      expect(nodeEphemeris).toBeDefined();
      const keys = Object.keys(nodeEphemeris);
      expect(keys.length).toBeGreaterThanOrEqual(2);
      // Nodes always have latitude 0
      for (const key of keys) {
        expect(nodeEphemeris[key]?.latitude).toBe(0);
      }
    });

    it("returns coordinate ephemeris for south lunar node (longitude + 180)", () => {
      const result = service.getCoordinateEphemerisByBody({
        bodies: ["south lunar node"],
        end: makeEnd(),
        start: makeStart(),
        timezone: "UTC",
      });

      const nodeEphemeris = result["south lunar node"];
      expect(nodeEphemeris).toBeDefined();
      // All latitudes must be 0 for nodes
      for (const val of Object.values(nodeEphemeris)) {
        expect(val.latitude).toBe(0);
      }
    });

    it("returns coordinate ephemeris for lunar perigee node", () => {
      const result = service.getCoordinateEphemerisByBody({
        bodies: ["lunar perigee"],
        end: makeEnd(),
        start: makeStart(),
        timezone: "UTC",
      });

      const nodeEphemeris = result["lunar perigee"];
      expect(nodeEphemeris).toBeDefined();
    });

    it("throws when calc returns a negative flag", async () => {
      const { calc } = await import("sweph");
      vi.mocked(calc).mockReturnValueOnce({
        data: [0, 0, 0, 0, 0, 0],
        error: "internal error",
        flag: -1,
      });

      expect(() =>
        service.getCoordinateEphemerisByBody({
          bodies: ["sun"],
          end: makeEnd(),
          start: makeStart(),
          timezone: "UTC",
        }),
      ).toThrow("calc failed for sun");
    });
  });

  // #region getAzimuthElevationEphemerisByBody

  describe("getAzimuthElevationEphemerisByBody", () => {
    it("returns azimuth and elevation for sun", () => {
      const result = service.getAzimuthElevationEphemerisByBody({
        bodies: ["sun"],
        coordinates: [-74.006, 40.7128],
        end: makeEnd(),
        start: makeStart(),
        timezone: "UTC",
      });

      const sunEphemeris = result.sun;
      expect(sunEphemeris).toBeDefined();
      const timestamps = Object.keys(sunEphemeris);
      expect(timestamps.length).toBeGreaterThanOrEqual(2);

      const first = sunEphemeris[timestamps[0] ?? ""];
      expect(first).toHaveProperty("azimuth", 180);
      expect(first).toHaveProperty("elevation", 44.8);
    });
  });

  // #region getIlluminationEphemerisByBody

  describe("getIlluminationEphemerisByBody", () => {
    it("returns 100 illumination for sun at every timestamp", () => {
      const result = service.getIlluminationEphemerisByBody({
        bodies: ["sun"],
        coordinates: [-74.006, 40.7128],
        end: makeEnd(),
        start: makeStart(),
        timezone: "UTC",
      });

      const sunEphemeris = result.sun;
      expect(sunEphemeris).toBeDefined();
      for (const val of Object.values(sunEphemeris)) {
        expect(val.illumination).toBe(100);
      }
    });

    it("returns pheno_ut phase × 100 for moon", () => {
      const result = service.getIlluminationEphemerisByBody({
        bodies: ["moon"],
        coordinates: [-74.006, 40.7128],
        end: makeEnd(),
        start: makeStart(),
        timezone: "UTC",
      });

      const moonEphemeris = result.moon;
      expect(moonEphemeris).toBeDefined();
      // pheno_ut mock returns data[1] = 0.75 → illumination = 75
      for (const val of Object.values(moonEphemeris)) {
        expect(val.illumination).toBe(75);
      }
    });
  });

  // #region getDiameterEphemerisByBody

  describe("getDiameterEphemerisByBody", () => {
    it("returns diameter from pheno_ut data[3] for sun", () => {
      const result = service.getDiameterEphemerisByBody({
        bodies: ["sun"],
        end: makeEnd(),
        start: makeStart(),
        timezone: "UTC",
      });

      const sunEphemeris = result.sun;
      expect(sunEphemeris).toBeDefined();
      // pheno_ut mock returns data[3] = 0.5
      for (const val of Object.values(sunEphemeris)) {
        expect(val.diameter).toBe(0.5);
      }
    });
  });

  // #region getDistanceEphemerisByBody

  describe("getDistanceEphemerisByBody", () => {
    it("returns distance from calc data[2]", () => {
      const result = service.getDistanceEphemerisByBody({
        bodies: ["sun"],
        end: makeEnd(),
        start: makeStart(),
        timezone: "UTC",
      });

      const sunEphemeris = result.sun;
      expect(sunEphemeris).toBeDefined();
      // calc mock returns data[2] = 1.01
      for (const val of Object.values(sunEphemeris)) {
        expect(val.distance).toBe(1.01);
      }
    });
  });

  // #region computeAllEphemerides

  describe("computeAllEphemerides", () => {
    it("returns all five ephemeris types", () => {
      const result = service.computeAllEphemerides({
        azimuthElevationBodies: ["sun", "moon"],
        coordinateBodies: ["sun", "moon"],
        coordinates: [-74.006, 40.7128],
        diameterBodies: ["sun", "moon"],
        distanceBodies: ["sun"],
        end: makeEnd(),
        illuminationBodies: ["sun", "moon"],
        start: makeStart(),
      });

      expect(result).toHaveProperty("coordinateEphemerisByBody");
      expect(result).toHaveProperty("azimuthElevationEphemerisByBody");
      expect(result).toHaveProperty("illuminationEphemerisByBody");
      expect(result).toHaveProperty("diameterEphemerisByBody");
      expect(result).toHaveProperty("distanceEphemerisByBody");
    });

    it("populates coordinate ephemeris for all requested bodies", () => {
      const result = service.computeAllEphemerides({
        azimuthElevationBodies: ["sun"],
        coordinateBodies: ["sun", "moon"],
        coordinates: [-74.006, 40.7128],
        diameterBodies: ["sun"],
        distanceBodies: ["sun"],
        end: makeEnd(),
        illuminationBodies: ["sun"],
        start: makeStart(),
      });

      expect(result.coordinateEphemerisByBody.sun).toBeDefined();
      expect(result.coordinateEphemerisByBody.moon).toBeDefined();
    });

    it("sets sun illumination to 100 in single-pass computation", () => {
      const result = service.computeAllEphemerides({
        azimuthElevationBodies: ["sun"],
        coordinateBodies: ["sun"],
        coordinates: [-74.006, 40.7128],
        diameterBodies: ["sun"],
        distanceBodies: ["sun"],
        end: makeEnd(),
        illuminationBodies: ["sun"],
        start: makeStart(),
      });

      const illumination = result.illuminationEphemerisByBody.sun;
      expect(illumination).toBeDefined();
      for (const val of Object.values(illumination)) {
        expect(val.illumination).toBe(100);
      }
    });

    it("skips azimuth/illumination/diameter/distance entries when not requested", () => {
      const result = service.computeAllEphemerides({
        azimuthElevationBodies: [],
        coordinateBodies: ["sun"],
        coordinates: [-74.006, 40.7128],
        diameterBodies: [],
        distanceBodies: [],
        end: makeEnd(),
        illuminationBodies: [],
        start: makeStart(),
      });

      expect(Object.keys(result.azimuthElevationEphemerisByBody)).toHaveLength(
        0,
      );
      expect(Object.keys(result.illuminationEphemerisByBody)).toHaveLength(0);
      expect(Object.keys(result.diameterEphemerisByBody)).toHaveLength(0);
      expect(Object.keys(result.distanceEphemerisByBody)).toHaveLength(0);
    });

    it("handles node bodies in coordinateBodies (no SE constant needed)", () => {
      const result = service.computeAllEphemerides({
        azimuthElevationBodies: [],
        coordinateBodies: ["north lunar node", "south lunar node"],
        coordinates: [-74.006, 40.7128],
        diameterBodies: [],
        distanceBodies: [],
        end: makeEnd(),
        illuminationBodies: [],
        start: makeStart(),
      });

      const north = result.coordinateEphemerisByBody["north lunar node"];
      const south = result.coordinateEphemerisByBody["south lunar node"];
      expect(north).toBeDefined();
      expect(south).toBeDefined();
      for (const val of Object.values(north)) {
        expect(val.latitude).toBe(0);
      }
    });
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
