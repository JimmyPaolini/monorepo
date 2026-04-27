import moment from "moment-timezone";
import { describe, expect, it } from "vitest";

import {
  getQuintupleAspectEvents,
  getQuintupleAspectProgressiveEvents,
} from "./quintupleAspects.events";

import type { Event } from "../../../calendar.utilities";
import type { AspectBodies } from "../aspects.store";

describe("quintupleAspects.events", () => {
  describe("getQuintupleAspectEvents", () => {
    describe("Pentagram composition", () => {
      it("should not generate perfective Pentagram events (only forming/dissolving)", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        // Pentagram: 5 bodies in star pattern spanning multiple hours
        // Connections: 0-2 (Sun-Mars), 1-3 (Moon-Jupiter), 2-4 (Mars-Venus), 3-0 (Jupiter-Sun), 4-1 (Venus-Moon)
        // No events generated because pattern exists in prev/current/next minutes
        const currentAspectBodies: AspectBodies[] = [
          { bodies: ["sun", "mars"], aspect: "quintile" },
          { bodies: ["moon", "jupiter"], aspect: "quintile" },
          { bodies: ["mars", "venus"], aspect: "quintile" },
          { bodies: ["jupiter", "sun"], aspect: "quintile" },
          { bodies: ["venus", "moon"], aspect: "quintile" },
        ];
        const previousAspectBodies: AspectBodies[] = [
          { bodies: ["sun", "mars"], aspect: "quintile" },
          { bodies: ["moon", "jupiter"], aspect: "quintile" },
          { bodies: ["mars", "venus"], aspect: "quintile" },
          { bodies: ["jupiter", "sun"], aspect: "quintile" },
          { bodies: ["venus", "moon"], aspect: "quintile" },
        ];

        const events = getQuintupleAspectEvents({
          currentAspectBodies,
          previousAspectBodies,
          minute: currentMinute,
        });

        // No events - pattern exists in prev/current/next minutes
        expect(events.length).toBe(0);
      });

      it("should detect forming Pentagram for events spanning an hour", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        // Pentagram forming (starts at current minute but ends an hour later)
        // Should detect forming event since pattern exists at current but not previous minute
        const currentAspectBodies: AspectBodies[] = [
          { bodies: ["sun", "mars"], aspect: "quintile" },
          { bodies: ["moon", "jupiter"], aspect: "quintile" },
          { bodies: ["mars", "venus"], aspect: "quintile" },
          { bodies: ["jupiter", "sun"], aspect: "quintile" },
          { bodies: ["venus", "moon"], aspect: "quintile" },
        ];
        const previousAspectBodies: AspectBodies[] = [];

        const events = getQuintupleAspectEvents({
          currentAspectBodies,
          previousAspectBodies,
          minute: currentMinute,
        });

        // Should detect forming event - pattern exists at current but not previous minute
        expect(events.length).toBe(1);
        expect(events[0]?.description).toContain("pentagram forming");
      });

      it("should detect dissolving Pentagram for events ending at current minute", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        // Pentagram dissolving (ends at current minute)
        // Should detect dissolving event since pattern exists at current but not next minute
        const currentAspectBodies: AspectBodies[] = [];
        const previousAspectBodies: AspectBodies[] = [
          { bodies: ["sun", "mars"], aspect: "quintile" },
          { bodies: ["moon", "jupiter"], aspect: "quintile" },
          { bodies: ["mars", "venus"], aspect: "quintile" },
          { bodies: ["jupiter", "sun"], aspect: "quintile" },
          { bodies: ["venus", "moon"], aspect: "quintile" },
        ];

        const events = getQuintupleAspectEvents({
          currentAspectBodies,
          previousAspectBodies,
          minute: currentMinute,
        });

        // Should detect dissolving event - pattern exists at current but not next minute
        expect(events.length).toBe(1);
        expect(events[0]?.description).toContain("pentagram dissolving");
      });

      it("should not detect Pentagram with incomplete quintiles", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        // Missing some quintiles - incomplete Pentagram
        const currentAspectBodies: AspectBodies[] = [
          { bodies: ["sun", "mars"], aspect: "quintile" },
          { bodies: ["moon", "jupiter"], aspect: "quintile" },
          { bodies: ["mars", "venus"], aspect: "quintile" },
        ];
        const previousAspectBodies: AspectBodies[] = [];

        const events = getQuintupleAspectEvents({
          currentAspectBodies,
          previousAspectBodies,
          minute: currentMinute,
        });

        const pentagram = events.find((e) =>
          e.categories.includes("Pentagram"),
        );
        expect(pentagram).toBeUndefined();
      });

      it("should not detect Pentagram with fewer than 5 bodies", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        // Only 4 bodies
        const currentAspectBodies: AspectBodies[] = [
          { bodies: ["sun", "mars"], aspect: "quintile" },
          { bodies: ["moon", "jupiter"], aspect: "quintile" },
        ];
        const previousAspectBodies: AspectBodies[] = [];

        const events = getQuintupleAspectEvents({
          currentAspectBodies,
          previousAspectBodies,
          minute: currentMinute,
        });

        const pentagram = events.find((e) =>
          e.categories.includes("Pentagram"),
        );
        expect(pentagram).toBeUndefined();
      });
    });

    it("should handle empty stored aspects", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const events = getQuintupleAspectEvents({ currentAspectBodies: [], previousAspectBodies: [], minute: currentMinute });
      expect(events.length).toBe(0);
    });

    it("should filter events outside current time window", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

      // Aspects that ended before current time - edge in NEITHER array
      const currentAspectBodies: AspectBodies[] = [];
      const previousAspectBodies: AspectBodies[] = [];

      const events = getQuintupleAspectEvents({
        currentAspectBodies,
        previousAspectBodies,
        minute: currentMinute,
      });
      expect(events.length).toBe(0);
    });

    it("should not generate events for progressive aspects spanning multiple hours", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      // Pentagram pattern but spans multiple hours
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "mars"], aspect: "quintile" },
        { bodies: ["moon", "jupiter"], aspect: "quintile" },
        { bodies: ["mars", "venus"], aspect: "quintile" },
        { bodies: ["jupiter", "sun"], aspect: "quintile" },
        { bodies: ["venus", "moon"], aspect: "quintile" },
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "mars"], aspect: "quintile" },
        { bodies: ["moon", "jupiter"], aspect: "quintile" },
        { bodies: ["mars", "venus"], aspect: "quintile" },
        { bodies: ["jupiter", "sun"], aspect: "quintile" },
        { bodies: ["venus", "moon"], aspect: "quintile" },
      ];

      const events = getQuintupleAspectEvents({
        currentAspectBodies,
        previousAspectBodies,
        minute: currentMinute,
      });

      // No events - pattern exists in prev/current/next minutes
      expect(events.length).toBe(0);
    });
  });

  describe("getQuintupleAspectProgressiveEvents", () => {
    it("should create progressive events from forming and dissolving pairs", () => {
      const formingEvent: Event = {
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        end: moment.utc("2024-03-21T10:00:00.000Z"),
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
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        end: moment.utc("2024-03-21T14:00:00.000Z"),
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

      const progressiveEvents = getQuintupleAspectProgressiveEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(progressiveEvents.length).toBe(1);
      expect(progressiveEvents[0]?.start).toEqual(formingEvent.start);
      expect(progressiveEvents[0]?.end).toEqual(dissolvingEvent.start);
      expect(progressiveEvents[0]?.description).toContain("pentagram");
      expect(progressiveEvents[0]?.categories).toContain("Quintuple Aspect");
    });

    it("should handle multiple body quintets", () => {
      const quintet1Forming: Event = {
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        end: moment.utc("2024-03-21T10:00:00.000Z"),
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
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        end: moment.utc("2024-03-21T14:00:00.000Z"),
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
        start: moment.utc("2024-03-21T11:00:00.000Z"),
        end: moment.utc("2024-03-21T11:00:00.000Z"),
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
        start: moment.utc("2024-03-21T15:00:00.000Z"),
        end: moment.utc("2024-03-21T15:00:00.000Z"),
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

      const progressiveEvents = getQuintupleAspectProgressiveEvents([
        quintet1Forming,
        quintet1Dissolving,
        quintet2Forming,
        quintet2Dissolving,
      ]);

      expect(progressiveEvents.length).toBe(2);
      expect(
        progressiveEvents.find(
          (e) =>
            e.description.includes("Sun") &&
            e.description.includes("Moon") &&
            e.description.includes("Mars") &&
            e.description.includes("Jupiter") &&
            e.description.includes("Venus"),
        ),
      ).toBeDefined();
      expect(
        progressiveEvents.find(
          (e) =>
            e.description.includes("Mercury") &&
            e.description.includes("Saturn") &&
            e.description.includes("Uranus") &&
            e.description.includes("Neptune") &&
            e.description.includes("Pluto"),
        ),
      ).toBeDefined();
    });

    it("should filter out non-quintuple-aspect events", () => {
      const quintupleAspectEvent: Event = {
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        end: moment.utc("2024-03-21T10:00:00.000Z"),
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
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        end: moment.utc("2024-03-21T10:00:00.000Z"),
        summary: "Some other event",
        description: "Not a quintuple aspect",
        categories: ["Other"],
      };

      const progressiveEvents = getQuintupleAspectProgressiveEvents([
        quintupleAspectEvent,
        nonQuintupleAspectEvent,
      ]);

      expect(
        progressiveEvents.every((e) =>
          e.categories.includes("Quintuple Aspect"),
        ),
      ).toBe(true);
    });

    it("should handle empty events array", () => {
      const progressiveEvents = getQuintupleAspectProgressiveEvents([]);
      expect(progressiveEvents.length).toBe(0);
    });

    it("should skip progressive when dissolving comes before forming", () => {
      const dissolvingEvent: Event = {
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        end: moment.utc("2024-03-21T10:00:00.000Z"),
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
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        end: moment.utc("2024-03-21T14:00:00.000Z"),
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

      const progressiveEvents = getQuintupleAspectProgressiveEvents([
        dissolvingEvent,
        formingEvent,
      ]);

      expect(progressiveEvents.length).toBe(0);
    });

    it("should remove phase emojis from summary", () => {
      const formingEvent: Event = {
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        end: moment.utc("2024-03-21T10:00:00.000Z"),
        summary: "➡️ Pentagram forming" as unknown as string,
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
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        end: moment.utc("2024-03-21T14:00:00.000Z"),
        summary: "⬅️ Pentagram dissolving" as unknown as string,
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

      const progressiveEvents = getQuintupleAspectProgressiveEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(progressiveEvents.length).toBe(1);
      expect(progressiveEvents[0]?.summary).toBe("Pentagram forming");
    });

    it("should remove phase text from description", () => {
      const formingEvent: Event = {
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        end: moment.utc("2024-03-21T10:00:00.000Z"),
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
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        end: moment.utc("2024-03-21T14:00:00.000Z"),
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

      const progressiveEvents = getQuintupleAspectProgressiveEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(progressiveEvents.length).toBe(1);
      expect(progressiveEvents[0]?.description).not.toMatch(
        /(forming|dissolving|exact)$/i,
      );
      expect(progressiveEvents[0]?.description).toContain("pentagram");
    });
  });
});
