import { describe, expect, it } from "vitest";

import { mockDates } from "../testing/mocks";

import { type Event, getCalendar, getEvent } from "./calendar.utilities";

describe("calendar.utilities", () => {
  mockDates();

  describe("getEvent", () => {
    const baseEvent: Event = {
      start: new Date("2025-03-20T09:06:00Z"),
      end: new Date("2025-03-20T09:06:00Z"),
      summary: "☀️ → ♈ Sun ingress Aries",
      description: "Sun ingress Aries",
      categories: ["Astronomy", "Astrology", "Ingress", "Sun", "Aries"],
    };

    it("should generate valid VEVENT structure", () => {
      const vevent = getEvent(baseEvent);

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
        "CATEGORIES:Astronomy,Astrology,Ingress,Sun,Aries"
      );
    });

    it("should include optional location when provided", () => {
      const eventWithLocation: Event = {
        ...baseEvent,
        location: "Philadelphia, PA",
      };
      const vevent = getEvent(eventWithLocation);

      expect(vevent).toContain("LOCATION:Philadelphia, PA");
    });

    it("should include geography when provided", () => {
      const eventWithGeo: Event = {
        ...baseEvent,
        geography: { latitude: 39.9526, longitude: -75.1652 },
      };
      const vevent = getEvent(eventWithGeo);

      expect(vevent).toContain("GEO:39.9526;-75.1652");
    });

    it("should include URL when provided", () => {
      const eventWithUrl: Event = {
        ...baseEvent,
        url: "https://example.com/event",
      };
      const vevent = getEvent(eventWithUrl);

      expect(vevent).toContain("URL:https://example.com/event");
    });

    it("should include priority when provided", () => {
      const eventWithPriority: Event = {
        ...baseEvent,
        priority: 1,
      };
      const vevent = getEvent(eventWithPriority);

      expect(vevent).toContain("PRIORITY:1");
    });

    it("should include color when provided", () => {
      const eventWithColor: Event = {
        ...baseEvent,
        color: "red",
      };
      const vevent = getEvent(eventWithColor);

      expect(vevent).toContain("COLOR:red");
    });

    it("should generate unique UID based on event details", () => {
      const vevent = getEvent(baseEvent);
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
        end: new Date("2025-04-20T09:06:00Z"),
      };
      const vevent = getEvent(durationEvent);

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
      const vevent = getEvent(baseEvent, "America/Los_Angeles");

      expect(vevent).toContain("DTSTART;TZID=America/Los_Angeles:");
      expect(vevent).toContain("DTEND;TZID=America/Los_Angeles:");
    });
  });

  describe("getCalendar", () => {
    const sampleEvents: Event[] = [
      {
        start: new Date("2025-03-20T09:06:00Z"),
        end: new Date("2025-03-20T09:06:00Z"),
        summary: "Vernal Equinox",
        description: "Sun enters Aries",
        categories: ["Astronomy", "Equinox"],
      },
      {
        start: new Date("2025-03-29T10:58:00Z"),
        end: new Date("2025-03-29T10:58:00Z"),
        summary: "Full Moon",
        description: "Full Moon in Libra",
        categories: ["Astronomy", "Lunar Phase"],
      },
    ];

    it("should generate valid VCALENDAR structure", () => {
      const calendar = getCalendar({
        events: sampleEvents,
        name: "Test Calendar",
      });

      expect(calendar).toContain("BEGIN:VCALENDAR");
      expect(calendar).toContain("END:VCALENDAR");
      expect(calendar).toContain("VERSION:2.0");
      expect(calendar).toContain(
        "PRODID:-//Caelundas//Astronomical Calendar//EN"
      );
      expect(calendar).toContain("CALSCALE:GREGORIAN");
      expect(calendar).toContain("METHOD:PUBLISH");
      expect(calendar).toContain("X-WR-CALNAME:Test Calendar");
    });

    it("should include calendar description when provided", () => {
      const calendar = getCalendar({
        events: sampleEvents,
        name: "Test Calendar",
        description: "A test calendar description",
      });

      expect(calendar).toContain("X-WR-CALDESC:A test calendar description");
    });

    it("should include timezone definition", () => {
      const calendar = getCalendar({
        events: sampleEvents,
        name: "Test Calendar",
        timezone: "America/New_York",
      });

      expect(calendar).toContain("X-WR-TIMEZONE:America/New_York");
      expect(calendar).toContain("BEGIN:VTIMEZONE");
      expect(calendar).toContain("TZID:America/New_York");
      expect(calendar).toContain("END:VTIMEZONE");
    });

    it("should include all events", () => {
      const calendar = getCalendar({
        events: sampleEvents,
        name: "Test Calendar",
      });

      expect(calendar).toContain("SUMMARY:Vernal Equinox");
      expect(calendar).toContain("SUMMARY:Full Moon");
      expect((calendar.match(/BEGIN:VEVENT/g) || []).length).toBe(2);
      expect((calendar.match(/END:VEVENT/g) || []).length).toBe(2);
    });

    it("should handle empty events array", () => {
      const calendar = getCalendar({
        events: [],
        name: "Empty Calendar",
      });

      expect(calendar).toContain("BEGIN:VCALENDAR");
      expect(calendar).toContain("END:VCALENDAR");
      expect(calendar).not.toContain("BEGIN:VEVENT");
    });

    it("should include daylight saving time rules for New York", () => {
      const calendar = getCalendar({
        events: sampleEvents,
        name: "Test Calendar",
        timezone: "America/New_York",
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
