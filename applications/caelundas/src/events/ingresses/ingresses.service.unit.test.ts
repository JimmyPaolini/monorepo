import { EphemerisService } from "@caelundas/src/ephemeris/ephemeris.service";
import {
  decanIngressBodies,
  peakIngressBodies,
  signIngressBodies,
} from "@caelundas/src/types";
import moment from "moment";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { IngressesService } from "./ingresses.service";

import type { CoordinateEphemeris } from "@caelundas/src/ephemeris/ephemeris.types";
import type { Body } from "@caelundas/src/types";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

const ephemerisService = new EphemerisService();
const service = new IngressesService(ephemerisService);

interface ServicePrivate {
  isSignIngress: (args: {
    previousLongitude: number;
    currentLongitude: number;
  }) => boolean;
  getDecan: (longitude: number) => number;
  isDecanIngress: (args: {
    previousLongitude: number;
    currentLongitude: number;
  }) => boolean;
  isPeakIngress: (args: {
    previousLongitude: number;
    currentLongitude: number;
  }) => boolean;
}
const s = service as unknown as ServicePrivate;

describe("ingresses.events", () => {
  describe("getSignIngressEvent", () => {
    it("should create a sign ingress event for Sun entering Aries", () => {
      const event = service.buildSignIngressEvent({
        body: "sun",
        longitude: 0, // 0° = Aries
        date: moment.utc("2024-03-20T03:06:00.000Z"),
      });

      expect(event).toMatchObject({
        start: moment.utc("2024-03-20T03:06:00.000Z"),
        end: moment.utc("2024-03-20T03:06:00.000Z"),
        summary: expect.stringContaining("Aries") as string,
        description: expect.stringContaining("Sun") as string,
        categories: expect.arrayContaining<string>([
          "Astronomy",
          "Astrology",
          "Ingress",
        ]) as string[],
      });
      expect(event.categories).toContain("Aries");
      expect(event.categories).toContain("Sun");
    });

    it("should create a sign ingress event for Moon entering Taurus", () => {
      const event = service.buildSignIngressEvent({
        body: "moon",
        longitude: 30, // 30° = Taurus
        date: moment.utc("2024-03-15T12:30:00.000Z"),
      });

      expect(event.summary).toContain("Taurus");
      expect(event.description).toContain("Moon");
      expect(event.categories).toContain("Taurus");
      expect(event.categories).toContain("Moon");
    });
  });

  describe("getSignIngressEvents", () => {
    it("should detect sign ingress when longitude crosses sign boundary", () => {
      const currentMinute = moment("2024-03-20T03:06:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Create ephemeris for all bodies with NaN longitudes except sun
      const coordinateEphemerisByBody = {} as Record<Body, CoordinateEphemeris>;
      for (const body of signIngressBodies) {
        coordinateEphemerisByBody[body] = {
          [previousMinute.toISOString()]: {
            longitude: Number.NaN,
            latitude: 0,
          },
          [currentMinute.toISOString()]: { longitude: Number.NaN, latitude: 0 },
        };
      }

      // Sun crossing from Pisces (359.9°) to Aries (0.1°)
      coordinateEphemerisByBody.sun = {
        [previousMinute.toISOString()]: { longitude: 359.9, latitude: 0 },
        [currentMinute.toISOString()]: { longitude: 0.1, latitude: 0 },
      };

      const events = service.getSignIngressEvents({
        coordinateEphemerisByBody,
        minute: currentMinute,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.summary).toContain("Aries");
      expect(events[0]?.categories).toContain("Sun");
    });

    it("should not detect ingress when no boundary is crossed", () => {
      const currentMinute = moment("2024-03-15T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Create ephemeris for all bodies with NaN longitudes except moon
      const coordinateEphemerisByBody = {} as Record<Body, CoordinateEphemeris>;
      for (const body of signIngressBodies) {
        coordinateEphemerisByBody[body] = {
          [previousMinute.toISOString()]: {
            longitude: Number.NaN,
            latitude: 0,
          },
          [currentMinute.toISOString()]: { longitude: Number.NaN, latitude: 0 },
        };
      }

      // Moon at 45.5° Taurus (no boundary crossing)
      coordinateEphemerisByBody.moon = {
        [previousMinute.toISOString()]: { longitude: 45.4, latitude: 0 },
        [currentMinute.toISOString()]: { longitude: 45.5, latitude: 0 },
      };

      const events = service.getSignIngressEvents({
        coordinateEphemerisByBody,
        minute: currentMinute,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("getDecanIngressEvent", () => {
    it("should create a decan ingress event", () => {
      const event = service.buildDecanIngressEvent({
        body: "venus",
        longitude: 10.5, // Decan 2 of Aries
        date: moment.utc("2024-04-05T10:00:00.000Z"),
      });

      expect(event).toMatchObject({
        start: moment.utc("2024-04-05T10:00:00.000Z"),
        end: moment.utc("2024-04-05T10:00:00.000Z"),
      });
      expect(event.categories).toContain("Decan");
      expect(event.categories).toContain("Aries");
      expect(event.categories).toContain("Venus");
    });
  });

  describe("getDecanIngressEvents", () => {
    it("should detect decan ingress but exclude sign ingress", () => {
      const currentMinute = moment("2024-04-05T10:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Create ephemeris for all bodies with NaN longitudes except venus
      const coordinateEphemerisByBody = {} as Record<Body, CoordinateEphemeris>;
      for (const body of decanIngressBodies) {
        coordinateEphemerisByBody[body] = {
          [previousMinute.toISOString()]: {
            longitude: Number.NaN,
            latitude: 0,
          },
          [currentMinute.toISOString()]: { longitude: Number.NaN, latitude: 0 },
        };
      }

      // Venus crossing decan boundary at 10°
      coordinateEphemerisByBody.venus = {
        [previousMinute.toISOString()]: { longitude: 9.9, latitude: 0 },
        [currentMinute.toISOString()]: { longitude: 10.1, latitude: 0 },
      };

      const events = service.getDecanIngressEvents({
        coordinateEphemerisByBody,
        minute: currentMinute,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.categories).toContain("Decan");
    });

    it("should not detect ingress when no decan boundary is crossed", () => {
      const currentMinute = moment("2024-04-10T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Create ephemeris for all bodies with NaN longitudes except venus
      const coordinateEphemerisByBody = {} as Record<Body, CoordinateEphemeris>;
      for (const body of decanIngressBodies) {
        coordinateEphemerisByBody[body] = {
          [previousMinute.toISOString()]: {
            longitude: Number.NaN,
            latitude: 0,
          },
          [currentMinute.toISOString()]: { longitude: Number.NaN, latitude: 0 },
        };
      }

      // Venus at 15.5° Aries (no decan boundary)
      coordinateEphemerisByBody.venus = {
        [previousMinute.toISOString()]: { longitude: 15.4, latitude: 0 },
        [currentMinute.toISOString()]: { longitude: 15.5, latitude: 0 },
      };

      const events = service.getDecanIngressEvents({
        coordinateEphemerisByBody,
        minute: currentMinute,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("getPeakIngressEvent", () => {
    it("should create a peak ingress event", () => {
      const event = service.buildPeakIngressEvent({
        body: "mars",
        longitude: 135, // 15° Leo (120° + 15°)
        date: moment.utc("2024-06-15T16:00:00.000Z"),
      });

      expect(event).toMatchObject({
        start: moment.utc("2024-06-15T16:00:00.000Z"),
        end: moment.utc("2024-06-15T16:00:00.000Z"),
      });
      expect(event.categories).toContain("Peak");
      expect(event.categories).toContain("Leo");
      expect(event.categories).toContain("Mars");
    });
  });

  describe("getPeakIngressEvents", () => {
    it("should detect peak ingress when crossing 15° midpoint", () => {
      const currentMinute = moment("2024-06-15T16:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Create ephemeris for all bodies with NaN longitudes except mars
      const coordinateEphemerisByBody = {} as Record<Body, CoordinateEphemeris>;
      for (const body of peakIngressBodies) {
        coordinateEphemerisByBody[body] = {
          [previousMinute.toISOString()]: {
            longitude: Number.NaN,
            latitude: 0,
          },
          [currentMinute.toISOString()]: { longitude: Number.NaN, latitude: 0 },
        };
      }

      // Mars crossing 15° peak in Leo
      coordinateEphemerisByBody.mars = {
        [previousMinute.toISOString()]: { longitude: 134.9, latitude: 0 },
        [currentMinute.toISOString()]: { longitude: 135.1, latitude: 0 },
      };

      const events = service.getPeakIngressEvents({
        coordinateEphemerisByBody,
        minute: currentMinute,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.categories).toContain("Peak");
    });

    it("should not detect ingress when no peak boundary is crossed", () => {
      const currentMinute = moment("2024-06-20T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Create ephemeris for all bodies with NaN longitudes except mars
      const coordinateEphemerisByBody = {} as Record<Body, CoordinateEphemeris>;
      for (const body of peakIngressBodies) {
        coordinateEphemerisByBody[body] = {
          [previousMinute.toISOString()]: {
            longitude: Number.NaN,
            latitude: 0,
          },
          [currentMinute.toISOString()]: { longitude: Number.NaN, latitude: 0 },
        };
      }

      // Mars at 140.5° (no peak boundary)
      coordinateEphemerisByBody.mars = {
        [previousMinute.toISOString()]: { longitude: 140.4, latitude: 0 },
        [currentMinute.toISOString()]: { longitude: 140.5, latitude: 0 },
      };

      const events = service.getPeakIngressEvents({
        coordinateEphemerisByBody,
        minute: currentMinute,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("getSignIngressProgressiveEvents", () => {
    it("should create progressive events for consecutive sign ingresses", () => {
      const events = [
        service.buildSignIngressEvent({
          body: "sun",
          longitude: 0,
          date: moment.utc("2024-03-20T03:06:00.000Z"),
        }),
        service.buildSignIngressEvent({
          body: "sun",
          longitude: 30,
          date: moment.utc("2024-04-19T15:00:00.000Z"),
        }),
      ];

      const progressiveEvents = service.detectProgressive(events);

      expect(progressiveEvents).toHaveLength(1);
      expect(progressiveEvents[0]?.start).toEqual(
        moment.utc("2024-03-20T03:06:00.000Z"),
      );
      expect(progressiveEvents[0]?.end).toEqual(
        moment.utc("2024-04-19T15:00:00.000Z"),
      );
      expect(progressiveEvents[0]?.categories).toContain("Sun");
      expect(progressiveEvents[0]?.categories).toContain("Aries");
    });

    it("should handle empty array", () => {
      const progressiveEvents = service.detectProgressive([]);

      expect(progressiveEvents).toHaveLength(0);
    });
  });

  describe("private utility methods", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    describe("degreeRangeBySign", () => {
      it("should have correct ranges for all signs", () => {
        expect(IngressesService.degreeRangeBySign.aries).toEqual({
          min: 0,
          max: 30,
        });
        expect(IngressesService.degreeRangeBySign.taurus).toEqual({
          min: 30,
          max: 60,
        });
        expect(IngressesService.degreeRangeBySign.gemini).toEqual({
          min: 60,
          max: 90,
        });
        expect(IngressesService.degreeRangeBySign.cancer).toEqual({
          min: 90,
          max: 120,
        });
        expect(IngressesService.degreeRangeBySign.leo).toEqual({
          min: 120,
          max: 150,
        });
        expect(IngressesService.degreeRangeBySign.virgo).toEqual({
          min: 150,
          max: 180,
        });
        expect(IngressesService.degreeRangeBySign.libra).toEqual({
          min: 180,
          max: 210,
        });
        expect(IngressesService.degreeRangeBySign.scorpio).toEqual({
          min: 210,
          max: 240,
        });
        expect(IngressesService.degreeRangeBySign.sagittarius).toEqual({
          min: 240,
          max: 270,
        });
        expect(IngressesService.degreeRangeBySign.capricorn).toEqual({
          min: 270,
          max: 300,
        });
        expect(IngressesService.degreeRangeBySign.aquarius).toEqual({
          min: 300,
          max: 330,
        });
        expect(IngressesService.degreeRangeBySign.pisces).toEqual({
          min: 330,
          max: 360,
        });
      });
    });

    describe("getSign", () => {
      it("should return correct sign for start of each sign", () => {
        expect(IngressesService.getSign(0)).toBe("aries");
        expect(IngressesService.getSign(30)).toBe("taurus");
        expect(IngressesService.getSign(60)).toBe("gemini");
        expect(IngressesService.getSign(90)).toBe("cancer");
        expect(IngressesService.getSign(120)).toBe("leo");
        expect(IngressesService.getSign(150)).toBe("virgo");
        expect(IngressesService.getSign(180)).toBe("libra");
        expect(IngressesService.getSign(210)).toBe("scorpio");
        expect(IngressesService.getSign(240)).toBe("sagittarius");
        expect(IngressesService.getSign(270)).toBe("capricorn");
        expect(IngressesService.getSign(300)).toBe("aquarius");
        expect(IngressesService.getSign(330)).toBe("pisces");
      });

      it("should return correct sign for middle of each sign", () => {
        expect(IngressesService.getSign(15)).toBe("aries");
        expect(IngressesService.getSign(45)).toBe("taurus");
        expect(IngressesService.getSign(75)).toBe("gemini");
        expect(IngressesService.getSign(105)).toBe("cancer");
        expect(IngressesService.getSign(135)).toBe("leo");
        expect(IngressesService.getSign(165)).toBe("virgo");
        expect(IngressesService.getSign(195)).toBe("libra");
        expect(IngressesService.getSign(225)).toBe("scorpio");
        expect(IngressesService.getSign(255)).toBe("sagittarius");
        expect(IngressesService.getSign(285)).toBe("capricorn");
        expect(IngressesService.getSign(315)).toBe("aquarius");
        expect(IngressesService.getSign(345)).toBe("pisces");
      });

      it("should return correct sign for end of each sign (exclusive)", () => {
        expect(IngressesService.getSign(29.99)).toBe("aries");
        expect(IngressesService.getSign(59.99)).toBe("taurus");
        expect(IngressesService.getSign(89.99)).toBe("gemini");
        expect(IngressesService.getSign(119.99)).toBe("cancer");
        expect(IngressesService.getSign(149.99)).toBe("leo");
        expect(IngressesService.getSign(179.99)).toBe("virgo");
        expect(IngressesService.getSign(209.99)).toBe("libra");
        expect(IngressesService.getSign(239.99)).toBe("scorpio");
        expect(IngressesService.getSign(269.99)).toBe("sagittarius");
        expect(IngressesService.getSign(299.99)).toBe("capricorn");
        expect(IngressesService.getSign(329.99)).toBe("aquarius");
        expect(IngressesService.getSign(359.99)).toBe("pisces");
      });

      it("should throw for longitude outside 0-360 range", () => {
        expect(() => IngressesService.getSign(360)).toThrow();
        expect(() => IngressesService.getSign(-1)).toThrow();
        expect(() => IngressesService.getSign(400)).toThrow();
      });
    });

    describe("isSignIngress", () => {
      it("should return true when crossing sign boundary", () => {
        expect(
          s.isSignIngress({ previousLongitude: 29.9, currentLongitude: 30.1 }),
        ).toBe(true);

        expect(
          s.isSignIngress({ previousLongitude: 359.9, currentLongitude: 0.1 }),
        ).toBe(true);
      });

      it("should return false when staying in same sign", () => {
        expect(
          s.isSignIngress({ previousLongitude: 15, currentLongitude: 16 }),
        ).toBe(false);

        expect(
          s.isSignIngress({ previousLongitude: 29, currentLongitude: 29.5 }),
        ).toBe(false);
      });
    });

    describe("getDecan", () => {
      it("should return decan 1 for degrees 0-9 within a sign", () => {
        expect(s.getDecan(0)).toBe(1);
        expect(s.getDecan(9)).toBe(1);
        expect(s.getDecan(30)).toBe(1);
        expect(s.getDecan(39)).toBe(1);
      });

      it("should return decan 2 for degrees 10-19 within a sign", () => {
        expect(s.getDecan(10)).toBe(2);
        expect(s.getDecan(19)).toBe(2);
        expect(s.getDecan(40)).toBe(2);
        expect(s.getDecan(49)).toBe(2);
      });

      it("should return decan 3 for degrees 20-29 within a sign", () => {
        expect(s.getDecan(20)).toBe(3);
        expect(s.getDecan(29)).toBe(3);
        expect(s.getDecan(50)).toBe(3);
        expect(s.getDecan(59)).toBe(3);
      });
    });

    describe("isDecanIngress", () => {
      it("should return true when crossing decan boundary within same sign", () => {
        expect(
          s.isDecanIngress({ previousLongitude: 9.9, currentLongitude: 10.1 }),
        ).toBe(true);

        expect(
          s.isDecanIngress({ previousLongitude: 19.9, currentLongitude: 20.1 }),
        ).toBe(true);
      });

      it("should return true when crossing sign boundary (also decan boundary)", () => {
        expect(
          s.isDecanIngress({ previousLongitude: 29.9, currentLongitude: 30.1 }),
        ).toBe(true);
      });

      it("should return false when staying in same decan", () => {
        expect(
          s.isDecanIngress({ previousLongitude: 5, currentLongitude: 6 }),
        ).toBe(false);

        expect(
          s.isDecanIngress({ previousLongitude: 15, currentLongitude: 16 }),
        ).toBe(false);
      });
    });

    describe("isPeakIngress", () => {
      it("should return true when crossing 15 degrees within a sign", () => {
        expect(
          s.isPeakIngress({ previousLongitude: 14.9, currentLongitude: 15.1 }),
        ).toBe(true);

        expect(
          s.isPeakIngress({ previousLongitude: 44.9, currentLongitude: 45.1 }),
        ).toBe(true);
      });

      it("should return false when not crossing 15 degrees", () => {
        expect(
          s.isPeakIngress({ previousLongitude: 10, currentLongitude: 11 }),
        ).toBe(false);

        expect(
          s.isPeakIngress({ previousLongitude: 16, currentLongitude: 17 }),
        ).toBe(false);
      });

      it("should return false when crossing sign boundary (not peak)", () => {
        expect(
          s.isPeakIngress({ previousLongitude: 29.9, currentLongitude: 30.1 }),
        ).toBe(false);
      });
    });
  });
});
