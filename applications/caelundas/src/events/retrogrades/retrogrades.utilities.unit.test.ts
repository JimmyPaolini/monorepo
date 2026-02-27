import { describe, expect, it } from "vitest";

import { isDirect, isRetrograde } from "./retrogrades.utilities";

describe("retrogrades.utilities", () => {
  describe("isRetrograde", () => {
    it("should return true when planet stations retrograde", () => {
      // Planet was moving direct (increasing longitude), now starting to move backward
      const result = isRetrograde({
        currentLongitude: 100,
        previousLongitudes: [98, 99], // Was increasing (direct motion)
        nextLongitudes: [100, 99], // Will be same or decreasing (retrograde)
      });

      expect(result).toBe(true);
    });

    it("should return false when planet continues direct motion", () => {
      // Planet was moving direct and will continue direct
      const result = isRetrograde({
        currentLongitude: 100,
        previousLongitudes: [98, 99],
        nextLongitudes: [101, 102],
      });

      expect(result).toBe(false);
    });

    it("should return false when planet is already retrograde", () => {
      // Planet was already retrograde (decreasing longitude)
      const result = isRetrograde({
        currentLongitude: 100,
        previousLongitudes: [102, 101], // Was decreasing (already retrograde)
        nextLongitudes: [99, 98],
      });

      expect(result).toBe(false);
    });

    it("should handle 0/360 boundary crossing correctly", () => {
      // Planet at 5° with previous positions near 360°
      const result = isRetrograde({
        currentLongitude: 5,
        previousLongitudes: [358, 360], // Effectively 358, 0 - was direct
        nextLongitudes: [5, 4], // Will be retrograde
      });

      expect(result).toBe(true);
    });

    it("should return false when not all previous longitudes indicate direct motion", () => {
      const result = isRetrograde({
        currentLongitude: 100,
        previousLongitudes: [101, 99], // Mixed - not all direct
        nextLongitudes: [100, 99],
      });

      expect(result).toBe(false);
    });

    it("should return false when not all next longitudes indicate retrograde", () => {
      const result = isRetrograde({
        currentLongitude: 100,
        previousLongitudes: [98, 99],
        nextLongitudes: [99, 101], // Mixed - not all retrograde
      });

      expect(result).toBe(false);
    });
  });

  describe("isDirect", () => {
    it("should return true when planet stations direct", () => {
      // Planet was retrograde (decreasing longitude), now starting to move forward
      const result = isDirect({
        currentLongitude: 100,
        previousLongitudes: [102, 101], // Was decreasing (retrograde motion)
        nextLongitudes: [100, 101], // Will be same or increasing (direct)
      });

      expect(result).toBe(true);
    });

    it("should return false when planet continues retrograde motion", () => {
      // Planet was retrograde and will continue retrograde
      const result = isDirect({
        currentLongitude: 100,
        previousLongitudes: [102, 101],
        nextLongitudes: [99, 98],
      });

      expect(result).toBe(false);
    });

    it("should return false when planet is already direct", () => {
      // Planet was already direct (increasing longitude)
      const result = isDirect({
        currentLongitude: 100,
        previousLongitudes: [98, 99], // Was increasing (already direct)
        nextLongitudes: [101, 102],
      });

      expect(result).toBe(false);
    });

    it("should handle 0/360 boundary crossing correctly", () => {
      // Planet at 355° with previous positions at higher degrees (retrograde)
      // and next positions crossing into low degrees (direct motion)
      const result = isDirect({
        currentLongitude: 355,
        previousLongitudes: [358, 357], // Was retrograde
        nextLongitudes: [355, 356], // Will be direct
      });

      expect(result).toBe(true);
    });

    it("should return false when not all previous longitudes indicate retrograde motion", () => {
      const result = isDirect({
        currentLongitude: 100,
        previousLongitudes: [99, 101], // Mixed - not all retrograde
        nextLongitudes: [100, 101],
      });

      expect(result).toBe(false);
    });

    it("should return false when not all next longitudes indicate direct motion", () => {
      const result = isDirect({
        currentLongitude: 100,
        previousLongitudes: [102, 101],
        nextLongitudes: [101, 99], // Mixed - not all direct
      });

      expect(result).toBe(false);
    });
  });
});
