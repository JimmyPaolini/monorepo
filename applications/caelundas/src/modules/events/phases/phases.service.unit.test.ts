import {
  symbolByMartianPhase,
  symbolByMercurianPhase,
  symbolByVenusianPhase,
} from "@caelundas/src/caelundas.constants";
import { planetaryPhaseBodies } from "@caelundas/src/caelundas.types";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { ProgressiveUtilitiesService } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Test } from "@nestjs/testing";
import moment, { type Moment } from "moment-timezone";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { PhasesService } from "./phases.service";

import type { Body } from "@caelundas/src/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type {
  CoordinateEphemeris,
  DistanceEphemeris,
  IlluminationEphemeris,
} from "@caelundas/src/modules/ephemeris/ephemeris.types";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

interface ServicePrivate {
  isMorningRise: (args: object) => boolean;
  isMorningSet: (args: object) => boolean;
  isEveningRise: (args: object) => boolean;
  isEveningSet: (args: object) => boolean;
  isWesternBrightest: (args: object) => boolean;
  isWesternElongation: (args: object) => boolean;
  isEasternBrightest: (args: object) => boolean;
  isEasternElongation: (args: object) => boolean;
  isBrightest: (args: object) => boolean;
}

describe("phases.events", () => {
  let service: PhasesService;
  let s: ServicePrivate;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PhasesService,
        EphemerisService,
        MathService,
        ProgressiveUtilitiesService,
      ],
    }).compile();
    service = module.get(PhasesService);
    s = service as unknown as ServicePrivate;
  });

  const setAllPhasePredicateSpies = (value: boolean): void => {
    vi.spyOn(s, "isMorningRise").mockReturnValue(value);
    vi.spyOn(s, "isMorningSet").mockReturnValue(value);
    vi.spyOn(s, "isEveningRise").mockReturnValue(value);
    vi.spyOn(s, "isEveningSet").mockReturnValue(value);
    vi.spyOn(s, "isWesternBrightest").mockReturnValue(value);
    vi.spyOn(s, "isWesternElongation").mockReturnValue(value);
    vi.spyOn(s, "isEasternBrightest").mockReturnValue(value);
    vi.spyOn(s, "isEasternElongation").mockReturnValue(value);
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
    setAllPhasePredicateSpies(false);
  });

  describe("phase detection branching", () => {
    it("detects all Venus phase events when all predicates are true", () => {
      setAllPhasePredicateSpies(true);
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
      setAllPhasePredicateSpies(true);
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
      setAllPhasePredicateSpies(true);
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
      setAllPhasePredicateSpies(false);
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
      setAllPhasePredicateSpies(true);
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

      const progressiveEvents = service.detectProgressive([nonPlanetaryEvent]);

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

  describe("private utility methods", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    describe("isBrightest", () => {
      it("should return true when current brightness is maximum", () => {
        const result = s.isBrightest({
          currentDistance: 1,
          currentIllumination: 0.9,
          previousDistances: [1.1, 1.05],
          previousIlluminations: [0.8, 0.85],
          nextDistances: [1.05, 1.1],
          nextIlluminations: [0.85, 0.8],
        });

        expect(result).toBe(true);
      });

      it("should return false when previous was brighter", () => {
        const result = s.isBrightest({
          currentDistance: 1,
          currentIllumination: 0.5,
          previousDistances: [0.8],
          previousIlluminations: [0.9],
          nextDistances: [1.1],
          nextIlluminations: [0.4],
        });

        expect(result).toBe(false);
      });

      it("should return false when next will be brighter", () => {
        const result = s.isBrightest({
          currentDistance: 1,
          currentIllumination: 0.5,
          previousDistances: [1.2],
          previousIlluminations: [0.4],
          nextDistances: [0.8],
          nextIlluminations: [0.9],
        });

        expect(result).toBe(false);
      });

      it("should throw when previous arrays have different lengths", () => {
        expect(() =>
          s.isBrightest({
            currentDistance: 1,
            currentIllumination: 0.5,
            previousDistances: [1, 1.1],
            previousIlluminations: [0.5],
            nextDistances: [1],
            nextIlluminations: [0.5],
          }),
        ).toThrow("same length");
      });

      it("should throw when next arrays have different lengths", () => {
        expect(() =>
          s.isBrightest({
            currentDistance: 1,
            currentIllumination: 0.5,
            previousDistances: [1],
            previousIlluminations: [0.5],
            nextDistances: [1, 1.1],
            nextIlluminations: [0.5],
          }),
        ).toThrow("same length");
      });
    });

    describe("isWesternBrightest", () => {
      it("should return true when planet is western and brightest", () => {
        const result = s.isWesternBrightest({
          currentDistance: 1,
          currentIllumination: 0.9,
          previousDistances: [1.1],
          previousIlluminations: [0.8],
          nextDistances: [1.1],
          nextIlluminations: [0.8],
          currentLongitudePlanet: 90,
          currentLongitudeSun: 100,
        });

        expect(result).toBe(true);
      });

      it("should return false when planet is eastern", () => {
        const result = s.isWesternBrightest({
          currentDistance: 1,
          currentIllumination: 0.9,
          previousDistances: [1.1],
          previousIlluminations: [0.8],
          nextDistances: [1.1],
          nextIlluminations: [0.8],
          currentLongitudePlanet: 110,
          currentLongitudeSun: 100,
        });

        expect(result).toBe(false);
      });
    });

    describe("isEasternBrightest", () => {
      it("should return true when planet is eastern and brightest", () => {
        const result = s.isEasternBrightest({
          currentDistance: 1,
          currentIllumination: 0.9,
          previousDistances: [1.1],
          previousIlluminations: [0.8],
          nextDistances: [1.1],
          nextIlluminations: [0.8],
          currentLongitudePlanet: 110,
          currentLongitudeSun: 100,
        });

        expect(result).toBe(true);
      });

      it("should return false when planet is western", () => {
        const result = s.isEasternBrightest({
          currentDistance: 1,
          currentIllumination: 0.9,
          previousDistances: [1.1],
          previousIlluminations: [0.8],
          nextDistances: [1.1],
          nextIlluminations: [0.8],
          currentLongitudePlanet: 90,
          currentLongitudeSun: 100,
        });

        expect(result).toBe(false);
      });
    });

    describe("isEasternElongation", () => {
      it("should return true at eastern elongation (maximum angle, planet east)", () => {
        const result = s.isEasternElongation({
          currentLongitudePlanet: 145,
          currentLongitudeSun: 100,
          previousLongitudePlanet: 140,
          previousLongitudeSun: 100,
          nextLongitudePlanet: 140,
          nextLongitudeSun: 100,
        });

        expect(result).toBe(true);
      });

      it("should return false when planet is western", () => {
        const result = s.isEasternElongation({
          currentLongitudePlanet: 55,
          currentLongitudeSun: 100,
          previousLongitudePlanet: 50,
          previousLongitudeSun: 100,
          nextLongitudePlanet: 50,
          nextLongitudeSun: 100,
        });

        expect(result).toBe(false);
      });

      it("should return false when not at maximum elongation", () => {
        const result = s.isEasternElongation({
          currentLongitudePlanet: 130,
          currentLongitudeSun: 100,
          previousLongitudePlanet: 120,
          previousLongitudeSun: 100,
          nextLongitudePlanet: 140,
          nextLongitudeSun: 100,
        });

        expect(result).toBe(false);
      });
    });

    describe("isWesternElongation", () => {
      it("should return true at western elongation (maximum angle, planet west)", () => {
        const result = s.isWesternElongation({
          currentLongitudePlanet: 55,
          currentLongitudeSun: 100,
          previousLongitudePlanet: 60,
          previousLongitudeSun: 100,
          nextLongitudePlanet: 60,
          nextLongitudeSun: 100,
        });

        expect(result).toBe(true);
      });

      it("should return false when planet is eastern", () => {
        const result = s.isWesternElongation({
          currentLongitudePlanet: 145,
          currentLongitudeSun: 100,
          previousLongitudePlanet: 140,
          previousLongitudeSun: 100,
          nextLongitudePlanet: 140,
          nextLongitudeSun: 100,
        });

        expect(result).toBe(false);
      });
    });

    describe("isMorningRise", () => {
      it("should return true for morning rise (western planet, crossing above threshold)", () => {
        const result = s.isMorningRise({
          currentLongitudePlanet: 90,
          currentLongitudeSun: 100,
          previousLongitudePlanet: 95,
          previousLongitudeSun: 100,
        });

        expect(result).toBe(true);
      });

      it("should return false when planet is eastern", () => {
        const result = s.isMorningRise({
          currentLongitudePlanet: 110,
          currentLongitudeSun: 100,
          previousLongitudePlanet: 105,
          previousLongitudeSun: 100,
        });

        expect(result).toBe(false);
      });
    });

    describe("isMorningSet", () => {
      it("should return true for morning set (western planet, crossing below threshold)", () => {
        const result = s.isMorningSet({
          currentLongitudePlanet: 95,
          currentLongitudeSun: 100,
          previousLongitudePlanet: 90,
          previousLongitudeSun: 100,
        });

        expect(result).toBe(true);
      });

      it("should return false when planet is eastern", () => {
        const result = s.isMorningSet({
          currentLongitudePlanet: 105,
          currentLongitudeSun: 100,
          previousLongitudePlanet: 110,
          previousLongitudeSun: 100,
        });

        expect(result).toBe(false);
      });
    });

    describe("isEveningRise", () => {
      it("should return true for evening rise (eastern planet, crossing above threshold)", () => {
        const result = s.isEveningRise({
          currentLongitudePlanet: 110,
          currentLongitudeSun: 100,
          previousLongitudePlanet: 105,
          previousLongitudeSun: 100,
        });

        expect(result).toBe(true);
      });

      it("should return false when planet is western", () => {
        const result = s.isEveningRise({
          currentLongitudePlanet: 90,
          currentLongitudeSun: 100,
          previousLongitudePlanet: 95,
          previousLongitudeSun: 100,
        });

        expect(result).toBe(false);
      });
    });

    describe("isEveningSet", () => {
      it("should return true for evening set (eastern planet, crossing below threshold)", () => {
        const result = s.isEveningSet({
          currentLongitudePlanet: 105,
          currentLongitudeSun: 100,
          previousLongitudePlanet: 110,
          previousLongitudeSun: 100,
        });

        expect(result).toBe(true);
      });

      it("should return false when planet is western", () => {
        const result = s.isEveningSet({
          currentLongitudePlanet: 95,
          currentLongitudeSun: 100,
          previousLongitudePlanet: 90,
          previousLongitudeSun: 100,
        });

        expect(result).toBe(false);
      });
    });
  }); // private utility methods
});
