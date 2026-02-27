import { describe, expect, it } from "vitest";

import {
  arcminutesPerDegree,
  arcsecondsPerArcminute,
  arcsecondsPerDegree,
  getAngle,
  getCombinations,
  isMaximum,
  isMinimum,
  normalizeDegrees,
  normalizeForComparison,
} from "./math.utilities";

describe("math.utilities", () => {
  describe("constants", () => {
    it("should have correct arcseconds per degree", () => {
      expect(arcsecondsPerArcminute).toBe(60);
      expect(arcminutesPerDegree).toBe(60);
      expect(arcsecondsPerDegree).toBe(3600);
    });
  });

  describe("normalizeDegrees", () => {
    it("should return the same value for degrees within 0-360", () => {
      expect(normalizeDegrees(0)).toBe(0);
      expect(normalizeDegrees(45)).toBe(45);
      expect(normalizeDegrees(180)).toBe(180);
      expect(normalizeDegrees(359)).toBe(359);
    });

    it("should wrap degrees >= 360 to 0-360 range", () => {
      expect(normalizeDegrees(360)).toBe(0);
      expect(normalizeDegrees(361)).toBe(1);
      expect(normalizeDegrees(450)).toBe(90);
      expect(normalizeDegrees(720)).toBe(0);
      expect(normalizeDegrees(725)).toBe(5);
    });

    it("should wrap negative degrees to 0-360 range", () => {
      expect(normalizeDegrees(-1)).toBe(359);
      expect(normalizeDegrees(-10)).toBe(350);
      expect(normalizeDegrees(-90)).toBe(270);
      expect(normalizeDegrees(-180)).toBe(180);
      expect(normalizeDegrees(-360)).toBe(0);
      expect(normalizeDegrees(-361)).toBe(359);
    });
  });

  describe("getAngle", () => {
    it("should return 0 for identical longitudes", () => {
      expect(getAngle(0, 0)).toBe(0);
      expect(getAngle(45, 45)).toBe(45 - 45);
      expect(getAngle(180, 180)).toBe(0);
    });

    it("should return the smaller angle between two longitudes", () => {
      expect(getAngle(0, 90)).toBe(90);
      expect(getAngle(90, 0)).toBe(90);
      expect(getAngle(0, 180)).toBe(180);
      expect(getAngle(180, 0)).toBe(180);
    });

    it("should handle angles > 180 by returning the shorter path", () => {
      expect(getAngle(0, 270)).toBe(90); // Shorter path is 90 degrees
      expect(getAngle(10, 350)).toBe(20); // Shorter path is 20 degrees
      expect(getAngle(350, 10)).toBe(20);
    });

    it("should handle unnormalized longitudes", () => {
      expect(getAngle(360, 0)).toBe(0);
      expect(getAngle(-90, 90)).toBe(180);
      expect(getAngle(450, 90)).toBe(0); // 450 normalizes to 90
    });
  });

  describe("normalizeForComparison", () => {
    it("should return current unchanged when difference is <= 180", () => {
      expect(normalizeForComparison(50, 100)).toBe(50);
      expect(normalizeForComparison(100, 50)).toBe(100);
      expect(normalizeForComparison(180, 0)).toBe(180);
    });

    it("should adjust current when crossing the 0/360 boundary", () => {
      // The function adjusts current relative to reference
      // When current=350 and reference=10, diff=340 > 180
      // Since 350 > 10, it subtracts 360 from current
      expect(normalizeForComparison(350, 10)).toBe(350 - 360); // -10

      // When current=10 and reference=350, diff=340 > 180
      // Since 10 < 350, it adds 360 to current
      expect(normalizeForComparison(10, 350)).toBe(10 + 360); // 370
    });
  });

  describe("isMaximum", () => {
    it("should return true when current is greater than both neighbors", () => {
      expect(isMaximum({ previous: 5, current: 10, next: 5 })).toBeTruthy();
      expect(isMaximum({ previous: 0, current: 100, next: 50 })).toBeTruthy();
    });

    it("should return false when current is not a maximum", () => {
      expect(isMaximum({ previous: 10, current: 5, next: 10 })).toBeFalsy();
      expect(isMaximum({ previous: 5, current: 10, next: 15 })).toBeFalsy();
      expect(isMaximum({ previous: 15, current: 10, next: 5 })).toBeFalsy();
      expect(isMaximum({ previous: 10, current: 10, next: 10 })).toBeFalsy();
    });
  });

  describe("isMinimum", () => {
    it("should return true when current is less than both neighbors", () => {
      expect(isMinimum({ previous: 10, current: 5, next: 10 })).toBeTruthy();
      expect(isMinimum({ previous: 100, current: 0, next: 50 })).toBeTruthy();
    });

    it("should return false when current is not a minimum", () => {
      expect(isMinimum({ previous: 5, current: 10, next: 5 })).toBeFalsy();
      expect(isMinimum({ previous: 15, current: 10, next: 5 })).toBeFalsy();
      expect(isMinimum({ previous: 5, current: 10, next: 15 })).toBeFalsy();
      expect(isMinimum({ previous: 10, current: 10, next: 10 })).toBeFalsy();
    });
  });

  describe("getCombinations", () => {
    it("should return empty array for k=0", () => {
      expect(getCombinations([1, 2, 3], 0)).toEqual([[]]);
    });

    it("should return single-element combinations for k=1", () => {
      expect(getCombinations([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
    });

    it("should return pairs for k=2", () => {
      expect(getCombinations([1, 2, 3], 2)).toEqual([
        [1, 2],
        [1, 3],
        [2, 3],
      ]);
    });

    it("should return triplets for k=3", () => {
      expect(getCombinations([1, 2, 3, 4], 3)).toEqual([
        [1, 2, 3],
        [1, 2, 4],
        [1, 3, 4],
        [2, 3, 4],
      ]);
    });

    it("should return the full array when k equals array length", () => {
      expect(getCombinations([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
    });

    it("should return empty array when k > array length", () => {
      expect(getCombinations([1, 2], 3)).toEqual([]);
    });

    it("should work with string arrays", () => {
      expect(getCombinations(["a", "b", "c"], 2)).toEqual([
        ["a", "b"],
        ["a", "c"],
        ["b", "c"],
      ]);
    });
  });
});
