import fs from "fs";

import { describe, expect, it, vi } from "vitest";

import { upsertEvents } from "../../database.utilities";
import {
  symbolByMartianPhase,
  symbolByMercurianPhase,
  symbolByVenusianPhase,
} from "../../symbols";

import {
  getMartianPhaseEvent,
  getMercurianPhaseEvent,
  getPlanetaryPhaseDurationEvents,
  getVenusianPhaseEvent,
  writePlanetaryPhaseEvents,
} from "./phases.events";

import type { Event } from "../../calendar.utilities";
import type { MartianPhase, MercurianPhase, VenusianPhase } from "../../types";

// Mock dependencies
vi.mock("../../database.utilities", () => ({
  upsertEvents: vi.fn(),
}));

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

vi.mock("./phases.utilities", () => ({
  isMorningRise: vi.fn(),
  isMorningSet: vi.fn(),
  isEveningRise: vi.fn(),
  isEveningSet: vi.fn(),
  isWesternBrightest: vi.fn(),
  isWesternElongation: vi.fn(),
  isEasternBrightest: vi.fn(),
  isEasternElongation: vi.fn(),
}));

describe("phases.events", () => {
  describe("getVenusianPhaseEvent", () => {
    it("should create a morning rise event with correct structure", () => {
      const timestamp = new Date("2024-01-15T06:00:00.000Z");

      const event = getVenusianPhaseEvent({
        timestamp,
        phase: "morning rise",
      });

      expect(event.summary).toBe(
        `♀️${symbolByVenusianPhase["morning rise"]} Venus Morning Rise`
      );
      expect(event.description).toBe("Venus Morning Rise");
      expect(event.start).toEqual(timestamp);
      expect(event.end).toEqual(timestamp);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Astrology");
      expect(event.categories).toContain("Planetary Phase");
      expect(event.categories).toContain("Venusian");
      expect(event.categories).toContain("Morning Rise");
    });

    it("should create a western brightest event with correct structure", () => {
      const timestamp = new Date("2024-02-15T06:00:00.000Z");

      const event = getVenusianPhaseEvent({
        timestamp,
        phase: "western brightest",
      });

      expect(event.summary).toBe(
        `♀️${symbolByVenusianPhase["western brightest"]} Venus Western Brightest`
      );
      expect(event.description).toBe("Venus Western Brightest");
      expect(event.categories).toContain("Western Brightest");
    });

    it("should create a western elongation event with correct structure", () => {
      const timestamp = new Date("2024-03-15T06:00:00.000Z");

      const event = getVenusianPhaseEvent({
        timestamp,
        phase: "western elongation",
      });

      expect(event.summary).toBe(
        `♀️${symbolByVenusianPhase["western elongation"]} Venus Western Elongation`
      );
      expect(event.description).toBe("Venus Western Elongation");
      expect(event.categories).toContain("Western Elongation");
    });

    it("should create a morning set event with correct structure", () => {
      const timestamp = new Date("2024-04-15T06:00:00.000Z");

      const event = getVenusianPhaseEvent({
        timestamp,
        phase: "morning set",
      });

      expect(event.summary).toBe(
        `♀️${symbolByVenusianPhase["morning set"]} Venus Morning Set`
      );
      expect(event.description).toBe("Venus Morning Set");
      expect(event.categories).toContain("Morning Set");
    });

    it("should create an evening rise event with correct structure", () => {
      const timestamp = new Date("2024-05-15T18:00:00.000Z");

      const event = getVenusianPhaseEvent({
        timestamp,
        phase: "evening rise",
      });

      expect(event.summary).toBe(
        `♀️${symbolByVenusianPhase["evening rise"]} Venus Evening Rise`
      );
      expect(event.description).toBe("Venus Evening Rise");
      expect(event.categories).toContain("Evening Rise");
    });

    it("should create an eastern elongation event with correct structure", () => {
      const timestamp = new Date("2024-06-15T18:00:00.000Z");

      const event = getVenusianPhaseEvent({
        timestamp,
        phase: "eastern elongation",
      });

      expect(event.summary).toBe(
        `♀️${symbolByVenusianPhase["eastern elongation"]} Venus Eastern Elongation`
      );
      expect(event.description).toBe("Venus Eastern Elongation");
      expect(event.categories).toContain("Eastern Elongation");
    });

    it("should create an eastern brightest event with correct structure", () => {
      const timestamp = new Date("2024-07-15T18:00:00.000Z");

      const event = getVenusianPhaseEvent({
        timestamp,
        phase: "eastern brightest",
      });

      expect(event.summary).toBe(
        `♀️${symbolByVenusianPhase["eastern brightest"]} Venus Eastern Brightest`
      );
      expect(event.description).toBe("Venus Eastern Brightest");
      expect(event.categories).toContain("Eastern Brightest");
    });

    it("should create an evening set event with correct structure", () => {
      const timestamp = new Date("2024-08-15T18:00:00.000Z");

      const event = getVenusianPhaseEvent({
        timestamp,
        phase: "evening set",
      });

      expect(event.summary).toBe(
        `♀️${symbolByVenusianPhase["evening set"]} Venus Evening Set`
      );
      expect(event.description).toBe("Venus Evening Set");
      expect(event.categories).toContain("Evening Set");
    });
  });

  describe("getMercurianPhaseEvent", () => {
    it("should create a morning rise event with correct structure", () => {
      const timestamp = new Date("2024-01-20T06:00:00.000Z");

      const event = getMercurianPhaseEvent({
        timestamp,
        phase: "morning rise",
      });

      expect(event.summary).toBe(
        `☿${symbolByMercurianPhase["morning rise"]} Mercury Morning Rise`
      );
      expect(event.description).toBe("Mercury Morning Rise");
      expect(event.start).toEqual(timestamp);
      expect(event.end).toEqual(timestamp);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Astrology");
      expect(event.categories).toContain("Planetary Phase");
      expect(event.categories).toContain("Mercurian");
      expect(event.categories).toContain("Morning Rise");
    });

    it("should create a western brightest event with correct structure", () => {
      const timestamp = new Date("2024-02-01T06:00:00.000Z");

      const event = getMercurianPhaseEvent({
        timestamp,
        phase: "western brightest",
      });

      expect(event.summary).toBe(
        `☿${symbolByMercurianPhase["western brightest"]} Mercury Western Brightest`
      );
      expect(event.description).toBe("Mercury Western Brightest");
      expect(event.categories).toContain("Western Brightest");
    });

    it("should create a western elongation event with correct structure", () => {
      const timestamp = new Date("2024-02-15T06:00:00.000Z");

      const event = getMercurianPhaseEvent({
        timestamp,
        phase: "western elongation",
      });

      expect(event.summary).toBe(
        `☿${symbolByMercurianPhase["western elongation"]} Mercury Western Elongation`
      );
      expect(event.description).toBe("Mercury Western Elongation");
      expect(event.categories).toContain("Western Elongation");
    });

    it("should create a morning set event with correct structure", () => {
      const timestamp = new Date("2024-03-01T06:00:00.000Z");

      const event = getMercurianPhaseEvent({
        timestamp,
        phase: "morning set",
      });

      expect(event.summary).toBe(
        `☿${symbolByMercurianPhase["morning set"]} Mercury Morning Set`
      );
      expect(event.description).toBe("Mercury Morning Set");
      expect(event.categories).toContain("Morning Set");
    });

    it("should create an evening rise event with correct structure", () => {
      const timestamp = new Date("2024-03-15T18:00:00.000Z");

      const event = getMercurianPhaseEvent({
        timestamp,
        phase: "evening rise",
      });

      expect(event.summary).toBe(
        `☿${symbolByMercurianPhase["evening rise"]} Mercury Evening Rise`
      );
      expect(event.description).toBe("Mercury Evening Rise");
      expect(event.categories).toContain("Evening Rise");
    });

    it("should create an eastern elongation event with correct structure", () => {
      const timestamp = new Date("2024-04-01T18:00:00.000Z");

      const event = getMercurianPhaseEvent({
        timestamp,
        phase: "eastern elongation",
      });

      expect(event.summary).toBe(
        `☿${symbolByMercurianPhase["eastern elongation"]} Mercury Eastern Elongation`
      );
      expect(event.description).toBe("Mercury Eastern Elongation");
      expect(event.categories).toContain("Eastern Elongation");
    });

    it("should create an eastern brightest event with correct structure", () => {
      const timestamp = new Date("2024-04-15T18:00:00.000Z");

      const event = getMercurianPhaseEvent({
        timestamp,
        phase: "eastern brightest",
      });

      expect(event.summary).toBe(
        `☿${symbolByMercurianPhase["eastern brightest"]} Mercury Eastern Brightest`
      );
      expect(event.description).toBe("Mercury Eastern Brightest");
      expect(event.categories).toContain("Eastern Brightest");
    });

    it("should create an evening set event with correct structure", () => {
      const timestamp = new Date("2024-05-01T18:00:00.000Z");

      const event = getMercurianPhaseEvent({
        timestamp,
        phase: "evening set",
      });

      expect(event.summary).toBe(
        `☿${symbolByMercurianPhase["evening set"]} Mercury Evening Set`
      );
      expect(event.description).toBe("Mercury Evening Set");
      expect(event.categories).toContain("Evening Set");
    });
  });

  describe("getMartianPhaseEvent", () => {
    it("should create a morning rise event with correct structure", () => {
      const timestamp = new Date("2024-06-01T06:00:00.000Z");

      const event = getMartianPhaseEvent({
        timestamp,
        phase: "morning rise",
      });

      expect(event.summary).toBe(
        `♂️${symbolByMartianPhase["morning rise"]} Mars Morning Rise`
      );
      expect(event.description).toBe("Mars Morning Rise");
      expect(event.start).toEqual(timestamp);
      expect(event.end).toEqual(timestamp);
      expect(event.categories).toContain("Astronomy");
      expect(event.categories).toContain("Astrology");
      expect(event.categories).toContain("Planetary Phase");
      expect(event.categories).toContain("Martian");
      expect(event.categories).toContain("Morning Rise");
    });

    it("should create a morning set event with correct structure", () => {
      const timestamp = new Date("2024-07-01T06:00:00.000Z");

      const event = getMartianPhaseEvent({
        timestamp,
        phase: "morning set",
      });

      expect(event.summary).toBe(
        `♂️${symbolByMartianPhase["morning set"]} Mars Morning Set`
      );
      expect(event.description).toBe("Mars Morning Set");
      expect(event.categories).toContain("Morning Set");
    });

    it("should create an evening rise event with correct structure", () => {
      const timestamp = new Date("2024-08-01T18:00:00.000Z");

      const event = getMartianPhaseEvent({
        timestamp,
        phase: "evening rise",
      });

      expect(event.summary).toBe(
        `♂️${symbolByMartianPhase["evening rise"]} Mars Evening Rise`
      );
      expect(event.description).toBe("Mars Evening Rise");
      expect(event.categories).toContain("Evening Rise");
    });

    it("should create an evening set event with correct structure", () => {
      const timestamp = new Date("2024-09-01T18:00:00.000Z");

      const event = getMartianPhaseEvent({
        timestamp,
        phase: "evening set",
      });

      expect(event.summary).toBe(
        `♂️${symbolByMartianPhase["evening set"]} Mars Evening Set`
      );
      expect(event.description).toBe("Mars Evening Set");
      expect(event.categories).toContain("Evening Set");
    });
  });

  describe("getPlanetaryPhaseDurationEvents", () => {
    it("should create Venus morning visibility duration event", () => {
      const morningRise: Event = {
        start: new Date("2024-01-15T06:00:00.000Z"),
        end: new Date("2024-01-15T06:00:00.000Z"),
        summary: "♀️🌄↥ Venus Morning Rise",
        description: "Venus Morning Rise",
        categories: [
          "Astronomy",
          "Astrology",
          "Planetary Phase",
          "Venusian",
          "Morning Rise",
        ],
      };
      const morningSet: Event = {
        start: new Date("2024-04-15T06:00:00.000Z"),
        end: new Date("2024-04-15T06:00:00.000Z"),
        summary: "♀️🌄↧ Venus Morning Set",
        description: "Venus Morning Set",
        categories: [
          "Astronomy",
          "Astrology",
          "Planetary Phase",
          "Venusian",
          "Morning Set",
        ],
      };

      const durationEvents = getPlanetaryPhaseDurationEvents([
        morningRise,
        morningSet,
      ]);

      expect(durationEvents.length).toBeGreaterThanOrEqual(1);
      const venusMorning = durationEvents.find(
        (e) =>
          e.description.includes("Venus") && e.description.includes("Morning")
      );
      expect(venusMorning).toBeDefined();
      if (venusMorning) {
        expect(venusMorning.start).toEqual(morningRise.start);
        expect(venusMorning.end).toEqual(morningSet.start);
        expect(venusMorning.summary).toContain("Venus Morning Star");
      }
    });

    it("should create Venus evening visibility duration event", () => {
      const eveningRise: Event = {
        start: new Date("2024-05-15T18:00:00.000Z"),
        end: new Date("2024-05-15T18:00:00.000Z"),
        summary: "♀️🌇↥ Venus Evening Rise",
        description: "Venus Evening Rise",
        categories: [
          "Astronomy",
          "Astrology",
          "Planetary Phase",
          "Venusian",
          "Evening Rise",
        ],
      };
      const eveningSet: Event = {
        start: new Date("2024-08-15T18:00:00.000Z"),
        end: new Date("2024-08-15T18:00:00.000Z"),
        summary: "♀️🌇↧ Venus Evening Set",
        description: "Venus Evening Set",
        categories: [
          "Astronomy",
          "Astrology",
          "Planetary Phase",
          "Venusian",
          "Evening Set",
        ],
      };

      const durationEvents = getPlanetaryPhaseDurationEvents([
        eveningRise,
        eveningSet,
      ]);

      expect(durationEvents.length).toBeGreaterThanOrEqual(1);
      const venusEvening = durationEvents.find(
        (e) =>
          e.description.includes("Venus") && e.description.includes("Evening")
      );
      expect(venusEvening).toBeDefined();
      if (venusEvening) {
        expect(venusEvening.start).toEqual(eveningRise.start);
        expect(venusEvening.end).toEqual(eveningSet.start);
        expect(venusEvening.summary).toContain("Venus Evening Star");
      }
    });

    it("should create Mercury morning visibility duration event", () => {
      const morningRise: Event = {
        start: new Date("2024-01-20T06:00:00.000Z"),
        end: new Date("2024-01-20T06:00:00.000Z"),
        summary: "☿🌄↥ Mercury Morning Rise",
        description: "Mercury Morning Rise",
        categories: [
          "Astronomy",
          "Astrology",
          "Planetary Phase",
          "Mercurian",
          "Morning Rise",
        ],
      };
      const morningSet: Event = {
        start: new Date("2024-03-01T06:00:00.000Z"),
        end: new Date("2024-03-01T06:00:00.000Z"),
        summary: "☿🌄↧ Mercury Morning Set",
        description: "Mercury Morning Set",
        categories: [
          "Astronomy",
          "Astrology",
          "Planetary Phase",
          "Mercurian",
          "Morning Set",
        ],
      };

      const durationEvents = getPlanetaryPhaseDurationEvents([
        morningRise,
        morningSet,
      ]);

      expect(durationEvents.length).toBeGreaterThanOrEqual(1);
      const mercuryMorning = durationEvents.find(
        (e) =>
          e.description.includes("Mercury") && e.description.includes("Morning")
      );
      expect(mercuryMorning).toBeDefined();
      if (mercuryMorning) {
        expect(mercuryMorning.start).toEqual(morningRise.start);
        expect(mercuryMorning.end).toEqual(morningSet.start);
        expect(mercuryMorning.summary).toContain("Mercury Morning Star");
      }
    });

    it("should create Mars morning visibility duration event", () => {
      const morningRise: Event = {
        start: new Date("2024-06-01T06:00:00.000Z"),
        end: new Date("2024-06-01T06:00:00.000Z"),
        summary: "♂️🌄↥ Mars Morning Rise",
        description: "Mars Morning Rise",
        categories: [
          "Astronomy",
          "Astrology",
          "Planetary Phase",
          "Martian",
          "Morning Rise",
        ],
      };
      const morningSet: Event = {
        start: new Date("2024-07-01T06:00:00.000Z"),
        end: new Date("2024-07-01T06:00:00.000Z"),
        summary: "♂️🌄↧ Mars Morning Set",
        description: "Mars Morning Set",
        categories: [
          "Astronomy",
          "Astrology",
          "Planetary Phase",
          "Martian",
          "Morning Set",
        ],
      };

      const durationEvents = getPlanetaryPhaseDurationEvents([
        morningRise,
        morningSet,
      ]);

      expect(durationEvents.length).toBeGreaterThanOrEqual(1);
      const marsMorning = durationEvents.find(
        (e) =>
          e.description.includes("Mars") && e.description.includes("Morning")
      );
      expect(marsMorning).toBeDefined();
      if (marsMorning) {
        expect(marsMorning.start).toEqual(morningRise.start);
        expect(marsMorning.end).toEqual(morningSet.start);
        expect(marsMorning.summary).toContain("Mars Morning Star");
      }
    });

    it("should return empty array when no planetary phase events provided", () => {
      const durationEvents = getPlanetaryPhaseDurationEvents([]);

      expect(durationEvents).toHaveLength(0);
    });

    it("should filter out non-planetary phase events", () => {
      const nonPlanetaryEvent: Event = {
        start: new Date("2024-01-15T06:00:00.000Z"),
        end: new Date("2024-01-15T06:00:00.000Z"),
        summary: "Some other event",
        description: "Not a planetary event",
        categories: ["Astronomy", "Something Else"],
      };

      const durationEvents = getPlanetaryPhaseDurationEvents([
        nonPlanetaryEvent,
      ]);

      expect(durationEvents).toHaveLength(0);
    });

    it("should handle multiple planets visibility events", () => {
      // Venus morning visibility
      const venusMorningRise: Event = {
        start: new Date("2024-01-15T06:00:00.000Z"),
        end: new Date("2024-01-15T06:00:00.000Z"),
        summary: "♀️🌄↥ Venus Morning Rise",
        description: "Venus Morning Rise",
        categories: [
          "Astronomy",
          "Astrology",
          "Planetary Phase",
          "Venusian",
          "Morning Rise",
        ],
      };
      const venusMorningSet: Event = {
        start: new Date("2024-04-15T06:00:00.000Z"),
        end: new Date("2024-04-15T06:00:00.000Z"),
        summary: "♀️🌄↧ Venus Morning Set",
        description: "Venus Morning Set",
        categories: [
          "Astronomy",
          "Astrology",
          "Planetary Phase",
          "Venusian",
          "Morning Set",
        ],
      };

      // Mercury morning visibility
      const mercuryMorningRise: Event = {
        start: new Date("2024-01-20T06:00:00.000Z"),
        end: new Date("2024-01-20T06:00:00.000Z"),
        summary: "☿🌄↥ Mercury Morning Rise",
        description: "Mercury Morning Rise",
        categories: [
          "Astronomy",
          "Astrology",
          "Planetary Phase",
          "Mercurian",
          "Morning Rise",
        ],
      };
      const mercuryMorningSet: Event = {
        start: new Date("2024-03-01T06:00:00.000Z"),
        end: new Date("2024-03-01T06:00:00.000Z"),
        summary: "☿🌄↧ Mercury Morning Set",
        description: "Mercury Morning Set",
        categories: [
          "Astronomy",
          "Astrology",
          "Planetary Phase",
          "Mercurian",
          "Morning Set",
        ],
      };

      const durationEvents = getPlanetaryPhaseDurationEvents([
        venusMorningRise,
        venusMorningSet,
        mercuryMorningRise,
        mercuryMorningSet,
      ]);

      // Should have duration events for both Venus and Mercury
      expect(durationEvents.length).toBeGreaterThanOrEqual(2);

      const venusDuration = durationEvents.find((e) =>
        e.description.includes("Venus")
      );
      const mercuryDuration = durationEvents.find((e) =>
        e.description.includes("Mercury")
      );

      expect(venusDuration).toBeDefined();
      expect(mercuryDuration).toBeDefined();
    });

    it("should create Mercury evening visibility duration event", () => {
      const eveningRise: Event = {
        start: new Date("2024-03-15T18:00:00.000Z"),
        end: new Date("2024-03-15T18:00:00.000Z"),
        summary: "☿🌇↥ Mercury Evening Rise",
        description: "Mercury Evening Rise",
        categories: [
          "Astronomy",
          "Astrology",
          "Planetary Phase",
          "Mercurian",
          "Evening Rise",
        ],
      };
      const eveningSet: Event = {
        start: new Date("2024-05-01T18:00:00.000Z"),
        end: new Date("2024-05-01T18:00:00.000Z"),
        summary: "☿🌇↧ Mercury Evening Set",
        description: "Mercury Evening Set",
        categories: [
          "Astronomy",
          "Astrology",
          "Planetary Phase",
          "Mercurian",
          "Evening Set",
        ],
      };

      const durationEvents = getPlanetaryPhaseDurationEvents([
        eveningRise,
        eveningSet,
      ]);

      expect(durationEvents.length).toBeGreaterThanOrEqual(1);
      const mercuryEvening = durationEvents.find(
        (e) =>
          e.description.includes("Mercury") && e.description.includes("Evening")
      );
      expect(mercuryEvening).toBeDefined();
      if (mercuryEvening) {
        expect(mercuryEvening.start).toEqual(eveningRise.start);
        expect(mercuryEvening.end).toEqual(eveningSet.start);
        expect(mercuryEvening.summary).toContain("Mercury Evening Star");
      }
    });

    it("should create Mars evening visibility duration event", () => {
      const eveningRise: Event = {
        start: new Date("2024-08-01T18:00:00.000Z"),
        end: new Date("2024-08-01T18:00:00.000Z"),
        summary: "♂️🌇↥ Mars Evening Rise",
        description: "Mars Evening Rise",
        categories: [
          "Astronomy",
          "Astrology",
          "Planetary Phase",
          "Martian",
          "Evening Rise",
        ],
      };
      const eveningSet: Event = {
        start: new Date("2024-09-01T18:00:00.000Z"),
        end: new Date("2024-09-01T18:00:00.000Z"),
        summary: "♂️🌇↧ Mars Evening Set",
        description: "Mars Evening Set",
        categories: [
          "Astronomy",
          "Astrology",
          "Planetary Phase",
          "Martian",
          "Evening Set",
        ],
      };

      const durationEvents = getPlanetaryPhaseDurationEvents([
        eveningRise,
        eveningSet,
      ]);

      expect(durationEvents.length).toBeGreaterThanOrEqual(1);
      const marsEvening = durationEvents.find(
        (e) =>
          e.description.includes("Mars") && e.description.includes("Evening")
      );
      expect(marsEvening).toBeDefined();
      if (marsEvening) {
        expect(marsEvening.start).toEqual(eveningRise.start);
        expect(marsEvening.end).toEqual(eveningSet.start);
        expect(marsEvening.summary).toContain("Mars Evening Star");
      }
    });
  });

  describe("writePlanetaryPhaseEvents", () => {
    it("should write events to file and database", () => {
      const start = new Date("2024-01-01T00:00:00.000Z");
      const end = new Date("2024-01-31T23:59:59.000Z");
      const events: Event[] = [
        {
          start: new Date("2024-01-15T06:00:00.000Z"),
          end: new Date("2024-01-15T06:00:00.000Z"),
          summary: "♀️🌄↥ Venus Morning Rise",
          description: "Venus Morning Rise",
          categories: [
            "Astronomy",
            "Astrology",
            "Planetary Phase",
            "Venusian",
            "Morning Rise",
          ],
        },
      ];

      writePlanetaryPhaseEvents({
        planetaryPhaseEvents: events,
        planetaryPhaseBodies: ["venus"],
        start,
        end,
      });

      expect(upsertEvents).toHaveBeenCalledWith(events);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it("should handle empty events array", () => {
      const start = new Date("2024-01-01T00:00:00.000Z");
      const end = new Date("2024-01-31T23:59:59.000Z");

      writePlanetaryPhaseEvents({
        planetaryPhaseEvents: [],
        planetaryPhaseBodies: ["venus"],
        start,
        end,
      });

      expect(upsertEvents).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it("should handle multiple planets", () => {
      const start = new Date("2024-01-01T00:00:00.000Z");
      const end = new Date("2024-01-31T23:59:59.000Z");
      const events: Event[] = [
        {
          start: new Date("2024-01-15T06:00:00.000Z"),
          end: new Date("2024-01-15T06:00:00.000Z"),
          summary: "♀️🌄↥ Venus Morning Rise",
          description: "Venus Morning Rise",
          categories: [
            "Astronomy",
            "Astrology",
            "Planetary Phase",
            "Venusian",
            "Morning Rise",
          ],
        },
        {
          start: new Date("2024-01-20T06:00:00.000Z"),
          end: new Date("2024-01-20T06:00:00.000Z"),
          summary: "☿🌄↥ Mercury Morning Rise",
          description: "Mercury Morning Rise",
          categories: [
            "Astronomy",
            "Astrology",
            "Planetary Phase",
            "Mercurian",
            "Morning Rise",
          ],
        },
      ];

      writePlanetaryPhaseEvents({
        planetaryPhaseEvents: events,
        planetaryPhaseBodies: ["venus", "mercury"],
        start,
        end,
      });

      expect(upsertEvents).toHaveBeenCalledWith(events);
      expect(fs.writeFileSync).toHaveBeenCalled();
      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      expect(writeCall[0]).toContain("venus,mercury");
    });
  });
});
