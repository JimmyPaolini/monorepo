import { describe, expect, it } from "vitest";

import {
  degreeRangeBySign,
  getDecan,
  getSign,
  isDecanIngress,
  isPeakIngress,
  isSignIngress,
} from "./ingresses.utilities";

describe("ingresses.utilities", () => {
  describe("degreeRangeBySign", () => {
    it("should have correct ranges for all signs", () => {
      expect(degreeRangeBySign.aries).toEqual({ min: 0, max: 30 });
      expect(degreeRangeBySign.taurus).toEqual({ min: 30, max: 60 });
      expect(degreeRangeBySign.gemini).toEqual({ min: 60, max: 90 });
      expect(degreeRangeBySign.cancer).toEqual({ min: 90, max: 120 });
      expect(degreeRangeBySign.leo).toEqual({ min: 120, max: 150 });
      expect(degreeRangeBySign.virgo).toEqual({ min: 150, max: 180 });
      expect(degreeRangeBySign.libra).toEqual({ min: 180, max: 210 });
      expect(degreeRangeBySign.scorpio).toEqual({ min: 210, max: 240 });
      expect(degreeRangeBySign.sagittarius).toEqual({ min: 240, max: 270 });
      expect(degreeRangeBySign.capricorn).toEqual({ min: 270, max: 300 });
      expect(degreeRangeBySign.aquarius).toEqual({ min: 300, max: 330 });
      expect(degreeRangeBySign.pisces).toEqual({ min: 330, max: 360 });
    });
  });

  describe("getSign", () => {
    it("should return correct sign for start of each sign", () => {
      expect(getSign(0)).toBe("aries");
      expect(getSign(30)).toBe("taurus");
      expect(getSign(60)).toBe("gemini");
      expect(getSign(90)).toBe("cancer");
      expect(getSign(120)).toBe("leo");
      expect(getSign(150)).toBe("virgo");
      expect(getSign(180)).toBe("libra");
      expect(getSign(210)).toBe("scorpio");
      expect(getSign(240)).toBe("sagittarius");
      expect(getSign(270)).toBe("capricorn");
      expect(getSign(300)).toBe("aquarius");
      expect(getSign(330)).toBe("pisces");
    });

    it("should return correct sign for middle of each sign", () => {
      expect(getSign(15)).toBe("aries");
      expect(getSign(45)).toBe("taurus");
      expect(getSign(75)).toBe("gemini");
      expect(getSign(105)).toBe("cancer");
      expect(getSign(135)).toBe("leo");
      expect(getSign(165)).toBe("virgo");
      expect(getSign(195)).toBe("libra");
      expect(getSign(225)).toBe("scorpio");
      expect(getSign(255)).toBe("sagittarius");
      expect(getSign(285)).toBe("capricorn");
      expect(getSign(315)).toBe("aquarius");
      expect(getSign(345)).toBe("pisces");
    });

    it("should return correct sign for end of each sign (exclusive)", () => {
      expect(getSign(29.99)).toBe("aries");
      expect(getSign(59.99)).toBe("taurus");
      expect(getSign(89.99)).toBe("gemini");
      expect(getSign(119.99)).toBe("cancer");
      expect(getSign(149.99)).toBe("leo");
      expect(getSign(179.99)).toBe("virgo");
      expect(getSign(209.99)).toBe("libra");
      expect(getSign(239.99)).toBe("scorpio");
      expect(getSign(269.99)).toBe("sagittarius");
      expect(getSign(299.99)).toBe("capricorn");
      expect(getSign(329.99)).toBe("aquarius");
      expect(getSign(359.99)).toBe("pisces");
    });

    it("should throw for longitude outside 0-360 range", () => {
      expect(() => getSign(360)).toThrow();
      expect(() => getSign(-1)).toThrow();
      expect(() => getSign(400)).toThrow();
    });
  });

  describe("isSignIngress", () => {
    it("should return true when crossing sign boundary", () => {
      // Aries to Taurus
      expect(
        isSignIngress({ previousLongitude: 29.9, currentLongitude: 30.1 })
      ).toBe(true);

      // Pisces to Aries (crossing 0/360)
      expect(
        isSignIngress({ previousLongitude: 359.9, currentLongitude: 0.1 })
      ).toBe(true);
    });

    it("should return false when staying in same sign", () => {
      expect(
        isSignIngress({ previousLongitude: 15, currentLongitude: 16 })
      ).toBe(false);

      expect(
        isSignIngress({ previousLongitude: 29, currentLongitude: 29.5 })
      ).toBe(false);
    });
  });

  describe("getDecan", () => {
    it("should return decan 1 for degrees 0-9 within a sign", () => {
      expect(getDecan(0)).toBe(1); // Aries 0-9
      expect(getDecan(9)).toBe(1);
      expect(getDecan(30)).toBe(1); // Taurus 0-9
      expect(getDecan(39)).toBe(1);
    });

    it("should return decan 2 for degrees 10-19 within a sign", () => {
      expect(getDecan(10)).toBe(2); // Aries 10-19
      expect(getDecan(19)).toBe(2);
      expect(getDecan(40)).toBe(2); // Taurus 10-19
      expect(getDecan(49)).toBe(2);
    });

    it("should return decan 3 for degrees 20-29 within a sign", () => {
      expect(getDecan(20)).toBe(3); // Aries 20-29
      expect(getDecan(29)).toBe(3);
      expect(getDecan(50)).toBe(3); // Taurus 20-29
      expect(getDecan(59)).toBe(3);
    });
  });

  describe("isDecanIngress", () => {
    it("should return true when crossing decan boundary within same sign", () => {
      // Decan 1 to Decan 2
      expect(
        isDecanIngress({ previousLongitude: 9.9, currentLongitude: 10.1 })
      ).toBe(true);

      // Decan 2 to Decan 3
      expect(
        isDecanIngress({ previousLongitude: 19.9, currentLongitude: 20.1 })
      ).toBe(true);
    });

    it("should return true when crossing sign boundary (also decan boundary)", () => {
      expect(
        isDecanIngress({ previousLongitude: 29.9, currentLongitude: 30.1 })
      ).toBe(true);
    });

    it("should return false when staying in same decan", () => {
      expect(
        isDecanIngress({ previousLongitude: 5, currentLongitude: 6 })
      ).toBe(false);

      expect(
        isDecanIngress({ previousLongitude: 15, currentLongitude: 16 })
      ).toBe(false);
    });
  });

  describe("isPeakIngress", () => {
    it("should return true when crossing 15 degrees within a sign", () => {
      // Crossing 15° in Aries
      expect(
        isPeakIngress({ previousLongitude: 14.9, currentLongitude: 15.1 })
      ).toBe(true);

      // Crossing 15° in Taurus (30 + 15 = 45)
      expect(
        isPeakIngress({ previousLongitude: 44.9, currentLongitude: 45.1 })
      ).toBe(true);
    });

    it("should return false when not crossing 15 degrees", () => {
      expect(
        isPeakIngress({ previousLongitude: 10, currentLongitude: 11 })
      ).toBe(false);

      expect(
        isPeakIngress({ previousLongitude: 16, currentLongitude: 17 })
      ).toBe(false);
    });

    it("should return false when crossing sign boundary (not peak)", () => {
      // Crossing from Aries (29.9°) to Taurus (30.1°) is NOT a peak ingress
      // because 30.1 - 30 = 0.1, which is < 15
      expect(
        isPeakIngress({ previousLongitude: 29.9, currentLongitude: 30.1 })
      ).toBe(false);
    });
  });
});
