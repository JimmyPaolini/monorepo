import { describe, expect, it } from "vitest";

import {
  getMajorAspect,
  getMajorAspectPhase,
  getMinorAspect,
  getMinorAspectPhase,
  getSpecialtyAspect,
  isAspect,
  isMajorAspect,
} from "./aspects.utilities";

describe("aspects.utilities", () => {
  describe("isAspect", () => {
    it("should return true for conjunction within orb", () => {
      expect(
        isAspect({ longitudeBody1: 0, longitudeBody2: 5, aspect: "conjunct" }),
      ).toBe(true);
      expect(
        isAspect({
          longitudeBody1: 100,
          longitudeBody2: 107,
          aspect: "conjunct",
        }),
      ).toBe(true);
    });

    it("should return false for conjunction outside orb", () => {
      expect(
        isAspect({ longitudeBody1: 0, longitudeBody2: 10, aspect: "conjunct" }),
      ).toBe(false);
    });

    it("should return true for opposition within orb", () => {
      expect(
        isAspect({
          longitudeBody1: 0,
          longitudeBody2: 180,
          aspect: "opposite",
        }),
      ).toBe(true);
      expect(
        isAspect({
          longitudeBody1: 0,
          longitudeBody2: 175,
          aspect: "opposite",
        }),
      ).toBe(true);
    });

    it("should return true for trine within orb", () => {
      expect(
        isAspect({ longitudeBody1: 0, longitudeBody2: 120, aspect: "trine" }),
      ).toBe(true);
      expect(
        isAspect({ longitudeBody1: 0, longitudeBody2: 115, aspect: "trine" }),
      ).toBe(true);
    });

    it("should return true for square within orb", () => {
      expect(
        isAspect({ longitudeBody1: 0, longitudeBody2: 90, aspect: "square" }),
      ).toBe(true);
      expect(
        isAspect({ longitudeBody1: 0, longitudeBody2: 85, aspect: "square" }),
      ).toBe(true);
    });

    it("should return true for sextile within orb", () => {
      expect(
        isAspect({ longitudeBody1: 0, longitudeBody2: 60, aspect: "sextile" }),
      ).toBe(true);
      expect(
        isAspect({ longitudeBody1: 0, longitudeBody2: 57, aspect: "sextile" }),
      ).toBe(true);
    });
  });

  describe("getMajorAspect", () => {
    it("should return conjunct for bodies at same longitude", () => {
      expect(getMajorAspect({ longitudeBody1: 45, longitudeBody2: 45 })).toBe(
        "conjunct",
      );
    });

    it("should return conjunct for bodies within conjunction orb", () => {
      expect(getMajorAspect({ longitudeBody1: 45, longitudeBody2: 50 })).toBe(
        "conjunct",
      );
    });

    it("should return opposite for bodies 180° apart", () => {
      expect(getMajorAspect({ longitudeBody1: 0, longitudeBody2: 180 })).toBe(
        "opposite",
      );
    });

    it("should return trine for bodies 120° apart", () => {
      expect(getMajorAspect({ longitudeBody1: 0, longitudeBody2: 120 })).toBe(
        "trine",
      );
      expect(getMajorAspect({ longitudeBody1: 0, longitudeBody2: 240 })).toBe(
        "trine",
      );
    });

    it("should return square for bodies 90° apart", () => {
      expect(getMajorAspect({ longitudeBody1: 0, longitudeBody2: 90 })).toBe(
        "square",
      );
      expect(getMajorAspect({ longitudeBody1: 0, longitudeBody2: 270 })).toBe(
        "square",
      );
    });

    it("should return sextile for bodies 60° apart", () => {
      expect(getMajorAspect({ longitudeBody1: 0, longitudeBody2: 60 })).toBe(
        "sextile",
      );
      expect(getMajorAspect({ longitudeBody1: 0, longitudeBody2: 300 })).toBe(
        "sextile",
      );
    });

    it("should return null when no major aspect is within orb", () => {
      // 45° is within semisquare orb but not a major aspect
      // 25° is not within any major aspect orb
      expect(
        getMajorAspect({ longitudeBody1: 0, longitudeBody2: 25 }),
      ).toBeNull();
      // 150° is quincunx (minor aspect), not major
      expect(
        getMajorAspect({ longitudeBody1: 0, longitudeBody2: 150 }),
      ).toBeNull();
    });

    it("should handle wrapping around 360°", () => {
      // Conjunction at 0/360 boundary - 355° and 2° are 7° apart
      expect(getMajorAspect({ longitudeBody1: 355, longitudeBody2: 2 })).toBe(
        "conjunct",
      );
    });
  });

  describe("getMinorAspect", () => {
    it("should return semisextile for bodies 30° apart", () => {
      expect(getMinorAspect({ longitudeBody1: 0, longitudeBody2: 30 })).toBe(
        "semisextile",
      );
    });

    it("should return semisquare for bodies 45° apart", () => {
      expect(getMinorAspect({ longitudeBody1: 0, longitudeBody2: 45 })).toBe(
        "semisquare",
      );
    });

    it("should return sesquiquadrate for bodies 135° apart", () => {
      expect(getMinorAspect({ longitudeBody1: 0, longitudeBody2: 135 })).toBe(
        "sesquiquadrate",
      );
    });

    it("should return quincunx for bodies 150° apart", () => {
      expect(getMinorAspect({ longitudeBody1: 0, longitudeBody2: 150 })).toBe(
        "quincunx",
      );
    });

    it("should return null when no minor aspect is within orb", () => {
      // 10° is not within any minor aspect orb (semisextile=30±2, semisquare=45±2, etc)
      expect(
        getMinorAspect({ longitudeBody1: 0, longitudeBody2: 10 }),
      ).toBeNull();
      // 120° is trine (major), not a minor aspect
      expect(
        getMinorAspect({ longitudeBody1: 0, longitudeBody2: 120 }),
      ).toBeNull();
    });
  });

  describe("getSpecialtyAspect", () => {
    it("should return quintile for bodies 72° apart", () => {
      expect(
        getSpecialtyAspect({ longitudeBody1: 0, longitudeBody2: 72 }),
      ).toBe("quintile");
    });

    it("should return biquintile for bodies 144° apart", () => {
      expect(
        getSpecialtyAspect({ longitudeBody1: 0, longitudeBody2: 144 }),
      ).toBe("biquintile");
    });

    it("should return null when no specialty aspect is within orb", () => {
      // 10° is not within any specialty aspect orb
      expect(
        getSpecialtyAspect({ longitudeBody1: 0, longitudeBody2: 10 }),
      ).toBeNull();
    });
  });

  describe("getMajorAspectPhase", () => {
    it("should return forming when entering aspect orb", () => {
      // Sun at 0°, Moon moving from outside orb into orb
      const phase = getMajorAspectPhase({
        previousLongitudeBody1: 0,
        previousLongitudeBody2: 171, // Outside 8° orb of opposition (180°)
        currentLongitudeBody1: 0,
        currentLongitudeBody2: 173, // Inside 8° orb
        nextLongitudeBody1: 0,
        nextLongitudeBody2: 175,
      });
      expect(phase).toBe("forming");
    });

    it("should return dissolving when exiting aspect orb", () => {
      const phase = getMajorAspectPhase({
        previousLongitudeBody1: 0,
        previousLongitudeBody2: 185,
        currentLongitudeBody1: 0,
        currentLongitudeBody2: 187, // Inside 8° orb
        nextLongitudeBody1: 0,
        nextLongitudeBody2: 189, // Outside 8° orb
      });
      expect(phase).toBe("dissolving");
    });

    it("should return exact when crossing the exact aspect angle", () => {
      const phase = getMajorAspectPhase({
        previousLongitudeBody1: 0,
        previousLongitudeBody2: 179, // Before exact 180°
        currentLongitudeBody1: 0,
        currentLongitudeBody2: 180, // Exact
        nextLongitudeBody1: 0,
        nextLongitudeBody2: 181, // After exact
      });
      expect(phase).toBe("exact");
    });

    it("should return null when not in any aspect phase", () => {
      const phase = getMajorAspectPhase({
        previousLongitudeBody1: 0,
        previousLongitudeBody2: 45,
        currentLongitudeBody1: 0,
        currentLongitudeBody2: 46,
        nextLongitudeBody1: 0,
        nextLongitudeBody2: 47,
      });
      expect(phase).toBeNull();
    });
  });

  describe("getMinorAspectPhase", () => {
    it("should detect minor aspect phases", () => {
      // Entering semisextile orb (30° ± 2°)
      const phase = getMinorAspectPhase({
        previousLongitudeBody1: 0,
        previousLongitudeBody2: 27, // Outside 2° orb
        currentLongitudeBody1: 0,
        currentLongitudeBody2: 29, // Inside 2° orb
        nextLongitudeBody1: 0,
        nextLongitudeBody2: 30,
      });
      expect(phase).toBe("forming");
    });
  });

  describe("isMajorAspect (backward compatibility)", () => {
    it("should return true only for exact phase", () => {
      // Exact opposition
      const isExact = isMajorAspect({
        previousLongitudeBody1: 0,
        previousLongitudeBody2: 179,
        currentLongitudeBody1: 0,
        currentLongitudeBody2: 180,
        nextLongitudeBody1: 0,
        nextLongitudeBody2: 181,
      });
      expect(isExact).toBe(true);
    });

    it("should return false for forming/dissolving phases", () => {
      // Forming (not exact)
      const isExact = isMajorAspect({
        previousLongitudeBody1: 0,
        previousLongitudeBody2: 171,
        currentLongitudeBody1: 0,
        currentLongitudeBody2: 173,
        nextLongitudeBody1: 0,
        nextLongitudeBody2: 175,
      });
      expect(isExact).toBe(false);
    });
  });
});
