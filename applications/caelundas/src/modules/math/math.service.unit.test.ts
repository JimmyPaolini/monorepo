import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { MathService } from "./math.service";

describe("MathService", () => {
  let service: MathService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [MathService],
    }).compile();
    service = await module.resolve(MathService);
  });

  describe("static constants", () => {
    it("has correct arcseconds per degree", () => {
      expect(MathService.arcsecondsPerArcminute).toBe(60);
      expect(MathService.arcminutesPerDegree).toBe(60);
      expect(MathService.arcsecondsPerDegree).toBe(3600);
    });
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });

  describe("normalizeDegrees", () => {
    it("returns the same value for degrees within 0-360", () => {
      expect(service.normalizeDegrees(0)).toBe(0);
      expect(service.normalizeDegrees(45)).toBe(45);
      expect(service.normalizeDegrees(180)).toBe(180);
      expect(service.normalizeDegrees(359)).toBe(359);
    });

    it("wraps degrees >= 360 to 0-360 range", () => {
      expect(service.normalizeDegrees(360)).toBe(0);
      expect(service.normalizeDegrees(361)).toBe(1);
      expect(service.normalizeDegrees(450)).toBe(90);
      expect(service.normalizeDegrees(720)).toBe(0);
      expect(service.normalizeDegrees(725)).toBe(5);
    });

    it("wraps negative degrees to 0-360 range", () => {
      expect(service.normalizeDegrees(-1)).toBe(359);
      expect(service.normalizeDegrees(-10)).toBe(350);
      expect(service.normalizeDegrees(-90)).toBe(270);
      expect(service.normalizeDegrees(-180)).toBe(180);
      expect(service.normalizeDegrees(-360)).toBe(0);
      expect(service.normalizeDegrees(-361)).toBe(359);
    });
  });

  describe("getAngle", () => {
    it("returns 0 for identical longitudes", () => {
      expect(service.getAngle(0, 0)).toBe(0);
      expect(service.getAngle(45, 45)).toBe(45 - 45);
      expect(service.getAngle(180, 180)).toBe(0);
    });

    it("returns the smaller angle between two longitudes", () => {
      expect(service.getAngle(0, 90)).toBe(90);
      expect(service.getAngle(90, 0)).toBe(90);
      expect(service.getAngle(0, 180)).toBe(180);
      expect(service.getAngle(180, 0)).toBe(180);
    });

    it("handles angles > 180 by returning the shorter path", () => {
      expect(service.getAngle(0, 270)).toBe(90); // Shorter path is 90 degrees
      expect(service.getAngle(10, 350)).toBe(20); // Shorter path is 20 degrees
      expect(service.getAngle(350, 10)).toBe(20);
    });

    it("handles unnormalized longitudes", () => {
      expect(service.getAngle(360, 0)).toBe(0);
      expect(service.getAngle(-90, 90)).toBe(180);
      expect(service.getAngle(450, 90)).toBe(0); // 450 normalizes to 90
    });
  });

  describe("normalizeForComparison", () => {
    it("returns current unchanged when difference is <= 180", () => {
      expect(service.normalizeForComparison(50, 100)).toBe(50);
      expect(service.normalizeForComparison(100, 50)).toBe(100);
      expect(service.normalizeForComparison(180, 0)).toBe(180);
    });

    it("adjusts current when crossing the 0/360 boundary", () => {
      // The function adjusts current relative to reference
      // When current=350 and reference=10, diff=340 > 180
      // Since 350 > 10, it subtracts 360 from current
      expect(service.normalizeForComparison(350, 10)).toBe(350 - 360); // -10

      // When current=10 and reference=350, diff=340 > 180
      // Since 10 < 350, it adds 360 to current
      expect(service.normalizeForComparison(10, 350)).toBe(10 + 360); // 370
    });
  });

  describe("isMaximum", () => {
    it("returns true when current is greater than both neighbors", () => {
      expect(
        service.isMaximum({ current: 10, next: 5, previous: 5 }),
      ).toBeTruthy();
      expect(
        service.isMaximum({ current: 100, next: 50, previous: 0 }),
      ).toBeTruthy();
    });

    it("returns false when current is not a maximum", () => {
      expect(
        service.isMaximum({ current: 5, next: 10, previous: 10 }),
      ).toBeFalsy();
      expect(
        service.isMaximum({ current: 10, next: 15, previous: 5 }),
      ).toBeFalsy();
      expect(
        service.isMaximum({ current: 10, next: 5, previous: 15 }),
      ).toBeFalsy();
      expect(
        service.isMaximum({ current: 10, next: 10, previous: 10 }),
      ).toBeFalsy();
    });
  });

  describe("isMinimum", () => {
    it("returns true when current is less than both neighbors", () => {
      expect(
        service.isMinimum({ current: 5, next: 10, previous: 10 }),
      ).toBeTruthy();
      expect(
        service.isMinimum({ current: 0, next: 50, previous: 100 }),
      ).toBeTruthy();
    });

    it("returns false when current is not a minimum", () => {
      expect(
        service.isMinimum({ current: 10, next: 5, previous: 5 }),
      ).toBeFalsy();
      expect(
        service.isMinimum({ current: 10, next: 5, previous: 15 }),
      ).toBeFalsy();
      expect(
        service.isMinimum({ current: 10, next: 15, previous: 5 }),
      ).toBeFalsy();
      expect(
        service.isMinimum({ current: 10, next: 10, previous: 10 }),
      ).toBeFalsy();
    });
  });

  describe("getCombinations", () => {
    it("returns empty array for k=0", () => {
      expect(service.getCombinations([1, 2, 3], 0)).toEqual([[]]);
    });

    it("returns single-element combinations for k=1", () => {
      expect(service.getCombinations([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
    });

    it("returns pairs for k=2", () => {
      expect(service.getCombinations([1, 2, 3], 2)).toEqual([
        [1, 2],
        [1, 3],
        [2, 3],
      ]);
    });

    it("returns triplets for k=3", () => {
      expect(service.getCombinations([1, 2, 3, 4], 3)).toEqual([
        [1, 2, 3],
        [1, 2, 4],
        [1, 3, 4],
        [2, 3, 4],
      ]);
    });

    it("returns the full array when k equals array length", () => {
      expect(service.getCombinations([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
    });

    it("returns empty array when k > array length", () => {
      expect(service.getCombinations([1, 2], 3)).toEqual([]);
    });

    it("works with string arrays", () => {
      expect(service.getCombinations(["a", "b", "c"], 2)).toEqual([
        ["a", "b"],
        ["a", "c"],
        ["b", "c"],
      ]);
    });
  });
});
