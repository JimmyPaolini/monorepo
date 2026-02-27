import moment from "moment-timezone";
import { describe, expect, it } from "vitest";

import {
  decanIngressBodies,
  peakIngressBodies,
  signIngressBodies,
} from "../../types";

import {
  getDecanIngressEvents,
  getPeakIngressEvents,
  getSignIngressDurationEvents,
  getSignIngressEvents,
} from "./ingresses.events";

import type { Event } from "../../calendar.utilities";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type { Body } from "../../types";

// Helper to create full ephemeris for all required bodies with default stationary values
function createFullEphemeris(
  baseTime: moment.Moment,
  bodies: readonly Body[],
  overrides: Partial<
    Record<Body, { previous: number; current: number; next: number }>
  > = {},
): Record<Body, CoordinateEphemeris> {
  const result: Record<string, CoordinateEphemeris> = {};
  const defaultLongitude = 100; // Default position away from any boundaries

  for (const body of bodies) {
    const override = overrides[body];
    result[body] = {
      [baseTime.clone().subtract(1, "minute").toISOString()]: {
        longitude: override?.previous ?? defaultLongitude,
        latitude: 0,
      },
      [baseTime.toISOString()]: {
        longitude: override?.current ?? defaultLongitude,
        latitude: 0,
      },
      [baseTime.clone().add(1, "minute").toISOString()]: {
        longitude: override?.next ?? defaultLongitude,
        latitude: 0,
      },
    };
  }

  return result as Record<Body, CoordinateEphemeris>;
}

