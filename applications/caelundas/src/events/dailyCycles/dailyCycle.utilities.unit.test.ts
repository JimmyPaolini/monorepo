import { describe, expect, it } from "vitest";

import { isRise, isSet, sunRadiusDegrees } from "./dailyCycle.utilities";

describe("dailyCycle.utilities", () => {
  describe("sunRadiusDegrees", () => {
    it("should have correct value for sun radius", () => {
      // Sun radius is 16 arcminutes, 60 arcminutes per degree
      expect(sunRadiusDegrees).toBeCloseTo(16 / 60, 5);
      expect(sunRadiusDegrees).toBeCloseTo(0.2667, 3);
    });
  });

  describe("isRise", () => {
    it("should return true when crossing above sun radius threshold", () => {
      // Rise occurs when elevation goes from below -sunRadiusDegrees to above
      const result = isRise({
        currentElevation: 0, // Above threshold
        previousElevation: -0.5, // Below threshold (-0.2667)
      });

      expect(result).toBeTruthy();
    });

    it("should return true at exact threshold crossing", () => {
      const result = isRise({
        currentElevation: -sunRadiusDegrees + 0.01, // Just above threshold
        previousElevation: -sunRadiusDegrees - 0.01, // Just below threshold
      });

      expect(result).toBeTruthy();
    });

    it("should return false when elevation stays below threshold", () => {
      const result = isRise({
        currentElevation: -0.5,
        previousElevation: -1,
      });

      expect(result).toBeFalsy();
    });

    it("should return false when elevation stays above threshold", () => {
      const result = isRise({
        currentElevation: 1,
        previousElevation: 0.5,
      });

      expect(result).toBeFalsy();
    });

    it("should return false when crossing threshold downward (set direction)", () => {
      const result = isRise({
        currentElevation: -0.5, // Below threshold
        previousElevation: 0, // Above threshold
      });

      expect(result).toBeFalsy();
    });
  });

  describe("isSet", () => {
    it("should return true when crossing below sun radius threshold", () => {
      // Set occurs when elevation goes from above -sunRadiusDegrees to below
      const result = isSet({
        currentElevation: -0.5, // Below threshold
        previousElevation: 0, // Above threshold
      });

      expect(result).toBeTruthy();
    });

    it("should return true at exact threshold crossing", () => {
      const result = isSet({
        currentElevation: -sunRadiusDegrees - 0.01, // Just below threshold
        previousElevation: -sunRadiusDegrees + 0.01, // Just above threshold
      });

      expect(result).toBeTruthy();
    });

    it("should return false when elevation stays above threshold", () => {
      const result = isSet({
        currentElevation: 0.5,
        previousElevation: 1,
      });

      expect(result).toBeFalsy();
    });

    it("should return false when elevation stays below threshold", () => {
      const result = isSet({
        currentElevation: -1,
        previousElevation: -0.5,
      });

      expect(result).toBeFalsy();
    });

    it("should return false when crossing threshold upward (rise direction)", () => {
      const result = isSet({
        currentElevation: 0, // Above threshold
        previousElevation: -0.5, // Below threshold
      });

      expect(result).toBeFalsy();
    });
  });
});
