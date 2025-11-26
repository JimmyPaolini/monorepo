import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import moment from "moment-timezone";
import type { Event } from "../../calendar.utilities";
import {
  getStelliumEvents,
  getStelliumDurationEvents,
} from "./stellium.events";

describe("stellium.events", () => {
  describe("getStelliumEvents", () => {
    describe("Stellium composition", () => {
      it("should not generate exact Stellium events (only forming/dissolving)", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const startTime = new Date("2024-03-21T11:00:00.000Z");
        const endTime = new Date("2024-03-21T13:00:00.000Z");

        // 4-body stellium: Sun, Moon, Mars, Venus all in conjunction
        const storedAspects: Event[] = [
          {
            start: startTime,
            end: endTime,
            summary: "Sun conjunct Moon",
            description: "Sun conjunct Moon",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Moon",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Sun conjunct Mars",
            description: "Sun conjunct Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Mars",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Sun conjunct Venus",
            description: "Sun conjunct Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Venus",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Moon conjunct Mars",
            description: "Moon conjunct Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Mars",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Moon conjunct Venus",
            description: "Moon conjunct Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Venus",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Mars conjunct Venus",
            description: "Mars conjunct Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Mars",
              "Venus",
              "Conjunct",
              "exact",
            ],
          },
        ];

        const events = getStelliumEvents(storedAspects, currentMinute);

        // Should return no events because pattern exists in prev/current/next (null phase)
        expect(events).toHaveLength(0);
      });

      it("should detect forming Stellium when pattern appears", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

        // Pattern doesn't exist at 11:59, exists at 12:00, doesn't exist at 12:01
        const aspect1159 = {
          start: new Date("2024-03-21T11:00:00.000Z"),
          end: new Date("2024-03-21T11:59:00.000Z"),
          summary: "Sun conjunct Moon",
          description: "Sun conjunct Moon",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Moon",
            "Conjunct",
            "exact",
          ],
        };

        const aspect1200Only = new Date("2024-03-21T12:00:00.000Z");

        // Complete 4-body stellium only at 12:00
        const storedAspects: Event[] = [
          aspect1159,
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Sun conjunct Moon",
            description: "Sun conjunct Moon",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Moon",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Sun conjunct Mars",
            description: "Sun conjunct Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Mars",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Sun conjunct Venus",
            description: "Sun conjunct Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Venus",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Moon conjunct Mars",
            description: "Moon conjunct Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Mars",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Moon conjunct Venus",
            description: "Moon conjunct Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Venus",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Mars conjunct Venus",
            description: "Mars conjunct Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Mars",
              "Venus",
              "Conjunct",
              "exact",
            ],
          },
        ];

        const events = getStelliumEvents(storedAspects, currentMinute);

        expect(events.length).toBeGreaterThanOrEqual(1);
        const stellium = events.find((e) => e.categories.includes("Stellium"));
        expect(stellium).toBeDefined();
        expect(stellium?.categories).toContain("Forming");
        expect(stellium?.categories).toContain("4 Body");
      });

      it("should return empty array when fewer than 6 conjunctions exist", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const startTime = new Date("2024-03-21T11:00:00.000Z");
        const endTime = new Date("2024-03-21T13:00:00.000Z");

        // Only 5 conjunctions (need 6 for 4-body stellium)
        const storedAspects: Event[] = [
          {
            start: startTime,
            end: endTime,
            summary: "Sun conjunct Moon",
            description: "Sun conjunct Moon",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Moon",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Sun conjunct Mars",
            description: "Sun conjunct Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Mars",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Sun conjunct Venus",
            description: "Sun conjunct Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Venus",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Moon conjunct Mars",
            description: "Moon conjunct Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Mars",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Moon conjunct Venus",
            description: "Moon conjunct Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Venus",
              "Conjunct",
              "exact",
            ],
          },
        ];

        const events = getStelliumEvents(storedAspects, currentMinute);

        expect(events).toHaveLength(0);
      });

      it("should skip clusters with fewer than 4 bodies", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const startTime = new Date("2024-03-21T11:00:00.000Z");
        const endTime = new Date("2024-03-21T13:00:00.000Z");

        // Two separate 3-body clusters (neither forms a stellium)
        const storedAspects: Event[] = [
          {
            start: startTime,
            end: endTime,
            summary: "Sun conjunct Moon",
            description: "Sun conjunct Moon",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Moon",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Sun conjunct Mars",
            description: "Sun conjunct Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Mars",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Moon conjunct Mars",
            description: "Moon conjunct Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Mars",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Jupiter conjunct Venus",
            description: "Jupiter conjunct Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Jupiter",
              "Venus",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Jupiter conjunct Saturn",
            description: "Jupiter conjunct Saturn",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Jupiter",
              "Saturn",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Venus conjunct Saturn",
            description: "Venus conjunct Saturn",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Venus",
              "Saturn",
              "Conjunct",
              "exact",
            ],
          },
        ];

        const events = getStelliumEvents(storedAspects, currentMinute);

        expect(events).toHaveLength(0);
      });

      it("should reject incomplete stellium (not all pairs conjunct)", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const startTime = new Date("2024-03-21T11:00:00.000Z");
        const endTime = new Date("2024-03-21T13:00:00.000Z");

        // 4 bodies but Mars-Venus conjunction is missing
        const storedAspects: Event[] = [
          {
            start: startTime,
            end: endTime,
            summary: "Sun conjunct Moon",
            description: "Sun conjunct Moon",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Moon",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Sun conjunct Mars",
            description: "Sun conjunct Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Mars",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Sun conjunct Venus",
            description: "Sun conjunct Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Venus",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Moon conjunct Mars",
            description: "Moon conjunct Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Mars",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Moon conjunct Venus",
            description: "Moon conjunct Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Venus",
              "Conjunct",
              "exact",
            ],
          },
          // Mars-Venus conjunction missing
        ];

        const events = getStelliumEvents(storedAspects, currentMinute);

        expect(events).toHaveLength(0);
      });

      it("should return empty array for invalid aspect events", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

        const storedAspects: Event[] = [
          {
            start: new Date("2024-03-21T12:00:00.000Z"),
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Invalid aspect",
            description: "Invalid aspect",
            categories: ["Not", "Valid", "Aspects"],
          },
        ];

        const events = getStelliumEvents(storedAspects, currentMinute);

        expect(events).toHaveLength(0);
      });

      it("should generate event with correct categories and description", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

        const aspect1159 = {
          start: new Date("2024-03-21T11:00:00.000Z"),
          end: new Date("2024-03-21T11:59:00.000Z"),
          summary: "Sun conjunct Moon",
          description: "Sun conjunct Moon",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Moon",
            "Conjunct",
            "exact",
          ],
        };

        const aspect1200Only = new Date("2024-03-21T12:00:00.000Z");

        const storedAspects: Event[] = [
          aspect1159,
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Sun conjunct Moon",
            description: "Sun conjunct Moon",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Moon",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Sun conjunct Mars",
            description: "Sun conjunct Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Mars",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Sun conjunct Venus",
            description: "Sun conjunct Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Venus",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Moon conjunct Mars",
            description: "Moon conjunct Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Mars",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Moon conjunct Venus",
            description: "Moon conjunct Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Venus",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Mars conjunct Venus",
            description: "Mars conjunct Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Mars",
              "Venus",
              "Conjunct",
              "exact",
            ],
          },
        ];

        const events = getStelliumEvents(storedAspects, currentMinute);

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

        const aspect1159 = {
          start: new Date("2024-03-21T11:00:00.000Z"),
          end: new Date("2024-03-21T11:59:00.000Z"),
          summary: "Sun conjunct Moon",
          description: "Sun conjunct Moon",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Moon",
            "Conjunct",
            "exact",
          ],
        };

        const aspect1200Only = new Date("2024-03-21T12:00:00.000Z");

        // 5-body stellium: Sun, Moon, Mars, Venus, Jupiter (10 conjunctions)
        const storedAspects: Event[] = [
          aspect1159,
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Sun conjunct Moon",
            description: "Sun conjunct Moon",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Moon",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Sun conjunct Mars",
            description: "Sun conjunct Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Mars",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Sun conjunct Venus",
            description: "Sun conjunct Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Venus",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Sun conjunct Jupiter",
            description: "Sun conjunct Jupiter",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Jupiter",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Moon conjunct Mars",
            description: "Moon conjunct Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Mars",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Moon conjunct Venus",
            description: "Moon conjunct Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Venus",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Moon conjunct Jupiter",
            description: "Moon conjunct Jupiter",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Jupiter",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Mars conjunct Venus",
            description: "Mars conjunct Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Mars",
              "Venus",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Mars conjunct Jupiter",
            description: "Mars conjunct Jupiter",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Mars",
              "Jupiter",
              "Conjunct",
              "exact",
            ],
          },
          {
            start: aspect1200Only,
            end: aspect1200Only,
            summary: "Venus conjunct Jupiter",
            description: "Venus conjunct Jupiter",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Venus",
              "Jupiter",
              "Conjunct",
              "exact",
            ],
          },
        ];

        const events = getStelliumEvents(storedAspects, currentMinute);

        expect(events.length).toBeGreaterThanOrEqual(1);
        const stellium = events.find((e) => e.categories.includes("5 Body"));
        expect(stellium).toBeDefined();
        expect(stellium?.categories).toContain("Stellium");
        expect(stellium?.categories).toContain("5 Body");
      });
    });
  });

  describe("getStelliumDurationEvents", () => {
    it("should return empty array for empty input", () => {
      const events = getStelliumDurationEvents([]);

      expect(events).toHaveLength(0);
    });

    it("should return empty array when no stellium events exist", () => {
      const events: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T13:00:00.000Z"),
          summary: "Sun conjunct Moon",
          description: "Sun conjunct Moon",
          categories: ["Astronomy", "Astrology", "Simple Aspect"],
        },
      ];

      const durationEvents = getStelliumDurationEvents(events);

      expect(durationEvents).toHaveLength(0);
    });

    it("should create duration event from forming to dissolving pair", () => {
      const formingEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
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
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
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

      const durationEvents = getStelliumDurationEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(durationEvents).toHaveLength(1);
      expect(durationEvents[0].start).toEqual(formingEvent.start);
      expect(durationEvents[0].end).toEqual(dissolvingEvent.start);
      expect(durationEvents[0].summary).toContain(
        "Mars, Moon, Sun, Venus stellium"
      );
      expect(durationEvents[0].description).toBe(
        "Mars, Moon, Sun, Venus stellium"
      );
      expect(durationEvents[0].categories).not.toContain("Forming");
      expect(durationEvents[0].categories).not.toContain("Dissolving");
    });

    it("should not create duration event when only forming exists", () => {
      const formingEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
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

      const durationEvents = getStelliumDurationEvents([formingEvent]);

      expect(durationEvents).toHaveLength(0);
    });

    it("should not create duration event when only dissolving exists", () => {
      const dissolvingEvent: Event = {
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
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

      const durationEvents = getStelliumDurationEvents([dissolvingEvent]);

      expect(durationEvents).toHaveLength(0);
    });

    it("should handle multiple forming/dissolving pairs", () => {
      const events: Event[] = [
        {
          start: new Date("2024-03-21T10:00:00.000Z"),
          end: new Date("2024-03-21T10:00:00.000Z"),
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
          start: new Date("2024-03-21T14:00:00.000Z"),
          end: new Date("2024-03-21T14:00:00.000Z"),
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
          start: new Date("2024-03-22T10:00:00.000Z"),
          end: new Date("2024-03-22T10:00:00.000Z"),
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
          start: new Date("2024-03-22T14:00:00.000Z"),
          end: new Date("2024-03-22T14:00:00.000Z"),
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

      const durationEvents = getStelliumDurationEvents(events);

      expect(durationEvents).toHaveLength(2);
      expect(durationEvents[0].start).toEqual(
        new Date("2024-03-21T10:00:00.000Z")
      );
      expect(durationEvents[0].end).toEqual(
        new Date("2024-03-21T14:00:00.000Z")
      );
      expect(durationEvents[1].start).toEqual(
        new Date("2024-03-22T10:00:00.000Z")
      );
      expect(durationEvents[1].end).toEqual(
        new Date("2024-03-22T14:00:00.000Z")
      );
    });

    it("should handle different body combinations separately", () => {
      const events: Event[] = [
        // First body combination
        {
          start: new Date("2024-03-21T10:00:00.000Z"),
          end: new Date("2024-03-21T10:00:00.000Z"),
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
          start: new Date("2024-03-21T14:00:00.000Z"),
          end: new Date("2024-03-21T14:00:00.000Z"),
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
          start: new Date("2024-03-21T11:00:00.000Z"),
          end: new Date("2024-03-21T11:00:00.000Z"),
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
          start: new Date("2024-03-21T15:00:00.000Z"),
          end: new Date("2024-03-21T15:00:00.000Z"),
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

      const durationEvents = getStelliumDurationEvents(events);

      expect(durationEvents).toHaveLength(2);
      expect(durationEvents[0].categories).toContain("Venus");
      expect(durationEvents[0].categories).toContain("Moon");
      expect(durationEvents[1].categories).toContain("Jupiter");
      expect(durationEvents[1].categories).toContain("Saturn");
    });

    it("should handle different stellium sizes separately", () => {
      const events: Event[] = [
        // 4-body stellium
        {
          start: new Date("2024-03-21T10:00:00.000Z"),
          end: new Date("2024-03-21T10:00:00.000Z"),
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
          start: new Date("2024-03-21T14:00:00.000Z"),
          end: new Date("2024-03-21T14:00:00.000Z"),
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
          start: new Date("2024-03-21T11:00:00.000Z"),
          end: new Date("2024-03-21T11:00:00.000Z"),
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
          start: new Date("2024-03-21T15:00:00.000Z"),
          end: new Date("2024-03-21T15:00:00.000Z"),
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

      const durationEvents = getStelliumDurationEvents(events);

      expect(durationEvents).toHaveLength(2);
      expect(durationEvents[0].categories).toContain("4 Body");
      expect(durationEvents[1].categories).toContain("5 Body");
    });
  });
});
