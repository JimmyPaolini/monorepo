import { Test } from "@nestjs/testing";
import moment from "moment-timezone";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { EphemerisAggregationService } from "./ephemeris-aggregation.service";
import { EphemerisConstantsService } from "./ephemeris-constants.service";
import { EphemerisCoordinateService } from "./ephemeris-coordinate.service";
import { EphemerisHorizonService } from "./ephemeris-horizon.service";
import { EphemerisPhenomenaService } from "./ephemeris-phenomena.service";
import { EphemerisTimeService } from "./ephemeris-time.service";
import { EphemerisService } from "./ephemeris.service";

import type * as EphemerisConstantsModule from "./ephemeris.constants";
import type {
  AzimuthElevationEphemeris,
  CoordinateEphemeris,
  DiameterEphemeris,
  DistanceEphemeris,
  IlluminationEphemeris,
} from "./ephemeris.types";

vi.mock("./ephemeris.constants", async (importOriginal) => {
  const original = await importOriginal<typeof EphemerisConstantsModule>();
  return {
    ...original,
    initializeSwissEphemeris: vi.fn(),
  };
});

describe("EphemerisService", () => {
  let service: EphemerisService;
  const aggregationService = {
    accumulateBodyEphemeris: vi.fn(),
    buildEphemerisEntries: vi.fn().mockReturnValue({
      azimuthEntries: [],
      coordinateEntries: [],
      diameterEntries: [],
      distanceEntries: [],
      illuminationEntries: [],
    }),
    buildEphemerisFeatureSets: vi.fn().mockReturnValue({
      azimuthElevationSet: new Set(["sun"]),
      diameterSet: new Set(["sun"]),
      distanceSet: new Set(["sun"]),
      illuminationSet: new Set(["sun"]),
    }),
    entriesToEphemerides: vi.fn().mockReturnValue({
      azimuthElevationEphemerisByBody: {},
      coordinateEphemerisByBody: {},
      diameterEphemerisByBody: {},
      distanceEphemerisByBody: {},
      illuminationEphemerisByBody: {},
    }),
  };

  const coordinateService = {
    computeBodyCoordinate: vi
      .fn()
      .mockReturnValue({ latitude: -1.2, longitude: 120.5 }),
    computeDistanceForBody: vi.fn().mockReturnValue({
      "2024-03-21T00:00:00.000Z": { distance: 1.01 },
    }),
    computeNodeBodyMinutes: vi.fn().mockReturnValue({
      "2024-03-21T00:00:00.000Z": { latitude: 0, longitude: 45 },
    }),
  };

  const constantsService = {
    isNode: vi.fn(
      (body: string) => body.includes("node") || body === "lunar perigee",
    ),
  };

  const horizonService = {
    computeAzimuthElevationForBody: vi.fn().mockReturnValue({
      "2024-03-21T00:00:00.000Z": { azimuth: 180, elevation: 44.8 },
    }),
  };

  const phenomenaService = {
    computeDiameterForBody: vi.fn().mockReturnValue({
      "2024-03-21T00:00:00.000Z": { diameter: 0.5 },
    }),
    computeIlluminationForBody: vi.fn().mockReturnValue({
      "2024-03-21T00:00:00.000Z": { illumination: 75 },
    }),
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

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EphemerisService,
        {
          provide: EphemerisAggregationService,
          useValue: aggregationService,
        },
        {
          provide: EphemerisCoordinateService,
          useValue: coordinateService,
        },
        {
          provide: EphemerisConstantsService,
          useValue: constantsService,
        },
        {
          provide: EphemerisHorizonService,
          useValue: horizonService,
        },
        {
          provide: EphemerisPhenomenaService,
          useValue: phenomenaService,
        },
        {
          provide: EphemerisTimeService,
          useValue: timeService,
        },
      ],
    }).compile();

    service = module.get(EphemerisService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("accessors", () => {
    it("returns azimuth/elevation values", () => {
      const ephemeris: AzimuthElevationEphemeris = {
        "2024-03-21T00:00:00.000Z": { azimuth: 180, elevation: 44.8 },
      };

      expect(
        service.getAzimuthElevationFromEphemeris(
          ephemeris,
          "2024-03-21T00:00:00.000Z",
          "azimuth",
        ),
      ).toBe(180);
    });

    it("returns coordinate values", () => {
      const ephemeris: CoordinateEphemeris = {
        "2024-03-21T00:00:00.000Z": { latitude: -1.2, longitude: 120.5 },
      };

      expect(
        service.getCoordinateFromEphemeris(
          ephemeris,
          "2024-03-21T00:00:00.000Z",
          "longitude",
        ),
      ).toBe(120.5);
    });

    it("returns diameter values", () => {
      const ephemeris: DiameterEphemeris = {
        "2024-03-21T00:00:00.000Z": { diameter: 0.5 },
      };

      expect(
        service.getDiameterFromEphemeris(
          ephemeris,
          "2024-03-21T00:00:00.000Z",
          "diameter",
        ),
      ).toBe(0.5);
    });

    it("returns distance values", () => {
      const ephemeris: DistanceEphemeris = {
        "2024-03-21T00:00:00.000Z": { distance: 1.01 },
      };

      expect(
        service.getDistanceFromEphemeris(
          ephemeris,
          "2024-03-21T00:00:00.000Z",
          "distance",
        ),
      ).toBe(1.01);
    });

    it("returns illumination values", () => {
      const ephemeris: IlluminationEphemeris = {
        "2024-03-21T00:00:00.000Z": { illumination: 75 },
      };

      expect(
        service.getIlluminationFromEphemeris(
          ephemeris,
          "2024-03-21T00:00:00.000Z",
          "illumination",
        ),
      ).toBe(75);
    });

    it("throws when accessor timestamp is missing", () => {
      expect(() =>
        service.getCoordinateFromEphemeris({}, "missing", "longitude"),
      ).toThrow("Missing longitude at missing");
    });
  });

  describe("facade delegation", () => {
    it("delegates computeAllEphemerides to aggregation service", () => {
      service.computeAllEphemerides({
        azimuthElevationBodies: ["sun"],
        coordinateBodies: ["sun"],
        coordinates: [-74.006, 40.7128],
        diameterBodies: ["sun"],
        distanceBodies: ["sun"],
        end: moment.utc("2024-03-21T00:01:00.000Z"),
        illuminationBodies: ["sun"],
        start: moment.utc("2024-03-21T00:00:00.000Z"),
      });

      expect(
        aggregationService.buildEphemerisFeatureSets,
      ).toHaveBeenCalledOnce();
      expect(aggregationService.accumulateBodyEphemeris).toHaveBeenCalled();
      expect(aggregationService.entriesToEphemerides).toHaveBeenCalledOnce();
    });

    it("delegates azimuth/elevation by body to horizon service", () => {
      const result = service.getAzimuthElevationEphemerisByBody({
        bodies: ["sun"],
        coordinates: [-74.006, 40.7128],
        end: moment.utc("2024-03-21T00:01:00.000Z"),
        start: moment.utc("2024-03-21T00:00:00.000Z"),
        timezone: "UTC",
      });

      expect(
        horizonService.computeAzimuthElevationForBody,
      ).toHaveBeenCalledOnce();
      expect(result.sun).toBeDefined();
    });

    it("delegates illumination by body to phenomena service", () => {
      const result = service.getIlluminationEphemerisByBody({
        bodies: ["moon"],
        coordinates: [-74.006, 40.7128],
        end: moment.utc("2024-03-21T00:01:00.000Z"),
        start: moment.utc("2024-03-21T00:00:00.000Z"),
        timezone: "UTC",
      });

      expect(
        phenomenaService.computeIlluminationForBody,
      ).toHaveBeenCalledOnce();
      expect(result.moon).toBeDefined();
    });

    it("delegates diameter by body to phenomena service", () => {
      const result = service.getDiameterEphemerisByBody({
        bodies: ["sun"],
        end: moment.utc("2024-03-21T00:01:00.000Z"),
        start: moment.utc("2024-03-21T00:00:00.000Z"),
        timezone: "UTC",
      });

      expect(phenomenaService.computeDiameterForBody).toHaveBeenCalledOnce();
      expect(result.sun).toBeDefined();
    });

    it("delegates distance by body to coordinate service", () => {
      const result = service.getDistanceEphemerisByBody({
        bodies: ["sun"],
        end: moment.utc("2024-03-21T00:01:00.000Z"),
        start: moment.utc("2024-03-21T00:00:00.000Z"),
        timezone: "UTC",
      });

      expect(coordinateService.computeDistanceForBody).toHaveBeenCalledOnce();
      expect(result.sun).toBeDefined();
    });

    it("handles both node and non-node coordinate paths", () => {
      const result = service.getCoordinateEphemerisByBody({
        bodies: ["north lunar node", "sun"],
        end: moment.utc("2024-03-21T00:01:00.000Z"),
        start: moment.utc("2024-03-21T00:00:00.000Z"),
        timezone: "UTC",
      });

      expect(coordinateService.computeNodeBodyMinutes).toHaveBeenCalledOnce();
      expect(coordinateService.computeBodyCoordinate).toHaveBeenCalled();
      expect(result["north lunar node"]).toBeDefined();
      expect(result.sun).toBeDefined();
    });

    it("getEphemerides delegates to computeAllEphemerides", () => {
      const spy = vi.spyOn(service, "computeAllEphemerides");
      service.getEphemerides({
        coordinates: [-74.006, 40.7128],
        end: moment.utc("2024-03-21T00:01:00.000Z"),
        start: moment.utc("2024-03-21T00:00:00.000Z"),
        timezone: "UTC",
      });

      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe("getLongitudesWindow", () => {
    it("returns previous/current/next longitude values", () => {
      const ephemeris: CoordinateEphemeris = {
        "2024-03-21T00:00:00.000Z": { latitude: 0, longitude: 10 },
        "2024-03-21T00:01:00.000Z": { latitude: 0, longitude: 20 },
        "2024-03-21T00:02:00.000Z": { latitude: 0, longitude: 30 },
      };

      const result = service.getLongitudesWindow({
        ephemeris,
        minute: moment.utc("2024-03-21T00:01:00.000Z"),
        next: moment.utc("2024-03-21T00:02:00.000Z"),
        previous: moment.utc("2024-03-21T00:00:00.000Z"),
      });

      expect(result).toEqual({ current: 20, next: 30, previous: 10 });
    });
  });
});
