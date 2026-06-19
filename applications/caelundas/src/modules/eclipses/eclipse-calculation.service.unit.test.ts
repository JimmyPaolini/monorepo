import { MathService } from "@caelundas/src/modules/math/math.service";
import moment, { type Moment } from "moment-timezone";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { EclipseCalculationService } from "./eclipse-calculation.service";
import { EclipseGeometryService } from "./eclipse-geometry.service";
import { EclipseTopocentricService } from "./eclipse-topocentric.service";

import type { EclipseCoordinates } from "./eclipses.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

describe("EclipseCalculationService", () => {
  const logger = new LoggerService();
  const ephemerisService = {
    getAzimuthElevationFromEphemeris: vi.fn(),
    getCoordinateFromEphemeris: vi.fn(),
    getDiameterFromEphemeris: vi.fn(),
  };
  const geometryService = new EclipseGeometryService(
    logger,
    ephemerisService as never,
    new MathService(),
  );
  const eclipseEventService = {
    buildLunarEclipseEvent: vi.fn(),
    buildSolarEclipseEvent: vi.fn(),
  };
  const topocentricService = new EclipseTopocentricService(
    logger,
    new MathService(),
    geometryService,
    eclipseEventService as never,
  );

  const service = new EclipseCalculationService(
    logger,
    new MathService(),
    geometryService,
    topocentricService,
    eclipseEventService as never,
  );

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

  describe("delegation helpers", () => {
    it("delegates eclipse coordinate sampling and topocentric activity", () => {
      const coordinates = {
        currentCoordinates: {
          diameterMoon: 0.5,
          diameterSun: 0.5,
          latitudeMoon: 0,
          latitudeSun: 0,
          longitudeMoon: 100,
          longitudeSun: 100,
        },
        nextCoordinates: {
          diameterMoon: 0.5,
          diameterSun: 0.5,
          latitudeMoon: 0,
          latitudeSun: 0,
          longitudeMoon: 101,
          longitudeSun: 100,
        },
        previousCoordinates: {
          diameterMoon: 0.5,
          diameterSun: 0.5,
          latitudeMoon: 0,
          latitudeSun: 0,
          longitudeMoon: 99,
          longitudeSun: 100,
        },
      };
      vi.spyOn(geometryService, "getAllEclipseCoordinates").mockReturnValue(coordinates as never);
      vi.spyOn(topocentricService, "isLunarTopocentricActive").mockReturnValue(true);
      vi.spyOn(topocentricService, "isSolarTopocentricActive").mockReturnValue(false);

      expect(
        service.getAllEclipseCoordinates({
          minute: moment.utc("2024-04-08T18:00:00.000Z"),
          moonCoordinateEphemeris: {},
          moonDiameterEphemeris: {},
          sunCoordinateEphemeris: {},
          sunDiameterEphemeris: {},
        }),
      ).toEqual(coordinates);
      expect(geometryService.getAllEclipseCoordinates).toHaveBeenCalled();

      expect(service.isLunarTopocentricActive(coordinates.currentCoordinates, true)).toBe(true);
      expect(service.isSolarTopocentricActive(coordinates.currentCoordinates, true)).toBe(false);
    });
  });

  describe("branch coverage", () => {
    const mockedGeometryService = {
      getEclipseAngles: vi.fn(),
      getAllEclipseCoordinates: vi.fn(),
    };
    const mockedTopocentricService = {
      getTopocentricEvents: vi.fn(),
      isLunarEclipseActive: vi.fn(),
      isLunarTopocentricActive: vi.fn(),
      isSolarEclipseActive: vi.fn(),
      isSolarTopocentricActive: vi.fn(),
    };
    const mockedEventService = {
      buildLunarEclipseEvent: vi.fn(),
      buildSolarEclipseEvent: vi.fn(),
    };
    const mockedMathService = {
      isMaximum: vi.fn(),
      isMinimum: vi.fn(),
    };
    const branchService = new EclipseCalculationService(
      new LoggerService(),
      mockedMathService as never,
      mockedGeometryService as never,
      mockedTopocentricService as never,
      mockedEventService as never,
    );

    beforeEach(() => {
      vi.restoreAllMocks();
      vi.clearAllMocks();
    });

    it("builds geocentric events for both eclipse phases", () => {
      const minute = moment.utc("2024-04-08T18:00:00.000Z");
      const solarEvent = {
        categories: ["Eclipse", "Solar"],
        description: "Solar",
        end: minute,
        start: minute,
        summary: "Solar",
      } as Event;
      const lunarEvent = {
        categories: ["Eclipse", "Lunar"],
        description: "Lunar",
        end: minute,
        start: minute,
        summary: "Lunar",
      } as Event;

      mockedEventService.buildSolarEclipseEvent.mockReturnValue(solarEvent);
      mockedEventService.buildLunarEclipseEvent.mockReturnValue(lunarEvent);

      vi.spyOn(branchService, "isSolarEclipse").mockReturnValue("beginning");
      vi.spyOn(branchService, "isLunarEclipse").mockReturnValue("ending");

      expect(
        branchService.getGeocentricEvents({
          currentCoordinates: {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 100,
            longitudeSun: 100,
          },
          minute,
          nextCoordinates: {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 101,
            longitudeSun: 101,
          },
          previousCoordinates: {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 99,
            longitudeSun: 99,
          },
        }),
      ).toEqual({
        events: [solarEvent, lunarEvent],
        lunarPhase: "ending",
        solarPhase: "beginning",
      });
      expect(mockedEventService.buildSolarEclipseEvent).toHaveBeenCalledWith({
        date: minute,
        frame: "geocentric",
        phase: "beginning",
      });
      expect(mockedEventService.buildLunarEclipseEvent).toHaveBeenCalledWith({
        date: minute,
        frame: "geocentric",
        phase: "ending",
      });
    });

    it("classifies solar eclipse beginning and ending", () => {
      mockedGeometryService.getEclipseAngles.mockReturnValue({
        currentDiameter: 10,
        currentLatitudeAngle: 1,
        currentLongitudeAngle: 9,
        nextLongitudeAngle: 8,
        previousLongitudeAngle: 12,
      });
      mockedMathService.isMinimum.mockReturnValue(false);

      expect(
        branchService.isSolarEclipse(
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 100,
            longitudeSun: 90,
          },
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 95,
            longitudeSun: 85,
          },
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 105,
            longitudeSun: 95,
          },
        ),
      ).toBe("beginning");

      mockedGeometryService.getEclipseAngles.mockReturnValue({
        currentDiameter: 10,
        currentLatitudeAngle: 1,
        currentLongitudeAngle: 9,
        nextLongitudeAngle: 12,
        previousLongitudeAngle: 8,
      });

      expect(
        branchService.isSolarEclipse(
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 100,
            longitudeSun: 90,
          },
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 95,
            longitudeSun: 85,
          },
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 105,
            longitudeSun: 95,
          },
        ),
      ).toBe("ending");

      mockedGeometryService.getEclipseAngles.mockReturnValue({
        currentDiameter: 10,
        currentLatitudeAngle: 20,
        currentLongitudeAngle: 9,
        nextLongitudeAngle: 12,
        previousLongitudeAngle: 8,
      });

      expect(
        branchService.isSolarEclipse(
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 100,
            longitudeSun: 90,
          },
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 95,
            longitudeSun: 85,
          },
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 105,
            longitudeSun: 95,
          },
        ),
      ).toBeNull();
    });

    it("classifies lunar eclipse beginning and ending", () => {
      mockedGeometryService.getEclipseAngles.mockReturnValue({
        currentDiameter: 10,
        currentLatitudeAngle: 1,
        currentLongitudeAngle: 171,
        nextLongitudeAngle: 172,
        previousLongitudeAngle: 169,
      });
      mockedMathService.isMaximum.mockReturnValue(false);

      expect(
        branchService.isLunarEclipse(
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 280,
            longitudeSun: 100,
          },
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 279,
            longitudeSun: 100,
          },
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 281,
            longitudeSun: 100,
          },
        ),
      ).toBe("beginning");

      mockedGeometryService.getEclipseAngles.mockReturnValue({
        currentDiameter: 10,
        currentLatitudeAngle: 1,
        currentLongitudeAngle: 171,
        nextLongitudeAngle: 169,
        previousLongitudeAngle: 172,
      });

      expect(
        branchService.isLunarEclipse(
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 280,
            longitudeSun: 100,
          },
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 279,
            longitudeSun: 100,
          },
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 281,
            longitudeSun: 100,
          },
        ),
      ).toBe("ending");
    });

    it("returns null when eclipse phase checks are active but no transition applies", () => {
      mockedMathService.isMinimum.mockReturnValue(false);
      mockedGeometryService.getEclipseAngles.mockReturnValue({
        currentDiameter: 10,
        currentLatitudeAngle: 1,
        currentLongitudeAngle: 10,
        nextLongitudeAngle: 9,
        previousLongitudeAngle: 8,
      });

      expect(
        branchService.isSolarEclipse(
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 100,
            longitudeSun: 90,
          },
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 99,
            longitudeSun: 90,
          },
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 101,
            longitudeSun: 90,
          },
        ),
      ).toBeNull();

      mockedMathService.isMaximum.mockReturnValue(false);
      mockedGeometryService.getEclipseAngles.mockReturnValue({
        currentDiameter: 10,
        currentLatitudeAngle: 12,
        currentLongitudeAngle: 175,
        nextLongitudeAngle: 176,
        previousLongitudeAngle: 174,
      });

      expect(
        branchService.isLunarEclipse(
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 280,
            longitudeSun: 100,
          },
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 279,
            longitudeSun: 100,
          },
          {
            diameterMoon: 0.5,
            diameterSun: 0.5,
            latitudeMoon: 0,
            latitudeSun: 0,
            longitudeMoon: 281,
            longitudeSun: 100,
          },
        ),
      ).toBeNull();
    });

    it("builds only the available geocentric phase events", () => {
      const buildGeocentricEclipseEvents = (
        branchService as unknown as {
          buildGeocentricEclipseEvents: (
            minute: Moment,
            solarPhase: "beginning" | "ending" | "maximum" | null,
            lunarPhase: "beginning" | "ending" | "maximum" | null,
          ) => Event[];
        }
      ).buildGeocentricEclipseEvents.bind(branchService);
      const minute = moment.utc("2024-04-08T18:00:00.000Z");
      const solarEvent = {
        categories: ["Eclipse", "Solar"],
        description: "solar",
        end: minute,
        start: minute,
        summary: "solar",
      } as Event;
      const lunarEvent = {
        categories: ["Eclipse", "Lunar"],
        description: "lunar",
        end: minute,
        start: minute,
        summary: "lunar",
      } as Event;
      mockedEventService.buildSolarEclipseEvent.mockReturnValue(solarEvent);
      mockedEventService.buildLunarEclipseEvent.mockReturnValue(lunarEvent);

      expect(buildGeocentricEclipseEvents(minute, "beginning", null)).toEqual([
        solarEvent,
      ]);
      expect(buildGeocentricEclipseEvents(minute, null, "ending")).toEqual([
        lunarEvent,
      ]);
    });
  });
});
