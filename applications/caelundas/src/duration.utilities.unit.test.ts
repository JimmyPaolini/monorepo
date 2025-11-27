import { describe, expect, it } from "vitest";

import { pairDurationEvents } from "./duration.utilities";

import type { Event } from "./calendar.utilities";

describe("duration.utilities", () => {
  describe("pairDurationEvents", () => {
    const createEvent = (dateStr: string, type: string): Event => ({
      start: new Date(dateStr),
      end: new Date(dateStr),
      summary: `${type} event`,
      description: `${type} event description`,
      categories: [type],
    });

    it("should pair beginnings with endings chronologically", () => {
      const beginnings = [
        createEvent("2025-01-01T10:00:00Z", "forming"),
        createEvent("2025-01-03T10:00:00Z", "forming"),
      ];
      const endings = [
        createEvent("2025-01-02T10:00:00Z", "dissolving"),
        createEvent("2025-01-04T10:00:00Z", "dissolving"),
      ];

      const pairs = pairDurationEvents(beginnings, endings, "test aspect");

      expect(pairs).toHaveLength(2);
      expect(pairs[0]).toBeDefined();
      const pair0 = pairs[0];
      if (!pair0) {
        throw new Error("pair0 is undefined");
      }
      expect(pair0[0].start.toISOString()).toBe("2025-01-01T10:00:00.000Z");
      expect(pair0[1].start.toISOString()).toBe("2025-01-02T10:00:00.000Z");
      expect(pairs[1]).toBeDefined();
      const pair1 = pairs[1];
      if (!pair1) {
        throw new Error("pair1 is undefined");
      }
      expect(pair1[0].start.toISOString()).toBe("2025-01-03T10:00:00.000Z");
      expect(pair1[1].start.toISOString()).toBe("2025-01-04T10:00:00.000Z");
    });

    it("should handle unsorted inputs by sorting them", () => {
      const beginnings = [
        createEvent("2025-01-03T10:00:00Z", "forming"),
        createEvent("2025-01-01T10:00:00Z", "forming"),
      ];
      const endings = [
        createEvent("2025-01-04T10:00:00Z", "dissolving"),
        createEvent("2025-01-02T10:00:00Z", "dissolving"),
      ];

      const pairs = pairDurationEvents(beginnings, endings, "test aspect");

      expect(pairs).toHaveLength(2);
      // Should be sorted: first pair is Jan 1 -> Jan 2
      expect(pairs[0]).toBeDefined();
      const pair0 = pairs[0];
      if (!pair0) {
        throw new Error("pair0 is undefined");
      }
      expect(pair0[0].start.toISOString()).toBe("2025-01-01T10:00:00.000Z");
      expect(pair0[1].start.toISOString()).toBe("2025-01-02T10:00:00.000Z");
    });

    it("should skip invalid endings that occur before or at beginning time", () => {
      const beginnings = [createEvent("2025-01-02T10:00:00Z", "forming")];
      const endings = [
        createEvent("2025-01-01T10:00:00Z", "dissolving"), // Before beginning - invalid
        createEvent("2025-01-03T10:00:00Z", "dissolving"), // After beginning - valid
      ];

      const pairs = pairDurationEvents(beginnings, endings, "test aspect");

      expect(pairs).toHaveLength(1);
      expect(pairs[0]).toBeDefined();
      const pair0 = pairs[0];
      if (!pair0) {
        throw new Error("pair0 is undefined");
      }
      expect(pair0[1].start.toISOString()).toBe("2025-01-03T10:00:00.000Z");
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Skipping invalid"),
      );
    });

    it("should warn about unpaired beginnings", () => {
      const beginnings = [
        createEvent("2025-01-01T10:00:00Z", "forming"),
        createEvent("2025-01-03T10:00:00Z", "forming"),
        createEvent("2025-01-05T10:00:00Z", "forming"), // No ending
      ];
      const endings = [
        createEvent("2025-01-02T10:00:00Z", "dissolving"),
        createEvent("2025-01-04T10:00:00Z", "dissolving"),
      ];

      const pairs = pairDurationEvents(beginnings, endings, "test aspect");

      expect(pairs).toHaveLength(2);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("1 unpaired test aspect beginning(s)"),
      );
    });

    it("should warn about unpaired endings", () => {
      const beginnings = [createEvent("2025-01-01T10:00:00Z", "forming")];
      const endings = [
        createEvent("2025-01-02T10:00:00Z", "dissolving"),
        createEvent("2025-01-04T10:00:00Z", "dissolving"), // No beginning
      ];

      const pairs = pairDurationEvents(beginnings, endings, "test aspect");

      expect(pairs).toHaveLength(1);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("1 unpaired test aspect ending(s)"),
      );
    });

    it("should handle empty arrays", () => {
      expect(pairDurationEvents([], [], "test")).toEqual([]);
      expect(
        pairDurationEvents(
          [createEvent("2025-01-01T10:00:00Z", "forming")],
          [],
          "test",
        ),
      ).toEqual([]);
      expect(
        pairDurationEvents(
          [],
          [createEvent("2025-01-01T10:00:00Z", "dissolving")],
          "test",
        ),
      ).toEqual([]);
    });

    it("should handle single valid pair", () => {
      const beginnings = [createEvent("2025-01-01T10:00:00Z", "forming")];
      const endings = [createEvent("2025-01-02T10:00:00Z", "dissolving")];

      const pairs = pairDurationEvents(beginnings, endings, "test aspect");

      expect(pairs).toHaveLength(1);
      expect(pairs[0]).toBeDefined();
      const pair0 = pairs[0];
      if (!pair0) {
        throw new Error("pair0 is undefined");
      }
      const beginning0 = beginnings[0];
      if (!beginning0) {
        throw new Error("beginning0 is undefined");
      }
      expect(pair0[0]).toBe(beginning0);
    });
  });
});
