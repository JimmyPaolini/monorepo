import moment from "moment-timezone";
import { describe, expect, it } from "vitest";

import { StelliumService } from "./stellium.service";

import type { Event } from "@caelundas/src/calendar/calendar.types";
import type { AspectBodies } from "@caelundas/src/events/aspects/aspects.service";

const service = new StelliumService();

describe("stellium.events", () => {
  describe("service.detect", () => {
    describe("Stellium composition", () => {
      it("should not generate perfective Stellium events (only forming/dissolving)", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

        // 4-body stellium: Sun, Moon, Mars, Venus all in conjunction
        const edges: AspectBodies[] = [
          { bodies: ["sun", "moon"], aspect: "conjunct" },
          { bodies: ["sun", "mars"], aspect: "conjunct" },
          { bodies: ["sun", "venus"], aspect: "conjunct" },
          { bodies: ["moon", "mars"], aspect: "conjunct" },
          { bodies: ["moon", "venus"], aspect: "conjunct" },
          { bodies: ["mars", "venus"], aspect: "conjunct" },
        ];
        const currentAspectBodies = edges;
        const previousAspectBodies = edges;

        const events = service.detect({
          currentAspectBodies,
          previousAspectBodies,
          minute: currentMinute,
        });

        // Should return no events because pattern exists in prev/current/next (null phase)
        expect(events).toHaveLength(0);
      });

      it("should detect forming Stellium when pattern appears", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

        // Complete 4-body stellium only at current minute
        const currentAspectBodies: AspectBodies[] = [
          { bodies: ["sun", "moon"], aspect: "conjunct" },
          { bodies: ["sun", "mars"], aspect: "conjunct" },
          { bodies: ["sun", "venus"], aspect: "conjunct" },
          { bodies: ["moon", "mars"], aspect: "conjunct" },
          { bodies: ["moon", "venus"], aspect: "conjunct" },
          { bodies: ["mars", "venus"], aspect: "conjunct" },
        ];
        // Pattern doesn't exist at previous minute (only Sun-Moon was conjunct)
        const previousAspectBodies: AspectBodies[] = [
          { bodies: ["sun", "moon"], aspect: "conjunct" },
        ];

        const events = service.detect({
          currentAspectBodies,
          previousAspectBodies,
          minute: currentMinute,
        });

        expect(events.length).toBeGreaterThanOrEqual(1);
        const stellium = events.find((e) => e.categories.includes("Stellium"));
        expect(stellium).toBeDefined();
        expect(stellium?.categories).toContain("Forming");
        expect(stellium?.categories).toContain("4 Body");
      });

      it("should return empty array when fewer than 6 conjunctions exist", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

        // Only 5 conjunctions (need 6 for 4-body stellium)
        const edges: AspectBodies[] = [
          { bodies: ["sun", "moon"], aspect: "conjunct" },
          { bodies: ["sun", "mars"], aspect: "conjunct" },
          { bodies: ["sun", "venus"], aspect: "conjunct" },
          { bodies: ["moon", "mars"], aspect: "conjunct" },
          { bodies: ["moon", "venus"], aspect: "conjunct" },
        ];
        const currentAspectBodies = edges;
        const previousAspectBodies = edges;

        const events = service.detect({
          currentAspectBodies,
          previousAspectBodies,
          minute: currentMinute,
        });

        expect(events).toHaveLength(0);
      });

      it("should skip clusters with fewer than 4 bodies", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

        // Two separate 3-body clusters (neither forms a stellium)
        const edges: AspectBodies[] = [
          { bodies: ["sun", "moon"], aspect: "conjunct" },
          { bodies: ["sun", "mars"], aspect: "conjunct" },
          { bodies: ["moon", "mars"], aspect: "conjunct" },
          { bodies: ["jupiter", "venus"], aspect: "conjunct" },
          { bodies: ["jupiter", "saturn"], aspect: "conjunct" },
          { bodies: ["venus", "saturn"], aspect: "conjunct" },
        ];
        const currentAspectBodies = edges;
        const previousAspectBodies = edges;

        const events = service.detect({
          currentAspectBodies,
          previousAspectBodies,
          minute: currentMinute,
        });

        expect(events).toHaveLength(0);
      });

      it("should reject incomplete stellium (not all pairs conjunct)", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

        // 4 bodies but Mars-Venus conjunction is missing
        const edges: AspectBodies[] = [
          { bodies: ["sun", "moon"], aspect: "conjunct" },
          { bodies: ["sun", "mars"], aspect: "conjunct" },
          { bodies: ["sun", "venus"], aspect: "conjunct" },
          { bodies: ["moon", "mars"], aspect: "conjunct" },
          { bodies: ["moon", "venus"], aspect: "conjunct" },
          // Mars-Venus conjunction missing
        ];
        const currentAspectBodies = edges;
        const previousAspectBodies = edges;

        const events = service.detect({
          currentAspectBodies,
          previousAspectBodies,
          minute: currentMinute,
        });

        expect(events).toHaveLength(0);
      });

      it("should return empty array for invalid aspect events", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

        const currentAspectBodies: AspectBodies[] = [];
        const previousAspectBodies: AspectBodies[] = [];

        const events = service.detect({
          currentAspectBodies,
          previousAspectBodies,
          minute: currentMinute,
        });

        expect(events).toHaveLength(0);
      });

      it("should generate event with correct categories and description", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

        // Complete 4-body stellium only at current minute
        const currentAspectBodies: AspectBodies[] = [
          { bodies: ["sun", "moon"], aspect: "conjunct" },
          { bodies: ["sun", "mars"], aspect: "conjunct" },
          { bodies: ["sun", "venus"], aspect: "conjunct" },
          { bodies: ["moon", "mars"], aspect: "conjunct" },
          { bodies: ["moon", "venus"], aspect: "conjunct" },
          { bodies: ["mars", "venus"], aspect: "conjunct" },
        ];
        // Pattern doesn't exist at previous minute (only Sun-Moon was conjunct)
        const previousAspectBodies: AspectBodies[] = [
          { bodies: ["sun", "moon"], aspect: "conjunct" },
        ];

        const events = service.detect({
          currentAspectBodies,
          previousAspectBodies,
          minute: currentMinute,
        });

        expect(events.length).toBeGreaterThanOrEqual(1);
        const stellium = events.find((e) => e.categories.includes("Stellium"));
        expect(stellium).toBeDefined();
        expect(stellium?.categories).toContain("Astronomy");
        expect(stellium?.categories).toContain("Astrology");
        expect(stellium?.categories).toContain("Compound Aspect");
        expect(stellium?.categories).toContain("Stellium");
        expect(stellium?.categories).toContain("4 Body");
        expect(stellium?.categories).toContain("Forming");
        expect(stellium?.summary).toContain("➡️");
        expect(stellium?.description).toContain("stellium forming");
      });

      it("should detect 5-body stellium", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

        // 5-body stellium: Sun, Moon, Mars, Venus, Jupiter (10 conjunctions)
        const currentAspectBodies: AspectBodies[] = [
          { bodies: ["sun", "moon"], aspect: "conjunct" },
          { bodies: ["sun", "mars"], aspect: "conjunct" },
          { bodies: ["sun", "venus"], aspect: "conjunct" },
          { bodies: ["sun", "jupiter"], aspect: "conjunct" },
          { bodies: ["moon", "mars"], aspect: "conjunct" },
          { bodies: ["moon", "venus"], aspect: "conjunct" },
          { bodies: ["moon", "jupiter"], aspect: "conjunct" },
          { bodies: ["mars", "venus"], aspect: "conjunct" },
          { bodies: ["mars", "jupiter"], aspect: "conjunct" },
          { bodies: ["venus", "jupiter"], aspect: "conjunct" },
        ];
        // Pattern doesn't exist at previous minute (only Sun-Moon was conjunct)
        const previousAspectBodies: AspectBodies[] = [
          { bodies: ["sun", "moon"], aspect: "conjunct" },
        ];

        const events = service.detect({
          currentAspectBodies,
          previousAspectBodies,
          minute: currentMinute,
        });

        expect(events.length).toBeGreaterThanOrEqual(1);
        const stellium = events.find((e) => e.categories.includes("5 Body"));
        expect(stellium).toBeDefined();
        expect(stellium?.categories).toContain("Stellium");
        expect(stellium?.categories).toContain("5 Body");
      });
    });
  });

  describe("service.detectProgressive", () => {
    it("should return empty array for empty input", () => {
      const events = service.detectProgressive([]);

      expect(events).toHaveLength(0);
    });

    it("should return empty array when no stellium events exist", () => {
      const events: Event[] = [
        {
          start: moment.utc("2024-03-21T12:00:00.000Z"),
          end: moment.utc("2024-03-21T13:00:00.000Z"),
          summary: "Sun conjunct Moon",
          description: "Sun conjunct Moon",
          categories: ["Astronomy", "Astrology", "Simple Aspect"],
        },
      ];

      const progressiveEvents = service.detectProgressive(events);

      expect(progressiveEvents).toHaveLength(0);
    });

    it("should create progressive event from forming to dissolving pair", () => {
      const formingEvent: Event = {
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        end: moment.utc("2024-03-21T10:00:00.000Z"),
        summary: "➡️ ✨ ☉-☽-♂-♀ Mars, Moon, Sun, Venus stellium forming",
        description: "Mars, Moon, Sun, Venus stellium forming",
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Stellium",
          "4 Body",
          "Forming",
          "Mars",
          "Moon",
          "Sun",
          "Venus",
        ],
      };

      const dissolvingEvent: Event = {
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        end: moment.utc("2024-03-21T14:00:00.000Z"),
        summary: "⬅️ ✨ ☉-☽-♂-♀ Mars, Moon, Sun, Venus stellium dissolving",
        description: "Mars, Moon, Sun, Venus stellium dissolving",
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Stellium",
          "4 Body",
          "Dissolving",
          "Mars",
          "Moon",
          "Sun",
          "Venus",
        ],
      };

      const progressiveEvents = service.detectProgressive([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(progressiveEvents).toHaveLength(1);
      expect(progressiveEvents[0]?.start).toEqual(formingEvent.start);
      expect(progressiveEvents[0]?.end).toEqual(dissolvingEvent.start);
      expect(progressiveEvents[0]?.summary).toContain(
        "Mars, Moon, Sun, Venus stellium",
      );
      expect(progressiveEvents[0]?.description).toBe(
        "Mars, Moon, Sun, Venus stellium",
      );
      expect(progressiveEvents[0]?.categories).not.toContain("Forming");
      expect(progressiveEvents[0]?.categories).not.toContain("Dissolving");
    });

    it("should not create progressive event when only forming exists", () => {
      const formingEvent: Event = {
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        end: moment.utc("2024-03-21T10:00:00.000Z"),
        summary: "➡️ ✨ ☉-☽-♂-♀ Mars, Moon, Sun, Venus stellium forming",
        description: "Mars, Moon, Sun, Venus stellium forming",
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Stellium",
          "4 Body",
          "Forming",
          "Mars",
          "Moon",
          "Sun",
          "Venus",
        ],
      };

      const progressiveEvents = service.detectProgressive([formingEvent]);

      expect(progressiveEvents).toHaveLength(0);
    });

    it("should not create progressive event when only dissolving exists", () => {
      const dissolvingEvent: Event = {
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        end: moment.utc("2024-03-21T14:00:00.000Z"),
        summary: "⬅️ ✨ ☉-☽-♂-♀ Mars, Moon, Sun, Venus stellium dissolving",
        description: "Mars, Moon, Sun, Venus stellium dissolving",
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Stellium",
          "4 Body",
          "Dissolving",
          "Mars",
          "Moon",
          "Sun",
          "Venus",
        ],
      };

      const progressiveEvents = service.detectProgressive([dissolvingEvent]);

      expect(progressiveEvents).toHaveLength(0);
    });

    it("should handle multiple forming/dissolving pairs", () => {
      const events: Event[] = [
        {
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "➡️ ✨ ☉-☽-♂-♀ Mars, Moon, Sun, Venus stellium forming",
          description: "Mars, Moon, Sun, Venus stellium forming",
          categories: [
            "Astronomy",
            "Astrology",
            "Compound Aspect",
            "Stellium",
            "4 Body",
            "Forming",
            "Mars",
            "Moon",
            "Sun",
            "Venus",
          ],
        },
        {
          start: moment.utc("2024-03-21T14:00:00.000Z"),
          end: moment.utc("2024-03-21T14:00:00.000Z"),
          summary: "⬅️ ✨ ☉-☽-♂-♀ Mars, Moon, Sun, Venus stellium dissolving",
          description: "Mars, Moon, Sun, Venus stellium dissolving",
          categories: [
            "Astronomy",
            "Astrology",
            "Compound Aspect",
            "Stellium",
            "4 Body",
            "Dissolving",
            "Mars",
            "Moon",
            "Sun",
            "Venus",
          ],
        },
        {
          start: moment.utc("2024-03-22T10:00:00.000Z"),
          end: moment.utc("2024-03-22T10:00:00.000Z"),
          summary: "➡️ ✨ ☉-☽-♂-♀ Mars, Moon, Sun, Venus stellium forming",
          description: "Mars, Moon, Sun, Venus stellium forming",
          categories: [
            "Astronomy",
            "Astrology",
            "Compound Aspect",
            "Stellium",
            "4 Body",
            "Forming",
            "Mars",
            "Moon",
            "Sun",
            "Venus",
          ],
        },
        {
          start: moment.utc("2024-03-22T14:00:00.000Z"),
          end: moment.utc("2024-03-22T14:00:00.000Z"),
          summary: "⬅️ ✨ ☉-☽-♂-♀ Mars, Moon, Sun, Venus stellium dissolving",
          description: "Mars, Moon, Sun, Venus stellium dissolving",
          categories: [
            "Astronomy",
            "Astrology",
            "Compound Aspect",
            "Stellium",
            "4 Body",
            "Dissolving",
            "Mars",
            "Moon",
            "Sun",
            "Venus",
          ],
        },
      ];

      const progressiveEvents = service.detectProgressive(events);

      expect(progressiveEvents).toHaveLength(2);
      expect(progressiveEvents[0]?.start).toEqual(
        moment.utc("2024-03-21T10:00:00.000Z"),
      );
      expect(progressiveEvents[0]?.end).toEqual(
        moment.utc("2024-03-21T14:00:00.000Z"),
      );
      expect(progressiveEvents[1]?.start).toEqual(
        moment.utc("2024-03-22T10:00:00.000Z"),
      );
      expect(progressiveEvents[1]?.end).toEqual(
        moment.utc("2024-03-22T14:00:00.000Z"),
      );
    });

    it("should handle different body combinations separately", () => {
      const events: Event[] = [
        // First body combination
        {
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "➡️ ✨ ☉-☽-♂-♀ Mars, Moon, Sun, Venus stellium forming",
          description: "Mars, Moon, Sun, Venus stellium forming",
          categories: [
            "Astronomy",
            "Astrology",
            "Compound Aspect",
            "Stellium",
            "4 Body",
            "Forming",
            "Mars",
            "Moon",
            "Sun",
            "Venus",
          ],
        },
        {
          start: moment.utc("2024-03-21T14:00:00.000Z"),
          end: moment.utc("2024-03-21T14:00:00.000Z"),
          summary: "⬅️ ✨ ☉-☽-♂-♀ Mars, Moon, Sun, Venus stellium dissolving",
          description: "Mars, Moon, Sun, Venus stellium dissolving",
          categories: [
            "Astronomy",
            "Astrology",
            "Compound Aspect",
            "Stellium",
            "4 Body",
            "Dissolving",
            "Mars",
            "Moon",
            "Sun",
            "Venus",
          ],
        },
        // Different body combination
        {
          start: moment.utc("2024-03-21T11:00:00.000Z"),
          end: moment.utc("2024-03-21T11:00:00.000Z"),
          summary: "➡️ ✨ ☉-♂-♃-♄ Jupiter, Mars, Saturn, Sun stellium forming",
          description: "Jupiter, Mars, Saturn, Sun stellium forming",
          categories: [
            "Astronomy",
            "Astrology",
            "Compound Aspect",
            "Stellium",
            "4 Body",
            "Forming",
            "Jupiter",
            "Mars",
            "Saturn",
            "Sun",
          ],
        },
        {
          start: moment.utc("2024-03-21T15:00:00.000Z"),
          end: moment.utc("2024-03-21T15:00:00.000Z"),
          summary:
            "⬅️ ✨ ☉-♂-♃-♄ Jupiter, Mars, Saturn, Sun stellium dissolving",
          description: "Jupiter, Mars, Saturn, Sun stellium dissolving",
          categories: [
            "Astronomy",
            "Astrology",
            "Compound Aspect",
            "Stellium",
            "4 Body",
            "Dissolving",
            "Jupiter",
            "Mars",
            "Saturn",
            "Sun",
          ],
        },
      ];

      const progressiveEvents = service.detectProgressive(events);

      expect(progressiveEvents).toHaveLength(2);
      expect(progressiveEvents[0]?.categories).toContain("Venus");
      expect(progressiveEvents[0]?.categories).toContain("Moon");
      expect(progressiveEvents[1]?.categories).toContain("Jupiter");
      expect(progressiveEvents[1]?.categories).toContain("Saturn");
    });

    it("should handle different stellium sizes separately", () => {
      const events: Event[] = [
        // 4-body stellium
        {
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "➡️ ✨ ☉-☽-♂-♀ Mars, Moon, Sun, Venus stellium forming",
          description: "Mars, Moon, Sun, Venus stellium forming",
          categories: [
            "Astronomy",
            "Astrology",
            "Compound Aspect",
            "Stellium",
            "4 Body",
            "Forming",
            "Mars",
            "Moon",
            "Sun",
            "Venus",
          ],
        },
        {
          start: moment.utc("2024-03-21T14:00:00.000Z"),
          end: moment.utc("2024-03-21T14:00:00.000Z"),
          summary: "⬅️ ✨ ☉-☽-♂-♀ Mars, Moon, Sun, Venus stellium dissolving",
          description: "Mars, Moon, Sun, Venus stellium dissolving",
          categories: [
            "Astronomy",
            "Astrology",
            "Compound Aspect",
            "Stellium",
            "4 Body",
            "Dissolving",
            "Mars",
            "Moon",
            "Sun",
            "Venus",
          ],
        },
        // 5-body stellium with same bodies
        {
          start: moment.utc("2024-03-21T11:00:00.000Z"),
          end: moment.utc("2024-03-21T11:00:00.000Z"),
          summary:
            "➡️ ✨ ☉-☽-♂-♃-♀ Jupiter, Mars, Moon, Sun, Venus stellium forming",
          description: "Jupiter, Mars, Moon, Sun, Venus stellium forming",
          categories: [
            "Astronomy",
            "Astrology",
            "Compound Aspect",
            "Stellium",
            "5 Body",
            "Forming",
            "Jupiter",
            "Mars",
            "Moon",
            "Sun",
            "Venus",
          ],
        },
        {
          start: moment.utc("2024-03-21T15:00:00.000Z"),
          end: moment.utc("2024-03-21T15:00:00.000Z"),
          summary:
            "⬅️ ✨ ☉-☽-♂-♃-♀ Jupiter, Mars, Moon, Sun, Venus stellium dissolving",
          description: "Jupiter, Mars, Moon, Sun, Venus stellium dissolving",
          categories: [
            "Astronomy",
            "Astrology",
            "Compound Aspect",
            "Stellium",
            "5 Body",
            "Dissolving",
            "Jupiter",
            "Mars",
            "Moon",
            "Sun",
            "Venus",
          ],
        },
      ];

      const progressiveEvents = service.detectProgressive(events);

      expect(progressiveEvents).toHaveLength(2);
      expect(progressiveEvents[0]?.categories).toContain("4 Body");
      expect(progressiveEvents[1]?.categories).toContain("5 Body");
    });
  });
});