describe("ingresses.events integration", () => {
  describe("getSignIngressEvents", () => {
    it("should detect Sun entering Aries (Vernal Equinox)", () => {
      const baseTime = moment.utc("2025-03-20T09:06:00Z");

      // Sun crossing from Pisces (359.9°) to Aries (0.1°)
      const coordinateEphemerisByBody = createFullEphemeris(
        baseTime,
        signIngressBodies,
        {
          sun: { previous: 359.9, current: 0.1, next: 0.2 },
        },
      );

      const events = getSignIngressEvents({
        coordinateEphemerisByBody,
        currentMinute: baseTime,
      });

      expect(events.length).toBe(1);
      expect(events[0]?.categories).toContain("Sun");
      expect(events[0]?.categories).toContain("Aries");
      expect(events[0]?.categories).toContain("Ingress");
      expect(events[0]?.summary).toContain("☀️");
      expect(events[0]?.summary).toContain("♈");
    });

    it("should detect Moon sign changes", () => {
      const baseTime = moment.utc("2025-01-15T18:30:00Z");

      // Moon crossing from Taurus (59.9°) to Gemini (60.1°)
      const coordinateEphemerisByBody = createFullEphemeris(
        baseTime,
        signIngressBodies,
        {
          moon: { previous: 59.9, current: 60.1, next: 60.3 },
        },
      );

      const events = getSignIngressEvents({
        coordinateEphemerisByBody,
        currentMinute: baseTime,
      });

      expect(events.length).toBe(1);
      expect(events[0]?.categories).toContain("Moon");
      expect(events[0]?.categories).toContain("Gemini");
    });

    it("should not generate event when body stays in same sign", () => {
      const baseTime = moment.utc("2025-02-10T12:00:00Z");

      // All bodies stay in their default positions (no boundary crossings)
      const coordinateEphemerisByBody = createFullEphemeris(
        baseTime,
        signIngressBodies,
      );

      const events = getSignIngressEvents({
        coordinateEphemerisByBody,
        currentMinute: baseTime,
      });

      expect(events.length).toBe(0);
    });
  });

  describe("getDecanIngressEvents", () => {
    it("should detect decan change within same sign", () => {
      const baseTime = moment.utc("2025-04-05T16:00:00Z");

      // Sun crossing from decan 1 (9.9°) to decan 2 (10.1°) in Aries
      const coordinateEphemerisByBody = createFullEphemeris(
        baseTime,
        decanIngressBodies,
        {
          sun: { previous: 9.9, current: 10.1, next: 10.2 },
        },
      );

      const events = getDecanIngressEvents({
        coordinateEphemerisByBody,
        currentMinute: baseTime,
      });

      expect(events.length).toBe(1);
      expect(events[0]?.categories).toContain("Decan");
      expect(events[0]?.categories).toContain("Sun");
      expect(events[0]?.categories).toContain("Aries");
    });

    it("should NOT generate decan event when crossing sign boundary (sign event takes precedence)", () => {
      const baseTime = moment.utc("2025-04-19T22:00:00Z");

      // Sun crossing from Aries (29.9°) to Taurus (30.1°)
      const coordinateEphemerisByBody = createFullEphemeris(
        baseTime,
        decanIngressBodies,
        {
          sun: { previous: 29.9, current: 30.1, next: 30.2 },
        },
      );

      const events = getDecanIngressEvents({
        coordinateEphemerisByBody,
        currentMinute: baseTime,
      });

      // Should be 0 because sign ingress takes precedence
      expect(events.length).toBe(0);
    });
  });

  describe("getPeakIngressEvents", () => {
    it("should detect peak ingress at 15° within a sign", () => {
      const baseTime = moment.utc("2025-05-05T08:00:00Z");

      // Sun crossing 15° in Taurus (30 + 15 = 45°)
      const coordinateEphemerisByBody = createFullEphemeris(
        baseTime,
        peakIngressBodies,
        {
          sun: { previous: 44.9, current: 45.1, next: 45.2 },
        },
      );

      const events = getPeakIngressEvents({
        coordinateEphemerisByBody,
        currentMinute: baseTime,
      });

      expect(events.length).toBe(1);
      expect(events[0]?.categories).toContain("Peak");
      expect(events[0]?.categories).toContain("Sun");
      expect(events[0]?.categories).toContain("Taurus");
    });
  });

  describe("getSignIngressDurationEvents", () => {
    it("should create duration events from consecutive sign ingresses", () => {
      const events: Event[] = [
        {
          start: new Date("2025-03-20T09:06:00Z"),
          end: new Date("2025-03-20T09:06:00Z"),
          summary: "☀️ → ♈ Sun ingress Aries",
          description: "Sun ingress Aries",
          categories: ["Astronomy", "Astrology", "Ingress", "Sun", "Aries"],
        },
        {
          start: new Date("2025-04-19T20:00:00Z"),
          end: new Date("2025-04-19T20:00:00Z"),
          summary: "☀️ → ♉︎ Sun ingress Taurus",
          description: "Sun ingress Taurus",
          categories: ["Astronomy", "Astrology", "Ingress", "Sun", "Taurus"],
        },
        {
          start: new Date("2025-05-20T19:00:00Z"),
          end: new Date("2025-05-20T19:00:00Z"),
          summary: "☀️ → ♊︎ Sun ingress Gemini",
          description: "Sun ingress Gemini",
          categories: ["Astronomy", "Astrology", "Ingress", "Sun", "Gemini"],
        },
      ];

      const durationEvents = getSignIngressDurationEvents(events);

      expect(durationEvents.length).toBe(2);

      // First duration: Sun in Aries
      expect(durationEvents[0]?.start.toISOString()).toBe(
        "2025-03-20T09:06:00.000Z",
      );
      expect(durationEvents[0]?.end.toISOString()).toBe(
        "2025-04-19T20:00:00.000Z",
      );
      expect(durationEvents[0]?.description).toContain("Sun");
      expect(durationEvents[0]?.description).toContain("Aries");

      // Second duration: Sun in Taurus
      expect(durationEvents[1]?.start.toISOString()).toBe(
        "2025-04-19T20:00:00.000Z",
      );
      expect(durationEvents[1]?.end.toISOString()).toBe(
        "2025-05-20T19:00:00.000Z",
      );
    });

    it("should handle events for multiple bodies separately", () => {
      const events: Event[] = [
        {
          start: new Date("2025-01-10T10:00:00Z"),
          end: new Date("2025-01-10T10:00:00Z"),
          summary: "Sun ingress Aquarius",
          description: "Sun ingress Aquarius",
          categories: ["Astronomy", "Astrology", "Ingress", "Sun", "Aquarius"],
        },
        {
          start: new Date("2025-01-12T08:00:00Z"),
          end: new Date("2025-01-12T08:00:00Z"),
          summary: "Moon ingress Gemini",
          description: "Moon ingress Gemini",
          categories: ["Astronomy", "Astrology", "Ingress", "Moon", "Gemini"],
        },
        {
          start: new Date("2025-01-14T15:00:00Z"),
          end: new Date("2025-01-14T15:00:00Z"),
          summary: "Moon ingress Cancer",
          description: "Moon ingress Cancer",
          categories: ["Astronomy", "Astrology", "Ingress", "Moon", "Cancer"],
        },
        {
          start: new Date("2025-02-18T12:00:00Z"),
          end: new Date("2025-02-18T12:00:00Z"),
          summary: "Sun ingress Pisces",
          description: "Sun ingress Pisces",
          categories: ["Astronomy", "Astrology", "Ingress", "Sun", "Pisces"],
        },
      ];

      const durationEvents = getSignIngressDurationEvents(events);

      // Should have: Sun in Aquarius, Moon in Gemini
      expect(durationEvents.length).toBe(2);

      const sunDuration = durationEvents.find((e) =>
        e.categories.includes("Sun"),
      );
      const moonDuration = durationEvents.find((e) =>
        e.categories.includes("Moon"),
      );

      expect(sunDuration).toBeDefined();
      expect(moonDuration).toBeDefined();

      expect(sunDuration?.start.toISOString()).toBe("2025-01-10T10:00:00.000Z");
      expect(sunDuration?.end.toISOString()).toBe("2025-02-18T12:00:00.000Z");

      expect(moonDuration?.start.toISOString()).toBe(
        "2025-01-12T08:00:00.000Z",
      );
      expect(moonDuration?.end.toISOString()).toBe("2025-01-14T15:00:00.000Z");
    });
  });
});
