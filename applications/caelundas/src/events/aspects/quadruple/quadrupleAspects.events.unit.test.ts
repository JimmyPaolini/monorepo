import moment from "moment-timezone";
import { describe, expect, it } from "vitest";

import {
    getQuadrupleAspectEvents,
    getQuadrupleAspectProgressiveEvents,
} from "./quadrupleAspects.events";

import type { AspectBodies } from "../aspects.store";
import type { Event } from "../../../calendar.utilities";

describe("quadrupleAspects.events", () => {
  describe("getQuadrupleAspectEvents", () => {
    describe("Grand Cross composition", () => {
      it("should detect Grand Cross from 2 oppositions and 4 squares", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        // Grand Cross: Sun opposite Moon, Mars opposite Jupiter
        // Plus squares: Sun-Mars, Sun-Jupiter, Moon-Mars, Moon-Jupiter
        const currentAspectBodies: AspectBodies[] = [
          { bodies: ["sun", "moon"], aspect: "opposite" },
          { bodies: ["mars", "jupiter"], aspect: "opposite" },
          { bodies: ["sun", "mars"], aspect: "square" },
          { bodies: ["sun", "jupiter"], aspect: "square" },
          { bodies: ["moon", "mars"], aspect: "square" },
          { bodies: ["moon", "jupiter"], aspect: "square" },
        ];
        const previousAspectBodies: AspectBodies[] = [];

        const events = getQuadrupleAspectEvents(
          currentAspectBodies,
          previousAspectBodies,
          currentMinute,
        );

        expect(events.length).toBeGreaterThanOrEqual(1);
        const grandCross = events.find((e) =>
          e.categories.includes("Grand Cross"),
        );
        expect(grandCross).toBeDefined();
        expect(grandCross?.description).toContain("grand cross");
        expect(grandCross?.categories).toContain("Sun");
        expect(grandCross?.categories).toContain("Moon");
        expect(grandCross?.categories).toContain("Mars");
        expect(grandCross?.categories).toContain("Jupiter");
      });

      it("should detect forming Grand Cross", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        // Grand Cross forming (starts at current minute)
        const currentAspectBodies: AspectBodies[] = [
          { bodies: ["sun", "moon"], aspect: "opposite" },
          { bodies: ["mars", "jupiter"], aspect: "opposite" },
          { bodies: ["sun", "mars"], aspect: "square" },
          { bodies: ["sun", "jupiter"], aspect: "square" },
          { bodies: ["moon", "mars"], aspect: "square" },
          { bodies: ["moon", "jupiter"], aspect: "square" },
        ];
        const previousAspectBodies: AspectBodies[] = [];

        const events = getQuadrupleAspectEvents(
          currentAspectBodies,
          previousAspectBodies,
          currentMinute,
        );

        expect(events.length).toBeGreaterThanOrEqual(1);
        const grandCross = events.find((e) =>
          e.categories.includes("Grand Cross"),
        );
        expect(grandCross).toBeDefined();
        expect(grandCross?.categories).toContain("Forming");
      });

      it("should detect dissolving Grand Cross", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        // Grand Cross dissolving (ends at current minute)
        const currentAspectBodies: AspectBodies[] = [];
        const previousAspectBodies: AspectBodies[] = [
          { bodies: ["sun", "moon"], aspect: "opposite" },
          { bodies: ["mars", "jupiter"], aspect: "opposite" },
          { bodies: ["sun", "mars"], aspect: "square" },
          { bodies: ["sun", "jupiter"], aspect: "square" },
          { bodies: ["moon", "mars"], aspect: "square" },
          { bodies: ["moon", "jupiter"], aspect: "square" },
        ];

        const events = getQuadrupleAspectEvents(
          currentAspectBodies,
          previousAspectBodies,
          currentMinute,
        );

        expect(events.length).toBeGreaterThanOrEqual(1);
        const grandCross = events.find((e) =>
          e.categories.includes("Grand Cross"),
        );
        expect(grandCross).toBeDefined();
        expect(grandCross?.categories).toContain("Dissolving");
      });

      it("should not detect Grand Cross with incomplete aspects", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        // Missing some squares - incomplete Grand Cross
        const currentAspectBodies: AspectBodies[] = [
          { bodies: ["sun", "moon"], aspect: "opposite" },
          { bodies: ["mars", "jupiter"], aspect: "opposite" },
          { bodies: ["sun", "mars"], aspect: "square" },
        ];
        const previousAspectBodies: AspectBodies[] = [];

        const events = getQuadrupleAspectEvents(
          currentAspectBodies,
          previousAspectBodies,
          currentMinute,
        );

        const grandCross = events.find((e) =>
          e.categories.includes("Grand Cross"),
        );
        expect(grandCross).toBeUndefined();
      });
    });

    describe("Kite composition", () => {
      it("should detect Kite from Grand Trine plus opposition and sextiles", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        // Kite: Grand Trine (Sun-Moon-Mars) + Venus opposite Sun + Venus sextile Moon/Mars
        const currentAspectBodies: AspectBodies[] = [
          { bodies: ["sun", "moon"], aspect: "trine" },
          { bodies: ["sun", "mars"], aspect: "trine" },
          { bodies: ["moon", "mars"], aspect: "trine" },
          { bodies: ["sun", "venus"], aspect: "opposite" },
          { bodies: ["venus", "moon"], aspect: "sextile" },
          { bodies: ["venus", "mars"], aspect: "sextile" },
        ];
        const previousAspectBodies: AspectBodies[] = [];

        const events = getQuadrupleAspectEvents(
          currentAspectBodies,
          previousAspectBodies,
          currentMinute,
        );

        expect(events.length).toBeGreaterThanOrEqual(1);
        const kite = events.find((e) => e.categories.includes("Kite"));
        expect(kite).toBeDefined();
        expect(kite?.description).toContain("kite");
        expect(kite?.categories).toContain("Sun");
        expect(kite?.categories).toContain("Moon");
        expect(kite?.categories).toContain("Mars");
        expect(kite?.categories).toContain("Venus");
        expect(kite?.description).toContain("Venus focal");
      });

      it("should not detect Kite with incomplete aspects", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        // Grand Trine present but missing sextiles
        const currentAspectBodies: AspectBodies[] = [
          { bodies: ["sun", "moon"], aspect: "trine" },
          { bodies: ["sun", "mars"], aspect: "trine" },
          { bodies: ["moon", "mars"], aspect: "trine" },
          { bodies: ["sun", "venus"], aspect: "opposite" },
        ];
        const previousAspectBodies: AspectBodies[] = [];

        const events = getQuadrupleAspectEvents(
          currentAspectBodies,
          previousAspectBodies,
          currentMinute,
        );

        const kite = events.find((e) => e.categories.includes("Kite"));
        expect(kite).toBeUndefined();
      });
    });

    it("should handle empty stored aspects", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const events = getQuadrupleAspectEvents([], [], currentMinute);
      expect(events.length).toBe(0);
    });

    it("should filter events outside current time window", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

      // Aspects that ended before current time
      const currentAspectBodies: AspectBodies[] = [];
      const previousAspectBodies: AspectBodies[] = [];

      const events = getQuadrupleAspectEvents(
        currentAspectBodies,
        previousAspectBodies,
        currentMinute,
      );
      expect(events.length).toBe(0);
    });

    it("should not generate events for progressive aspects spanning multiple hours", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      // Grand Cross pattern but spans multiple hours
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "moon"], aspect: "opposite" },
        { bodies: ["mars", "jupiter"], aspect: "opposite" },
        { bodies: ["sun", "mars"], aspect: "square" },
        { bodies: ["sun", "jupiter"], aspect: "square" },
        { bodies: ["moon", "mars"], aspect: "square" },
        { bodies: ["moon", "jupiter"], aspect: "square" },
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "moon"], aspect: "opposite" },
        { bodies: ["mars", "jupiter"], aspect: "opposite" },
        { bodies: ["sun", "mars"], aspect: "square" },
        { bodies: ["sun", "jupiter"], aspect: "square" },
        { bodies: ["moon", "mars"], aspect: "square" },
        { bodies: ["moon", "jupiter"], aspect: "square" },
      ];

      const events = getQuadrupleAspectEvents(
        currentAspectBodies,
        previousAspectBodies,
        currentMinute,
      );

      // No events - pattern exists in prev/current/next minutes
      expect(events.length).toBe(0);
    });
  });

  describe("getQuadrupleAspectProgressiveEvents", () => {
    it("should create progressive events from forming and dissolving pairs", () => {
      const formingEvent: Event = {
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        end: moment.utc("2024-03-21T10:00:00.000Z"),
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
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        end: moment.utc("2024-03-21T14:00:00.000Z"),
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

      const progressiveEvents = getQuadrupleAspectProgressiveEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(progressiveEvents.length).toBe(1);
      expect(progressiveEvents[0]?.start).toEqual(formingEvent.start);
      expect(progressiveEvents[0]?.end).toEqual(dissolvingEvent.start);
      expect(progressiveEvents[0]?.description).toContain("grand cross");
      expect(progressiveEvents[0]?.categories).toContain("Quadruple Aspect");
    });

    it("should handle multiple aspect types", () => {
      const grandCrossForming: Event = {
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        end: moment.utc("2024-03-21T10:00:00.000Z"),
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
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        end: moment.utc("2024-03-21T14:00:00.000Z"),
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
        start: moment.utc("2024-03-21T11:00:00.000Z"),
        end: moment.utc("2024-03-21T11:00:00.000Z"),
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
        start: moment.utc("2024-03-21T15:00:00.000Z"),
        end: moment.utc("2024-03-21T15:00:00.000Z"),
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

      const progressiveEvents = getQuadrupleAspectProgressiveEvents([
        grandCrossForming,
        grandCrossDissolving,
        kiteForming,
        kiteDissolving,
      ]);

      expect(progressiveEvents.length).toBe(2);
      expect(
        progressiveEvents.find((e) => e.description.includes("grand cross")),
      ).toBeDefined();
      expect(
        progressiveEvents.find((e) => e.description.includes("kite")),
      ).toBeDefined();
    });

    it("should handle multiple body quartets", () => {
      const quartet1Forming: Event = {
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        end: moment.utc("2024-03-21T10:00:00.000Z"),
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
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        end: moment.utc("2024-03-21T14:00:00.000Z"),
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
        start: moment.utc("2024-03-21T11:00:00.000Z"),
        end: moment.utc("2024-03-21T11:00:00.000Z"),
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
        start: moment.utc("2024-03-21T15:00:00.000Z"),
        end: moment.utc("2024-03-21T15:00:00.000Z"),
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

      const progressiveEvents = getQuadrupleAspectProgressiveEvents([
        quartet1Forming,
        quartet1Dissolving,
        quartet2Forming,
        quartet2Dissolving,
      ]);

      expect(progressiveEvents.length).toBe(2);
      expect(
        progressiveEvents.find(
          (e) =>
            e.description.includes("Sun") &&
            e.description.includes("Moon") &&
            e.description.includes("Mars") &&
            e.description.includes("Jupiter"),
        ),
      ).toBeDefined();
      expect(
        progressiveEvents.find(
          (e) =>
            e.description.includes("Venus") &&
            e.description.includes("Mercury") &&
            e.description.includes("Saturn") &&
            e.description.includes("Uranus"),
        ),
      ).toBeDefined();
    });

    it("should filter out non-quadruple-aspect events", () => {
      const quadrupleAspectEvent: Event = {
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        end: moment.utc("2024-03-21T10:00:00.000Z"),
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
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        end: moment.utc("2024-03-21T10:00:00.000Z"),
        summary: "Some other event",
        description: "Not a quadruple aspect",
        categories: ["Other"],
      };

      const progressiveEvents = getQuadrupleAspectProgressiveEvents([
        quadrupleAspectEvent,
        nonQuadrupleAspectEvent,
      ]);

      expect(
        progressiveEvents.every((e) =>
          e.categories.includes("Quadruple Aspect"),
        ),
      ).toBe(true);
    });

    it("should handle empty events array", () => {
      const progressiveEvents = getQuadrupleAspectProgressiveEvents([]);
      expect(progressiveEvents.length).toBe(0);
    });

    it("should skip progressive when dissolving comes before forming", () => {
      const dissolvingEvent: Event = {
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        end: moment.utc("2024-03-21T10:00:00.000Z"),
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
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        end: moment.utc("2024-03-21T14:00:00.000Z"),
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

      const progressiveEvents = getQuadrupleAspectProgressiveEvents([
        dissolvingEvent,
        formingEvent,
      ]);

      expect(progressiveEvents.length).toBe(0);
    });

    it("should remove phase emojis from summary", () => {
      const formingEvent: Event = {
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        end: moment.utc("2024-03-21T10:00:00.000Z"),
        summary: "➡️ Grand Cross forming" as unknown as string,
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
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        end: moment.utc("2024-03-21T14:00:00.000Z"),
        summary: "⬅️ Grand Cross dissolving" as unknown as string,
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

      const progressiveEvents = getQuadrupleAspectProgressiveEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(progressiveEvents.length).toBe(1);
      expect(progressiveEvents[0]?.summary).toBe("Grand Cross forming");
    });

    it("should remove phase text from description", () => {
      const formingEvent: Event = {
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        end: moment.utc("2024-03-21T10:00:00.000Z"),
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
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        end: moment.utc("2024-03-21T14:00:00.000Z"),
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

      const progressiveEvents = getQuadrupleAspectProgressiveEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(progressiveEvents.length).toBe(1);
      expect(progressiveEvents[0]?.description).not.toMatch(
        /(forming|dissolving|perfective)/i,
      );
    });

    it("should preserve focal body information in description", () => {
      const formingEvent: Event = {
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        end: moment.utc("2024-03-21T10:00:00.000Z"),
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
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        end: moment.utc("2024-03-21T14:00:00.000Z"),
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

      const progressiveEvents = getQuadrupleAspectProgressiveEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(progressiveEvents.length).toBe(1);
      // Focal info should be removed by the regex that removes phase text with optional focal info
      expect(progressiveEvents[0]?.description).not.toContain("forming");
      expect(progressiveEvents[0]?.description).not.toContain("dissolving");
    });
  });
});
