import moment, { type Moment } from "moment-timezone";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    symbolByMartianPhase,
    symbolByMercurianPhase,
    symbolByVenusianPhase,
} from "../../symbols";
import { planetaryPhaseBodies } from "../../types";

import { PhasesService } from "./phases.service";
import * as phasesUtilities from "./phases.utilities";

import type { Event } from "../../calendar.utilities";
import type {
    CoordinateEphemeris,
    DistanceEphemeris,
    IlluminationEphemeris,
} from "../../ephemeris/ephemeris.types";
import type { Body } from "../../types";

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

const service = new PhasesService();


describe("phases.events", () => {
  const setAllPhasePredicateMocks = (value: boolean): void => {
    vi.mocked(phasesUtilities.isMorningRise).mockReturnValue(value);
    vi.mocked(phasesUtilities.isMorningSet).mockReturnValue(value);
    vi.mocked(phasesUtilities.isEveningRise).mockReturnValue(value);
    vi.mocked(phasesUtilities.isEveningSet).mockReturnValue(value);
    vi.mocked(phasesUtilities.isWesternBrightest).mockReturnValue(value);
    vi.mocked(phasesUtilities.isWesternElongation).mockReturnValue(value);
    vi.mocked(phasesUtilities.isEasternBrightest).mockReturnValue(value);
    vi.mocked(phasesUtilities.isEasternElongation).mockReturnValue(value);
  };

  const createCoordinateEphemeris = (
    minute: Moment,
    longitude = 100,
  ): CoordinateEphemeris => {
    const ephemeris: CoordinateEphemeris = {};
    for (let offset = -31; offset <= 31; offset += 1) {
      const ts = new Date(minute.valueOf() + offset * 60_000).toISOString();
      ephemeris[ts] = {
        longitude,
        latitude: 0,
      };
    }
    return ephemeris;
  };

  const createDistanceEphemeris = (
    minute: Moment,
    distance = 1,
  ): DistanceEphemeris => {
    const ephemeris: DistanceEphemeris = {};
    for (let offset = -31; offset <= 31; offset += 1) {
      const ts = new Date(minute.valueOf() + offset * 60_000).toISOString();
      ephemeris[ts] = {
        distance,
      };
    }
    return ephemeris;
  };

  const createIlluminationEphemeris = (
    minute: Moment,
    illumination = 50,
  ): IlluminationEphemeris => {
    const ephemeris: IlluminationEphemeris = {};
    for (let offset = -31; offset <= 31; offset += 1) {
      const ts = new Date(minute.valueOf() + offset * 60_000).toISOString();
      ephemeris[ts] = {
        illumination,
      };
    }
    return ephemeris;
  };

  const createDetectionInputs = (
    minute: Moment,
  ): {
    minute: Moment;
    sunCoordinateEphemeris: CoordinateEphemeris;
    venusCoordinateEphemeris: CoordinateEphemeris;
    mercuryCoordinateEphemeris: CoordinateEphemeris;
    marsCoordinateEphemeris: CoordinateEphemeris;
    venusDistanceEphemeris: DistanceEphemeris;
    mercuryDistanceEphemeris: DistanceEphemeris;
    marsDistanceEphemeris: DistanceEphemeris;
    venusIlluminationEphemeris: IlluminationEphemeris;
    mercuryIlluminationEphemeris: IlluminationEphemeris;
    marsIlluminationEphemeris: IlluminationEphemeris;
  } => ({
    minute,
    sunCoordinateEphemeris: createCoordinateEphemeris(minute, 90),
    venusCoordinateEphemeris: createCoordinateEphemeris(minute, 100),
    mercuryCoordinateEphemeris: createCoordinateEphemeris(minute, 100),
    marsCoordinateEphemeris: createCoordinateEphemeris(minute, 100),
    venusDistanceEphemeris: createDistanceEphemeris(minute, 1),
    mercuryDistanceEphemeris: createDistanceEphemeris(minute, 1),
    marsDistanceEphemeris: createDistanceEphemeris(minute, 1),
    venusIlluminationEphemeris: createIlluminationEphemeris(minute, 50),
    mercuryIlluminationEphemeris: createIlluminationEphemeris(minute, 50),
    marsIlluminationEphemeris: createIlluminationEphemeris(minute, 50),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    setAllPhasePredicateMocks(false);
  });

  describe("phase detection branching", () => {
    it("detects all Venus phase events when all predicates are true", () => {
      setAllPhasePredicateMocks(true);
      const minute = moment.utc("2024-01-15T06:00:00.000Z");
      const inputs = createDetectionInputs(minute);

      const events = service.getVenusianPhaseEvents({
        minute,
        sunCoordinateEphemeris: inputs.sunCoordinateEphemeris,
        venusCoordinateEphemeris: inputs.venusCoordinateEphemeris,
        venusDistanceEphemeris: inputs.venusDistanceEphemeris,
        venusIlluminationEphemeris: inputs.venusIlluminationEphemeris,
      });

      expect(events).toHaveLength(8);
      expect(events.map((event) => event.description)).toEqual(
        expect.arrayContaining([
          "Venus Morning Rise",
          "Venus Western Brightest",
          "Venus Western Elongation",
          "Venus Morning Set",
          "Venus Evening Rise",
          "Venus Eastern Elongation",
          "Venus Eastern Brightest",
          "Venus Evening Set",
        ]),
      );
    });

    it("detects all Mercury phase events when all predicates are true", () => {
      setAllPhasePredicateMocks(true);
      const minute = moment.utc("2024-01-20T06:00:00.000Z");
      const inputs = createDetectionInputs(minute);

      const events = service.getMercurianPhaseEvents({
        minute,
        sunCoordinateEphemeris: inputs.sunCoordinateEphemeris,
        mercuryCoordinateEphemeris: inputs.mercuryCoordinateEphemeris,
        mercuryDistanceEphemeris: inputs.mercuryDistanceEphemeris,
        mercuryIlluminationEphemeris: inputs.mercuryIlluminationEphemeris,
      });

      expect(events).toHaveLength(8);
      expect(events.map((event) => event.description)).toEqual(
        expect.arrayContaining([
          "Mercury Morning Rise",
          "Mercury Western Brightest",
          "Mercury Western Elongation",
          "Mercury Morning Set",
          "Mercury Evening Rise",
          "Mercury Eastern Elongation",
          "Mercury Eastern Brightest",
          "Mercury Evening Set",
        ]),
      );
    });

    it("detects only Mars rise/set phases when all predicates are true", () => {
      setAllPhasePredicateMocks(true);
      const minute = moment.utc("2024-06-01T06:00:00.000Z");
      const inputs = createDetectionInputs(minute);

      const events = service.getMartianPhaseEvents({
        minute,
        sunCoordinateEphemeris: inputs.sunCoordinateEphemeris,
        marsCoordinateEphemeris: inputs.marsCoordinateEphemeris,
        marsDistanceEphemeris: inputs.marsDistanceEphemeris,
        marsIlluminationEphemeris: inputs.marsIlluminationEphemeris,
      });

      expect(events).toHaveLength(4);
      expect(events.map((event) => event.description)).toEqual(
        expect.arrayContaining([
          "Mars Morning Rise",
          "Mars Morning Set",
          "Mars Evening Rise",
          "Mars Evening Set",
        ]),
      );
    });

    it("returns no Venus phase events when all predicates are false", () => {
      setAllPhasePredicateMocks(false);
      const minute = moment.utc("2024-02-01T06:00:00.000Z");
      const inputs = createDetectionInputs(minute);

      const events = service.getVenusianPhaseEvents({
        minute,
        sunCoordinateEphemeris: inputs.sunCoordinateEphemeris,
        venusCoordinateEphemeris: inputs.venusCoordinateEphemeris,
        venusDistanceEphemeris: inputs.venusDistanceEphemeris,
        venusIlluminationEphemeris: inputs.venusIlluminationEphemeris,
      });

      expect(events).toEqual([]);
    });

    it("gates planetary phase detection by configured phase bodies", () => {
      setAllPhasePredicateMocks(true);
      const minute = moment.utc("2024-03-01T06:00:00.000Z");
      const inputs = createDetectionInputs(minute);

      const mutablePlanetaryPhaseBodies =
        planetaryPhaseBodies as unknown as Body[];
      const originalBodies = [...mutablePlanetaryPhaseBodies];
      mutablePlanetaryPhaseBodies.splice(
        0,
        mutablePlanetaryPhaseBodies.length,
        "venus",
      );

      try {
        const events = service.detect({
          minute,
          coordinateEphemerisByBody: {
            sun: inputs.sunCoordinateEphemeris,
            moon: inputs.sunCoordinateEphemeris,
            mercury: inputs.mercuryCoordinateEphemeris,
            venus: inputs.venusCoordinateEphemeris,
            mars: inputs.marsCoordinateEphemeris,
            jupiter: inputs.sunCoordinateEphemeris,
            saturn: inputs.sunCoordinateEphemeris,
            uranus: inputs.sunCoordinateEphemeris,
            neptune: inputs.sunCoordinateEphemeris,
            pluto: inputs.sunCoordinateEphemeris,
            chiron: inputs.sunCoordinateEphemeris,
            lilith: inputs.sunCoordinateEphemeris,
            ceres: inputs.sunCoordinateEphemeris,
            pallas: inputs.sunCoordinateEphemeris,
            juno: inputs.sunCoordinateEphemeris,
            vesta: inputs.sunCoordinateEphemeris,
            "north lunar node": inputs.sunCoordinateEphemeris,
            "south lunar node": inputs.sunCoordinateEphemeris,
            "lunar apogee": inputs.sunCoordinateEphemeris,
            "lunar perigee": inputs.sunCoordinateEphemeris,
          },
          distanceEphemerisByBody: {
            sun: inputs.venusDistanceEphemeris,
            mercury: inputs.mercuryDistanceEphemeris,
            venus: inputs.venusDistanceEphemeris,
            mars: inputs.marsDistanceEphemeris,
          },
          illuminationEphemerisByBody: {
            sun: inputs.venusIlluminationEphemeris,
            moon: inputs.venusIlluminationEphemeris,
            mercury: inputs.mercuryIlluminationEphemeris,
            venus: inputs.venusIlluminationEphemeris,
            mars: inputs.marsIlluminationEphemeris,
          },
        });

        expect(events).toHaveLength(8);
        expect(
          events.every((event) => event.description.startsWith("Venus")),
        ).toBe(true);
      } finally {
        mutablePlanetaryPhaseBodies.splice(
          0,
          mutablePlanetaryPhaseBodies.length,
          ...originalBodies,
        );
      }
    });
  });

  describe("getVenusianPhaseEvent", () => {
    it("should create a morning rise event with correct structure", () => {
      const timestamp = moment.utc("2024-01-15T06:00:00.000Z");

      const event = service.buildVenusianPhaseEvent({
        timestamp,
        phase: "morning rise",
      });

      expect(event.summary).toBe(
        `♀️${symbolByVenusianPhase["morning rise"]} Venus Morning Rise`,
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
      const timestamp = moment.utc("2024-02-15T06:00:00.000Z");

      const event = service.buildVenusianPhaseEvent({
        timestamp,
        phase: "western brightest",
      });

      expect(event.summary).toBe(
        `♀️${symbolByVenusianPhase["western brightest"]} Venus Western Brightest`,
      );
      expect(event.description).toBe("Venus Western Brightest");
      expect(event.categories).toContain("Western Brightest");
    });

    it("should create a western elongation event with correct structure", () => {
      const timestamp = moment.utc("2024-03-15T06:00:00.000Z");

      const event = service.buildVenusianPhaseEvent({
        timestamp,
        phase: "western elongation",
      });

      expect(event.summary).toBe(
        `♀️${symbolByVenusianPhase["western elongation"]} Venus Western Elongation`,
      );
      expect(event.description).toBe("Venus Western Elongation");
      expect(event.categories).toContain("Western Elongation");
    });

    it("should create a morning set event with correct structure", () => {
      const timestamp = moment.utc("2024-04-15T06:00:00.000Z");

      const event = service.buildVenusianPhaseEvent({
        timestamp,
        phase: "morning set",
      });

      expect(event.summary).toBe(
        `♀️${symbolByVenusianPhase["morning set"]} Venus Morning Set`,
      );
      expect(event.description).toBe("Venus Morning Set");
      expect(event.categories).toContain("Morning Set");
    });

    it("should create an evening rise event with correct structure", () => {
      const timestamp = moment.utc("2024-05-15T18:00:00.000Z");

      const event = service.buildVenusianPhaseEvent({
        timestamp,
        phase: "evening rise",
      });

      expect(event.summary).toBe(
        `♀️${symbolByVenusianPhase["evening rise"]} Venus Evening Rise`,
      );
      expect(event.description).toBe("Venus Evening Rise");
      expect(event.categories).toContain("Evening Rise");
    });

    it("should create an eastern elongation event with correct structure", () => {
      const timestamp = moment.utc("2024-06-15T18:00:00.000Z");

      const event = service.buildVenusianPhaseEvent({
        timestamp,
        phase: "eastern elongation",
      });

      expect(event.summary).toBe(
        `♀️${symbolByVenusianPhase["eastern elongation"]} Venus Eastern Elongation`,
      );
      expect(event.description).toBe("Venus Eastern Elongation");
      expect(event.categories).toContain("Eastern Elongation");
    });

    it("should create an eastern brightest event with correct structure", () => {
      const timestamp = moment.utc("2024-07-15T18:00:00.000Z");

      const event = service.buildVenusianPhaseEvent({
        timestamp,
        phase: "eastern brightest",
      });

      expect(event.summary).toBe(
        `♀️${symbolByVenusianPhase["eastern brightest"]} Venus Eastern Brightest`,
      );
      expect(event.description).toBe("Venus Eastern Brightest");
      expect(event.categories).toContain("Eastern Brightest");
    });

    it("should create an evening set event with correct structure", () => {
      const timestamp = moment.utc("2024-08-15T18:00:00.000Z");

      const event = service.buildVenusianPhaseEvent({
        timestamp,
        phase: "evening set",
      });

      expect(event.summary).toBe(
        `♀️${symbolByVenusianPhase["evening set"]} Venus Evening Set`,
      );
      expect(event.description).toBe("Venus Evening Set");
      expect(event.categories).toContain("Evening Set");
    });
  });

  describe("getMercurianPhaseEvent", () => {
    it("should create a morning rise event with correct structure", () => {
      const timestamp = moment.utc("2024-01-20T06:00:00.000Z");

      const event = service.buildMercurianPhaseEvent({
        timestamp,
        phase: "morning rise",
      });

      expect(event.summary).toBe(
        `☿${symbolByMercurianPhase["morning rise"]} Mercury Morning Rise`,
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
      const timestamp = moment.utc("2024-02-01T06:00:00.000Z");

      const event = service.buildMercurianPhaseEvent({
        timestamp,
        phase: "western brightest",
      });

      expect(event.summary).toBe(
        `☿${symbolByMercurianPhase["western brightest"]} Mercury Western Brightest`,
      );
      expect(event.description).toBe("Mercury Western Brightest");
      expect(event.categories).toContain("Western Brightest");
    });

    it("should create a western elongation event with correct structure", () => {
      const timestamp = moment.utc("2024-02-15T06:00:00.000Z");

      const event = service.buildMercurianPhaseEvent({
        timestamp,
        phase: "western elongation",
      });

      expect(event.summary).toBe(
        `☿${symbolByMercurianPhase["western elongation"]} Mercury Western Elongation`,
      );
      expect(event.description).toBe("Mercury Western Elongation");
      expect(event.categories).toContain("Western Elongation");
    });

    it("should create a morning set event with correct structure", () => {
      const timestamp = moment.utc("2024-03-01T06:00:00.000Z");

      const event = service.buildMercurianPhaseEvent({
        timestamp,
        phase: "morning set",
      });

      expect(event.summary).toBe(
        `☿${symbolByMercurianPhase["morning set"]} Mercury Morning Set`,
      );
      expect(event.description).toBe("Mercury Morning Set");
      expect(event.categories).toContain("Morning Set");
    });

    it("should create an evening rise event with correct structure", () => {
      const timestamp = moment.utc("2024-03-15T18:00:00.000Z");

      const event = service.buildMercurianPhaseEvent({
        timestamp,
        phase: "evening rise",
      });

      expect(event.summary).toBe(
        `☿${symbolByMercurianPhase["evening rise"]} Mercury Evening Rise`,
      );
      expect(event.description).toBe("Mercury Evening Rise");
      expect(event.categories).toContain("Evening Rise");
    });

    it("should create an eastern elongation event with correct structure", () => {
      const timestamp = moment.utc("2024-04-01T18:00:00.000Z");

      const event = service.buildMercurianPhaseEvent({
        timestamp,
        phase: "eastern elongation",
      });

      expect(event.summary).toBe(
        `☿${symbolByMercurianPhase["eastern elongation"]} Mercury Eastern Elongation`,
      );
      expect(event.description).toBe("Mercury Eastern Elongation");
      expect(event.categories).toContain("Eastern Elongation");
    });

    it("should create an eastern brightest event with correct structure", () => {
      const timestamp = moment.utc("2024-04-15T18:00:00.000Z");

      const event = service.buildMercurianPhaseEvent({
        timestamp,
        phase: "eastern brightest",
      });

      expect(event.summary).toBe(
        `☿${symbolByMercurianPhase["eastern brightest"]} Mercury Eastern Brightest`,
      );
      expect(event.description).toBe("Mercury Eastern Brightest");
      expect(event.categories).toContain("Eastern Brightest");
    });

    it("should create an evening set event with correct structure", () => {
      const timestamp = moment.utc("2024-05-01T18:00:00.000Z");

      const event = service.buildMercurianPhaseEvent({
        timestamp,
        phase: "evening set",
      });

      expect(event.summary).toBe(
        `☿${symbolByMercurianPhase["evening set"]} Mercury Evening Set`,
      );
      expect(event.description).toBe("Mercury Evening Set");
      expect(event.categories).toContain("Evening Set");
    });
  });

  describe("getMartianPhaseEvent", () => {
    it("should create a morning rise event with correct structure", () => {
      const timestamp = moment.utc("2024-06-01T06:00:00.000Z");

      const event = service.buildMartianPhaseEvent({
        timestamp,
        phase: "morning rise",
      });

      expect(event.summary).toBe(
        `♂️${symbolByMartianPhase["morning rise"]} Mars Morning Rise`,
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
      const timestamp = moment.utc("2024-07-01T06:00:00.000Z");

      const event = service.buildMartianPhaseEvent({
        timestamp,
        phase: "morning set",
      });

      expect(event.summary).toBe(
        `♂️${symbolByMartianPhase["morning set"]} Mars Morning Set`,
      );
      expect(event.description).toBe("Mars Morning Set");
      expect(event.categories).toContain("Morning Set");
    });

    it("should create an evening rise event with correct structure", () => {
      const timestamp = moment.utc("2024-08-01T18:00:00.000Z");

      const event = service.buildMartianPhaseEvent({
        timestamp,
        phase: "evening rise",
      });

      expect(event.summary).toBe(
        `♂️${symbolByMartianPhase["evening rise"]} Mars Evening Rise`,
      );
      expect(event.description).toBe("Mars Evening Rise");
      expect(event.categories).toContain("Evening Rise");
    });

    it("should create an evening set event with correct structure", () => {
      const timestamp = moment.utc("2024-09-01T18:00:00.000Z");

      const event = service.buildMartianPhaseEvent({
        timestamp,
        phase: "evening set",
      });

      expect(event.summary).toBe(
        `♂️${symbolByMartianPhase["evening set"]} Mars Evening Set`,
      );
      expect(event.description).toBe("Mars Evening Set");
      expect(event.categories).toContain("Evening Set");
    });
  });

  describe("service.detectProgressive", () => {
    it("should create Venus morning visibility progressive event", () => {
      const morningRise: Event = {
        start: moment.utc("2024-01-15T06:00:00.000Z"),
        end: moment.utc("2024-01-15T06:00:00.000Z"),
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
        start: moment.utc("2024-04-15T06:00:00.000Z"),
        end: moment.utc("2024-04-15T06:00:00.000Z"),
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

      const progressiveEvents = service.detectProgressive([
        morningRise,
        morningSet,
      ]);

      expect(progressiveEvents.length).toBeGreaterThanOrEqual(1);
      const venusMorning = progressiveEvents.find(
        (e) =>
          e.description.includes("Venus") && e.description.includes("Morning"),
      );
      expect(venusMorning).toBeDefined();
      if (venusMorning) {
        expect(venusMorning.start).toEqual(morningRise.start);
        expect(venusMorning.end).toEqual(morningSet.start);
        expect(venusMorning.summary).toContain("Venus Morning Star");
      }
    });

    it("should create Venus evening visibility progressive event", () => {
      const eveningRise: Event = {
        start: moment.utc("2024-05-15T18:00:00.000Z"),
        end: moment.utc("2024-05-15T18:00:00.000Z"),
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
        start: moment.utc("2024-08-15T18:00:00.000Z"),
        end: moment.utc("2024-08-15T18:00:00.000Z"),
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

      const progressiveEvents = service.detectProgressive([
        eveningRise,
        eveningSet,
      ]);

      expect(progressiveEvents.length).toBeGreaterThanOrEqual(1);
      const venusEvening = progressiveEvents.find(
        (e) =>
          e.description.includes("Venus") && e.description.includes("Evening"),
      );
      expect(venusEvening).toBeDefined();
      if (venusEvening) {
        expect(venusEvening.start).toEqual(eveningRise.start);
        expect(venusEvening.end).toEqual(eveningSet.start);
        expect(venusEvening.summary).toContain("Venus Evening Star");
      }
    });

    it("should create Mercury morning visibility progressive event", () => {
      const morningRise: Event = {
        start: moment.utc("2024-01-20T06:00:00.000Z"),
        end: moment.utc("2024-01-20T06:00:00.000Z"),
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
        start: moment.utc("2024-03-01T06:00:00.000Z"),
        end: moment.utc("2024-03-01T06:00:00.000Z"),
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

      const progressiveEvents = service.detectProgressive([
        morningRise,
        morningSet,
      ]);

      expect(progressiveEvents.length).toBeGreaterThanOrEqual(1);
      const mercuryMorning = progressiveEvents.find(
        (e) =>
          e.description.includes("Mercury") &&
          e.description.includes("Morning"),
      );
      expect(mercuryMorning).toBeDefined();
      if (mercuryMorning) {
        expect(mercuryMorning.start).toEqual(morningRise.start);
        expect(mercuryMorning.end).toEqual(morningSet.start);
        expect(mercuryMorning.summary).toContain("Mercury Morning Star");
      }
    });

    it("should create Mars morning visibility progressive event", () => {
      const morningRise: Event = {
        start: moment.utc("2024-06-01T06:00:00.000Z"),
        end: moment.utc("2024-06-01T06:00:00.000Z"),
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
        start: moment.utc("2024-07-01T06:00:00.000Z"),
        end: moment.utc("2024-07-01T06:00:00.000Z"),
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

      const progressiveEvents = service.detectProgressive([
        morningRise,
        morningSet,
      ]);

      expect(progressiveEvents.length).toBeGreaterThanOrEqual(1);
      const marsMorning = progressiveEvents.find(
        (e) =>
          e.description.includes("Mars") && e.description.includes("Morning"),
      );
      expect(marsMorning).toBeDefined();
      if (marsMorning) {
        expect(marsMorning.start).toEqual(morningRise.start);
        expect(marsMorning.end).toEqual(morningSet.start);
        expect(marsMorning.summary).toContain("Mars Morning Star");
      }
    });

    it("should return empty array when no planetary phase events provided", () => {
      const progressiveEvents = service.detectProgressive([]);

      expect(progressiveEvents).toHaveLength(0);
    });

    it("should filter out non-planetary phase events", () => {
      const nonPlanetaryEvent: Event = {
        start: moment.utc("2024-01-15T06:00:00.000Z"),
        end: moment.utc("2024-01-15T06:00:00.000Z"),
        summary: "Some other event",
        description: "Not a planetary event",
        categories: ["Astronomy", "Something Else"],
      };

      const progressiveEvents = service.detectProgressive([
        nonPlanetaryEvent,
      ]);

      expect(progressiveEvents).toHaveLength(0);
    });

    it("should handle multiple planets visibility events", () => {
      // Venus morning visibility
      const venusMorningRise: Event = {
        start: moment.utc("2024-01-15T06:00:00.000Z"),
        end: moment.utc("2024-01-15T06:00:00.000Z"),
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
        start: moment.utc("2024-04-15T06:00:00.000Z"),
        end: moment.utc("2024-04-15T06:00:00.000Z"),
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
        start: moment.utc("2024-01-20T06:00:00.000Z"),
        end: moment.utc("2024-01-20T06:00:00.000Z"),
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
        start: moment.utc("2024-03-01T06:00:00.000Z"),
        end: moment.utc("2024-03-01T06:00:00.000Z"),
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

      const progressiveEvents = service.detectProgressive([
        venusMorningRise,
        venusMorningSet,
        mercuryMorningRise,
        mercuryMorningSet,
      ]);

      // Should have progressive events for both Venus and Mercury
      expect(progressiveEvents.length).toBeGreaterThanOrEqual(2);

      const venusDuration = progressiveEvents.find((e) =>
        e.description.includes("Venus"),
      );
      const mercuryDuration = progressiveEvents.find((e) =>
        e.description.includes("Mercury"),
      );

      expect(venusDuration).toBeDefined();
      expect(mercuryDuration).toBeDefined();
    });

    it("should create Mercury evening visibility progressive event", () => {
      const eveningRise: Event = {
        start: moment.utc("2024-03-15T18:00:00.000Z"),
        end: moment.utc("2024-03-15T18:00:00.000Z"),
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
        start: moment.utc("2024-05-01T18:00:00.000Z"),
        end: moment.utc("2024-05-01T18:00:00.000Z"),
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

      const progressiveEvents = service.detectProgressive([
        eveningRise,
        eveningSet,
      ]);

      expect(progressiveEvents.length).toBeGreaterThanOrEqual(1);
      const mercuryEvening = progressiveEvents.find(
        (e) =>
          e.description.includes("Mercury") &&
          e.description.includes("Evening"),
      );
      expect(mercuryEvening).toBeDefined();
      if (mercuryEvening) {
        expect(mercuryEvening.start).toEqual(eveningRise.start);
        expect(mercuryEvening.end).toEqual(eveningSet.start);
        expect(mercuryEvening.summary).toContain("Mercury Evening Star");
      }
    });

    it("should create Mars evening visibility progressive event", () => {
      const eveningRise: Event = {
        start: moment.utc("2024-08-01T18:00:00.000Z"),
        end: moment.utc("2024-08-01T18:00:00.000Z"),
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
        start: moment.utc("2024-09-01T18:00:00.000Z"),
        end: moment.utc("2024-09-01T18:00:00.000Z"),
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

      const progressiveEvents = service.detectProgressive([
        eveningRise,
        eveningSet,
      ]);

      expect(progressiveEvents.length).toBeGreaterThanOrEqual(1);
      const marsEvening = progressiveEvents.find(
        (e) =>
          e.description.includes("Mars") && e.description.includes("Evening"),
      );
      expect(marsEvening).toBeDefined();
      if (marsEvening) {
        expect(marsEvening.start).toEqual(eveningRise.start);
        expect(marsEvening.end).toEqual(eveningSet.start);
        expect(marsEvening.summary).toContain("Mars Evening Star");
      }
    });
  });
});
