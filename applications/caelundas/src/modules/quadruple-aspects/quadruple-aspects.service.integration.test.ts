import moment from "moment-timezone";
import { describe, expect, it } from "vitest";

import { QuadrupleAspectsService } from "./quadruple-aspects.service";

import type { AspectBodies } from "@caelundas/src/modules/aspects/aspects.service";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

/**
 * Integration tests for Quadruple Aspect pattern detection
 *
 * These tests use precisely crafted aspect boundary conditions to verify
 * that Grand Cross and Kite patterns are correctly detected when they
 * form and dissolve.
 *
 * The forming/dissolving boundary is tested by including the critical aspect
 * in only current or only previous, so phase detection fires exactly once.
 */

const service = new QuadrupleAspectsService();

describe("quadruple-aspects.events integration", () => {
  describe("Grand Cross pattern", () => {
    it("should detect forming Grand Cross when the final square completes the pattern", () => {
      const currentMinute = moment.utc("2024-06-15T14:30:00.000Z");

      // Both oppositions are new in current — keeping oppositions out of previous
      // ensures the union has each opposition exactly once, preventing duplicate
      // Grand Cross detections from the nested "for oppositions" loops.
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "mars"], aspect: "opposite" }, // newly added
        { bodies: ["moon", "jupiter"], aspect: "opposite" }, // newly added
        { bodies: ["sun", "moon"], aspect: "square" },
        { bodies: ["sun", "jupiter"], aspect: "square" },
        { bodies: ["mars", "moon"], aspect: "square" },
        { bodies: ["mars", "jupiter"], aspect: "square" },
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "moon"], aspect: "square" },
        { bodies: ["sun", "jupiter"], aspect: "square" },
        { bodies: ["mars", "moon"], aspect: "square" },
        { bodies: ["mars", "jupiter"], aspect: "square" },
      ];

      const events = service.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute: currentMinute,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.categories).toContain("Grand Cross");
      expect(events[0]?.categories).toContain("Forming");
      expect(events[0]?.categories).toContain("Sun");
      expect(events[0]?.categories).toContain("Mars");
      expect(events[0]?.categories).toContain("Moon");
      expect(events[0]?.categories).toContain("Jupiter");
      expect(events[0]?.description).toBe(
        "Jupiter, Mars, Moon, Sun grand cross forming",
      );
      expect(events[0]?.summary).toContain("➡️");
      expect(events[0]?.summary).toContain("➕");
      expect(events[0]?.start).toEqual(currentMinute);
    });

    it("should detect dissolving Grand Cross when a required square ends", () => {
      const currentMinute = moment.utc("2024-06-15T18:00:00.000Z");

      // Both oppositions ended in current — keeping oppositions out of current
      // ensures the union has each opposition exactly once, preventing duplicate
      // Grand Cross detections from the nested "for oppositions" loops.
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "moon"], aspect: "square" },
        { bodies: ["sun", "jupiter"], aspect: "square" },
        { bodies: ["mars", "moon"], aspect: "square" },
        { bodies: ["mars", "jupiter"], aspect: "square" },
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "mars"], aspect: "opposite" }, // about to end
        { bodies: ["moon", "jupiter"], aspect: "opposite" }, // about to end
        { bodies: ["sun", "moon"], aspect: "square" },
        { bodies: ["sun", "jupiter"], aspect: "square" },
        { bodies: ["mars", "moon"], aspect: "square" },
        { bodies: ["mars", "jupiter"], aspect: "square" },
      ];

      const events = service.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute: currentMinute,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.categories).toContain("Grand Cross");
      expect(events[0]?.categories).toContain("Dissolving");
      expect(events[0]?.description).toBe(
        "Jupiter, Mars, Moon, Sun grand cross dissolving",
      );
      expect(events[0]?.summary).toContain("⬅️");
      expect(events[0]?.start).toEqual(
        currentMinute.clone().subtract(1, "minute"),
      );
    });

    it("should produce a progressive Grand Cross event spanning from forming to dissolving", () => {
      const formingStart = moment.utc("2024-06-15T14:30:00.000Z");
      const dissolvingStart = moment.utc("2024-06-15T18:00:00.000Z");

      const formingEvent: Event = {
        start: formingStart,
        end: formingStart,
        summary:
          "➡️ ➕ ☀️-♂️-🌙-♃ Jupiter, Mars, Moon, Sun grand cross forming",
        description: "Jupiter, Mars, Moon, Sun grand cross forming",
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Quadruple Aspect",
          "Grand Cross",
          "Forming",
          "Sun",
          "Mars",
          "Moon",
          "Jupiter",
        ],
      };

      const dissolvingEvent: Event = {
        start: dissolvingStart,
        end: dissolvingStart,
        summary:
          "⬅️ ➕ ☀️-♂️-🌙-♃ Jupiter, Mars, Moon, Sun grand cross dissolving",
        description: "Jupiter, Mars, Moon, Sun grand cross dissolving",
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Quadruple Aspect",
          "Grand Cross",
          "Dissolving",
          "Sun",
          "Mars",
          "Moon",
          "Jupiter",
        ],
      };

      const progressiveEvents = service.detectProgressive([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(progressiveEvents).toHaveLength(1);
      expect(progressiveEvents[0]?.start).toEqual(formingStart);
      expect(progressiveEvents[0]?.end).toEqual(dissolvingStart);
      expect(progressiveEvents[0]?.categories).toContain("Quadruple Aspect");
      expect(progressiveEvents[0]?.categories).toContain("Grand Cross");
      expect(progressiveEvents[0]?.categories).toContain("Jupiter");
      expect(progressiveEvents[0]?.categories).toContain("Mars");
      expect(progressiveEvents[0]?.categories).toContain("Moon");
      expect(progressiveEvents[0]?.categories).toContain("Sun");
      expect(progressiveEvents[0]?.categories).not.toContain("Forming");
      expect(progressiveEvents[0]?.categories).not.toContain("Dissolving");
      expect(progressiveEvents[0]?.description).toBe(
        "Jupiter, Mars, Moon, Sun grand cross",
      );
      expect(progressiveEvents[0]?.summary).toContain("➕");
      expect(progressiveEvents[0]?.summary).not.toMatch(/^➡️/);
    });
  });

  describe("Kite pattern", () => {
    it("should detect forming Kite when the opposition to the focal body completes the pattern", () => {
      const currentMinute = moment.utc("2024-07-20T10:00:00.000Z");

      // Grand Trine + Kite aspects all new in current. Keeping trines out of
      // previous ensures C(trines,3)=1 grand trine combination in the union,
      // preventing duplicate Kite detections.
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "moon"], aspect: "trine" }, // newly added
        { bodies: ["sun", "mars"], aspect: "trine" }, // newly added
        { bodies: ["moon", "mars"], aspect: "trine" }, // newly added
        { bodies: ["sun", "venus"], aspect: "opposite" }, // newly added
        { bodies: ["venus", "moon"], aspect: "sextile" },
        { bodies: ["venus", "mars"], aspect: "sextile" },
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["venus", "moon"], aspect: "sextile" },
        { bodies: ["venus", "mars"], aspect: "sextile" },
      ];

      const events = service.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute: currentMinute,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.categories).toContain("Kite");
      expect(events[0]?.categories).toContain("Forming");
      expect(events[0]?.categories).toContain("Sun");
      expect(events[0]?.categories).toContain("Moon");
      expect(events[0]?.categories).toContain("Mars");
      expect(events[0]?.categories).toContain("Venus");
      expect(events[0]?.categories).toContain("Venus Focal");
      expect(events[0]?.description).toBe(
        "Mars, Moon, Sun, Venus kite forming (Venus focal)",
      );
      expect(events[0]?.summary).toContain("➡️");
      expect(events[0]?.summary).toContain("🪁");
      expect(events[0]?.start).toEqual(currentMinute);
    });

    it("should detect dissolving Kite when the focal opposition ends", () => {
      const currentMinute = moment.utc("2024-07-20T14:00:00.000Z");

      // Grand Trine + opposition ended in current. Keeping trines out of current
      // ensures C(trines,3)=1 grand trine combination in the union, preventing
      // duplicate Kite detections.
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["venus", "moon"], aspect: "sextile" },
        { bodies: ["venus", "mars"], aspect: "sextile" },
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "moon"], aspect: "trine" }, // about to end
        { bodies: ["sun", "mars"], aspect: "trine" }, // about to end
        { bodies: ["moon", "mars"], aspect: "trine" }, // about to end
        { bodies: ["sun", "venus"], aspect: "opposite" }, // about to end
        { bodies: ["venus", "moon"], aspect: "sextile" },
        { bodies: ["venus", "mars"], aspect: "sextile" },
      ];

      const events = service.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute: currentMinute,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.categories).toContain("Kite");
      expect(events[0]?.categories).toContain("Dissolving");
      expect(events[0]?.categories).toContain("Venus Focal");
      expect(events[0]?.description).toBe(
        "Mars, Moon, Sun, Venus kite dissolving (Venus focal)",
      );
      expect(events[0]?.summary).toContain("⬅️");
      expect(events[0]?.start).toEqual(
        currentMinute.clone().subtract(1, "minute"),
      );
    });

    it("should produce a progressive Kite event spanning from forming to dissolving", () => {
      const formingStart = moment.utc("2024-07-20T10:00:00.000Z");
      const dissolvingStart = moment.utc("2024-07-20T14:00:00.000Z");

      const formingEvent: Event = {
        start: formingStart,
        end: formingStart,
        summary:
          "➡️ 🪁 ☀️-🌙-♂️-♀️ Mars, Moon, Sun, Venus kite forming (Venus focal)",
        description: "Mars, Moon, Sun, Venus kite forming (Venus focal)",
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Quadruple Aspect",
          "Kite",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Venus",
          "Venus Focal",
        ],
      };

      const dissolvingEvent: Event = {
        start: dissolvingStart,
        end: dissolvingStart,
        summary:
          "⬅️ 🪁 ☀️-🌙-♂️-♀️ Mars, Moon, Sun, Venus kite dissolving (Venus focal)",
        description: "Mars, Moon, Sun, Venus kite dissolving (Venus focal)",
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Quadruple Aspect",
          "Kite",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Venus",
          "Venus Focal",
        ],
      };

      const progressiveEvents = service.detectProgressive([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(progressiveEvents).toHaveLength(1);
      expect(progressiveEvents[0]?.start).toEqual(formingStart);
      expect(progressiveEvents[0]?.end).toEqual(dissolvingStart);
      expect(progressiveEvents[0]?.categories).toContain("Quadruple Aspect");
      expect(progressiveEvents[0]?.categories).toContain("Kite");
      expect(progressiveEvents[0]?.categories).toContain("Venus");
      expect(progressiveEvents[0]?.categories).toContain("Venus Focal");
      expect(progressiveEvents[0]?.categories).not.toContain("Forming");
      expect(progressiveEvents[0]?.categories).not.toContain("Dissolving");
      expect(progressiveEvents[0]?.description).toBe(
        "Mars, Moon, Sun, Venus kite",
      );
      expect(progressiveEvents[0]?.summary).toContain("🪁");
      expect(progressiveEvents[0]?.summary).not.toMatch(/^➡️/);
    });
  });

  describe("Edge cases", () => {
    it("should not detect Grand Cross with only 1 opposition (incomplete pattern)", () => {
      const currentMinute = moment.utc("2024-09-01T08:00:00.000Z");

      // Only one opposition — need 2 for a Grand Cross
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "mars"], aspect: "opposite" },
        { bodies: ["sun", "moon"], aspect: "square" },
        { bodies: ["sun", "jupiter"], aspect: "square" },
        { bodies: ["mars", "moon"], aspect: "square" },
        { bodies: ["mars", "jupiter"], aspect: "square" },
      ];
      const previousAspectBodies: AspectBodies[] = [];

      const events = service.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute: currentMinute,
      });

      const grandCrossEvents = events.filter((e) =>
        e.categories.includes("Grand Cross"),
      );
      expect(grandCrossEvents).toHaveLength(0);
    });

    it("should not detect Kite without a Grand Trine base", () => {
      const currentMinute = moment.utc("2024-09-01T10:00:00.000Z");

      // Kite-specific aspects but no Grand Trine (no trines at all)
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "venus"], aspect: "opposite" },
        { bodies: ["venus", "moon"], aspect: "sextile" },
        { bodies: ["venus", "mars"], aspect: "sextile" },
      ];
      const previousAspectBodies: AspectBodies[] = [];

      const events = service.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute: currentMinute,
      });

      const kiteEvents = events.filter((e) => e.categories.includes("Kite"));
      expect(kiteEvents).toHaveLength(0);
    });

    it("should not detect Grand Cross when squares are replaced with trines", () => {
      const currentMinute = moment.utc("2024-09-01T12:00:00.000Z");

      // Two oppositions but connections are trines, not squares
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "mars"], aspect: "opposite" },
        { bodies: ["moon", "jupiter"], aspect: "opposite" },
        { bodies: ["sun", "moon"], aspect: "trine" },
        { bodies: ["sun", "jupiter"], aspect: "trine" },
        { bodies: ["mars", "moon"], aspect: "trine" },
        { bodies: ["mars", "jupiter"], aspect: "trine" },
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "mars"], aspect: "opposite" },
        { bodies: ["moon", "jupiter"], aspect: "opposite" },
        { bodies: ["sun", "jupiter"], aspect: "trine" },
        { bodies: ["mars", "moon"], aspect: "trine" },
        { bodies: ["mars", "jupiter"], aspect: "trine" },
      ];

      const events = service.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute: currentMinute,
      });

      const grandCrossEvents = events.filter((e) =>
        e.categories.includes("Grand Cross"),
      );
      expect(grandCrossEvents).toHaveLength(0);
    });
  });
});
