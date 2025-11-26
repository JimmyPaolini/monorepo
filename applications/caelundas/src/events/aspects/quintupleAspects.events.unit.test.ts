import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import moment from "moment-timezone";
import type { Event } from "../../calendar.utilities";
import {
  getQuintupleAspectEvents,
  getQuintupleAspectDurationEvents,
} from "./quintupleAspects.events";

describe("quintupleAspects.events", () => {
  describe("getQuintupleAspectEvents", () => {
    describe("Pentagram composition", () => {
      it("should not generate exact Pentagram events (only forming/dissolving)", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const startTime = new Date("2024-03-21T11:00:00.000Z");
        const endTime = new Date("2024-03-21T13:00:00.000Z");

        // Pentagram: 5 bodies in star pattern spanning multiple hours
        // Connections: 0-2 (Sun-Mars), 1-3 (Moon-Jupiter), 2-4 (Mars-Venus), 3-0 (Jupiter-Sun), 4-1 (Venus-Moon)
        // No events generated because pattern exists in prev/current/next minutes
        const storedAspects: Event[] = [
          {
            start: startTime,
            end: endTime,
            summary: "Sun quintile Mars",
            description: "Sun quintile Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Specialty Aspect",
              "Sun",
              "Mars",
              "Quintile",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Moon quintile Jupiter",
            description: "Moon quintile Jupiter",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Specialty Aspect",
              "Moon",
              "Jupiter",
              "Quintile",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Mars quintile Venus",
            description: "Mars quintile Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Specialty Aspect",
              "Mars",
              "Venus",
              "Quintile",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Jupiter quintile Sun",
            description: "Jupiter quintile Sun",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Specialty Aspect",
              "Jupiter",
              "Sun",
              "Quintile",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Venus quintile Moon",
            description: "Venus quintile Moon",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Specialty Aspect",
              "Venus",
              "Moon",
              "Quintile",
              "exact",
            ],
          },
        ];

        const events = getQuintupleAspectEvents(storedAspects, currentMinute);

        // No events - pattern exists in prev/current/next minutes
        expect(events.length).toBe(0);
      });

      it("should detect forming Pentagram for events spanning an hour", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const currentTime = new Date("2024-03-21T12:00:00.000Z");
        const futureTime = new Date("2024-03-21T13:00:00.000Z");

        // Pentagram forming (starts at current minute but ends an hour later)
        // Should detect forming event since pattern exists at current but not previous minute
        const storedAspects: Event[] = [
          {
            start: currentTime,
            end: futureTime,
            summary: "Sun quintile Mars",
            description: "Sun quintile Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Specialty Aspect",
              "Sun",
              "Mars",
              "Quintile",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: futureTime,
            summary: "Moon quintile Jupiter",
            description: "Moon quintile Jupiter",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Specialty Aspect",
              "Moon",
              "Jupiter",
              "Quintile",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: futureTime,
            summary: "Mars quintile Venus",
            description: "Mars quintile Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Specialty Aspect",
              "Mars",
              "Venus",
              "Quintile",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: futureTime,
            summary: "Jupiter quintile Sun",
            description: "Jupiter quintile Sun",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Specialty Aspect",
              "Jupiter",
              "Sun",
              "Quintile",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: futureTime,
            summary: "Venus quintile Moon",
            description: "Venus quintile Moon",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Specialty Aspect",
              "Venus",
              "Moon",
              "Quintile",
              "exact",
            ],
          },
        ];

        const events = getQuintupleAspectEvents(storedAspects, currentMinute);

        // Should detect forming event - pattern exists at current but not previous minute
        expect(events.length).toBe(1);
        expect(events[0].description).toContain("pentagram forming");
      });

      it("should detect dissolving Pentagram for events ending at current minute", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const currentTime = new Date("2024-03-21T12:00:00.000Z");

        // Pentagram dissolving (ends at current minute)
        // Should detect dissolving event since pattern exists at current but not next minute
        const storedAspects: Event[] = [
          {
            start: new Date("2024-03-21T11:00:00.000Z"),
            end: currentTime,
            summary: "Sun quintile Mars",
            description: "Sun quintile Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Specialty Aspect",
              "Sun",
              "Mars",
              "Quintile",
              "exact",
            ],
          },
          {
            start: new Date("2024-03-21T11:00:00.000Z"),
            end: currentTime,
            summary: "Moon quintile Jupiter",
            description: "Moon quintile Jupiter",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Specialty Aspect",
              "Moon",
              "Jupiter",
              "Quintile",
              "exact",
            ],
          },
          {
            start: new Date("2024-03-21T11:00:00.000Z"),
            end: currentTime,
            summary: "Mars quintile Venus",
            description: "Mars quintile Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Specialty Aspect",
              "Mars",
              "Venus",
              "Quintile",
              "exact",
            ],
          },
          {
            start: new Date("2024-03-21T11:00:00.000Z"),
            end: currentTime,
            summary: "Jupiter quintile Sun",
            description: "Jupiter quintile Sun",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Specialty Aspect",
              "Jupiter",
              "Sun",
              "Quintile",
              "exact",
            ],
          },
          {
            start: new Date("2024-03-21T11:00:00.000Z"),
            end: currentTime,
            summary: "Venus quintile Moon",
            description: "Venus quintile Moon",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Specialty Aspect",
              "Venus",
              "Moon",
              "Quintile",
              "exact",
            ],
          },
        ];

        const events = getQuintupleAspectEvents(storedAspects, currentMinute);

        // Should detect dissolving event - pattern exists at current but not next minute
        expect(events.length).toBe(1);
        expect(events[0].description).toContain("pentagram dissolving");
      });

      it("should not detect Pentagram with incomplete quintiles", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const currentTime = new Date("2024-03-21T12:00:00.000Z");

        // Missing some quintiles - incomplete Pentagram
        const storedAspects: Event[] = [
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Sun quintile Mars",
            description: "Sun quintile Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Specialty Aspect",
              "Sun",
              "Mars",
              "Quintile",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Moon quintile Jupiter",
            description: "Moon quintile Jupiter",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Specialty Aspect",
              "Moon",
              "Jupiter",
              "Quintile",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Mars quintile Venus",
            description: "Mars quintile Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Specialty Aspect",
              "Mars",
              "Venus",
              "Quintile",
              "exact",
            ],
          },
        ];

        const events = getQuintupleAspectEvents(storedAspects, currentMinute);

        const pentagram = events.find((e) =>
          e.categories.includes("Pentagram")
        );
        expect(pentagram).toBeUndefined();
      });

      it("should not detect Pentagram with fewer than 5 bodies", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const currentTime = new Date("2024-03-21T12:00:00.000Z");

        // Only 4 bodies
        const storedAspects: Event[] = [
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Sun quintile Mars",
            description: "Sun quintile Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Specialty Aspect",
              "Sun",
              "Mars",
              "Quintile",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Moon quintile Jupiter",
            description: "Moon quintile Jupiter",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Specialty Aspect",
              "Moon",
              "Jupiter",
              "Quintile",
              "exact",
            ],
          },
        ];

        const events = getQuintupleAspectEvents(storedAspects, currentMinute);

        const pentagram = events.find((e) =>
          e.categories.includes("Pentagram")
        );
        expect(pentagram).toBeUndefined();
      });
    });

    it("should handle empty stored aspects", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const events = getQuintupleAspectEvents([], currentMinute);
      expect(events.length).toBe(0);
    });

    it("should filter events outside current time window", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

      // Aspects that ended before current time
      const storedAspects: Event[] = [
        {
          start: new Date("2024-03-21T10:00:00.000Z"),
          end: new Date("2024-03-21T11:00:00.000Z"),
          summary: "Sun quintile Mars",
          description: "Sun quintile Mars",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Sun",
            "Mars",
            "Quintile",
            "exact",
          ],
        },
      ];

      const events = getQuintupleAspectEvents(storedAspects, currentMinute);
      expect(events.length).toBe(0);
    });

    it("should not generate events for duration aspects spanning multiple hours", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const startTime = new Date("2024-03-21T11:00:00.000Z");
      const endTime = new Date("2024-03-21T13:00:00.000Z");

      // Pentagram pattern but spans multiple hours
      const storedAspects: Event[] = [
        {
          start: startTime,
          end: endTime,
          summary: "Sun quintile Mars",
          description: "Sun quintile Mars",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Sun",
            "Mars",
            "Quintile",
            "exact",
          ],
        },
        {
          start: startTime,
          end: endTime,
          summary: "Moon quintile Jupiter",
          description: "Moon quintile Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Moon",
            "Jupiter",
            "Quintile",
            "exact",
          ],
        },
        {
          start: startTime,
          end: endTime,
          summary: "Mars quintile Venus",
          description: "Mars quintile Venus",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Mars",
            "Venus",
            "Quintile",
            "exact",
          ],
        },
        {
          start: startTime,
          end: endTime,
          summary: "Jupiter quintile Sun",
          description: "Jupiter quintile Sun",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Jupiter",
            "Sun",
            "Quintile",
            "exact",
          ],
        },
        {
          start: startTime,
          end: endTime,
          summary: "Venus quintile Moon",
          description: "Venus quintile Moon",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Venus",
            "Moon",
            "Quintile",
            "exact",
          ],
        },
      ];

      const events = getQuintupleAspectEvents(storedAspects, currentMinute);

      // No events - pattern exists in prev/current/next minutes
      expect(events.length).toBe(0);
    });
  });

  describe("getQuintupleAspectDurationEvents", () => {
    it("should create duration events from forming and dissolving pairs", () => {
      const formingEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "Pentagram forming",
        description: "Jupiter, Mars, Moon, Sun, Venus pentagram forming",
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Quintuple Aspect",
          "Pentagram",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
      };

      const dissolvingEvent: Event = {
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "Pentagram dissolving",
        description: "Jupiter, Mars, Moon, Sun, Venus pentagram dissolving",
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Quintuple Aspect",
          "Pentagram",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
      };

      const durationEvents = getQuintupleAspectDurationEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(durationEvents.length).toBe(1);
      expect(durationEvents[0].start).toEqual(formingEvent.start);
      expect(durationEvents[0].end).toEqual(dissolvingEvent.start);
      expect(durationEvents[0].description).toContain("pentagram");
      expect(durationEvents[0].categories).toContain("Quintuple Aspect");
    });

    it("should handle multiple body quintets", () => {
      const quintet1Forming: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "Pentagram forming",
        description: "Sun, Moon, Mars, Jupiter, Venus pentagram forming",
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
      };

      const quintet1Dissolving: Event = {
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "Pentagram dissolving",
        description: "Sun, Moon, Mars, Jupiter, Venus pentagram dissolving",
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
      };

      const quintet2Forming: Event = {
        start: new Date("2024-03-21T11:00:00.000Z"),
        end: new Date("2024-03-21T11:00:00.000Z"),
        summary: "Pentagram forming",
        description:
          "Mercury, Saturn, Uranus, Neptune, Pluto pentagram forming",
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Forming",
          "Mercury",
          "Saturn",
          "Uranus",
          "Neptune",
          "Pluto",
        ],
      };

      const quintet2Dissolving: Event = {
        start: new Date("2024-03-21T15:00:00.000Z"),
        end: new Date("2024-03-21T15:00:00.000Z"),
        summary: "Pentagram dissolving",
        description:
          "Mercury, Saturn, Uranus, Neptune, Pluto pentagram dissolving",
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Dissolving",
          "Mercury",
          "Saturn",
          "Uranus",
          "Neptune",
          "Pluto",
        ],
      };

      const durationEvents = getQuintupleAspectDurationEvents([
        quintet1Forming,
        quintet1Dissolving,
        quintet2Forming,
        quintet2Dissolving,
      ]);

      expect(durationEvents.length).toBe(2);
      expect(
        durationEvents.find(
          (e) =>
            e.description.includes("Sun") &&
            e.description.includes("Moon") &&
            e.description.includes("Mars") &&
            e.description.includes("Jupiter") &&
            e.description.includes("Venus")
        )
      ).toBeDefined();
      expect(
        durationEvents.find(
          (e) =>
            e.description.includes("Mercury") &&
            e.description.includes("Saturn") &&
            e.description.includes("Uranus") &&
            e.description.includes("Neptune") &&
            e.description.includes("Pluto")
        )
      ).toBeDefined();
    });

    it("should filter out non-quintuple-aspect events", () => {
      const quintupleAspectEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "Pentagram forming",
        description: "Sun, Moon, Mars, Jupiter, Venus pentagram forming",
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
      };

      const nonQuintupleAspectEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "Some other event",
        description: "Not a quintuple aspect",
        categories: ["Other"],
      };

      const durationEvents = getQuintupleAspectDurationEvents([
        quintupleAspectEvent,
        nonQuintupleAspectEvent,
      ]);

      expect(
        durationEvents.every((e) => e.categories.includes("Quintuple Aspect"))
      ).toBe(true);
    });

    it("should handle empty events array", () => {
      const durationEvents = getQuintupleAspectDurationEvents([]);
      expect(durationEvents.length).toBe(0);
    });

    it("should skip duration when dissolving comes before forming", () => {
      const dissolvingEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "Pentagram dissolving",
        description: "Sun, Moon, Mars, Jupiter, Venus pentagram dissolving",
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
      };

      const formingEvent: Event = {
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "Pentagram forming",
        description: "Sun, Moon, Mars, Jupiter, Venus pentagram forming",
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
      };

      const durationEvents = getQuintupleAspectDurationEvents([
        dissolvingEvent,
        formingEvent,
      ]);

      expect(durationEvents.length).toBe(0);
    });

    it("should remove phase emojis from summary", () => {
      const formingEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "➡️ Pentagram forming" as any,
        description: "Jupiter, Mars, Moon, Sun, Venus pentagram forming",
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
      };

      const dissolvingEvent: Event = {
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "⬅️ Pentagram dissolving" as any,
        description: "Jupiter, Mars, Moon, Sun, Venus pentagram dissolving",
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
      };

      const durationEvents = getQuintupleAspectDurationEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(durationEvents.length).toBe(1);
      expect(durationEvents[0].summary).toBe("Pentagram forming");
    });

    it("should remove phase text from description", () => {
      const formingEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "Pentagram forming",
        description: "Jupiter, Mars, Moon, Sun, Venus pentagram forming",
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
      };

      const dissolvingEvent: Event = {
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "Pentagram dissolving",
        description: "Jupiter, Mars, Moon, Sun, Venus pentagram dissolving",
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
      };

      const durationEvents = getQuintupleAspectDurationEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(durationEvents.length).toBe(1);
      expect(durationEvents[0].description).not.toMatch(
        /(forming|dissolving|exact)$/i
      );
      expect(durationEvents[0].description).toContain("pentagram");
    });
  });
});
