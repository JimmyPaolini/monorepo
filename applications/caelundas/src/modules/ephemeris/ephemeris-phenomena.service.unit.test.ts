import moment from "moment-timezone";
import { pheno_ut } from "sweph";
import { describe, expect, it, vi } from "vitest";

import { EphemerisPhenomenaService } from "./ephemeris-phenomena.service";

import type { EphemerisConstantsService } from "./ephemeris-constants.service";
import type { EphemerisTimeService } from "./ephemeris-time.service";
import type * as Sweph from "sweph";

vi.mock("sweph", async (importOriginal) => {
  const original = await importOriginal<typeof Sweph>();
  return {
    ...original,
    pheno_ut: vi.fn().mockReturnValue({
      data: [0, 0.75, 0, 0.5, 0, 0],
      error: "",
      flag: 258,
    }),
  };
});

describe("EphemerisPhenomenaService", () => {
  const constantsService = {
    getSwissEphemerisConstantForBody: vi.fn().mockReturnValue(0),
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

  const service = new EphemerisPhenomenaService(
    constantsService as unknown as EphemerisConstantsService,
    timeService as unknown as EphemerisTimeService,
  );

  describe("computeIlluminationForBody", () => {
    it("returns 100 for sun", () => {
      const result = service.computeIlluminationForBody({
        body: "sun",
        end: moment.utc("2024-03-21T00:01:00.000Z"),
        start: moment.utc("2024-03-21T00:00:00.000Z"),
      });

      for (const value of Object.values(result)) {
        expect(value.illumination).toBe(100);
      }
    });

    it("returns pheno illumination percent for moon", () => {
      const result = service.computeIlluminationForBody({
        body: "moon",
        end: moment.utc("2024-03-21T00:01:00.000Z"),
        start: moment.utc("2024-03-21T00:00:00.000Z"),
      });

      for (const value of Object.values(result)) {
        expect(value.illumination).toBe(75);
      }
    });
  });

  describe("computeDiameterForBody", () => {
    it("returns diameter from pheno data[3]", () => {
      const result = service.computeDiameterForBody({
        body: "sun",
        end: moment.utc("2024-03-21T00:01:00.000Z"),
        start: moment.utc("2024-03-21T00:00:00.000Z"),
      });

      for (const value of Object.values(result)) {
        expect(value.diameter).toBe(0.5);
      }
    });
  });

  describe("computePhenoForMinute", () => {
    it("sets sun illumination and diameter", () => {
      const illuminationEphemeris = {};
      const diameterEphemeris = {};
      service.computePhenoForMinute({
        body: "sun",
        diameterEphemeris,
        illuminationEphemeris,
        julianDayUniversalTime: 2_460_395.499_306,
        needsDiameter: true,
        needsIllumination: true,
        swissEphemerisConstant: 0,
        timestamp: "2024-03-21T00:00:00.000Z",
      });

      expect(illuminationEphemeris).toEqual({
        "2024-03-21T00:00:00.000Z": { illumination: 100 },
      });
      expect(diameterEphemeris).toEqual({
        "2024-03-21T00:00:00.000Z": { diameter: 0.5 },
      });
    });

    it("throws when pheno fails", () => {
      vi.mocked(pheno_ut).mockReturnValueOnce({
        data: [0, 0, 0, 0, 0],
        error: "pheno failure",
        flag: -1,
      });

      expect(() =>
        service.computePhenoForMinute({
          body: "moon",
          diameterEphemeris: {},
          illuminationEphemeris: {},
          julianDayUniversalTime: 2_460_395.499_306,
          needsDiameter: true,
          needsIllumination: true,
          swissEphemerisConstant: 0,
          timestamp: "2024-03-21T00:00:00.000Z",
        }),
      ).toThrow("pheno_ut failed for moon");
    });
  });
});
