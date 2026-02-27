import { describe, expect, it } from "vitest";

import {
  getMajorAspect,
  getMajorAspectPhase,
  getMinorAspect,
} from "./aspects.utilities";

describe("majorAspects.events integration", () => {
  describe("getMajorAspect (unit-level integration)", () => {
    it("should detect a Sun-Jupiter conjunction when bodies are close", () => {
      // Sun at 295°, Jupiter at 295° = exact conjunction
      const aspect = getMajorAspect({
        longitudeBody1: 295,
        longitudeBody2: 295,
      });
      expect(aspect).toBe("conjunct");
    });

    it("should detect a Mars-Saturn square when bodies are 90° apart", () => {
      // Mars at 100°, Saturn at 10° = 90° apart (square)
      const aspect = getMajorAspect({
        longitudeBody1: 100,
        longitudeBody2: 10,
      });
      expect(aspect).toBe("square");
    });

    it("should detect trine when bodies are 120° apart", () => {
      const aspect = getMajorAspect({
        longitudeBody1: 0,
        longitudeBody2: 120,
      });
      expect(aspect).toBe("trine");
    });

    it("should detect opposition when bodies are 180° apart", () => {
      const aspect = getMajorAspect({
        longitudeBody1: 55,
        longitudeBody2: 235,
      });
      expect(aspect).toBe("opposite");
    });

    it("should detect sextile when bodies are 60° apart", () => {
      const aspect = getMajorAspect({
        longitudeBody1: 0,
        longitudeBody2: 60,
      });
      expect(aspect).toBe("sextile");
    });
  });

  describe("getMajorAspectPhase (unit-level integration)", () => {
    it("should return forming when entering aspect orb", () => {
      // Venus at 5°, Jupiter at 120° (115° apart)
      // Previous: 7° and 120° = 113° (outside 6° orb of trine)
      // Current: 5° and 120° = 115° (inside 6° orb of trine, 120±6)
      const phase = getMajorAspectPhase({
        previousLongitudeBody1: 7,
        previousLongitudeBody2: 120,
        currentLongitudeBody1: 5,
        currentLongitudeBody2: 120,
        nextLongitudeBody1: 3,
        nextLongitudeBody2: 120,
      });
      expect(phase).toBe("forming");
    });

    it("should return exact when crossing the exact aspect angle", () => {
      const phase = getMajorAspectPhase({
        previousLongitudeBody1: 0,
        previousLongitudeBody2: 179,
        currentLongitudeBody1: 0,
        currentLongitudeBody2: 180,
        nextLongitudeBody1: 0,
        nextLongitudeBody2: 181,
      });
      expect(phase).toBe("exact");
    });

    it("should return dissolving when exiting aspect orb", () => {
      const phase = getMajorAspectPhase({
        previousLongitudeBody1: 0,
        previousLongitudeBody2: 185,
        currentLongitudeBody1: 0,
        currentLongitudeBody2: 187,
        nextLongitudeBody1: 0,
        nextLongitudeBody2: 189, // Outside 8° orb
      });
      expect(phase).toBe("dissolving");
    });

    it("should return null when not in any aspect phase", () => {
      const phase = getMajorAspectPhase({
        previousLongitudeBody1: 0,
        previousLongitudeBody2: 25,
        currentLongitudeBody1: 0,
        currentLongitudeBody2: 26,
        nextLongitudeBody1: 0,
        nextLongitudeBody2: 27,
      });
      expect(phase).toBeNull();
    });
  });
});

describe("minorAspects.events integration", () => {
  describe("getMinorAspect (unit-level integration)", () => {
    it("should detect a Venus-Mars quincunx (150°)", () => {
      // Venus at 30°, Mars at 180° = 150° apart (quincunx)
      const aspect = getMinorAspect({
        longitudeBody1: 30,
        longitudeBody2: 180,
      });
      expect(aspect).toBe("quincunx");
    });

    it("should detect semisextile at 30°", () => {
      const aspect = getMinorAspect({
        longitudeBody1: 0,
        longitudeBody2: 30,
      });
      expect(aspect).toBe("semisextile");
    });

    it("should detect sesquiquadrate at 135°", () => {
      const aspect = getMinorAspect({
        longitudeBody1: 0,
        longitudeBody2: 135,
      });
      expect(aspect).toBe("sesquiquadrate");
    });
  });
});
