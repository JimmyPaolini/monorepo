import moment from "moment-timezone";
import { describe, expect, it } from "vitest";

import { TripleAspectsService } from "./triple-aspects.service";

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { AspectBodies } from "@caelundas/src/modules/events/aspects/aspects.service";

/**
 * Integration tests for Triple Aspect pattern detection
 *
 * These tests use precisely crafted aspect boundary conditions to verify
 * that T-Square, Yod, and Grand Trine patterns are correctly detected when
 * they form and dissolve.
 *
 * The forming/dissolving boundary is tested by including the critical aspect
 * in only current or only previous, so phase detection fires exactly once.
 */

const service = new TripleAspectsService();

describe("tripleAspects.events integration", () => {
  describe("T-Square pattern", () => {
    it("should detect forming T-Square when the final aspect completes the pattern", () => {
      const currentMinute = moment.utc("2024-06-15T14:30:00.000Z");

      // Opposition is new in current — it's the unique edge in the union, preventing
      // duplicate T-Square detections from the outer "for oppositions" loop.
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "moon"], aspect: "opposite" }, // newly added
        { bodies: ["sun", "mars"], aspect: "square" },
        { bodies: ["moon", "mars"], aspect: "square" },
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "mars"], aspect: "square" },
        { bodies: ["moon", "mars"], aspect: "square" },
      ];

      const events = service.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute: currentMinute,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.categories).toContain("T Square");
      expect(events[0]?.categories).toContain("Forming");
      expect(events[0]?.categories).toContain("Sun");
      expect(events[0]?.categories).toContain("Moon");
      expect(events[0]?.categories).toContain("Mars");
      expect(events[0]?.categories).toContain("Mars Focal");
      expect(events[0]?.description).toBe(
        "Mars, Moon, Sun t-square forming (Mars focal)",
      );
      expect(events[0]?.summary).toContain("➡️");
      expect(events[0]?.summary).toContain("⊤");
      expect(events[0]?.start).toEqual(currentMinute);
    });

    it("should detect dissolving T-Square when a required aspect ends", () => {
      const currentMinute = moment.utc("2024-06-15T16:00:00.000Z");

      // Opposition ended in current — it's the unique edge in the union, preventing
      // duplicate T-Square detections from the outer "for oppositions" loop.
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "mars"], aspect: "square" },
        { bodies: ["moon", "mars"], aspect: "square" },
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "moon"], aspect: "opposite" }, // about to end
        { bodies: ["sun", "mars"], aspect: "square" },
        { bodies: ["moon", "mars"], aspect: "square" },
      ];

      const events = service.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute: currentMinute,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.categories).toContain("T Square");
      expect(events[0]?.categories).toContain("Dissolving");
      expect(events[0]?.categories).toContain("Mars Focal");
      expect(events[0]?.description).toBe(
        "Mars, Moon, Sun t-square dissolving (Mars focal)",
      );
      expect(events[0]?.summary).toContain("⬅️");
      expect(events[0]?.start).toEqual(
        currentMinute.clone().subtract(1, "minute"),
      );
    });

    it("should produce a progressive T-Square event spanning from forming to dissolving", () => {
      const formingStart = moment.utc("2024-06-15T14:30:00.000Z");
      const dissolvingStart = moment.utc("2024-06-15T16:00:00.000Z");

      const formingEvent: Event = {
        start: formingStart,
        end: formingStart,
        summary: "➡️ ⊤ ☀️-🌙-♂️ Mars, Moon, Sun t-square forming (Mars focal)",
        description: "Mars, Moon, Sun t-square forming (Mars focal)",
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Triple Aspect",
          "T Square",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Mars Focal",
        ],
      };

      const dissolvingEvent: Event = {
        start: dissolvingStart,
        end: dissolvingStart,
        summary:
          "⬅️ ⊤ ☀️-🌙-♂️ Mars, Moon, Sun t-square dissolving (Mars focal)",
        description: "Mars, Moon, Sun t-square dissolving (Mars focal)",
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Triple Aspect",
          "T Square",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Mars Focal",
        ],
      };

      const progressiveEvents = service.detectProgressive([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(progressiveEvents).toHaveLength(1);
      expect(progressiveEvents[0]?.start).toEqual(formingStart);
      expect(progressiveEvents[0]?.end).toEqual(dissolvingStart);
      expect(progressiveEvents[0]?.categories).toContain("Triple Aspect");
      expect(progressiveEvents[0]?.categories).toContain("T Square");
      expect(progressiveEvents[0]?.categories).toContain("Mars");
      expect(progressiveEvents[0]?.categories).toContain("Moon");
      expect(progressiveEvents[0]?.categories).toContain("Sun");
      expect(progressiveEvents[0]?.categories).not.toContain("Forming");
      expect(progressiveEvents[0]?.categories).not.toContain("Dissolving");
      expect(progressiveEvents[0]?.description).toBe(
        "Mars, Moon, Sun t-square",
      );
      expect(progressiveEvents[0]?.summary).toContain("⊤");
      expect(progressiveEvents[0]?.summary).toContain("(focal: Mars)");
      expect(progressiveEvents[0]?.summary).not.toMatch(/^➡️/);
    });
  });

  describe("Yod pattern", () => {
    it("should detect forming Yod when the second quincunx completes the pattern", () => {
      const currentMinute = moment.utc("2024-07-20T10:15:00.000Z");

      // Sextile is new in current — it's the unique edge in the union, preventing
      // duplicate Yod detections from the outer "for sextiles" loop.
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["venus", "jupiter"], aspect: "sextile" }, // newly added
        { bodies: ["venus", "saturn"], aspect: "quincunx" },
        { bodies: ["jupiter", "saturn"], aspect: "quincunx" },
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["venus", "saturn"], aspect: "quincunx" },
        { bodies: ["jupiter", "saturn"], aspect: "quincunx" },
      ];

      const events = service.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute: currentMinute,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.categories).toContain("Yod");
      expect(events[0]?.categories).toContain("Forming");
      expect(events[0]?.categories).toContain("Venus");
      expect(events[0]?.categories).toContain("Jupiter");
      expect(events[0]?.categories).toContain("Saturn");
      expect(events[0]?.categories).toContain("Saturn Focal");
      expect(events[0]?.description).toBe(
        "Jupiter, Saturn, Venus yod forming (Saturn focal)",
      );
      expect(events[0]?.summary).toContain("➡️");
      expect(events[0]?.summary).toContain("⚛");
      expect(events[0]?.start).toEqual(currentMinute);
    });

    it("should detect dissolving Yod when a required aspect ends", () => {
      const currentMinute = moment.utc("2024-07-20T14:00:00.000Z");

      // Sextile ended in current — it's the unique edge in the union, preventing
      // duplicate Yod detections from the outer "for sextiles" loop.
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["venus", "saturn"], aspect: "quincunx" },
        { bodies: ["jupiter", "saturn"], aspect: "quincunx" },
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["venus", "jupiter"], aspect: "sextile" }, // about to end
        { bodies: ["venus", "saturn"], aspect: "quincunx" },
        { bodies: ["jupiter", "saturn"], aspect: "quincunx" },
      ];

      const events = service.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute: currentMinute,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.categories).toContain("Yod");
      expect(events[0]?.categories).toContain("Dissolving");
      expect(events[0]?.categories).toContain("Saturn Focal");
      expect(events[0]?.description).toBe(
        "Jupiter, Saturn, Venus yod dissolving (Saturn focal)",
      );
      expect(events[0]?.summary).toContain("⬅️");
      expect(events[0]?.start).toEqual(
        currentMinute.clone().subtract(1, "minute"),
      );
    });
  });

  describe("Grand Trine pattern", () => {
    it("should detect forming Grand Trine when the third trine completes the triangle", () => {
      const currentMinute = moment.utc("2024-08-05T09:00:00.000Z");

      // Sun-Mars trine is new in current → forming boundary
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "moon"], aspect: "trine" },
        { bodies: ["sun", "mars"], aspect: "trine" }, // newly added
        { bodies: ["moon", "mars"], aspect: "trine" },
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "moon"], aspect: "trine" },
        { bodies: ["moon", "mars"], aspect: "trine" },
      ];

      const events = service.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute: currentMinute,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.categories).toContain("Grand Trine");
      expect(events[0]?.categories).toContain("Forming");
      expect(events[0]?.categories).toContain("Sun");
      expect(events[0]?.categories).toContain("Moon");
      expect(events[0]?.categories).toContain("Mars");
      expect(events[0]?.categories).not.toContain("Mars Focal");
      expect(events[0]?.description).toBe(
        "Mars, Moon, Sun grand trine forming",
      );
      expect(events[0]?.summary).toContain("➡️");
      expect(events[0]?.summary).toContain("△");
      expect(events[0]?.start).toEqual(currentMinute);
    });

    it("should detect dissolving Grand Trine when a trine aspect ends", () => {
      const currentMinute = moment.utc("2024-08-05T12:00:00.000Z");

      // Sun-Mars trine ended → dissolving boundary
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "moon"], aspect: "trine" },
        { bodies: ["moon", "mars"], aspect: "trine" },
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "moon"], aspect: "trine" },
        { bodies: ["sun", "mars"], aspect: "trine" },
        { bodies: ["moon", "mars"], aspect: "trine" },
      ];

      const events = service.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute: currentMinute,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.categories).toContain("Grand Trine");
      expect(events[0]?.categories).toContain("Dissolving");
      expect(events[0]?.description).toBe(
        "Mars, Moon, Sun grand trine dissolving",
      );
      expect(events[0]?.summary).toContain("⬅️");
      expect(events[0]?.start).toEqual(
        currentMinute.clone().subtract(1, "minute"),
      );
    });

    it("should produce a progressive Grand Trine event spanning from forming to dissolving", () => {
      const formingStart = moment.utc("2024-08-05T09:00:00.000Z");
      const dissolvingStart = moment.utc("2024-08-05T12:00:00.000Z");

      const formingEvent: Event = {
        start: formingStart,
        end: formingStart,
        summary: "➡️ △ ☀️-🌙-♂️ Mars, Moon, Sun grand trine forming",
        description: "Mars, Moon, Sun grand trine forming",
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Triple Aspect",
          "Grand Trine",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
        ],
      };

      const dissolvingEvent: Event = {
        start: dissolvingStart,
        end: dissolvingStart,
        summary: "⬅️ △ ☀️-🌙-♂️ Mars, Moon, Sun grand trine dissolving",
        description: "Mars, Moon, Sun grand trine dissolving",
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Triple Aspect",
          "Grand Trine",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
        ],
      };

      const progressiveEvents = service.detectProgressive([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(progressiveEvents).toHaveLength(1);
      expect(progressiveEvents[0]?.start).toEqual(formingStart);
      expect(progressiveEvents[0]?.end).toEqual(dissolvingStart);
      expect(progressiveEvents[0]?.categories).toContain("Triple Aspect");
      expect(progressiveEvents[0]?.categories).toContain("Grand Trine");
      expect(progressiveEvents[0]?.categories).toContain("Mars");
      expect(progressiveEvents[0]?.categories).toContain("Moon");
      expect(progressiveEvents[0]?.categories).toContain("Sun");
      expect(progressiveEvents[0]?.categories).not.toContain("Forming");
      expect(progressiveEvents[0]?.categories).not.toContain("Dissolving");
      expect(progressiveEvents[0]?.description).toBe(
        "Mars, Moon, Sun grand trine",
      );
      expect(progressiveEvents[0]?.summary).toContain("△");
      expect(progressiveEvents[0]?.summary).not.toMatch(/^➡️/);
    });
  });

  describe("Edge cases", () => {
    it("should not detect Grand Trine with only 2 trines (incomplete pattern)", () => {
      const currentMinute = moment.utc("2024-09-01T08:00:00.000Z");

      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "moon"], aspect: "trine" },
        { bodies: ["moon", "mars"], aspect: "trine" },
        // Missing: sun-mars trine
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "moon"], aspect: "trine" },
      ];

      const events = service.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute: currentMinute,
      });

      expect(events).toHaveLength(0);
    });

    it("should not detect Grand Trine when aspect type is wrong (sextiles instead of trines)", () => {
      const currentMinute = moment.utc("2024-09-01T10:00:00.000Z");

      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "moon"], aspect: "sextile" },
        { bodies: ["sun", "mars"], aspect: "sextile" },
        { bodies: ["moon", "mars"], aspect: "sextile" },
      ];
      const previousAspectBodies: AspectBodies[] = [];

      const events = service.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute: currentMinute,
      });

      const grandTrineEvents = events.filter((e) =>
        e.categories.includes("Grand Trine"),
      );
      expect(grandTrineEvents).toHaveLength(0);
    });

    it("should not detect T-Square when using trines instead of squares", () => {
      const currentMinute = moment.utc("2024-09-01T12:00:00.000Z");

      // Opposition exists but trines instead of squares (no T-Square)
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "moon"], aspect: "opposite" },
        { bodies: ["sun", "mars"], aspect: "trine" },
        { bodies: ["moon", "mars"], aspect: "trine" },
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "moon"], aspect: "opposite" },
        { bodies: ["moon", "mars"], aspect: "trine" },
      ];

      const events = service.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute: currentMinute,
      });

      const tSquareEvents = events.filter((e) =>
        e.categories.includes("T Square"),
      );
      expect(tSquareEvents).toHaveLength(0);
    });

    it("should detect Grand Trine with outer planets", () => {
      const currentMinute = moment.utc("2024-10-01T06:00:00.000Z");

      // Jupiter-Saturn-Neptune grand trine (outer planets)
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["jupiter", "saturn"], aspect: "trine" },
        { bodies: ["jupiter", "neptune"], aspect: "trine" }, // newly added
        { bodies: ["saturn", "neptune"], aspect: "trine" },
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["jupiter", "saturn"], aspect: "trine" },
        { bodies: ["saturn", "neptune"], aspect: "trine" },
      ];

      const events = service.detect({
        currentAspectBodies,
        previousAspectBodies,
        minute: currentMinute,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.categories).toContain("Grand Trine");
      expect(events[0]?.categories).toContain("Forming");
      expect(events[0]?.categories).toContain("Jupiter");
      expect(events[0]?.categories).toContain("Saturn");
      expect(events[0]?.categories).toContain("Neptune");
    });
  });
});
