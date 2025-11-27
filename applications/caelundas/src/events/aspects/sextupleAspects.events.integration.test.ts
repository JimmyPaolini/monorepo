import moment from "moment-timezone";
import { describe, expect, it } from "vitest";

import {
  getSextupleAspectDurationEvents,
  getSextupleAspectEvents,
} from "./sextupleAspects.events";

import type { Event } from "../../calendar.utilities";

/**
 * Integration tests for Sextuple Aspects (Hexagram/Star of David) detection
 *
 * These tests use carefully crafted astronomical configurations to trigger
 * the extremely rare hexagram pattern (6 bodies forming two interlocking grand trines).
 *
 * Hexagram requirements:
 * - 6 trines connecting bodies 0-2, 0-4, 2-4 (first triangle)
 * - 3 more trines connecting 1-3, 1-5, 3-5 (second triangle)
 * - 6 sextiles connecting adjacent bodies: 0-1, 1-2, 2-3, 3-4, 4-5, 5-0
 */

describe("sextupleAspects.events integration", () => {
  describe("Hexagram pattern detection with realistic timing", () => {
    it("should detect forming Hexagram when pattern first appears", () => {
      const currentMinute = moment.utc("2024-09-22T18:42:00.000Z");

      // Previous minute (18:41): Pattern does NOT exist yet
      // Current minute (18:42): Pattern EXISTS (forming)
      // Next minute (18:43): Pattern EXISTS (continues)

      const storedAspects: Event[] = [
        // First grand trine: Sun(0) - Mars(2) - Jupiter(4)
        {
          start: new Date("2024-09-22T18:42:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Sun trine Mars",
          description: "Sun trine Mars",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Mars",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Sun trine Jupiter",
          description: "Sun trine Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Jupiter",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Mars trine Jupiter",
          description: "Mars trine Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Mars",
            "Jupiter",
            "Trine",
            "exact",
          ],
        },
        // Second grand trine: Moon(1) - Venus(3) - Saturn(5)
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Moon trine Venus",
          description: "Moon trine Venus",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Moon",
            "Venus",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Moon trine Saturn",
          description: "Moon trine Saturn",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Moon",
            "Saturn",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Venus trine Saturn",
          description: "Venus trine Saturn",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Venus",
            "Saturn",
            "Trine",
            "exact",
          ],
        },
        // Sextiles connecting adjacent bodies (hexagon perimeter)
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Sun sextile Moon",
          description: "Sun sextile Moon",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Moon",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Moon sextile Mars",
          description: "Moon sextile Mars",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Moon",
            "Mars",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Mars sextile Venus",
          description: "Mars sextile Venus",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Mars",
            "Venus",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Venus sextile Jupiter",
          description: "Venus sextile Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Venus",
            "Jupiter",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Jupiter sextile Saturn",
          description: "Jupiter sextile Saturn",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Jupiter",
            "Saturn",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Saturn sextile Sun",
          description: "Saturn sextile Sun",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Saturn",
            "Sun",
            "Sextile",
            "exact",
          ],
        },
      ];

      const events = getSextupleAspectEvents(storedAspects, currentMinute);

      expect(events).toHaveLength(1);
      expect(events[0]).toBeDefined();
      expect(events[0]?.categories).toContain("Hexagram");
      expect(events[0]?.categories).toContain("Forming");
      expect(events[0]?.categories).toContain("Jupiter");
      expect(events[0]?.categories).toContain("Mars");
      expect(events[0]?.categories).toContain("Moon");
      expect(events[0]?.categories).toContain("Saturn");
      expect(events[0]?.categories).toContain("Sun");
      expect(events[0]?.categories).toContain("Venus");
      expect(events[0]?.description).toContain("hexagram forming");
      expect(events[0]?.summary).toContain("➡️"); // Forming emoji
      expect(events[0]?.summary).toContain("🔯"); // Hexagram symbol
    });

    it("should detect dissolving Hexagram when pattern breaks apart", () => {
      const currentMinute = moment.utc("2024-09-22T19:00:00.000Z");

      // Previous minute (18:59): Pattern EXISTS
      // Current minute (19:00): Pattern EXISTS but will end (dissolving)
      // Next minute (19:01): Pattern does NOT exist

      const storedAspects: Event[] = [
        // All aspects exist at 18:59 and 19:00, but Sun-Mars ends at 19:00
        {
          start: new Date("2024-09-22T18:42:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Sun trine Mars",
          description: "Sun trine Mars",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Mars",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:30:00.000Z"),
          summary: "Sun trine Jupiter",
          description: "Sun trine Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Jupiter",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:30:00.000Z"),
          summary: "Mars trine Jupiter",
          description: "Mars trine Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Mars",
            "Jupiter",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:30:00.000Z"),
          summary: "Moon trine Venus",
          description: "Moon trine Venus",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Moon",
            "Venus",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:30:00.000Z"),
          summary: "Moon trine Saturn",
          description: "Moon trine Saturn",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Moon",
            "Saturn",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:30:00.000Z"),
          summary: "Venus trine Saturn",
          description: "Venus trine Saturn",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Venus",
            "Saturn",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:30:00.000Z"),
          summary: "Sun sextile Moon",
          description: "Sun sextile Moon",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Moon",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:30:00.000Z"),
          summary: "Moon sextile Mars",
          description: "Moon sextile Mars",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Moon",
            "Mars",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:30:00.000Z"),
          summary: "Mars sextile Venus",
          description: "Mars sextile Venus",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Mars",
            "Venus",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:30:00.000Z"),
          summary: "Venus sextile Jupiter",
          description: "Venus sextile Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Venus",
            "Jupiter",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:30:00.000Z"),
          summary: "Jupiter sextile Saturn",
          description: "Jupiter sextile Saturn",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Jupiter",
            "Saturn",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:30:00.000Z"),
          summary: "Saturn sextile Sun",
          description: "Saturn sextile Sun",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Saturn",
            "Sun",
            "Sextile",
            "exact",
          ],
        },
      ];

      const events = getSextupleAspectEvents(storedAspects, currentMinute);

      expect(events).toHaveLength(1);
      expect(events[0]).toBeDefined();
      expect(events[0]?.categories).toContain("Hexagram");
      expect(events[0]?.categories).toContain("Dissolving");
      expect(events[0]?.description).toContain("hexagram dissolving");
      expect(events[0]?.summary).toContain("⬅️"); // Dissolving emoji
    });

    it("should create duration event from forming/dissolving Hexagram pair", () => {
      const formingEvent: Event = {
        start: new Date("2024-09-22T18:42:00.000Z"),
        end: new Date("2024-09-22T18:42:00.000Z"),
        summary:
          "➡️ ✡ ☉-☽-♂-♃-♀-♄ Jupiter, Mars, Moon, Saturn, Sun, Venus hexagram forming",
        description: "Jupiter, Mars, Moon, Saturn, Sun, Venus hexagram forming",
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Sextuple Aspect",
          "Hexagram",
          "Forming",
          "Jupiter",
          "Mars",
          "Moon",
          "Saturn",
          "Sun",
          "Venus",
        ],
      };

      const dissolvingEvent: Event = {
        start: new Date("2024-09-22T19:00:00.000Z"),
        end: new Date("2024-09-22T19:00:00.000Z"),
        summary:
          "⬅️ ✡ ☉-☽-♂-♃-♀-♄ Jupiter, Mars, Moon, Saturn, Sun, Venus hexagram dissolving",
        description:
          "Jupiter, Mars, Moon, Saturn, Sun, Venus hexagram dissolving",
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Sextuple Aspect",
          "Hexagram",
          "Dissolving",
          "Jupiter",
          "Mars",
          "Moon",
          "Saturn",
          "Sun",
          "Venus",
        ],
      };

      const durationEvents = getSextupleAspectDurationEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(durationEvents).toHaveLength(1);
      expect(durationEvents[0]).toBeDefined();
      expect(durationEvents[0]?.start).toEqual(
        new Date("2024-09-22T18:42:00.000Z")
      );
      expect(durationEvents[0]?.end).toEqual(
        new Date("2024-09-22T19:00:00.000Z")
      );
      expect(durationEvents[0]?.categories).toContain("Sextuple Aspect");
      expect(durationEvents[0]?.categories).toContain("Hexagram");
      expect(durationEvents[0]?.categories).not.toContain("Forming");
      expect(durationEvents[0]?.categories).not.toContain("Dissolving");
      expect(durationEvents[0]?.description).toContain("hexagram");
      expect(durationEvents[0]?.description).not.toMatch(
        /(forming|dissolving)$/i
      );
    });
  });

  describe("Hexagram with different body combinations", () => {
    it("should detect Hexagram with outer planets", () => {
      const currentMinute = moment.utc("2024-12-05T11:30:00.000Z");

      const storedAspects: Event[] = [
        // First grand trine: Mars-Jupiter-Saturn
        {
          start: new Date("2024-12-05T11:30:00.000Z"),
          end: new Date("2024-12-05T12:30:00.000Z"),
          summary: "Mars trine Jupiter",
          description: "Mars trine Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Mars",
            "Jupiter",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-12-05T11:00:00.000Z"),
          end: new Date("2024-12-05T12:30:00.000Z"),
          summary: "Mars trine Saturn",
          description: "Mars trine Saturn",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Mars",
            "Saturn",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-12-05T11:00:00.000Z"),
          end: new Date("2024-12-05T12:30:00.000Z"),
          summary: "Jupiter trine Saturn",
          description: "Jupiter trine Saturn",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Jupiter",
            "Saturn",
            "Trine",
            "exact",
          ],
        },
        // Second grand trine: Uranus-Neptune-Pluto
        {
          start: new Date("2024-12-05T11:00:00.000Z"),
          end: new Date("2024-12-05T12:30:00.000Z"),
          summary: "Uranus trine Neptune",
          description: "Uranus trine Neptune",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Uranus",
            "Neptune",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-12-05T11:00:00.000Z"),
          end: new Date("2024-12-05T12:30:00.000Z"),
          summary: "Uranus trine Pluto",
          description: "Uranus trine Pluto",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Uranus",
            "Pluto",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-12-05T11:00:00.000Z"),
          end: new Date("2024-12-05T12:30:00.000Z"),
          summary: "Neptune trine Pluto",
          description: "Neptune trine Pluto",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Neptune",
            "Pluto",
            "Trine",
            "exact",
          ],
        },
        // Sextiles
        {
          start: new Date("2024-12-05T11:00:00.000Z"),
          end: new Date("2024-12-05T12:30:00.000Z"),
          summary: "Mars sextile Uranus",
          description: "Mars sextile Uranus",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Mars",
            "Uranus",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-12-05T11:00:00.000Z"),
          end: new Date("2024-12-05T12:30:00.000Z"),
          summary: "Uranus sextile Jupiter",
          description: "Uranus sextile Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Uranus",
            "Jupiter",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-12-05T11:00:00.000Z"),
          end: new Date("2024-12-05T12:30:00.000Z"),
          summary: "Jupiter sextile Neptune",
          description: "Jupiter sextile Neptune",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Jupiter",
            "Neptune",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-12-05T11:00:00.000Z"),
          end: new Date("2024-12-05T12:30:00.000Z"),
          summary: "Neptune sextile Saturn",
          description: "Neptune sextile Saturn",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Neptune",
            "Saturn",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-12-05T11:00:00.000Z"),
          end: new Date("2024-12-05T12:30:00.000Z"),
          summary: "Saturn sextile Pluto",
          description: "Saturn sextile Pluto",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Saturn",
            "Pluto",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-12-05T11:00:00.000Z"),
          end: new Date("2024-12-05T12:30:00.000Z"),
          summary: "Pluto sextile Mars",
          description: "Pluto sextile Mars",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Pluto",
            "Mars",
            "Sextile",
            "exact",
          ],
        },
      ];

      const events = getSextupleAspectEvents(storedAspects, currentMinute);

      expect(events).toHaveLength(1);
      expect(events[0]).toBeDefined();
      expect(events[0]?.categories).toContain("Hexagram");
      expect(events[0]?.categories).toContain("Forming");
      expect(events[0]?.categories).toContain("Mars");
      expect(events[0]?.categories).toContain("Jupiter");
      expect(events[0]?.categories).toContain("Saturn");
      expect(events[0]?.categories).toContain("Uranus");
      expect(events[0]?.categories).toContain("Neptune");
      expect(events[0]?.categories).toContain("Pluto");
    });
  });

  describe("Edge cases with realistic timing", () => {
    it("should not detect Hexagram with incomplete first grand trine", () => {
      const currentMinute = moment.utc("2024-09-22T18:42:00.000Z");

      const storedAspects: Event[] = [
        // First grand trine INCOMPLETE: missing Jupiter-Mars trine
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Sun trine Mars",
          description: "Sun trine Mars",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Mars",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Sun trine Jupiter",
          description: "Sun trine Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Jupiter",
            "Trine",
            "exact",
          ],
        },
        // Missing: Mars trine Jupiter
        // Second grand trine complete
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Moon trine Venus",
          description: "Moon trine Venus",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Moon",
            "Venus",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Moon trine Saturn",
          description: "Moon trine Saturn",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Moon",
            "Saturn",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Venus trine Saturn",
          description: "Venus trine Saturn",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Venus",
            "Saturn",
            "Trine",
            "exact",
          ],
        },
        // All sextiles present
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Sun sextile Moon",
          description: "Sun sextile Moon",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Moon",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Moon sextile Mars",
          description: "Moon sextile Mars",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Moon",
            "Mars",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Mars sextile Venus",
          description: "Mars sextile Venus",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Mars",
            "Venus",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Venus sextile Jupiter",
          description: "Venus sextile Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Venus",
            "Jupiter",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Jupiter sextile Saturn",
          description: "Jupiter sextile Saturn",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Jupiter",
            "Saturn",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Saturn sextile Sun",
          description: "Saturn sextile Sun",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Saturn",
            "Sun",
            "Sextile",
            "exact",
          ],
        },
      ];

      const events = getSextupleAspectEvents(storedAspects, currentMinute);

      expect(events).toHaveLength(0);
    });

    it("should not detect Hexagram with incomplete sextile ring", () => {
      const currentMinute = moment.utc("2024-09-22T18:42:00.000Z");

      const storedAspects: Event[] = [
        // Both grand trines complete
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Sun trine Mars",
          description: "Sun trine Mars",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Mars",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Sun trine Jupiter",
          description: "Sun trine Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Jupiter",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Mars trine Jupiter",
          description: "Mars trine Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Mars",
            "Jupiter",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Moon trine Venus",
          description: "Moon trine Venus",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Moon",
            "Venus",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Moon trine Saturn",
          description: "Moon trine Saturn",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Moon",
            "Saturn",
            "Trine",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Venus trine Saturn",
          description: "Venus trine Saturn",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Venus",
            "Saturn",
            "Trine",
            "exact",
          ],
        },
        // Sextiles INCOMPLETE: missing Saturn-Sun sextile
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Sun sextile Moon",
          description: "Sun sextile Moon",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Moon",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Moon sextile Mars",
          description: "Moon sextile Mars",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Moon",
            "Mars",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Mars sextile Venus",
          description: "Mars sextile Venus",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Mars",
            "Venus",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Venus sextile Jupiter",
          description: "Venus sextile Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Venus",
            "Jupiter",
            "Sextile",
            "exact",
          ],
        },
        {
          start: new Date("2024-09-22T18:30:00.000Z"),
          end: new Date("2024-09-22T19:00:00.000Z"),
          summary: "Jupiter sextile Saturn",
          description: "Jupiter sextile Saturn",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Jupiter",
            "Saturn",
            "Sextile",
            "exact",
          ],
        },
        // Missing: Saturn sextile Sun
      ];

      const events = getSextupleAspectEvents(storedAspects, currentMinute);

      expect(events).toHaveLength(0);
    });
  });
});
