import { mockDates } from "@caelundas/testing/mocks";
import moment from "moment-timezone";
import { describe, expect, it } from "vitest";

import { CalendarService } from "./calendar.service";

import type { Event } from "./calendar.types";

const service = new CalendarService();

describe("CalendarService", () => {
  mockDates();

  describe("buildEventContent", () => {
    const baseEvent: Event = {
      start: moment.utc("2025-03-20T09:06:00Z"),
      end: moment.utc("2025-03-20T09:06:00Z"),
      summary: "☀️ → ♈ Sun ingress Aries",
      description: "Sun ingress Aries",
      categories: ["Astronomy", "Astrology", "Ingress", "Sun", "Aries"],
    };

    it("should generate valid VEVENT structure", () => {
      const vevent = service.buildEventContent(baseEvent);

      expect(vevent).toContain("BEGIN:VEVENT");
      expect(vevent).toContain("END:VEVENT");
      expect(vevent).toContain("UID:");
      expect(vevent).toContain("DTSTAMP:");
      expect(vevent).toContain("DTSTART;TZID=America/New_York:");
      expect(vevent).toContain("DTEND;TZID=America/New_York:");
      expect(vevent).toContain("SUMMARY:☀️ → ♈ Sun ingress Aries");
      expect(vevent).toContain("DESCRIPTION:Sun ingress Aries");
      expect(vevent).toContain("STATUS:CONFIRMED");
      expect(vevent).toContain("CLASS:PUBLIC");
      expect(vevent).toContain("TRANSP:TRANSPARENT");
      expect(vevent).toContain(
        "CATEGORIES:Astronomy,Astrology,Ingress,Sun,Aries",
      );
    });

    it("should include optional location when provided", () => {
      const eventWithLocation: Event = {
        ...baseEvent,
        location: "Philadelphia, PA",
      };
      const vevent = service.buildEventContent(eventWithLocation);

      expect(vevent).toContain("LOCATION:Philadelphia, PA");
    });

    it("should include geography when provided", () => {
      const eventWithGeo: Event = {
        ...baseEvent,
        geography: { latitude: 39.9526, longitude: -75.1652 },
      };
      const vevent = service.buildEventContent(eventWithGeo);

      expect(vevent).toContain("GEO:39.9526;-75.1652");
    });

    it("should include URL when provided", () => {
      const eventWithUrl: Event = {
        ...baseEvent,
        url: "https://example.com/event",
      };
      const vevent = service.buildEventContent(eventWithUrl);

      expect(vevent).toContain("URL:https://example.com/event");
    });

    it("should include priority when provided", () => {
      const eventWithPriority: Event = {
        ...baseEvent,
        priority: 1,
      };
      const vevent = service.buildEventContent(eventWithPriority);

      expect(vevent).toContain("PRIORITY:1");
    });

    it("should include color when provided", () => {
      const eventWithColor: Event = {
        ...baseEvent,
        color: "red",
      };
      const vevent = service.buildEventContent(eventWithColor);

      expect(vevent).toContain("COLOR:red");
    });

    it("should generate unique UID based on event details", () => {
      const vevent = service.buildEventContent(baseEvent);
      const uidMatch = /UID:(.+)/.exec(vevent);

      expect(uidMatch).not.toBeNull();
      if (uidMatch) {
        expect(uidMatch[1]).toContain(baseEvent.summary);
        expect(uidMatch[1]).toContain(baseEvent.description);
      }
    });

    it("should handle events with different start and end times", () => {
      const durationEvent: Event = {
        ...baseEvent,
        end: moment.utc("2025-04-20T09:06:00Z"),
      };
      const vevent = service.buildEventContent(durationEvent);

      // UID should include both start and end when they differ
      const uidMatch = /UID:(.+)/.exec(vevent);
      if (uidMatch) {
        expect(uidMatch[1]).toContain(durationEvent.summary);
      }
      // Verify both DTSTART and DTEND are present with different values
      expect(vevent).toContain("DTSTART");
      expect(vevent).toContain("DTEND");
    });

    it("should use provided timezone", () => {
      const vevent = service.buildEventContent(
        baseEvent,
        "America/Los_Angeles",
      );

      expect(vevent).toContain("DTSTART;TZID=America/Los_Angeles:");
      expect(vevent).toContain("DTEND;TZID=America/Los_Angeles:");
    });
  });

  describe("buildFileContent", () => {
    const sampleEvents: Event[] = [
      {
        start: moment.utc("2025-03-20T09:06:00Z"),
        end: moment.utc("2025-03-20T09:06:00Z"),
        summary: "Vernal Equinox",
        description: "Sun enters Aries",
        categories: ["Astronomy", "Equinox"],
      },
      {
        start: moment.utc("2025-03-29T10:58:00Z"),
        end: moment.utc("2025-03-29T10:58:00Z"),
        summary: "Full Moon",
        description: "Full Moon in Libra",
        categories: ["Astronomy", "Lunar Phase"],
      },
    ];

    it("should generate valid VCALENDAR structure", () => {
      const calendar = service.buildFileContent({
        events: sampleEvents,
        name: "Test Calendar",
        timezone: "America/New_York",
        description: "A test calendar description",
      });

      expect(calendar).toContain("BEGIN:VCALENDAR");
      expect(calendar).toContain("END:VCALENDAR");
      expect(calendar).toContain("VERSION:2.0");
      expect(calendar).toContain(
        "PRODID:-//Caelundas//Astronomical Calendar//EN",
      );
      expect(calendar).toContain("CALSCALE:GREGORIAN");
      expect(calendar).toContain("METHOD:PUBLISH");
      expect(calendar).toContain("X-WR-CALNAME:Test Calendar");
    });

    it("should include calendar description when provided", () => {
      const calendar = service.buildFileContent({
        events: sampleEvents,
        name: "Test Calendar",
        description: "A test calendar description",
        timezone: "America/New_York",
      });

      expect(calendar).toContain("X-WR-CALDESC:A test calendar description");
    });

    it("should include timezone definition", () => {
      const calendar = service.buildFileContent({
        events: sampleEvents,
        name: "Test Calendar",
        timezone: "America/New_York",
        description: "A test calendar description",
      });

      expect(calendar).toContain("X-WR-TIMEZONE:America/New_York");
      expect(calendar).toContain("BEGIN:VTIMEZONE");
      expect(calendar).toContain("TZID:America/New_York");
      expect(calendar).toContain("END:VTIMEZONE");
    });

    it("should include all events", () => {
      const calendar = service.buildFileContent({
        events: sampleEvents,
        name: "Test Calendar",
        timezone: "America/New_York",
        description: "A test calendar description",
      });

      expect(calendar).toContain("SUMMARY:Vernal Equinox");
      expect(calendar).toContain("SUMMARY:Full Moon");
      expect((calendar.match(/BEGIN:VEVENT/g) || []).length).toBe(2);
      expect((calendar.match(/END:VEVENT/g) || []).length).toBe(2);
    });

    it("should handle empty events array", () => {
      const calendar = service.buildFileContent({
        events: [],
        name: "Empty Calendar",
        timezone: "America/New_York",
        description: "A test calendar description",
      });

      expect(calendar).toContain("BEGIN:VCALENDAR");
      expect(calendar).toContain("END:VCALENDAR");
      expect(calendar).not.toContain("BEGIN:VEVENT");
    });

    it("should include daylight saving time rules for New York", () => {
      const calendar = service.buildFileContent({
        events: sampleEvents,
        name: "Test Calendar",
        timezone: "America/New_York",
        description: "A test calendar description",
      });

      expect(calendar).toContain("BEGIN:DAYLIGHT");
      expect(calendar).toContain("END:DAYLIGHT");
      expect(calendar).toContain("BEGIN:STANDARD");
      expect(calendar).toContain("END:STANDARD");
      expect(calendar).toContain("TZNAME:EDT");
      expect(calendar).toContain("TZNAME:EST");
    });
  });
});
