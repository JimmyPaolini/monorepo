import { describe, it, expect } from "vitest";
import {
  isNewMoon,
  isFullMoon,
  isLunarPhase,
  illuminationByPhase,
} from "./monthlyLunarCycle.utilities";

describe("monthlyLunarCycle.utilities", () => {
  describe("illuminationByPhase", () => {
    it("should have correct illumination values for all phases", () => {
      expect(illuminationByPhase.new).toBe(0);
      expect(illuminationByPhase["waxing crescent"]).toBe(0.25);
      expect(illuminationByPhase["first quarter"]).toBe(0.5);
      expect(illuminationByPhase["waxing gibbous"]).toBe(0.75);
      expect(illuminationByPhase.full).toBe(1);
      expect(illuminationByPhase["waning gibbous"]).toBe(0.75);
      expect(illuminationByPhase["last quarter"]).toBe(0.5);
      expect(illuminationByPhase["waning crescent"]).toBe(0.25);
    });
  });

  describe("isNewMoon", () => {
    it("should return true at new moon (minimum illumination)", () => {
      const result = isNewMoon({
        currentIllumination: 1,
        previousIlluminations: [5, 3],
        nextIlluminations: [3, 5],
      });

      expect(result).toBe(true);
    });

    it("should return false when illumination is not minimum", () => {
      const result = isNewMoon({
        currentIllumination: 10,
        previousIlluminations: [5, 8],
        nextIlluminations: [12, 15],
      });

      expect(result).toBe(false);
    });

    it("should return false when illumination is above 50", () => {
      // Even if it's minimum, if above 50% it's not a new moon
      const result = isNewMoon({
        currentIllumination: 55,
        previousIlluminations: [60, 58],
        nextIlluminations: [58, 60],
      });

      expect(result).toBe(false);
    });

    it("should handle edge case where current equals next minimum", () => {
      const result = isNewMoon({
        currentIllumination: 2,
        previousIlluminations: [5, 3],
        nextIlluminations: [2, 5], // Current equals min of next
      });

      expect(result).toBe(true);
    });
  });

  describe("isFullMoon", () => {
    it("should return true at full moon (maximum illumination)", () => {
      const result = isFullMoon({
        currentIllumination: 99,
        previousIlluminations: [95, 97],
        nextIlluminations: [97, 95],
      });

      expect(result).toBe(true);
    });

    it("should return false when illumination is not maximum", () => {
      const result = isFullMoon({
        currentIllumination: 80,
        previousIlluminations: [75, 78],
        nextIlluminations: [85, 90],
      });

      expect(result).toBe(false);
    });

    it("should return false when illumination is below 50", () => {
      // Even if it's maximum locally, if below 50% it's not a full moon
      const result = isFullMoon({
        currentIllumination: 45,
        previousIlluminations: [40, 42],
        nextIlluminations: [42, 40],
      });

      expect(result).toBe(false);
    });

    it("should handle edge case where current equals next maximum", () => {
      const result = isFullMoon({
        currentIllumination: 98,
        previousIlluminations: [95, 97],
        nextIlluminations: [98, 95], // Current equals max of next
      });

      expect(result).toBe(true);
    });
  });

  describe("isLunarPhase", () => {
    describe("new moon phase", () => {
      it("should delegate to isNewMoon", () => {
        const result = isLunarPhase({
          currentIllumination: 1,
          previousIlluminations: [5, 3],
          nextIlluminations: [3, 5],
          lunarPhase: "new",
        });

        expect(result).toBe(true);
      });
    });

    describe("full moon phase", () => {
      it("should delegate to isFullMoon", () => {
        const result = isLunarPhase({
          currentIllumination: 99,
          previousIlluminations: [95, 97],
          nextIlluminations: [97, 95],
          lunarPhase: "full",
        });

        expect(result).toBe(true);
      });
    });

    describe("waxing crescent", () => {
      it("should return true when crossing 25% threshold while waxing", () => {
        const result = isLunarPhase({
          currentIllumination: 26, // Above 25%
          previousIlluminations: [24], // Was below 25%
          nextIlluminations: [28],
          lunarPhase: "waxing crescent",
        });

        expect(result).toBe(true);
      });

      it("should return false when waning", () => {
        const result = isLunarPhase({
          currentIllumination: 24, // Below 25%
          previousIlluminations: [26], // Was above 25%
          nextIlluminations: [22],
          lunarPhase: "waxing crescent",
        });

        expect(result).toBe(false);
      });
    });

    describe("first quarter", () => {
      it("should return true when crossing 50% threshold while waxing", () => {
        const result = isLunarPhase({
          currentIllumination: 51, // Above 50%
          previousIlluminations: [49], // Was below 50%
          nextIlluminations: [53],
          lunarPhase: "first quarter",
        });

        expect(result).toBe(true);
      });

      it("should return false when not crossing threshold", () => {
        const result = isLunarPhase({
          currentIllumination: 55,
          previousIlluminations: [52],
          nextIlluminations: [58],
          lunarPhase: "first quarter",
        });

        expect(result).toBe(false);
      });
    });

    describe("waxing gibbous", () => {
      it("should return true when crossing 75% threshold while waxing", () => {
        const result = isLunarPhase({
          currentIllumination: 76, // Above 75%
          previousIlluminations: [74], // Was below 75%
          nextIlluminations: [78],
          lunarPhase: "waxing gibbous",
        });

        expect(result).toBe(true);
      });
    });

    describe("waning gibbous", () => {
      it("should return true when crossing 75% threshold while waning", () => {
        const result = isLunarPhase({
          currentIllumination: 74, // Below 75%
          previousIlluminations: [76], // Was above 75%
          nextIlluminations: [72],
          lunarPhase: "waning gibbous",
        });

        expect(result).toBe(true);
      });

      it("should return false when waxing", () => {
        const result = isLunarPhase({
          currentIllumination: 76, // Above 75%
          previousIlluminations: [74], // Was below 75%
          nextIlluminations: [78],
          lunarPhase: "waning gibbous",
        });

        expect(result).toBe(false);
      });
    });

    describe("last quarter", () => {
      it("should return true when crossing 50% threshold while waning", () => {
        const result = isLunarPhase({
          currentIllumination: 49, // Below 50%
          previousIlluminations: [51], // Was above 50%
          nextIlluminations: [47],
          lunarPhase: "last quarter",
        });

        expect(result).toBe(true);
      });
    });

    describe("waning crescent", () => {
      it("should return true when crossing 25% threshold while waning", () => {
        const result = isLunarPhase({
          currentIllumination: 24, // Below 25%
          previousIlluminations: [26], // Was above 25%
          nextIlluminations: [22],
          lunarPhase: "waning crescent",
        });

        expect(result).toBe(true);
      });
    });
  });
});
