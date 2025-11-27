import { beforeEach, describe, expect, it, vi } from "vitest";

import * as mathUtilities from "../../math.utilities";

import {
  canFormAspect,
  clearAngleCache,
  couldBeGrandCross,
  couldBeGrandTrine,
  couldBeHexagram,
  couldBeKite,
  couldBePentagram,
  couldBeStellium,
  couldBeTSquare,
  couldBeYod,
  getAngleCacheStats,
  getCachedAngle,
} from "./aspects.cache";

vi.mock("../../math.utilities", () => ({
  getAngle: vi.fn((lon1: number, lon2: number) => {
    // Simple mock implementation
    let angle = Math.abs(lon1 - lon2);
    if (angle > 180) {
      angle = 360 - angle;
    }
    return angle;
  }),
}));

describe("aspects.cache", () => {
  beforeEach(() => {
    clearAngleCache();
    vi.clearAllMocks();
  });

  describe("getCachedAngle", () => {
    it("should calculate angle on first call", () => {
      const result = getCachedAngle({
        timestamp1: "2024-01-01T00:00:00Z",
        timestamp2: "2024-01-01T00:01:00Z",
        body1: "sun",
        body2: "moon",
        longitude1: 0,
        longitude2: 90,
      });

      expect(result).toBe(90);
      expect(mathUtilities.getAngle).toHaveBeenCalledWith(0, 90);
      expect(mathUtilities.getAngle).toHaveBeenCalledTimes(1);
    });

    it("should return cached angle on subsequent calls", () => {
      const args = {
        timestamp1: "2024-01-01T00:00:00Z",
        timestamp2: "2024-01-01T00:01:00Z",
        body1: "sun" as const,
        body2: "moon" as const,
        longitude1: 0,
        longitude2: 90,
      };

      getCachedAngle(args);
      const result = getCachedAngle(args);

      expect(result).toBe(90);
      expect(mathUtilities.getAngle).toHaveBeenCalledTimes(1); // Only called once
    });

    it("should use same cache key for reversed body order", () => {
      getCachedAngle({
        timestamp1: "2024-01-01T00:00:00Z",
        timestamp2: "2024-01-01T00:01:00Z",
        body1: "sun",
        body2: "moon",
        longitude1: 0,
        longitude2: 90,
      });

      const result = getCachedAngle({
        timestamp1: "2024-01-01T00:00:00Z",
        timestamp2: "2024-01-01T00:01:00Z",
        body1: "moon",
        body2: "sun",
        longitude1: 90,
        longitude2: 0,
      });

      expect(result).toBe(90);
      expect(mathUtilities.getAngle).toHaveBeenCalledTimes(1); // Only called once
    });

    it("should cache different angles for different body pairs", () => {
      getCachedAngle({
        timestamp1: "2024-01-01T00:00:00Z",
        timestamp2: "2024-01-01T00:01:00Z",
        body1: "sun",
        body2: "moon",
        longitude1: 0,
        longitude2: 90,
      });

      getCachedAngle({
        timestamp1: "2024-01-01T00:00:00Z",
        timestamp2: "2024-01-01T00:01:00Z",
        body1: "sun",
        body2: "mars",
        longitude1: 0,
        longitude2: 120,
      });

      expect(mathUtilities.getAngle).toHaveBeenCalledTimes(2);
    });
  });

  describe("clearAngleCache", () => {
    it("should clear the cache", () => {
      getCachedAngle({
        timestamp1: "2024-01-01T00:00:00Z",
        timestamp2: "2024-01-01T00:01:00Z",
        body1: "sun",
        body2: "moon",
        longitude1: 0,
        longitude2: 90,
      });

      expect(getAngleCacheStats().size).toBe(1);

      clearAngleCache();

      expect(getAngleCacheStats().size).toBe(0);

      // Should recalculate after clear
      getCachedAngle({
        timestamp1: "2024-01-01T00:00:00Z",
        timestamp2: "2024-01-01T00:01:00Z",
        body1: "sun",
        body2: "moon",
        longitude1: 0,
        longitude2: 90,
      });

      expect(mathUtilities.getAngle).toHaveBeenCalledTimes(2);
    });
  });

  describe("getAngleCacheStats", () => {
    it("should return cache statistics", () => {
      const stats = getAngleCacheStats();

      expect(stats).toHaveProperty("size");
      expect(stats).toHaveProperty("ephemerisSize");
      expect(stats.size).toBe(0);
      expect(stats.ephemerisSize).toBe(0);
    });

    it("should track cache size correctly", () => {
      getCachedAngle({
        timestamp1: "2024-01-01T00:00:00Z",
        timestamp2: "2024-01-01T00:01:00Z",
        body1: "sun",
        body2: "moon",
        longitude1: 0,
        longitude2: 90,
      });

      expect(getAngleCacheStats().size).toBe(1);

      getCachedAngle({
        timestamp1: "2024-01-01T00:00:00Z",
        timestamp2: "2024-01-01T00:01:00Z",
        body1: "sun",
        body2: "mars",
        longitude1: 0,
        longitude2: 120,
      });

      expect(getAngleCacheStats().size).toBe(2);
    });
  });

  describe("canFormAspect", () => {
    it("should return true for valid triple aspect pattern within tolerance", () => {
      const result = canFormAspect({
        longitudes: [0, 90, 180],
        requiredAngles: [90, 90, 180],
        maxOrb: 10,
      });

      expect(result).toBe(true);
    });

    it("should return false for triple aspect pattern outside tolerance", () => {
      const result = canFormAspect({
        longitudes: [0, 45, 90],
        requiredAngles: [90, 90, 180],
        maxOrb: 10,
      });

      expect(result).toBe(false);
    });

    it("should check all permutations of required angles", () => {
      // Pattern where angles match after permutation
      const result = canFormAspect({
        longitudes: [0, 120, 240],
        requiredAngles: [120, 120, 120],
        maxOrb: 10,
      });

      expect(result).toBe(true);
    });

    it("should return true for non-triple aspect cases", () => {
      const result = canFormAspect({
        longitudes: [0, 90],
        requiredAngles: [90],
        maxOrb: 10,
      });

      expect(result).toBe(true);
    });

    it("should return true for mismatched array lengths", () => {
      const result = canFormAspect({
        longitudes: [0, 90, 180],
        requiredAngles: [90, 90],
        maxOrb: 10,
      });

      expect(result).toBe(true);
    });
  });

  describe("couldBeTSquare", () => {
    it("should return true for valid T-Square pattern", () => {
      // Opposition (180°) between first two, squares (90°) to third
      const result = couldBeTSquare([0, 180, 90]);

      expect(result).toBe(true);
    });

    it("should return false for invalid T-Square pattern", () => {
      const result = couldBeTSquare([0, 30, 60]);

      expect(result).toBe(false);
    });

    it("should accept pattern within generous orb", () => {
      // Slightly off but within 2x orb buffer (20°)
      const result = couldBeTSquare([0, 175, 85]);

      expect(result).toBe(true);
    });
  });

  describe("couldBeYod", () => {
    it("should return true for valid Yod pattern", () => {
      // Sextile (60°) between two, quincunxes (150°) to third
      const result = couldBeYod([0, 60, 210]);

      expect(result).toBe(true);
    });

    it("should return false for invalid Yod pattern", () => {
      const result = couldBeYod([0, 90, 180]);

      expect(result).toBe(false);
    });

    it("should accept pattern within generous orb", () => {
      const result = couldBeYod([0, 65, 205]);

      expect(result).toBe(true);
    });
  });

  describe("couldBeGrandTrine", () => {
    it("should return true for valid Grand Trine pattern", () => {
      // Three bodies at 120° intervals
      const result = couldBeGrandTrine([0, 120, 240]);

      expect(result).toBe(true);
    });

    it("should return false for invalid Grand Trine pattern", () => {
      const result = couldBeGrandTrine([0, 90, 180]);

      expect(result).toBe(false);
    });

    it("should accept pattern within generous orb", () => {
      const result = couldBeGrandTrine([0, 115, 235]);

      expect(result).toBe(true);
    });
  });

  describe("couldBeKite", () => {
    it("should return true when at least one opposition exists", () => {
      // Grand Trine plus one opposition
      const result = couldBeKite([0, 120, 180, 240]);

      expect(result).toBe(true);
    });

    it("should return false when no oppositions exist", () => {
      // No pairs 180° apart (all within 120° span)
      const result = couldBeKite([0, 30, 60, 90]);

      expect(result).toBe(false);
    });

    it("should accept opposition within generous orb", () => {
      const result = couldBeKite([0, 120, 195, 240]);

      expect(result).toBe(true);
    });
  });

  describe("couldBeGrandCross", () => {
    it("should return true when two oppositions exist", () => {
      // Four bodies forming cross: 0°, 90°, 180°, 270°
      const result = couldBeGrandCross([0, 90, 180, 270]);

      expect(result).toBe(true);
    });

    it("should return false when fewer than two oppositions exist", () => {
      const result = couldBeGrandCross([0, 60, 120, 180]);

      expect(result).toBe(false);
    });

    it("should accept oppositions within generous orb", () => {
      const result = couldBeGrandCross([0, 90, 175, 265]);

      expect(result).toBe(true);
    });
  });

  describe("couldBePentagram", () => {
    it("should return true for valid Pentagram pattern", () => {
      // Five bodies evenly spaced at 72° intervals
      const result = couldBePentagram([0, 72, 144, 216, 288]);

      expect(result).toBe(true);
    });

    it("should return false when insufficient quintile aspects exist", () => {
      const result = couldBePentagram([0, 30, 60, 90, 120]);

      expect(result).toBe(false);
    });

    it("should accept pattern with some tolerance", () => {
      // Slightly off but most pairs are close to 72° or 144°
      const result = couldBePentagram([0, 75, 140, 220, 285]);

      expect(result).toBe(true);
    });

    it("should require at least 7 quintile pairs", () => {
      // Only 6 pairs match (not enough)
      const result = couldBePentagram([0, 72, 144, 180, 252]);

      expect(result).toBe(false);
    });
  });

  describe("couldBeHexagram", () => {
    it("should return true for valid Hexagram pattern", () => {
      // Six bodies evenly spaced at 60° intervals
      const result = couldBeHexagram([0, 60, 120, 180, 240, 300]);

      expect(result).toBe(true);
    });

    it("should return false when spacing is incorrect", () => {
      const result = couldBeHexagram([0, 30, 60, 90, 120, 150]);

      expect(result).toBe(false);
    });

    it("should require both good spacing and oppositions", () => {
      // Good spacing but no oppositions
      const result = couldBeHexagram([0, 50, 100, 150, 200, 250]);

      expect(result).toBe(false);
    });

    it("should accept pattern with tolerance", () => {
      const result = couldBeHexagram([0, 65, 120, 185, 240, 305]);

      expect(result).toBe(true);
    });

    it("should handle wrap-around spacing correctly", () => {
      const result = couldBeHexagram([0, 60, 120, 180, 240, 300]);

      expect(result).toBe(true);
    });
  });

  describe("couldBeStellium", () => {
    it("should return true for tightly grouped planets", () => {
      // All within 10° span
      const result = couldBeStellium([0, 5, 10]);

      expect(result).toBe(true);
    });

    it("should return false for fewer than 3 planets", () => {
      const result = couldBeStellium([0, 5]);

      expect(result).toBe(false);
    });

    it("should return false for widely spread planets", () => {
      const result = couldBeStellium([0, 50, 100]);

      expect(result).toBe(false);
    });

    it("should use custom maxOrb parameter", () => {
      const result = couldBeStellium([0, 10, 20], 15);

      expect(result).toBe(true);
    });

    it("should use default maxOrb of 10 when not specified", () => {
      const result = couldBeStellium([0, 8, 15]);

      expect(result).toBe(true);
    });

    it("should handle zodiac wrap-around correctly", () => {
      // Planets near 0°/360° boundary
      const result = couldBeStellium([355, 0, 5]);

      expect(result).toBe(true);
    });

    it("should reject wrap-around when span is too large", () => {
      const result = couldBeStellium([340, 0, 20]);

      expect(result).toBe(false);
    });

    it("should apply 1.5x buffer to maxOrb", () => {
      // Span of 14° is within 10 * 1.5 = 15°
      const result = couldBeStellium([0, 7, 14], 10);

      expect(result).toBe(true);
    });
  });
});
