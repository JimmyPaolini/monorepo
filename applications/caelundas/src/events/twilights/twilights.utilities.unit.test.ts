import { describe, it, expect } from "vitest";
import {
  isDawn,
  isDusk,
  isAstronomicalDawn,
  isNauticalDawn,
  isCivilDawn,
  isAstronomicalDusk,
  isNauticalDusk,
  isCivilDusk,
  degreesByTwilight,
  twilights,
  sunRadiusDegrees,
} from "./twilights.utilities";

describe("twilights.utilities", () => {
  describe("constants", () => {
    it("should have correct twilight types", () => {
      expect(twilights).toEqual(["civil", "nautical", "astronomical"]);
    });

    it("should have correct degrees for each twilight type", () => {
      expect(degreesByTwilight.civil).toBe(6);
      expect(degreesByTwilight.nautical).toBe(12);
      expect(degreesByTwilight.astronomical).toBe(18);
    });

    it("should calculate sun radius in degrees correctly", () => {
      // Sun radius is 16 arcminutes, 60 arcminutes per degree
      expect(sunRadiusDegrees).toBeCloseTo(16 / 60, 5);
    });
  });

  describe("isDawn", () => {
    it("should return true when crossing dawn threshold from below", () => {
      // Civil dawn: elevation crosses from below -6° to above -6°
      expect(
        isDawn({
          currentElevation: -5, // Above -6°
          previousElevation: -7, // Below -6°
          twilight: "civil",
        })
      ).toBe(true);
    });

    it("should return false when elevation stays below threshold", () => {
      expect(
        isDawn({
          currentElevation: -8,
          previousElevation: -10,
          twilight: "civil",
        })
      ).toBe(false);
    });

    it("should return false when elevation stays above threshold", () => {
      expect(
        isDawn({
          currentElevation: -4,
          previousElevation: -5,
          twilight: "civil",
        })
      ).toBe(false);
    });

    it("should return false when crossing threshold from above (dusk direction)", () => {
      expect(
        isDawn({
          currentElevation: -7,
          previousElevation: -5,
          twilight: "civil",
        })
      ).toBe(false);
    });

    it("should work for nautical twilight (-12°)", () => {
      expect(
        isDawn({
          currentElevation: -11,
          previousElevation: -13,
          twilight: "nautical",
        })
      ).toBe(true);
    });

    it("should work for astronomical twilight (-18°)", () => {
      expect(
        isDawn({
          currentElevation: -17,
          previousElevation: -19,
          twilight: "astronomical",
        })
      ).toBe(true);
    });
  });

  describe("isDusk", () => {
    it("should return true when crossing dusk threshold from above", () => {
      // Civil dusk: elevation crosses from above -6° to below -6°
      expect(
        isDusk({
          currentElevation: -7, // Below -6°
          previousElevation: -5, // Above -6°
          twilight: "civil",
        })
      ).toBe(true);
    });

    it("should return false when elevation stays above threshold", () => {
      expect(
        isDusk({
          currentElevation: -4,
          previousElevation: -5,
          twilight: "civil",
        })
      ).toBe(false);
    });

    it("should return false when elevation stays below threshold", () => {
      expect(
        isDusk({
          currentElevation: -8,
          previousElevation: -10,
          twilight: "civil",
        })
      ).toBe(false);
    });

    it("should return false when crossing threshold from below (dawn direction)", () => {
      expect(
        isDusk({
          currentElevation: -5,
          previousElevation: -7,
          twilight: "civil",
        })
      ).toBe(false);
    });

    it("should work for nautical twilight (-12°)", () => {
      expect(
        isDusk({
          currentElevation: -13,
          previousElevation: -11,
          twilight: "nautical",
        })
      ).toBe(true);
    });

    it("should work for astronomical twilight (-18°)", () => {
      expect(
        isDusk({
          currentElevation: -19,
          previousElevation: -17,
          twilight: "astronomical",
        })
      ).toBe(true);
    });
  });

  describe("helper dawn functions", () => {
    it("isAstronomicalDawn should detect astronomical dawn", () => {
      expect(
        isAstronomicalDawn({
          currentElevation: -17,
          previousElevation: -19,
        })
      ).toBe(true);

      expect(
        isAstronomicalDawn({
          currentElevation: -19,
          previousElevation: -20,
        })
      ).toBe(false);
    });

    it("isNauticalDawn should detect nautical dawn", () => {
      expect(
        isNauticalDawn({
          currentElevation: -11,
          previousElevation: -13,
        })
      ).toBe(true);

      expect(
        isNauticalDawn({
          currentElevation: -13,
          previousElevation: -14,
        })
      ).toBe(false);
    });

    it("isCivilDawn should detect civil dawn", () => {
      expect(
        isCivilDawn({
          currentElevation: -5,
          previousElevation: -7,
        })
      ).toBe(true);

      expect(
        isCivilDawn({
          currentElevation: -7,
          previousElevation: -8,
        })
      ).toBe(false);
    });
  });

  describe("helper dusk functions", () => {
    it("isAstronomicalDusk should detect astronomical dusk", () => {
      expect(
        isAstronomicalDusk({
          currentElevation: -19,
          previousElevation: -17,
        })
      ).toBe(true);

      expect(
        isAstronomicalDusk({
          currentElevation: -17,
          previousElevation: -19,
        })
      ).toBe(false);
    });

    it("isNauticalDusk should detect nautical dusk", () => {
      expect(
        isNauticalDusk({
          currentElevation: -13,
          previousElevation: -11,
        })
      ).toBe(true);

      expect(
        isNauticalDusk({
          currentElevation: -11,
          previousElevation: -13,
        })
      ).toBe(false);
    });

    it("isCivilDusk should detect civil dusk", () => {
      expect(
        isCivilDusk({
          currentElevation: -7,
          previousElevation: -5,
        })
      ).toBe(true);

      expect(
        isCivilDusk({
          currentElevation: -5,
          previousElevation: -7,
        })
      ).toBe(false);
    });
  });
});
