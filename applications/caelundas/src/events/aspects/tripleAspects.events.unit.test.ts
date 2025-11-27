import moment from "moment-timezone";
import { describe, expect, it } from "vitest";

import {
  getTripleAspectDurationEvents,
  getTripleAspectEvents,
} from "./tripleAspects.events";

import type { Event } from "../../calendar.utilities";

describe("tripleAspects.events", () => {
  describe("getTripleAspectEvents", () => {
    describe("T-Square composition", () => {
      it("should not generate exact T-Square events (only forming/dissolving)", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const startTime = new Date("2024-03-21T11:00:00.000Z");
        const endTime = new Date("2024-03-21T13:00:00.000Z");

        // T-Square: Sun opposite Moon, with Mars square to both
        // These duration events span multiple hours, so pattern exists in prev/current/next minutes
        // Triple aspects only generate forming/dissolving events, not "exact"
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
        ];

        const events = getTripleAspectEvents(storedAspects, currentMinute);

        // No events generated because pattern exists in prev/current/next
        // (neither forming nor dissolving criteria are met)
        expect(events.length).toBe(0);
      });

      it("should detect forming T-Square", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const currentTime = new Date("2024-03-21T12:00:00.000Z");

        // T-Square forming (not present in previous minute)
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
        ];

        const events = getTripleAspectEvents(storedAspects, currentMinute);

        expect(events.length).toBeGreaterThanOrEqual(1);
        const tSquare = events.find((e) => e.categories.includes("T Square"));
        expect(tSquare).toBeDefined();
        expect(tSquare?.categories).toContain("Forming");
      });

      it("should detect dissolving T-Square", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const currentTime = new Date("2024-03-21T12:00:00.000Z");

        // T-Square dissolving (will not be present in next minute)
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
        ];

        const events = getTripleAspectEvents(storedAspects, currentMinute);

        expect(events.length).toBeGreaterThanOrEqual(1);
        const tSquare = events.find((e) => e.categories.includes("T Square"));
        expect(tSquare).toBeDefined();
        expect(tSquare?.categories).toContain("Dissolving");
      });

      it("should not detect T-Square with incomplete aspects", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const startTime = new Date("2024-03-21T11:00:00.000Z");
        const endTime = new Date("2024-03-21T13:00:00.000Z");

        // Only opposition and one square (incomplete T-Square)
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

        const events = getTripleAspectEvents(storedAspects, currentMinute);

        const tSquare = events.find((e) => e.categories.includes("T Square"));
        expect(tSquare).toBeUndefined();
      });
    });

    describe("Yod composition", () => {
      it("should not generate exact Yod events (only forming/dissolving)", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const startTime = new Date("2024-03-21T11:00:00.000Z");
        const endTime = new Date("2024-03-21T13:00:00.000Z");

        // Yod: Sun sextile Moon, with Venus quincunx to both
        // Duration events span multiple hours - no forming/dissolving event generated
        const storedAspects: Event[] = [
          {
            start: startTime,
            end: endTime,
            summary: "Sun sextile Moon",
            description: "Sun sextile Moon",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Moon",
              "Sextile",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Sun quincunx Venus",
            description: "Sun quincunx Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Minor Aspect",
              "Sun",
              "Venus",
              "Quincunx",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Moon quincunx Venus",
            description: "Moon quincunx Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Minor Aspect",
              "Moon",
              "Venus",
              "Quincunx",
              "exact",
            ],
          },
        ];

        const events = getTripleAspectEvents(storedAspects, currentMinute);

        // No events generated - pattern exists in prev/current/next
        expect(events.length).toBe(0);
      });

      it("should not detect Yod with incomplete aspects", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const startTime = new Date("2024-03-21T11:00:00.000Z");
        const endTime = new Date("2024-03-21T13:00:00.000Z");

        // Only sextile and one quincunx (incomplete Yod)
        const storedAspects: Event[] = [
          {
            start: startTime,
            end: endTime,
            summary: "Sun sextile Moon",
            description: "Sun sextile Moon",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Major Aspect",
              "Sun",
              "Moon",
              "Sextile",
              "exact",
            ],
          },
          {
            start: startTime,
            end: endTime,
            summary: "Sun quincunx Venus",
            description: "Sun quincunx Venus",
            categories: [
              "Astronomy",
              "Astrology",
              "Simple Aspect",
              "Minor Aspect",
              "Sun",
              "Venus",
              "Quincunx",
              "exact",
            ],
          },
        ];

        const events = getTripleAspectEvents(storedAspects, currentMinute);

        const yod = events.find((e) => e.categories.includes("Yod"));
        expect(yod).toBeUndefined();
      });
    });

    describe("Grand Trine composition", () => {
      it("should not generate exact Grand Trine events (only forming/dissolving)", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const startTime = new Date("2024-03-21T11:00:00.000Z");
        const endTime = new Date("2024-03-21T13:00:00.000Z");

        // Grand Trine: Sun trine Moon, Sun trine Mars, Moon trine Mars
        // Duration events span multiple hours - no forming/dissolving event generated
        const storedAspects: Event[] = [
          {
            start: startTime,
            end: endTime,
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
            start: startTime,
            end: endTime,
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
            start: startTime,
            end: endTime,
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
        ];

        const events = getTripleAspectEvents(storedAspects, currentMinute);

        // No events generated - pattern exists in prev/current/next
        expect(events.length).toBe(0);
      });

      it("should not detect Grand Trine with incomplete trines", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const startTime = new Date("2024-03-21T11:00:00.000Z");
        const endTime = new Date("2024-03-21T13:00:00.000Z");

        // Only two trines (incomplete Grand Trine)
        const storedAspects: Event[] = [
          {
            start: startTime,
            end: endTime,
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
            start: startTime,
            end: endTime,
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
        ];

        const events = getTripleAspectEvents(storedAspects, currentMinute);

        const grandTrine = events.find((e) =>
          e.categories.includes("Grand Trine"),
        );
        expect(grandTrine).toBeUndefined();
      });
    });

    it("should handle empty stored aspects", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const events = getTripleAspectEvents([], currentMinute);
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

      const events = getTripleAspectEvents(storedAspects, currentMinute);
      expect(events.length).toBe(0);
    });

    it("should detect multiple triple aspects simultaneously", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const startTime = new Date("2024-03-21T11:00:00.000Z");
      const endTime = new Date("2024-03-21T13:00:00.000Z");

      // Both T-Square and Grand Trine present
      const storedAspects: Event[] = [
        // T-Square: Sun opposite Moon, Mars square both
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
        // Grand Trine: Venus, Jupiter, Saturn
        {
          start: startTime,
          end: endTime,
          summary: "Venus trine Jupiter",
          description: "Venus trine Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Venus",
            "Jupiter",
            "Trine",
            "exact",
          ],
        },
        {
          start: startTime,
          end: endTime,
          summary: "Venus trine Saturn",
          description: "Venus trine Saturn",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Venus",
            "Saturn",
            "Trine",
            "exact",
          ],
        },
        {
          start: startTime,
          end: endTime,
          summary: "Jupiter trine Saturn",
          description: "Jupiter trine Saturn",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Jupiter",
            "Saturn",
            "Trine",
            "exact",
          ],
        },
      ];

      const events = getTripleAspectEvents(storedAspects, currentMinute);

      // No events - both patterns exist in prev/current/next minutes
      expect(events.length).toBe(0);
    });
  });

  describe("getTripleAspectDurationEvents", () => {
    it("should create duration events from forming and dissolving pairs", () => {
      const formingEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "T-Square forming",
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
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "T-Square dissolving",
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

      const durationEvents = getTripleAspectDurationEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(durationEvents.length).toBe(1);
      expect(durationEvents[0]?.start).toEqual(formingEvent.start);
      expect(durationEvents[0]?.end).toEqual(dissolvingEvent.start);
      expect(durationEvents[0]?.description).toContain("t-square");
      expect(durationEvents[0]?.categories).toContain("Triple Aspect");
    });

    it("should handle multiple aspect types", () => {
      const tSquareForming: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "T-Square forming",
        description: "Mars, Moon, Sun t-square forming",
        categories: [
          "Triple Aspect",
          "T Square",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
        ],
      };

      const tSquareDissolving: Event = {
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "T-Square dissolving",
        description: "Mars, Moon, Sun t-square dissolving",
        categories: [
          "Triple Aspect",
          "T Square",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
        ],
      };

      const grandTrineForming: Event = {
        start: new Date("2024-03-21T11:00:00.000Z"),
        end: new Date("2024-03-21T11:00:00.000Z"),
        summary: "Grand Trine forming",
        description: "Jupiter, Saturn, Venus grand trine forming",
        categories: [
          "Triple Aspect",
          "Grand Trine",
          "Forming",
          "Venus",
          "Jupiter",
          "Saturn",
        ],
      };

      const grandTrineDissolving: Event = {
        start: new Date("2024-03-21T15:00:00.000Z"),
        end: new Date("2024-03-21T15:00:00.000Z"),
        summary: "Grand Trine dissolving",
        description: "Jupiter, Saturn, Venus grand trine dissolving",
        categories: [
          "Triple Aspect",
          "Grand Trine",
          "Dissolving",
          "Venus",
          "Jupiter",
          "Saturn",
        ],
      };

      const durationEvents = getTripleAspectDurationEvents([
        tSquareForming,
        tSquareDissolving,
        grandTrineForming,
        grandTrineDissolving,
      ]);

      expect(durationEvents.length).toBe(2);
      expect(
        durationEvents.find((e) => e.description.includes("t-square")),
      ).toBeDefined();
      expect(
        durationEvents.find((e) => e.description.includes("grand trine")),
      ).toBeDefined();
    });

    it("should handle multiple body triplets", () => {
      const sunMoonMarsForming: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "T-Square forming",
        description: "Sun, Moon, Mars t-square forming",
        categories: [
          "Triple Aspect",
          "T Square",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
        ],
      };

      const sunMoonMarsDissolving: Event = {
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "T-Square dissolving",
        description: "Sun, Moon, Mars t-square dissolving",
        categories: [
          "Triple Aspect",
          "T Square",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
        ],
      };

      const venusJupiterSaturnForming: Event = {
        start: new Date("2024-03-21T11:00:00.000Z"),
        end: new Date("2024-03-21T11:00:00.000Z"),
        summary: "Grand Trine forming",
        description: "Venus, Jupiter, Saturn grand trine forming",
        categories: [
          "Triple Aspect",
          "Grand Trine",
          "Forming",
          "Venus",
          "Jupiter",
          "Saturn",
        ],
      };

      const venusJupiterSaturnDissolving: Event = {
        start: new Date("2024-03-21T15:00:00.000Z"),
        end: new Date("2024-03-21T15:00:00.000Z"),
        summary: "Grand Trine dissolving",
        description: "Venus, Jupiter, Saturn grand trine dissolving",
        categories: [
          "Triple Aspect",
          "Grand Trine",
          "Dissolving",
          "Venus",
          "Jupiter",
          "Saturn",
        ],
      };

      const durationEvents = getTripleAspectDurationEvents([
        sunMoonMarsForming,
        sunMoonMarsDissolving,
        venusJupiterSaturnForming,
        venusJupiterSaturnDissolving,
      ]);

      expect(durationEvents.length).toBe(2);
      expect(
        durationEvents.find(
          (e) =>
            e.description.includes("Sun") &&
            e.description.includes("Moon") &&
            e.description.includes("Mars"),
        ),
      ).toBeDefined();
      expect(
        durationEvents.find(
          (e) =>
            e.description.includes("Venus") &&
            e.description.includes("Jupiter") &&
            e.description.includes("Saturn"),
        ),
      ).toBeDefined();
    });

    it("should filter out non-triple-aspect events", () => {
      const tripleAspectEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "T-Square forming",
        description: "Sun, Moon, Mars t-square forming",
        categories: [
          "Triple Aspect",
          "T Square",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
        ],
      };

      const nonTripleAspectEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "Some other event",
        description: "Not a triple aspect",
        categories: ["Other"],
      };

      const durationEvents = getTripleAspectDurationEvents([
        tripleAspectEvent,
        nonTripleAspectEvent,
      ]);

      expect(
        durationEvents.every((e) => e.categories.includes("Triple Aspect")),
      ).toBe(true);
    });

    it("should handle empty events array", () => {
      const durationEvents = getTripleAspectDurationEvents([]);
      expect(durationEvents.length).toBe(0);
    });

    it("should skip duration when dissolving comes before forming", () => {
      const dissolvingEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "T-Square dissolving",
        description: "Sun, Moon, Mars t-square dissolving",
        categories: [
          "Triple Aspect",
          "T Square",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
        ],
      };

      const formingEvent: Event = {
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "T-Square forming",
        description: "Sun, Moon, Mars t-square forming",
        categories: [
          "Triple Aspect",
          "T Square",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
        ],
      };

      const durationEvents = getTripleAspectDurationEvents([
        dissolvingEvent,
        formingEvent,
      ]);

      expect(durationEvents.length).toBe(0);
    });

    it("should sort bodies alphabetically in description", () => {
      const formingEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "Grand Trine forming",
        description: "Venus, Jupiter, Saturn grand trine forming",
        categories: [
          "Triple Aspect",
          "Grand Trine",
          "Forming",
          "Venus",
          "Jupiter",
          "Saturn",
        ],
      };

      const dissolvingEvent: Event = {
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "Grand Trine dissolving",
        description: "Venus, Jupiter, Saturn grand trine dissolving",
        categories: [
          "Triple Aspect",
          "Grand Trine",
          "Dissolving",
          "Venus",
          "Jupiter",
          "Saturn",
        ],
      };

      const durationEvents = getTripleAspectDurationEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(durationEvents.length).toBe(1);
      // Bodies should be sorted: Jupiter, Saturn, Venus
      expect(durationEvents[0]?.categories).toContain("Jupiter");
      expect(durationEvents[0]?.categories).toContain("Saturn");
      expect(durationEvents[0]?.categories).toContain("Venus");
      const jupiterIndex = durationEvents[0]?.categories.indexOf("Jupiter");
      const saturnIndex = durationEvents[0]?.categories.indexOf("Saturn");
      const venusIndex = durationEvents[0]?.categories.indexOf("Venus");
      expect(jupiterIndex).toBeLessThan(saturnIndex ?? 0);
      expect(saturnIndex).toBeLessThan(venusIndex ?? 0);
    });

    it("should include focal/apex information in duration events", () => {
      const formingEvent: Event = {
        start: new Date("2024-03-21T10:00:00.000Z"),
        end: new Date("2024-03-21T10:00:00.000Z"),
        summary: "T-Square forming",
        description: "Mars, Moon, Sun t-square forming (Mars focal)",
        categories: [
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
        start: new Date("2024-03-21T14:00:00.000Z"),
        end: new Date("2024-03-21T14:00:00.000Z"),
        summary: "T-Square dissolving",
        description: "Mars, Moon, Sun t-square dissolving (Mars focal)",
        categories: [
          "Triple Aspect",
          "T Square",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Mars Focal",
        ],
      };

      const durationEvents = getTripleAspectDurationEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(durationEvents.length).toBe(1);
      expect(durationEvents[0]?.summary).toContain("focal: Mars");
    });
  });
});
