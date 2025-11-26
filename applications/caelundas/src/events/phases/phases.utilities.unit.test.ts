import { describe, it, expect } from "vitest";
import {
  isBrightest,
  isWesternBrightest,
  isEasternBrightest,
  isEasternElongation,
  isWesternElongation,
  isMorningRise,
  isMorningSet,
  isEveningRise,
  isEveningSet,
} from "./phases.utilities";

describe("phases.utilities", () => {
  describe("brightness functions", () => {
    describe("isBrightest", () => {
      it("should return true when current brightness is maximum", () => {
        const result = isBrightest({
          currentDistance: 1.0,
          currentIllumination: 0.9,
          previousDistances: [1.1, 1.05],
          previousIlluminations: [0.8, 0.85],
          nextDistances: [1.05, 1.1],
          nextIlluminations: [0.85, 0.8],
        });

        expect(result).toBe(true);
      });

      it("should return false when previous was brighter", () => {
        const result = isBrightest({
          currentDistance: 1.0,
          currentIllumination: 0.5,
          previousDistances: [0.8], // Closer = brighter
          previousIlluminations: [0.9],
          nextDistances: [1.1],
          nextIlluminations: [0.4],
        });

        expect(result).toBe(false);
      });

      it("should return false when next will be brighter", () => {
        const result = isBrightest({
          currentDistance: 1.0,
          currentIllumination: 0.5,
          previousDistances: [1.2],
          previousIlluminations: [0.4],
          nextDistances: [0.8], // Closer = brighter
          nextIlluminations: [0.9],
        });

        expect(result).toBe(false);
      });

      it("should throw when previous arrays have different lengths", () => {
        expect(() =>
          isBrightest({
            currentDistance: 1.0,
            currentIllumination: 0.5,
            previousDistances: [1.0, 1.1], // 2 elements
            previousIlluminations: [0.5], // 1 element
            nextDistances: [1.0],
            nextIlluminations: [0.5],
          })
        ).toThrow("same length");
      });

      it("should throw when next arrays have different lengths", () => {
        expect(() =>
          isBrightest({
            currentDistance: 1.0,
            currentIllumination: 0.5,
            previousDistances: [1.0],
            previousIlluminations: [0.5],
            nextDistances: [1.0, 1.1], // 2 elements
            nextIlluminations: [0.5], // 1 element
          })
        ).toThrow("same length");
      });
    });

    describe("isWesternBrightest", () => {
      it("should return true when planet is western and brightest", () => {
        const result = isWesternBrightest({
          currentDistance: 1.0,
          currentIllumination: 0.9,
          previousDistances: [1.1],
          previousIlluminations: [0.8],
          nextDistances: [1.1],
          nextIlluminations: [0.8],
          currentLongitudePlanet: 90, // West of Sun
          currentLongitudeSun: 100,
        });

        expect(result).toBe(true);
      });

      it("should return false when planet is eastern", () => {
        const result = isWesternBrightest({
          currentDistance: 1.0,
          currentIllumination: 0.9,
          previousDistances: [1.1],
          previousIlluminations: [0.8],
          nextDistances: [1.1],
          nextIlluminations: [0.8],
          currentLongitudePlanet: 110, // East of Sun
          currentLongitudeSun: 100,
        });

        expect(result).toBe(false);
      });
    });

    describe("isEasternBrightest", () => {
      it("should return true when planet is eastern and brightest", () => {
        const result = isEasternBrightest({
          currentDistance: 1.0,
          currentIllumination: 0.9,
          previousDistances: [1.1],
          previousIlluminations: [0.8],
          nextDistances: [1.1],
          nextIlluminations: [0.8],
          currentLongitudePlanet: 110, // East of Sun
          currentLongitudeSun: 100,
        });

        expect(result).toBe(true);
      });

      it("should return false when planet is western", () => {
        const result = isEasternBrightest({
          currentDistance: 1.0,
          currentIllumination: 0.9,
          previousDistances: [1.1],
          previousIlluminations: [0.8],
          nextDistances: [1.1],
          nextIlluminations: [0.8],
          currentLongitudePlanet: 90, // West of Sun
          currentLongitudeSun: 100,
        });

        expect(result).toBe(false);
      });
    });
  });

  describe("elongation functions", () => {
    describe("isEasternElongation", () => {
      it("should return true at eastern elongation (maximum angle, planet east)", () => {
        const result = isEasternElongation({
          currentLongitudePlanet: 145, // East of Sun
          currentLongitudeSun: 100,
          previousLongitudePlanet: 140,
          previousLongitudeSun: 100,
          nextLongitudePlanet: 140, // Angle decreasing
          nextLongitudeSun: 100,
        });

        expect(result).toBe(true);
      });

      it("should return false when planet is western", () => {
        const result = isEasternElongation({
          currentLongitudePlanet: 55, // West of Sun
          currentLongitudeSun: 100,
          previousLongitudePlanet: 50,
          previousLongitudeSun: 100,
          nextLongitudePlanet: 50,
          nextLongitudeSun: 100,
        });

        expect(result).toBe(false);
      });

      it("should return false when not at maximum elongation", () => {
        const result = isEasternElongation({
          currentLongitudePlanet: 130,
          currentLongitudeSun: 100,
          previousLongitudePlanet: 120,
          previousLongitudeSun: 100,
          nextLongitudePlanet: 140, // Still increasing
          nextLongitudeSun: 100,
        });

        expect(result).toBe(false);
      });
    });

    describe("isWesternElongation", () => {
      it("should return true at western elongation (maximum angle, planet west)", () => {
        const result = isWesternElongation({
          currentLongitudePlanet: 55, // West of Sun
          currentLongitudeSun: 100,
          previousLongitudePlanet: 60,
          previousLongitudeSun: 100,
          nextLongitudePlanet: 60, // Angle decreasing
          nextLongitudeSun: 100,
        });

        expect(result).toBe(true);
      });

      it("should return false when planet is eastern", () => {
        const result = isWesternElongation({
          currentLongitudePlanet: 145, // East of Sun
          currentLongitudeSun: 100,
          previousLongitudePlanet: 140,
          previousLongitudeSun: 100,
          nextLongitudePlanet: 140,
          nextLongitudeSun: 100,
        });

        expect(result).toBe(false);
      });
    });
  });

  describe("rise/set functions", () => {
    // Rise/set threshold is civil twilight = 6 degrees

    describe("isMorningRise", () => {
      it("should return true for morning rise (western planet, crossing above threshold)", () => {
        const result = isMorningRise({
          currentLongitudePlanet: 90, // West of Sun (morning star)
          currentLongitudeSun: 100,
          previousLongitudePlanet: 95, // Was closer to Sun (below threshold)
          previousLongitudeSun: 100,
        });

        expect(result).toBe(true);
      });

      it("should return false when planet is eastern", () => {
        const result = isMorningRise({
          currentLongitudePlanet: 110, // East of Sun
          currentLongitudeSun: 100,
          previousLongitudePlanet: 105,
          previousLongitudeSun: 100,
        });

        expect(result).toBe(false);
      });
    });

    describe("isMorningSet", () => {
      it("should return true for morning set (western planet, crossing below threshold)", () => {
        const result = isMorningSet({
          currentLongitudePlanet: 95, // West of Sun (morning star), close to Sun
          currentLongitudeSun: 100,
          previousLongitudePlanet: 90, // Was farther from Sun (above threshold)
          previousLongitudeSun: 100,
        });

        expect(result).toBe(true);
      });

      it("should return false when planet is eastern", () => {
        const result = isMorningSet({
          currentLongitudePlanet: 105, // East of Sun
          currentLongitudeSun: 100,
          previousLongitudePlanet: 110,
          previousLongitudeSun: 100,
        });

        expect(result).toBe(false);
      });
    });

    describe("isEveningRise", () => {
      it("should return true for evening rise (eastern planet, crossing above threshold)", () => {
        const result = isEveningRise({
          currentLongitudePlanet: 110, // East of Sun (evening star)
          currentLongitudeSun: 100,
          previousLongitudePlanet: 105, // Was closer to Sun (below threshold)
          previousLongitudeSun: 100,
        });

        expect(result).toBe(true);
      });

      it("should return false when planet is western", () => {
        const result = isEveningRise({
          currentLongitudePlanet: 90, // West of Sun
          currentLongitudeSun: 100,
          previousLongitudePlanet: 95,
          previousLongitudeSun: 100,
        });

        expect(result).toBe(false);
      });
    });

    describe("isEveningSet", () => {
      it("should return true for evening set (eastern planet, crossing below threshold)", () => {
        const result = isEveningSet({
          currentLongitudePlanet: 105, // East of Sun (evening star), close to Sun
          currentLongitudeSun: 100,
          previousLongitudePlanet: 110, // Was farther from Sun (above threshold)
          previousLongitudeSun: 100,
        });

        expect(result).toBe(true);
      });

      it("should return false when planet is western", () => {
        const result = isEveningSet({
          currentLongitudePlanet: 95, // West of Sun
          currentLongitudeSun: 100,
          previousLongitudePlanet: 90,
          previousLongitudeSun: 100,
        });

        expect(result).toBe(false);
      });
    });
  });
});
