import moment from "moment";
import { describe, expect, it, vi } from "vitest";

import {
    decanIngressBodies,
    peakIngressBodies,
    signIngressBodies,
} from "../../types";

import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type { Body } from "../../types";
import { IngressesService } from "./ingresses.service";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

vi.mock("../../calendar.utilities", () => ({
  getCalendar: vi.fn(() => "MOCK_CALENDAR_CONTENT"),
}));


const service = new IngressesService();

describe("ingresses.events", () => {
  describe("getSignIngressEvent", () => {
    it("should create a sign ingress event for Sun entering Aries", async () => {

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

    it("should create a sign ingress event for Moon entering Taurus", async () => {

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
    it("should detect sign ingress when longitude crosses sign boundary", async () => {

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

    it("should not detect ingress when no boundary is crossed", async () => {

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
    it("should create a decan ingress event", async () => {

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
    it("should detect decan ingress but exclude sign ingress", async () => {

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

    it("should not detect ingress when no decan boundary is crossed", async () => {

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
    it("should create a peak ingress event", async () => {

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
    it("should detect peak ingress when crossing 15° midpoint", async () => {

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

    it("should not detect ingress when no peak boundary is crossed", async () => {

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
    it("should create progressive events for consecutive sign ingresses", async () => {
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

    it("should handle empty array", async () => {
      // biome-ignore format: oxfmt is the primary formatter

      const progressiveEvents = service.detectProgressive([]);

      expect(progressiveEvents).toHaveLength(0);
    });
  });
});
