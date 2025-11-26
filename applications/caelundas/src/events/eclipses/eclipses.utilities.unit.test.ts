import { describe, it, expect } from "vitest";
import { isSolarEclipse, isLunarEclipse } from "./eclipses.utilities";

describe("eclipses.utilities", () => {
  describe("isSolarEclipse", () => {
    // Default diameters (approximate angular diameters in degrees)
    const defaultDiameters = {
      currentDiameterMoon: 0.5,
      currentDiameterSun: 0.5,
    };

    it("should return 'maximum' at solar eclipse maximum", () => {
      // At maximum, the Sun-Moon longitude angle is at minimum
      const result = isSolarEclipse({
        ...defaultDiameters,
        currentLatitudeMoon: 0,
        currentLatitudeSun: 0,
        currentLongitudeMoon: 100, // Same as Sun = conjunction
        currentLongitudeSun: 100,
        previousLongitudeMoon: 99, // Was approaching
        previousLongitudeSun: 100,
        nextLongitudeMoon: 101, // Will be leaving
        nextLongitudeSun: 100,
      });

      expect(result).toBe("maximum");
    });

    it("should return 'beginning' when eclipse starts", () => {
      const diameter = 0.5 + 0.5; // Combined diameter = 1 degree

      const result = isSolarEclipse({
        ...defaultDiameters,
        currentLatitudeMoon: 0,
        currentLatitudeSun: 0,
        currentLongitudeMoon: 100 + diameter * 0.5, // Just inside eclipse
        currentLongitudeSun: 100,
        previousLongitudeMoon: 100 + diameter * 1.5, // Was outside
        previousLongitudeSun: 100,
        nextLongitudeMoon: 100 + diameter * 0.3, // Moving closer
        nextLongitudeSun: 100,
      });

      expect(result).toBe("beginning");
    });

    it("should return 'ending' when eclipse ends", () => {
      const diameter = 0.5 + 0.5; // Combined diameter = 1 degree

      const result = isSolarEclipse({
        ...defaultDiameters,
        currentLatitudeMoon: 0,
        currentLatitudeSun: 0,
        currentLongitudeMoon: 100 + diameter * 0.5, // Just inside eclipse
        currentLongitudeSun: 100,
        previousLongitudeMoon: 100 + diameter * 0.3, // Was closer
        previousLongitudeSun: 100,
        nextLongitudeMoon: 100 + diameter * 1.5, // Will be outside
        nextLongitudeSun: 100,
      });

      expect(result).toBe("ending");
    });

    it("should return null when latitude too far for eclipse", () => {
      const result = isSolarEclipse({
        ...defaultDiameters,
        currentLatitudeMoon: 5, // Far from Sun's latitude
        currentLatitudeSun: 0,
        currentLongitudeMoon: 100,
        currentLongitudeSun: 100,
        previousLongitudeMoon: 99,
        previousLongitudeSun: 100,
        nextLongitudeMoon: 101,
        nextLongitudeSun: 100,
      });

      expect(result).toBeNull();
    });

    it("should return null when not at conjunction", () => {
      const result = isSolarEclipse({
        ...defaultDiameters,
        currentLatitudeMoon: 0,
        currentLatitudeSun: 0,
        currentLongitudeMoon: 190, // Far from Sun
        currentLongitudeSun: 100,
        previousLongitudeMoon: 189,
        previousLongitudeSun: 100,
        nextLongitudeMoon: 191,
        nextLongitudeSun: 100,
      });

      expect(result).toBeNull();
    });
  });

  describe("isLunarEclipse", () => {
    const defaultDiameters = {
      currentDiameterMoon: 0.5,
      currentDiameterSun: 0.5,
    };

    it("should return 'maximum' at lunar eclipse maximum", () => {
      // At maximum, the Sun-Moon longitude angle is at maximum (180°)
      const result = isLunarEclipse({
        ...defaultDiameters,
        currentLatitudeMoon: 0,
        currentLatitudeSun: 0,
        currentLongitudeMoon: 280, // Opposite Sun = opposition
        currentLongitudeSun: 100,
        previousLongitudeMoon: 279, // Was approaching 180° separation
        previousLongitudeSun: 100,
        nextLongitudeMoon: 281, // Will be leaving 180° separation
        nextLongitudeSun: 100,
      });

      expect(result).toBe("maximum");
    });

    it("should return 'beginning' when lunar eclipse starts", () => {
      const diameter = 0.5 + 0.5;
      const oppositionThreshold = 180 - diameter;

      const result = isLunarEclipse({
        ...defaultDiameters,
        currentLatitudeMoon: 0,
        currentLatitudeSun: 0,
        currentLongitudeMoon: 100 + oppositionThreshold + 0.5, // Just crossed threshold
        currentLongitudeSun: 100,
        previousLongitudeMoon: 100 + oppositionThreshold - 0.5, // Was before threshold
        previousLongitudeSun: 100,
        nextLongitudeMoon: 100 + oppositionThreshold + 1, // Moving toward opposition
        nextLongitudeSun: 100,
      });

      expect(result).toBe("beginning");
    });

    it("should return 'ending' when lunar eclipse ends", () => {
      const diameter = 0.5 + 0.5;
      const oppositionThreshold = 180 - diameter;

      const result = isLunarEclipse({
        ...defaultDiameters,
        currentLatitudeMoon: 0,
        currentLatitudeSun: 0,
        currentLongitudeMoon: 100 + oppositionThreshold + 0.5, // Still inside threshold
        currentLongitudeSun: 100,
        previousLongitudeMoon: 100 + oppositionThreshold + 1, // Was closer to opposition
        previousLongitudeSun: 100,
        nextLongitudeMoon: 100 + oppositionThreshold - 0.5, // Will be outside
        nextLongitudeSun: 100,
      });

      expect(result).toBe("ending");
    });

    it("should return null when latitude too far for eclipse", () => {
      const result = isLunarEclipse({
        ...defaultDiameters,
        currentLatitudeMoon: 5, // Far from Sun's latitude
        currentLatitudeSun: 0,
        currentLongitudeMoon: 280,
        currentLongitudeSun: 100,
        previousLongitudeMoon: 279,
        previousLongitudeSun: 100,
        nextLongitudeMoon: 281,
        nextLongitudeSun: 100,
      });

      expect(result).toBeNull();
    });

    it("should return null when not at opposition", () => {
      const result = isLunarEclipse({
        ...defaultDiameters,
        currentLatitudeMoon: 0,
        currentLatitudeSun: 0,
        currentLongitudeMoon: 150, // Not at opposition
        currentLongitudeSun: 100,
        previousLongitudeMoon: 149,
        previousLongitudeSun: 100,
        nextLongitudeMoon: 151,
        nextLongitudeSun: 100,
      });

      expect(result).toBeNull();
    });
  });
});
