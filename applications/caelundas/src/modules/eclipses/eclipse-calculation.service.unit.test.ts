import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import moment from "moment-timezone";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { EclipseCalculationService } from "./eclipse-calculation.service";
import { EclipseEventService } from "./eclipse-event.service";
import { EclipseGeometryService } from "./eclipse-geometry.service";
import { EclipseTopocentricService } from "./eclipse-topocentric.service";

import type { EclipseCoordinates } from "./eclipses.types";

describe("EclipseCalculationService", () => {
  let service: EclipseCalculationService;
  let ephemerisService: ReturnType<typeof createMock<EphemerisService>>;
  let eclipseEventService: ReturnType<typeof createMock<EclipseEventService>>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EclipseCalculationService,
        EclipseGeometryService,
        EclipseTopocentricService,
        MathService,
        { provide: LoggerService, useValue: createMock<LoggerService>() },
        { provide: EphemerisService, useValue: createMock<EphemerisService>() },
        {
          provide: EclipseEventService,
          useValue: createMock<EclipseEventService>(),
        },
      ],
    }).compile();

    service = module.get(EclipseCalculationService);
    void module.get(LoggerService);
    ephemerisService = module.get(EphemerisService);
    eclipseEventService = module.get(EclipseEventService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isSolarEclipse", () => {
    it("returns maximum at conjunction minimum", () => {
      const result = service.isSolarEclipse(
        {
          diameterMoon: 0.5,
          diameterSun: 0.5,
          latitudeMoon: 0,
          latitudeSun: 0,
          longitudeMoon: 100,
          longitudeSun: 100,
        },
        {
          diameterMoon: 0,
          diameterSun: 0,
          latitudeMoon: 0,
          latitudeSun: 0,
          longitudeMoon: 99,
          longitudeSun: 100,
        },
        {
          diameterMoon: 0,
          diameterSun: 0,
          latitudeMoon: 0,
          latitudeSun: 0,
          longitudeMoon: 101,
          longitudeSun: 100,
        },
      );

      expect(result).toBe("maximum");
    });

    it("returns null when latitude exceeds eclipse diameter threshold", () => {
      const result = service.isSolarEclipse(
        {
          diameterMoon: 0.5,
          diameterSun: 0.5,
          latitudeMoon: 5,
          latitudeSun: 0,
          longitudeMoon: 100,
          longitudeSun: 100,
        },
        {
          diameterMoon: 0,
          diameterSun: 0,
          latitudeMoon: 0,
          latitudeSun: 0,
          longitudeMoon: 99,
          longitudeSun: 100,
        },
        {
          diameterMoon: 0,
          diameterSun: 0,
          latitudeMoon: 0,
          latitudeSun: 0,
          longitudeMoon: 101,
          longitudeSun: 100,
        },
      );

      expect(result).toBeNull();
    });
  });

  describe("isLunarEclipse", () => {
    it("returns maximum at opposition maximum", () => {
      const result = service.isLunarEclipse(
        {
          diameterMoon: 0.5,
          diameterSun: 0.5,
          latitudeMoon: 0,
          latitudeSun: 0,
          longitudeMoon: 280,
          longitudeSun: 100,
        },
        {
          diameterMoon: 0,
          diameterSun: 0,
          latitudeMoon: 0,
          latitudeSun: 0,
          longitudeMoon: 279,
          longitudeSun: 100,
        },
        {
          diameterMoon: 0,
          diameterSun: 0,
          latitudeMoon: 0,
          latitudeSun: 0,
          longitudeMoon: 281,
          longitudeSun: 100,
        },
      );

      expect(result).toBe("maximum");
    });

    it("returns null when not in opposition threshold", () => {
      const result = service.isLunarEclipse(
        {
          diameterMoon: 0.5,
          diameterSun: 0.5,
          latitudeMoon: 0,
          latitudeSun: 0,
          longitudeMoon: 150,
          longitudeSun: 100,
        },
        {
          diameterMoon: 0,
          diameterSun: 0,
          latitudeMoon: 0,
          latitudeSun: 0,
          longitudeMoon: 149,
          longitudeSun: 100,
        },
        {
          diameterMoon: 0,
          diameterSun: 0,
          latitudeMoon: 0,
          latitudeSun: 0,
          longitudeMoon: 151,
          longitudeSun: 100,
        },
      );

      expect(result).toBeNull();
    });
  });

  describe("active-state helpers", () => {
    it("reports active solar eclipse overlap", () => {
      const active = service.isSolarEclipseActive({
        diameterMoon: 0.5,
        diameterSun: 0.5,
        latitudeMoon: 0,
        latitudeSun: 0,
        longitudeMoon: 100.4,
        longitudeSun: 100,
      });

      expect(active).toBe(true);
    });

    it("reports inactive solar eclipse overlap", () => {
      const active = service.isSolarEclipseActive({
        diameterMoon: 0.5,
        diameterSun: 0.5,
        latitudeMoon: 5,
        latitudeSun: 0,
        longitudeMoon: 100,
        longitudeSun: 100,
      });

      expect(active).toBe(false);
    });

    it("reports active lunar eclipse overlap", () => {
      const active = service.isLunarEclipseActive({
        diameterMoon: 0.5,
        diameterSun: 0.5,
        latitudeMoon: 0,
        latitudeSun: 0,
        longitudeMoon: 279.5,
        longitudeSun: 100,
      });

      expect(active).toBe(true);
    });

    it("reports inactive lunar eclipse overlap", () => {
      const active = service.isLunarEclipseActive({
        diameterMoon: 0.5,
        diameterSun: 0.5,
        latitudeMoon: 0,
        latitudeSun: 0,
        longitudeMoon: 250,
        longitudeSun: 100,
      });

      expect(active).toBe(false);
    });
  });

  describe("getTopocentricEventsForDetect", () => {
    it("returns topocentric events when visibility and geometry align", () => {
      const moonEvent = {
        categories: ["Eclipse", "Lunar", "Topocentric Visibility"],
        description: "Lunar Eclipse begins (Topocentric Visibility)",
        end: moment.utc("2024-09-18T02:00:00.000Z"),
        start: moment.utc("2024-09-18T02:00:00.000Z"),
        summary: "📍 🌙🐉▶️ Lunar Eclipse begins",
      };
      const solarEvent = {
        categories: ["Eclipse", "Solar", "Topocentric Visibility"],
        description: "Solar Eclipse begins (Topocentric Visibility)",
        end: moment.utc("2024-04-08T18:00:00.000Z"),
        start: moment.utc("2024-04-08T18:00:00.000Z"),
        summary: "📍 ☀️🐉▶️ Solar Eclipse begins",
      };

      eclipseEventService.buildLunarEclipseEvent.mockReturnValue(moonEvent);
      eclipseEventService.buildSolarEclipseEvent.mockReturnValue(solarEvent);

      ephemerisService.getAzimuthElevationFromEphemeris.mockReturnValue(15);

      const coordinates: EclipseCoordinates = {
        diameterMoon: 0.5,
        diameterSun: 0.5,
        latitudeMoon: 0,
        latitudeSun: 0,
        longitudeMoon: 100,
        longitudeSun: 100,
      };

      const events = service.getTopocentricEventsForDetect({
        coordinates: {
          currentCoordinates: coordinates,
          nextCoordinates: { ...coordinates, longitudeMoon: 101 },
          previousCoordinates: { ...coordinates, longitudeMoon: 98 },
        },
        geocentricPhases: {
          lunarPhase: "beginning",
          solarPhase: "beginning",
        },
        minute: moment.utc("2024-04-08T18:00:00.000Z"),
        moonAzimuthElevationEphemeris: {},
        sunAzimuthElevationEphemeris: {},
      });

      expect(events.length).toBeGreaterThan(0);
    });
  });
});
