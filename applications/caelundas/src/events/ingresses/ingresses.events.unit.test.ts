import moment from "moment";
import { describe, expect, it, vi } from "vitest";

import {
  decanIngressBodies,
  peakIngressBodies,
  signIngressBodies,
} from "../../types";

import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type { Body } from "../../types";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

vi.mock("../../database.utilities", () => ({
  upsertEvents: vi.fn(),
}));

vi.mock("../../calendar.utilities", () => ({
  getCalendar: vi.fn(() => "MOCK_CALENDAR_CONTENT"),
}));

vi.mock("../../output.utilities", () => ({
  getOutputPath: vi.fn((filename: string) => `/mock/output/${filename}`),
}));

describe("ingresses.events", () => {
  describe("getSignIngressEvent", () => {
    it("should create a sign ingress event for Sun entering Aries", async () => {
      const { getSignIngressEvent } = await import("./ingresses.events");

      const event = getSignIngressEvent({
        body: "sun",
        longitude: 0, // 0° = Aries
        date: new Date("2024-03-20T03:06:00.000Z"),
      });

      expect(event).toMatchObject({
        start: new Date("2024-03-20T03:06:00.000Z"),
        end: new Date("2024-03-20T03:06:00.000Z"),
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
      const { getSignIngressEvent } = await import("./ingresses.events");

      const event = getSignIngressEvent({
        body: "moon",
        longitude: 30, // 30° = Taurus
        date: new Date("2024-03-15T12:30:00.000Z"),
      });

      expect(event.summary).toContain("Taurus");
      expect(event.description).toContain("Moon");
      expect(event.categories).toContain("Taurus");
      expect(event.categories).toContain("Moon");
    });
  });

  describe("getSignIngressEvents", () => {
    it("should detect sign ingress when longitude crosses sign boundary", async () => {
      const { getSignIngressEvents } = await import("./ingresses.events");

      const currentMinute = moment("2024-03-20T03:06:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Create ephemeris for all bodies with NaN longitudes except sun
      const coordinateEphemerisByBody = {} as Record<Body, CoordinateEphemeris>;
      for (const body of signIngressBodies) {
        coordinateEphemerisByBody[body] = {
          [previousMinute.toISOString()]: { longitude: NaN, latitude: 0 },
          [currentMinute.toISOString()]: { longitude: NaN, latitude: 0 },
        };
      }

      // Sun crossing from Pisces (359.9°) to Aries (0.1°)
      coordinateEphemerisByBody.sun = {
        [previousMinute.toISOString()]: { longitude: 359.9, latitude: 0 },
        [currentMinute.toISOString()]: { longitude: 0.1, latitude: 0 },
      };

      const events = getSignIngressEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.summary).toContain("Aries");
      expect(events[0]?.categories).toContain("Sun");
    });

    it("should not detect ingress when no boundary is crossed", async () => {
      const { getSignIngressEvents } = await import("./ingresses.events");

      const currentMinute = moment("2024-03-15T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Create ephemeris for all bodies with NaN longitudes except moon
      const coordinateEphemerisByBody = {} as Record<Body, CoordinateEphemeris>;
      for (const body of signIngressBodies) {
        coordinateEphemerisByBody[body] = {
          [previousMinute.toISOString()]: { longitude: NaN, latitude: 0 },
          [currentMinute.toISOString()]: { longitude: NaN, latitude: 0 },
        };
      }

      // Moon at 45.5° Taurus (no boundary crossing)
      coordinateEphemerisByBody.moon = {
        [previousMinute.toISOString()]: { longitude: 45.4, latitude: 0 },
        [currentMinute.toISOString()]: { longitude: 45.5, latitude: 0 },
      };

      const events = getSignIngressEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("writeSignIngressEvents", () => {
    it("should write events to file and database", async () => {
      const { upsertEvents } = await import("../../database.utilities");
      const fs = await import("fs");
      const { writeSignIngressEvents, getSignIngressEvent } = await import(
        "./ingresses.events"
      );

      const events = [
        getSignIngressEvent({
          body: "sun",
          longitude: 0,
          date: new Date("2024-03-20T03:06:00.000Z"),
        }),
      ];
      const start = new Date("2024-03-01T00:00:00.000Z");
      const end = new Date("2024-03-31T23:59:59.000Z");

      writeSignIngressEvents({
        signIngressEvents: events,
        signIngressBodies: ["sun"],
        start,
        end,
      });

      expect(upsertEvents).toHaveBeenCalledWith(events);
      expect(fs.default.writeFileSync).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Writing")
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Wrote")
      );
    });

    it("should not write when events array is empty", async () => {
      const { upsertEvents } = await import("../../database.utilities");
      const fs = await import("fs");
      const { writeSignIngressEvents } = await import("./ingresses.events");

      const start = new Date("2024-03-01T00:00:00.000Z");
      const end = new Date("2024-03-31T23:59:59.000Z");

      writeSignIngressEvents({
        signIngressEvents: [],
        signIngressBodies: ["sun"],
        start,
        end,
      });

      expect(upsertEvents).not.toHaveBeenCalled();
      expect(fs.default.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe("getDecanIngressEvent", () => {
    it("should create a decan ingress event", async () => {
      const { getDecanIngressEvent } = await import("./ingresses.events");

      const event = getDecanIngressEvent({
        body: "venus",
        longitude: 10.5, // Decan 2 of Aries
        date: new Date("2024-04-05T10:00:00.000Z"),
      });

      expect(event).toMatchObject({
        start: new Date("2024-04-05T10:00:00.000Z"),
        end: new Date("2024-04-05T10:00:00.000Z"),
      });
      expect(event.categories).toContain("Decan");
      expect(event.categories).toContain("Aries");
      expect(event.categories).toContain("Venus");
    });
  });

  describe("getDecanIngressEvents", () => {
    it("should detect decan ingress but exclude sign ingress", async () => {
      const { getDecanIngressEvents } = await import("./ingresses.events");

      const currentMinute = moment("2024-04-05T10:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Create ephemeris for all bodies with NaN longitudes except venus
      const coordinateEphemerisByBody = {} as Record<Body, CoordinateEphemeris>;
      for (const body of decanIngressBodies) {
        coordinateEphemerisByBody[body] = {
          [previousMinute.toISOString()]: { longitude: NaN, latitude: 0 },
          [currentMinute.toISOString()]: { longitude: NaN, latitude: 0 },
        };
      }

      // Venus crossing decan boundary at 10°
      coordinateEphemerisByBody.venus = {
        [previousMinute.toISOString()]: { longitude: 9.9, latitude: 0 },
        [currentMinute.toISOString()]: { longitude: 10.1, latitude: 0 },
      };

      const events = getDecanIngressEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.categories).toContain("Decan");
    });

    it("should not detect ingress when no decan boundary is crossed", async () => {
      const { getDecanIngressEvents } = await import("./ingresses.events");

      const currentMinute = moment("2024-04-10T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Create ephemeris for all bodies with NaN longitudes except venus
      const coordinateEphemerisByBody = {} as Record<Body, CoordinateEphemeris>;
      for (const body of decanIngressBodies) {
        coordinateEphemerisByBody[body] = {
          [previousMinute.toISOString()]: { longitude: NaN, latitude: 0 },
          [currentMinute.toISOString()]: { longitude: NaN, latitude: 0 },
        };
      }

      // Venus at 15.5° Aries (no decan boundary)
      coordinateEphemerisByBody.venus = {
        [previousMinute.toISOString()]: { longitude: 15.4, latitude: 0 },
        [currentMinute.toISOString()]: { longitude: 15.5, latitude: 0 },
      };

      const events = getDecanIngressEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("writeDecanIngressEvents", () => {
    it("should write events to file and database", async () => {
      const { upsertEvents } = await import("../../database.utilities");
      const fs = await import("fs");
      const { writeDecanIngressEvents, getDecanIngressEvent } = await import(
        "./ingresses.events"
      );

      const events = [
        getDecanIngressEvent({
          body: "venus",
          longitude: 10.5,
          date: new Date("2024-04-05T10:00:00.000Z"),
        }),
      ];
      const start = new Date("2024-04-01T00:00:00.000Z");
      const end = new Date("2024-04-30T23:59:59.000Z");

      writeDecanIngressEvents({
        decanIngressEvents: events,
        decanIngressBodies: ["venus"],
        start,
        end,
      });

      expect(upsertEvents).toHaveBeenCalledWith(events);
      expect(fs.default.writeFileSync).toHaveBeenCalled();
    });

    it("should not write when events array is empty", async () => {
      const { upsertEvents } = await import("../../database.utilities");
      const fs = await import("fs");
      const { writeDecanIngressEvents } = await import("./ingresses.events");

      writeDecanIngressEvents({
        decanIngressEvents: [],
        decanIngressBodies: ["venus"],
        start: new Date("2024-04-01T00:00:00.000Z"),
        end: new Date("2024-04-30T23:59:59.000Z"),
      });

      expect(upsertEvents).not.toHaveBeenCalled();
      expect(fs.default.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe("getPeakIngressEvent", () => {
    it("should create a peak ingress event", async () => {
      const { getPeakIngressEvent } = await import("./ingresses.events");

      const event = getPeakIngressEvent({
        body: "mars",
        longitude: 135, // 15° Leo (120° + 15°)
        date: new Date("2024-06-15T16:00:00.000Z"),
      });

      expect(event).toMatchObject({
        start: new Date("2024-06-15T16:00:00.000Z"),
        end: new Date("2024-06-15T16:00:00.000Z"),
      });
      expect(event.categories).toContain("Peak");
      expect(event.categories).toContain("Leo");
      expect(event.categories).toContain("Mars");
    });
  });

  describe("getPeakIngressEvents", () => {
    it("should detect peak ingress when crossing 15° midpoint", async () => {
      const { getPeakIngressEvents } = await import("./ingresses.events");

      const currentMinute = moment("2024-06-15T16:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Create ephemeris for all bodies with NaN longitudes except mars
      const coordinateEphemerisByBody = {} as Record<Body, CoordinateEphemeris>;
      for (const body of peakIngressBodies) {
        coordinateEphemerisByBody[body] = {
          [previousMinute.toISOString()]: { longitude: NaN, latitude: 0 },
          [currentMinute.toISOString()]: { longitude: NaN, latitude: 0 },
        };
      }

      // Mars crossing 15° peak in Leo
      coordinateEphemerisByBody.mars = {
        [previousMinute.toISOString()]: { longitude: 134.9, latitude: 0 },
        [currentMinute.toISOString()]: { longitude: 135.1, latitude: 0 },
      };

      const events = getPeakIngressEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.categories).toContain("Peak");
    });

    it("should not detect ingress when no peak boundary is crossed", async () => {
      const { getPeakIngressEvents } = await import("./ingresses.events");

      const currentMinute = moment("2024-06-20T12:00:00.000Z");
      const previousMinute = currentMinute.clone().subtract(1, "minute");

      // Create ephemeris for all bodies with NaN longitudes except mars
      const coordinateEphemerisByBody = {} as Record<Body, CoordinateEphemeris>;
      for (const body of peakIngressBodies) {
        coordinateEphemerisByBody[body] = {
          [previousMinute.toISOString()]: { longitude: NaN, latitude: 0 },
          [currentMinute.toISOString()]: { longitude: NaN, latitude: 0 },
        };
      }

      // Mars at 140.5° (no peak boundary)
      coordinateEphemerisByBody.mars = {
        [previousMinute.toISOString()]: { longitude: 140.4, latitude: 0 },
        [currentMinute.toISOString()]: { longitude: 140.5, latitude: 0 },
      };

      const events = getPeakIngressEvents({
        coordinateEphemerisByBody,
        currentMinute,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("writePeakIngressEvents", () => {
    it("should write events to file and database", async () => {
      const { upsertEvents } = await import("../../database.utilities");
      const fs = await import("fs");
      const { writePeakIngressEvents, getPeakIngressEvent } = await import(
        "./ingresses.events"
      );

      const events = [
        getPeakIngressEvent({
          body: "mars",
          longitude: 135,
          date: new Date("2024-06-15T16:00:00.000Z"),
        }),
      ];
      const start = new Date("2024-06-01T00:00:00.000Z");
      const end = new Date("2024-06-30T23:59:59.000Z");

      writePeakIngressEvents({
        peakIngressEvents: events,
        peakIngressBodies: ["mars"],
        start,
        end,
      });

      expect(upsertEvents).toHaveBeenCalledWith(events);
      expect(fs.default.writeFileSync).toHaveBeenCalled();
    });

    it("should not write when events array is empty", async () => {
      const { upsertEvents } = await import("../../database.utilities");
      const fs = await import("fs");
      const { writePeakIngressEvents } = await import("./ingresses.events");

      writePeakIngressEvents({
        peakIngressEvents: [],
        peakIngressBodies: ["mars"],
        start: new Date("2024-06-01T00:00:00.000Z"),
        end: new Date("2024-06-30T23:59:59.000Z"),
      });

      expect(upsertEvents).not.toHaveBeenCalled();
      expect(fs.default.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe("getSignIngressDurationEvents", () => {
    it("should create duration events for consecutive sign ingresses", async () => {
      const { getSignIngressEvent, getSignIngressDurationEvents } =
        await import("./ingresses.events");

      const events = [
        getSignIngressEvent({
          body: "sun",
          longitude: 0,
          date: new Date("2024-03-20T03:06:00.000Z"),
        }),
        getSignIngressEvent({
          body: "sun",
          longitude: 30,
          date: new Date("2024-04-19T15:00:00.000Z"),
        }),
      ];

      const durationEvents = getSignIngressDurationEvents(events);

      expect(durationEvents).toHaveLength(1);
      expect(durationEvents[0]?.start).toEqual(
        new Date("2024-03-20T03:06:00.000Z")
      );
      expect(durationEvents[0]?.end).toEqual(
        new Date("2024-04-19T15:00:00.000Z")
      );
      expect(durationEvents[0]?.categories).toContain("Sun");
      expect(durationEvents[0]?.categories).toContain("Aries");
    });

    it("should handle empty array", async () => {
      const { getSignIngressDurationEvents } = await import(
        "./ingresses.events"
      );

      const durationEvents = getSignIngressDurationEvents([]);

      expect(durationEvents).toHaveLength(0);
    });
  });
});
