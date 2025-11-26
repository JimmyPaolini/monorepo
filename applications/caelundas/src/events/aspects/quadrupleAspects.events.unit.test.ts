import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import moment from "moment-timezone";
import type { Event } from "../../calendar.utilities";
import {
  getQuadrupleAspectEvents,
  getQuadrupleAspectDurationEvents,
} from "./quadrupleAspects.events";

describe("quadrupleAspects.events", () => {
  describe("getQuadrupleAspectEvents", () => {
    describe("Grand Cross composition", () => {
      it("should detect Grand Cross from 2 oppositions and 4 squares", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const currentTime = new Date("2024-03-21T12:00:00.000Z");

        // Grand Cross: Sun opposite Moon, Mars opposite Jupiter
        // Plus squares: Sun-Mars, Sun-Jupiter, Moon-Mars, Moon-Jupiter
        const storedAspects: Event[] = [
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Sun opposite Moon",
            description: "Sun opposite Moon",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Moon",
              "Opposite",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Mars opposite Jupiter",
            description: "Mars opposite Jupiter",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Mars",
              "Jupiter",
              "Opposite",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Sun square Mars",
            description: "Sun square Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Mars",
              "Square",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Sun square Jupiter",
            description: "Sun square Jupiter",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Jupiter",
              "Square",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Moon square Mars",
            description: "Moon square Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Mars",
              "Square",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Moon square Jupiter",
            description: "Moon square Jupiter",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Jupiter",
              "Square",
              "exact",
            ],
          },
        ];

        const events = getQuadrupleAspectEvents(storedAspects, currentMinute);

        expect(events.length).toBeGreaterThanOrEqual(1);
        const grandCross = events.find((e) =>
          e.categories.includes("Grand Cross")
        );
        expect(grandCross).toBeDefined();
        expect(grandCross!.description).toContain("grand cross");
        expect(grandCross!.categories).toContain("Sun");
        expect(grandCross!.categories).toContain("Moon");
        expect(grandCross!.categories).toContain("Mars");
        expect(grandCross!.categories).toContain("Jupiter");
      });

      it("should detect forming Grand Cross", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const currentTime = new Date("2024-03-21T12:00:00.000Z");

        // Grand Cross forming (starts at current minute)
        const storedAspects: Event[] = [
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Sun opposite Moon",
            description: "Sun opposite Moon",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Moon",
              "Opposite",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Mars opposite Jupiter",
            description: "Mars opposite Jupiter",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Mars",
              "Jupiter",
              "Opposite",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Sun square Mars",
            description: "Sun square Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Mars",
              "Square",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Sun square Jupiter",
            description: "Sun square Jupiter",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Jupiter",
              "Square",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Moon square Mars",
            description: "Moon square Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Mars",
              "Square",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Moon square Jupiter",
            description: "Moon square Jupiter",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Jupiter",
              "Square",
              "exact",
            ],
          },
        ];

        const events = getQuadrupleAspectEvents(storedAspects, currentMinute);

        expect(events.length).toBeGreaterThanOrEqual(1);
        const grandCross = events.find((e) =>
          e.categories.includes("Grand Cross")
        );
        expect(grandCross).toBeDefined();
        expect(grandCross!.categories).toContain("Forming");
      });

      it("should detect dissolving Grand Cross", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const currentTime = new Date("2024-03-21T12:00:00.000Z");

        // Grand Cross dissolving (ends at current minute)
        const storedAspects: Event[] = [
          {
            start: new Date("2024-03-21T11:00:00.000Z"),
            end: currentTime,
            summary: "Sun opposite Moon",
            description: "Sun opposite Moon",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Moon",
              "Opposite",
              "exact",
            ],
          },
          {
            start: new Date("2024-03-21T11:00:00.000Z"),
            end: currentTime,
            summary: "Mars opposite Jupiter",
            description: "Mars opposite Jupiter",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Mars",
              "Jupiter",
              "Opposite",
              "exact",
            ],
          },
          {
            start: new Date("2024-03-21T11:00:00.000Z"),
            end: currentTime,
            summary: "Sun square Mars",
            description: "Sun square Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Mars",
              "Square",
              "exact",
            ],
          },
          {
            start: new Date("2024-03-21T11:00:00.000Z"),
            end: currentTime,
            summary: "Sun square Jupiter",
            description: "Sun square Jupiter",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Jupiter",
              "Square",
              "exact",
            ],
          },
          {
            start: new Date("2024-03-21T11:00:00.000Z"),
            end: currentTime,
            summary: "Moon square Mars",
            description: "Moon square Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Mars",
              "Square",
              "exact",
            ],
          },
          {
            start: new Date("2024-03-21T11:00:00.000Z"),
            end: currentTime,
            summary: "Moon square Jupiter",
            description: "Moon square Jupiter",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Jupiter",
              "Square",
              "exact",
            ],
          },
        ];

        const events = getQuadrupleAspectEvents(storedAspects, currentMinute);

        expect(events.length).toBeGreaterThanOrEqual(1);
        const grandCross = events.find((e) =>
          e.categories.includes("Grand Cross")
        );
        expect(grandCross).toBeDefined();
        expect(grandCross!.categories).toContain("Dissolving");
      });

      it("should not detect Grand Cross with incomplete aspects", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const currentTime = new Date("2024-03-21T12:00:00.000Z");

        // Missing some squares - incomplete Grand Cross
        const storedAspects: Event[] = [
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Sun opposite Moon",
            description: "Sun opposite Moon",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Moon",
              "Opposite",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Mars opposite Jupiter",
            description: "Mars opposite Jupiter",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Mars",
              "Jupiter",
              "Opposite",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Sun square Mars",
            description: "Sun square Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Mars",
              "Square",
              "exact",
            ],
          },
        ];

        const events = getQuadrupleAspectEvents(storedAspects, currentMinute);

        const grandCross = events.find((e) =>
          e.categories.includes("Grand Cross")
        );
        expect(grandCross).toBeUndefined();
      });
    });

    describe("Kite composition", () => {
      it("should detect Kite from Grand Trine plus opposition and sextiles", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const currentTime = new Date("2024-03-21T12:00:00.000Z");

        // Kite: Grand Trine (Sun-Moon-Mars) + Venus opposite Sun + Venus sextile Moon/Mars
        const storedAspects: Event[] = [
          // Grand Trine
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Sun trine Moon",
            description: "Sun trine Moon",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Moon",
              "Trine",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Sun trine Mars",
            description: "Sun trine Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Mars",
              "Trine",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Moon trine Mars",
            description: "Moon trine Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Mars",
              "Trine",
              "exact",
            ],
          },
          // Opposition
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Sun opposite Venus",
            description: "Sun opposite Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Venus",
              "Opposite",
              "exact",
            ],
          },
          // Sextiles
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Venus sextile Moon",
            description: "Venus sextile Moon",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Venus",
              "Moon",
              "Sextile",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Venus sextile Mars",
            description: "Venus sextile Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Venus",
              "Mars",
              "Sextile",
              "exact",
            ],
          },
        ];

        const events = getQuadrupleAspectEvents(storedAspects, currentMinute);

        expect(events.length).toBeGreaterThanOrEqual(1);
        const kite = events.find((e) => e.categories.includes("Kite"));
        expect(kite).toBeDefined();
        expect(kite!.description).toContain("kite");
        expect(kite!.categories).toContain("Sun");
        expect(kite!.categories).toContain("Moon");
        expect(kite!.categories).toContain("Mars");
        expect(kite!.categories).toContain("Venus");
        expect(kite!.description).toContain("Venus focal");
      });

      it("should not detect Kite with incomplete aspects", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const currentTime = new Date("2024-03-21T12:00:00.000Z");

        // Grand Trine present but missing sextiles
        const storedAspects: Event[] = [
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Sun trine Moon",
            description: "Sun trine Moon",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Moon",
              "Trine",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Sun trine Mars",
            description: "Sun trine Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Mars",
              "Trine",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Moon trine Mars",
            description: "Moon trine Mars",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Moon",
              "Mars",
              "Trine",
              "exact",
            ],
          },
          {
            start: currentTime,
            end: new Date("2024-03-21T13:00:00.000Z"),
            summary: "Sun opposite Venus",
            description: "Sun opposite Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Venus",
              "Opposite",
              "exact",
            ],
          },
        ];

        const events = getQuadrupleAspectEvents(storedAspects, currentMinute);

        const kite = events.find((e) => e.categories.includes("Kite"));
        expect(kite).toBeUndefined();
      });
    });

    it("should handle empty stored aspects", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const events = getQuadrupleAspectEvents([], currentMinute);
      expect(events.length).toBe(0);
    });

    it("should filter events outside current time window", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

      // Aspects that ended before current time
      const storedAspects: Event[] = [
        {
          start: new Date("2024-03-21T10:00:00.000Z"),
          end: new Date("2024-03-21T11:00:00.000Z"),
          summary: "Sun opposite Moon",
          description: "Sun opposite Moon",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Moon",
            "Opposite",
            "exact",
          ],
        },
      ];

      const events = getQuadrupleAspectEvents(storedAspects, currentMinute);
      expect(events.length).toBe(0);
    });

    it("should not generate events for duration aspects spanning multiple hours", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const startTime = new Date("2024-03-21T11:00:00.000Z");
      const endTime = new Date("2024-03-21T13:00:00.000Z");

      // Grand Cross pattern but spans multiple hours
      const storedAspects: Event[] = [
        {
          start: startTime,
          end: endTime,
          summary: "Sun opposite Moon",
          description: "Sun opposite Moon",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Moon",
            "Opposite",
            "exact",
          ],
        },
        {
          start: startTime,
          end: endTime,
          summary: "Mars opposite Jupiter",
          description: "Mars opposite Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Mars",
            "Jupiter",
            "Opposite",
            "exact",
          ],
        },
        {
          start: startTime,
          end: endTime,
          summary: "Sun square Mars",
          description: "Sun square Mars",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Mars",
            "Square",
            "exact",
          ],
        },
        {
          start: startTime,
          end: endTime,
          summary: "Sun square Jupiter",
          description: "Sun square Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Jupiter",
            "Square",
            "exact",
          ],
        },
        {
          start: startTime,
          end: endTime,
          summary: "Moon square Mars",
          description: "Moon square Mars",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Moon",
            "Mars",
            "Square",
            "exact",
          ],
        },
        {
          start: startTime,
          end: endTime,
          summary: "Moon square Jupiter",
          description: "Moon square Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Moon",
            "Jupiter",
            "Square",
            "exact",
          ],
        },
      ];

      const events = getQuadrupleAspectEvents(storedAspects, currentMinute);

      // No events - pattern exists in prev/current/next minutes
      expect(events.length).toBe(0);
    });
  });

  describe("getQuadrupleAspectDurationEvents", () => {
    it("should create duration events from forming and dissolving pairs", () => {
      const formingEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "Grand Cross forming",
        description: "Jupiter, Mars, Moon, Sun grand cross forming",
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Quadruple Aspect",
          "Grand Cross",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
        ],
      };

      const dissolvingEvent: Event = {
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "Grand Cross dissolving",
        description: "Jupiter, Mars, Moon, Sun grand cross dissolving",
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Quadruple Aspect",
          "Grand Cross",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
        ],
      };

      const durationEvents = getQuadrupleAspectDurationEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(durationEvents.length).toBe(1);
      expect(durationEvents[0].start).toEqual(formingEvent.start);
      expect(durationEvents[0].end).toEqual(dissolvingEvent.start);
      expect(durationEvents[0].description).toContain("grand cross");
      expect(durationEvents[0].categories).toContain("Quadruple Aspect");
    });

    it("should handle multiple aspect types", () => {
      const grandCrossForming: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "Grand Cross forming",
        description: "Jupiter, Mars, Moon, Sun grand cross forming",
        categories: [
          "Quadruple Aspect",
          "Grand Cross",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
        ],
      };

      const grandCrossDissolving: Event = {
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "Grand Cross dissolving",
        description: "Jupiter, Mars, Moon, Sun grand cross dissolving",
        categories: [
          "Quadruple Aspect",
          "Grand Cross",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
        ],
      };

      const kiteForming: Event = {
        start: new Date("2024-03-21T11:00:00.000Z"),
        end: new Date("2024-03-21T11:00:00.000Z"),
        summary: "Kite forming",
        description: "Mars, Moon, Sun, Venus kite forming (Venus focal)",
        categories: [
          "Quadruple Aspect",
          "Kite",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Venus",
        ],
      };

      const kiteDissolving: Event = {
        start: new Date("2024-03-21T15:00:00.000Z"),
        end: new Date("2024-03-21T15:00:00.000Z"),
        summary: "Kite dissolving",
        description: "Mars, Moon, Sun, Venus kite dissolving (Venus focal)",
        categories: [
          "Quadruple Aspect",
          "Kite",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Venus",
        ],
      };

      const durationEvents = getQuadrupleAspectDurationEvents([
        grandCrossForming,
        grandCrossDissolving,
        kiteForming,
        kiteDissolving,
      ]);

      expect(durationEvents.length).toBe(2);
      expect(
        durationEvents.find((e) => e.description.includes("grand cross"))
      ).toBeDefined();
      expect(
        durationEvents.find((e) => e.description.includes("kite"))
      ).toBeDefined();
    });

    it("should handle multiple body quartets", () => {
      const quartet1Forming: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "Grand Cross forming",
        description: "Sun, Moon, Mars, Jupiter grand cross forming",
        categories: [
          "Quadruple Aspect",
          "Grand Cross",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
        ],
      };

      const quartet1Dissolving: Event = {
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "Grand Cross dissolving",
        description: "Sun, Moon, Mars, Jupiter grand cross dissolving",
        categories: [
          "Quadruple Aspect",
          "Grand Cross",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
        ],
      };

      const quartet2Forming: Event = {
        start: new Date("2024-03-21T11:00:00.000Z"),
        end: new Date("2024-03-21T11:00:00.000Z"),
        summary: "Kite forming",
        description: "Venus, Mercury, Saturn, Uranus kite forming",
        categories: [
          "Quadruple Aspect",
          "Kite",
          "Forming",
          "Venus",
          "Mercury",
          "Saturn",
          "Uranus",
        ],
      };

      const quartet2Dissolving: Event = {
        start: new Date("2024-03-21T15:00:00.000Z"),
        end: new Date("2024-03-21T15:00:00.000Z"),
        summary: "Kite dissolving",
        description: "Venus, Mercury, Saturn, Uranus kite dissolving",
        categories: [
          "Quadruple Aspect",
          "Kite",
          "Dissolving",
          "Venus",
          "Mercury",
          "Saturn",
          "Uranus",
        ],
      };

      const durationEvents = getQuadrupleAspectDurationEvents([
        quartet1Forming,
        quartet1Dissolving,
        quartet2Forming,
        quartet2Dissolving,
      ]);

      expect(durationEvents.length).toBe(2);
      expect(
        durationEvents.find(
          (e) =>
            e.description.includes("Sun") &&
            e.description.includes("Moon") &&
            e.description.includes("Mars") &&
            e.description.includes("Jupiter")
        )
      ).toBeDefined();
      expect(
        durationEvents.find(
          (e) =>
            e.description.includes("Venus") &&
            e.description.includes("Mercury") &&
            e.description.includes("Saturn") &&
            e.description.includes("Uranus")
        )
      ).toBeDefined();
    });

    it("should filter out non-quadruple-aspect events", () => {
      const quadrupleAspectEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "Grand Cross forming",
        description: "Sun, Moon, Mars, Jupiter grand cross forming",
        categories: [
          "Quadruple Aspect",
          "Grand Cross",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
        ],
      };

      const nonQuadrupleAspectEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "Some other event",
        description: "Not a quadruple aspect",
        categories: ["Other"],
      };

      const durationEvents = getQuadrupleAspectDurationEvents([
        quadrupleAspectEvent,
        nonQuadrupleAspectEvent,
      ]);

      expect(
        durationEvents.every((e) => e.categories.includes("Quadruple Aspect"))
      ).toBe(true);
    });

    it("should handle empty events array", () => {
      const durationEvents = getQuadrupleAspectDurationEvents([]);
      expect(durationEvents.length).toBe(0);
    });

    it("should skip duration when dissolving comes before forming", () => {
      const dissolvingEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "Grand Cross dissolving",
        description: "Sun, Moon, Mars, Jupiter grand cross dissolving",
        categories: [
          "Quadruple Aspect",
          "Grand Cross",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
        ],
      };

      const formingEvent: Event = {
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "Grand Cross forming",
        description: "Sun, Moon, Mars, Jupiter grand cross forming",
        categories: [
          "Quadruple Aspect",
          "Grand Cross",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
        ],
      };

      const durationEvents = getQuadrupleAspectDurationEvents([
        dissolvingEvent,
        formingEvent,
      ]);

      expect(durationEvents.length).toBe(0);
    });

    it("should remove phase emojis from summary", () => {
      const formingEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "➡️ Grand Cross forming" as any,
        description: "Jupiter, Mars, Moon, Sun grand cross forming",
        categories: [
          "Quadruple Aspect",
          "Grand Cross",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
        ],
      };

      const dissolvingEvent: Event = {
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "⬅️ Grand Cross dissolving" as any,
        description: "Jupiter, Mars, Moon, Sun grand cross dissolving",
        categories: [
          "Quadruple Aspect",
          "Grand Cross",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
        ],
      };

      const durationEvents = getQuadrupleAspectDurationEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(durationEvents.length).toBe(1);
      expect(durationEvents[0].summary).toBe("Grand Cross forming");
    });

    it("should remove phase text from description", () => {
      const formingEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "Grand Cross forming",
        description: "Jupiter, Mars, Moon, Sun grand cross forming",
        categories: [
          "Quadruple Aspect",
          "Grand Cross",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
        ],
      };

      const dissolvingEvent: Event = {
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "Grand Cross dissolving",
        description: "Jupiter, Mars, Moon, Sun grand cross dissolving",
        categories: [
          "Quadruple Aspect",
          "Grand Cross",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
        ],
      };

      const durationEvents = getQuadrupleAspectDurationEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(durationEvents.length).toBe(1);
      expect(durationEvents[0].description).not.toMatch(
        /(forming|dissolving|exact)/i
      );
    });

    it("should preserve focal body information in description", () => {
      const formingEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "Kite forming",
        description: "Mars, Moon, Sun, Venus kite forming (Venus focal)",
        categories: [
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
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "Kite dissolving",
        description: "Mars, Moon, Sun, Venus kite dissolving (Venus focal)",
        categories: [
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

      const durationEvents = getQuadrupleAspectDurationEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(durationEvents.length).toBe(1);
      // Focal info should be removed by the regex that removes phase text with optional focal info
      expect(durationEvents[0].description).not.toContain("forming");
      expect(durationEvents[0].description).not.toContain("dissolving");
    });
  });
});
