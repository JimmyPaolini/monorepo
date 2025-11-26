import { describe, it, expect } from "vitest";
import {
  isVernalEquinox,
  isFirstHexadecan,
  isBeltane,
  isThirdHexadecan,
  isSummerSolstice,
  isFifthHexadecan,
  isLammas,
  isSeventhHexadecan,
  isAutumnalEquinox,
  isNinthHexadecan,
  isSamhain,
  isEleventhHexadecan,
  isWinterSolstice,
  isThirteenthHexadecan,
  isImbolc,
  isFifteenthHexadecan,
} from "./annualSolarCycle.utilities";

describe("annualSolarCycle.utilities", () => {
  describe("isVernalEquinox", () => {
    it("should return true when crossing 0° (from Pisces to Aries)", () => {
      // Vernal equinox: crossing from >180 (after autumnal) back to <180
      // This happens at 0° when going from ~359° to ~1°
      const result = isVernalEquinox({
        currentLongitude: 1, // Just entered Aries
        previousLongitude: 359, // Was in Pisces
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing the boundary", () => {
      const result = isVernalEquinox({
        currentLongitude: 10,
        previousLongitude: 5,
      });

      expect(result).toBe(false);
    });
  });

  describe("isFirstHexadecan (22.5°)", () => {
    it("should return true when crossing 22.5°", () => {
      const result = isFirstHexadecan({
        currentLongitude: 23,
        previousLongitude: 22,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = isFirstHexadecan({
        currentLongitude: 21,
        previousLongitude: 20,
      });

      expect(result).toBe(false);
    });
  });

  describe("isBeltane (45°)", () => {
    it("should return true when crossing 45°", () => {
      const result = isBeltane({
        currentLongitude: 46,
        previousLongitude: 44,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = isBeltane({
        currentLongitude: 44,
        previousLongitude: 43,
      });

      expect(result).toBe(false);
    });
  });

  describe("isThirdHexadecan (67.5°)", () => {
    it("should return true when crossing 67.5°", () => {
      const result = isThirdHexadecan({
        currentLongitude: 68,
        previousLongitude: 67,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = isThirdHexadecan({
        currentLongitude: 66,
        previousLongitude: 65,
      });

      expect(result).toBe(false);
    });
  });

  describe("isSummerSolstice (90°)", () => {
    it("should return true when crossing 90°", () => {
      const result = isSummerSolstice({
        currentLongitude: 91,
        previousLongitude: 89,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = isSummerSolstice({
        currentLongitude: 88,
        previousLongitude: 87,
      });

      expect(result).toBe(false);
    });
  });

  describe("isFifthHexadecan (112.5°)", () => {
    it("should return true when crossing 112.5°", () => {
      const result = isFifthHexadecan({
        currentLongitude: 113,
        previousLongitude: 112,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = isFifthHexadecan({
        currentLongitude: 111,
        previousLongitude: 110,
      });

      expect(result).toBe(false);
    });
  });

  describe("isLammas (135°)", () => {
    it("should return true when crossing 135°", () => {
      const result = isLammas({
        currentLongitude: 136,
        previousLongitude: 134,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = isLammas({
        currentLongitude: 133,
        previousLongitude: 132,
      });

      expect(result).toBe(false);
    });
  });

  describe("isSeventhHexadecan (157.5°)", () => {
    it("should return true when crossing 157.5°", () => {
      const result = isSeventhHexadecan({
        currentLongitude: 158,
        previousLongitude: 157,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = isSeventhHexadecan({
        currentLongitude: 156,
        previousLongitude: 155,
      });

      expect(result).toBe(false);
    });
  });

  describe("isAutumnalEquinox (180°)", () => {
    it("should return true when crossing 180°", () => {
      const result = isAutumnalEquinox({
        currentLongitude: 181,
        previousLongitude: 179,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = isAutumnalEquinox({
        currentLongitude: 178,
        previousLongitude: 177,
      });

      expect(result).toBe(false);
    });
  });

  describe("isNinthHexadecan (202.5°)", () => {
    it("should return true when crossing 202.5°", () => {
      const result = isNinthHexadecan({
        currentLongitude: 203,
        previousLongitude: 202,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = isNinthHexadecan({
        currentLongitude: 201,
        previousLongitude: 200,
      });

      expect(result).toBe(false);
    });
  });

  describe("isSamhain (225°)", () => {
    it("should return true when crossing 225°", () => {
      const result = isSamhain({
        currentLongitude: 226,
        previousLongitude: 224,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = isSamhain({
        currentLongitude: 223,
        previousLongitude: 222,
      });

      expect(result).toBe(false);
    });
  });

  describe("isEleventhHexadecan (247.5°)", () => {
    it("should return true when crossing 247.5°", () => {
      const result = isEleventhHexadecan({
        currentLongitude: 248,
        previousLongitude: 247,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = isEleventhHexadecan({
        currentLongitude: 246,
        previousLongitude: 245,
      });

      expect(result).toBe(false);
    });
  });

  describe("isWinterSolstice (270°)", () => {
    it("should return true when crossing 270°", () => {
      const result = isWinterSolstice({
        currentLongitude: 271,
        previousLongitude: 269,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = isWinterSolstice({
        currentLongitude: 268,
        previousLongitude: 267,
      });

      expect(result).toBe(false);
    });
  });

  describe("isThirteenthHexadecan (292.5°)", () => {
    it("should return true when crossing 292.5°", () => {
      const result = isThirteenthHexadecan({
        currentLongitude: 293,
        previousLongitude: 292,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = isThirteenthHexadecan({
        currentLongitude: 291,
        previousLongitude: 290,
      });

      expect(result).toBe(false);
    });
  });

  describe("isImbolc (315°)", () => {
    it("should return true when crossing 315°", () => {
      const result = isImbolc({
        currentLongitude: 316,
        previousLongitude: 314,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = isImbolc({
        currentLongitude: 313,
        previousLongitude: 312,
      });

      expect(result).toBe(false);
    });
  });

  describe("isFifteenthHexadecan (337.5°)", () => {
    it("should return true when crossing 337.5°", () => {
      const result = isFifteenthHexadecan({
        currentLongitude: 338,
        previousLongitude: 337,
      });

      expect(result).toBe(true);
    });

    it("should return false when not crossing", () => {
      const result = isFifteenthHexadecan({
        currentLongitude: 336,
        previousLongitude: 335,
      });

      expect(result).toBe(false);
    });
  });
});
