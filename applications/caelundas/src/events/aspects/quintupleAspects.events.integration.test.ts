import moment from "moment-timezone";
import { describe, expect, it } from "vitest";

import {
  getQuintupleAspectDurationEvents,
  getQuintupleAspectEvents,
} from "./quintupleAspects.events";

import type { Event } from "../../calendar.utilities";

/**
 * Integration tests for Quintuple Aspects (Pentagram) detection
 *
 * These tests use carefully crafted astronomical configurations to trigger
 * the rare pentagram pattern (5 bodies forming a 5-pointed star with quintiles).
 *
 * Since pentagrams are astronomically rare, we manually create aspect events
 * that simulate a time when 5 bodies form the exact quintile relationships
 * needed for pattern detection.
 */

describe("quintupleAspects.events integration", () => {
  describe("Pentagram pattern detection with realistic timing", () => {
    it("should detect forming Pentagram when pattern first appears", () => {
      const currentMinute = moment.utc("2024-06-15T14:23:00.000Z");

      // Previous minute (14:22): Pattern does NOT exist yet - Sun-Mars quintile hasn't started
      // Current minute (14:23): Pattern EXISTS (forming) - Sun-Mars quintile starts
      // Next minute (14:24): Pattern EXISTS (continues) - all quintiles still active

      const storedAspects: Event[] = [
        // Star pattern: Sun(0) -> Mars(2), Moon(1) -> Jupiter(3), Mars(2) -> Venus(4), Jupiter(3) -> Sun(0), Venus(4) -> Moon(1)

        // Sun quintile Mars (edge 0-2) - THE CRITICAL ASPECT that starts exactly at 14:23:00
        {
          start: new Date("2024-06-15T14:23:00.000Z"),
          end: new Date("2024-06-15T14:40:00.000Z"),
          summary: "Sun quintile Mars",
          description: "Sun quintile Mars",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Sun",
            "Mars",
            "Quintile",
            "exact",
          ],
        },
        // Moon quintile Jupiter (edge 1-3) - exists before, during, and after
        {
          start: new Date("2024-06-15T14:00:00.000Z"),
          end: new Date("2024-06-15T14:40:00.000Z"),
          summary: "Moon quintile Jupiter",
          description: "Moon quintile Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Moon",
            "Jupiter",
            "Quintile",
            "exact",
          ],
        },
        // Mars quintile Venus (edge 2-4) - exists before, during, and after
        {
          start: new Date("2024-06-15T14:00:00.000Z"),
          end: new Date("2024-06-15T14:40:00.000Z"),
          summary: "Mars quintile Venus",
          description: "Mars quintile Venus",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Mars",
            "Venus",
            "Quintile",
            "exact",
          ],
        },
        // Jupiter quintile Sun (edge 3-0) - exists before, during, and after
        {
          start: new Date("2024-06-15T14:00:00.000Z"),
          end: new Date("2024-06-15T14:40:00.000Z"),
          summary: "Jupiter quintile Sun",
          description: "Jupiter quintile Sun",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Jupiter",
            "Sun",
            "Quintile",
            "exact",
          ],
        },
        // Venus quintile Moon (edge 4-1) - exists before, during, and after
        {
          start: new Date("2024-06-15T14:00:00.000Z"),
          end: new Date("2024-06-15T14:40:00.000Z"),
          summary: "Venus quintile Moon",
          description: "Venus quintile Moon",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Venus",
            "Moon",
            "Quintile",
            "exact",
          ],
        },
      ];

      const events = getQuintupleAspectEvents(storedAspects, currentMinute);

      expect(events).toHaveLength(1);
      expect(events[0]?.categories).toContain("Pentagram");
      expect(events[0]?.categories).toContain("Forming");
      expect(events[0]?.categories).toContain("Jupiter");
      expect(events[0]?.categories).toContain("Mars");
      expect(events[0]?.categories).toContain("Moon");
      expect(events[0]?.categories).toContain("Sun");
      expect(events[0]?.categories).toContain("Venus");
      expect(events[0]?.description).toContain("pentagram forming");
      expect(events[0]?.summary).toContain("➡️"); // Forming emoji
      expect(events[0]?.summary).toContain("⭐"); // Pentagram symbol
    });

    it("should detect dissolving Pentagram when pattern breaks apart", () => {
      const currentMinute = moment.utc("2024-06-15T14:30:00.000Z");

      // Previous minute (14:29): Pattern EXISTS - all quintiles still active
      // Current minute (14:30): Pattern EXISTS but Sun-Mars quintile ends exactly at 14:30:00 (dissolving)
      // Next minute (14:31): Pattern does NOT exist - Sun-Mars quintile is gone

      const storedAspects: Event[] = [
        // Sun-Mars quintile - THE CRITICAL ASPECT that ends exactly at 14:30:00
        {
          start: new Date("2024-06-15T14:00:00.000Z"),
          end: new Date("2024-06-15T14:30:00.000Z"),
          summary: "Sun quintile Mars",
          description: "Sun quintile Mars",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Sun",
            "Mars",
            "Quintile",
            "exact",
          ],
        },
        // All other quintiles continue beyond 14:30
        {
          start: new Date("2024-06-15T14:00:00.000Z"),
          end: new Date("2024-06-15T15:00:00.000Z"),
          summary: "Moon quintile Jupiter",
          description: "Moon quintile Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Moon",
            "Jupiter",
            "Quintile",
            "exact",
          ],
        },
        {
          start: new Date("2024-06-15T14:00:00.000Z"),
          end: new Date("2024-06-15T15:00:00.000Z"),
          summary: "Mars quintile Venus",
          description: "Mars quintile Venus",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Mars",
            "Venus",
            "Quintile",
            "exact",
          ],
        },
        {
          start: new Date("2024-06-15T14:00:00.000Z"),
          end: new Date("2024-06-15T15:00:00.000Z"),
          summary: "Jupiter quintile Sun",
          description: "Jupiter quintile Sun",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Jupiter",
            "Sun",
            "Quintile",
            "exact",
          ],
        },
        {
          start: new Date("2024-06-15T14:00:00.000Z"),
          end: new Date("2024-06-15T15:00:00.000Z"),
          summary: "Venus quintile Moon",
          description: "Venus quintile Moon",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Venus",
            "Moon",
            "Quintile",
            "exact",
          ],
        },
      ];

      const events = getQuintupleAspectEvents(storedAspects, currentMinute);

      expect(events).toHaveLength(1);
      expect(events[0]?.categories).toContain("Pentagram");
      expect(events[0]?.categories).toContain("Dissolving");
      expect(events[0]?.description).toContain("pentagram dissolving");
      expect(events[0]?.summary).toContain("⬅️"); // Dissolving emoji
    });

    it("should create duration event from forming/dissolving Pentagram pair", () => {
      const formingEvent: Event = {
        start: new Date("2024-06-15T14:23:00.000Z"),
        end: new Date("2024-06-15T14:23:00.000Z"),
        summary:
          "➡️ ⬠ ☉-☽-♂-♃-♀ Jupiter, Mars, Moon, Sun, Venus pentagram forming",
        description: "Jupiter, Mars, Moon, Sun, Venus pentagram forming",
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Quintuple Aspect",
          "Pentagram",
          "Forming",
          "Jupiter",
          "Mars",
          "Moon",
          "Sun",
          "Venus",
        ],
      };

      const dissolvingEvent: Event = {
        start: new Date("2024-06-15T14:30:00.000Z"),
        end: new Date("2024-06-15T14:30:00.000Z"),
        summary:
          "⬅️ ⬠ ☉-☽-♂-♃-♀ Jupiter, Mars, Moon, Sun, Venus pentagram dissolving",
        description: "Jupiter, Mars, Moon, Sun, Venus pentagram dissolving",
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Quintuple Aspect",
          "Pentagram",
          "Dissolving",
          "Jupiter",
          "Mars",
          "Moon",
          "Sun",
          "Venus",
        ],
      };

      const durationEvents = getQuintupleAspectDurationEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(durationEvents).toHaveLength(1);
      expect(durationEvents[0]?.start).toEqual(
        new Date("2024-06-15T14:23:00.000Z"),
      );
      expect(durationEvents[0]?.end).toEqual(
        new Date("2024-06-15T14:30:00.000Z"),
      );
      expect(durationEvents[0]?.categories).toContain("Quintuple Aspect");
      expect(durationEvents[0]?.categories).toContain("Pentagram");
      expect(durationEvents[0]?.categories).not.toContain("Forming");
      expect(durationEvents[0]?.categories).not.toContain("Dissolving");
      expect(durationEvents[0]?.description).toContain("pentagram");
      expect(durationEvents[0]?.description).not.toMatch(
        /(forming|dissolving)$/i,
      );
    });
  });

  describe("Pentagram with different body combinations", () => {
    it("should detect Pentagram with outer planets", () => {
      const currentMinute = moment.utc("2024-08-10T09:15:00.000Z");

      const storedAspects: Event[] = [
        // Saturn-Uranus-Neptune-Pluto-Jupiter pentagram forming at 09:15
        // Saturn-Neptune quintile is the critical aspect that starts exactly at 09:15:00
        {
          start: new Date("2024-08-10T09:15:00.000Z"),
          end: new Date("2024-08-10T10:00:00.000Z"),
          summary: "Saturn quintile Neptune",
          description: "Saturn quintile Neptune",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Saturn",
            "Neptune",
            "Quintile",
            "exact",
          ],
        },
        // All other quintiles exist before, during, and after 09:15
        {
          start: new Date("2024-08-10T09:00:00.000Z"),
          end: new Date("2024-08-10T10:00:00.000Z"),
          summary: "Uranus quintile Pluto",
          description: "Uranus quintile Pluto",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Uranus",
            "Pluto",
            "Quintile",
            "exact",
          ],
        },
        {
          start: new Date("2024-08-10T09:00:00.000Z"),
          end: new Date("2024-08-10T10:00:00.000Z"),
          summary: "Neptune quintile Jupiter",
          description: "Neptune quintile Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Neptune",
            "Jupiter",
            "Quintile",
            "exact",
          ],
        },
        {
          start: new Date("2024-08-10T09:00:00.000Z"),
          end: new Date("2024-08-10T10:00:00.000Z"),
          summary: "Pluto quintile Saturn",
          description: "Pluto quintile Saturn",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Pluto",
            "Saturn",
            "Quintile",
            "exact",
          ],
        },
        {
          start: new Date("2024-08-10T09:00:00.000Z"),
          end: new Date("2024-08-10T10:00:00.000Z"),
          summary: "Jupiter quintile Uranus",
          description: "Jupiter quintile Uranus",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Jupiter",
            "Uranus",
            "Quintile",
            "exact",
          ],
        },
      ];

      const events = getQuintupleAspectEvents(storedAspects, currentMinute);

      expect(events).toHaveLength(1);
      expect(events[0]?.categories).toContain("Pentagram");
      expect(events[0]?.categories).toContain("Forming");
      expect(events[0]?.categories).toContain("Saturn");
      expect(events[0]?.categories).toContain("Uranus");
      expect(events[0]?.categories).toContain("Neptune");
      expect(events[0]?.categories).toContain("Pluto");
      expect(events[0]?.categories).toContain("Jupiter");
    });
  });

  describe("Edge cases with realistic timing", () => {
    it("should not detect Pentagram with only 4 quintiles (incomplete pattern)", () => {
      const currentMinute = moment.utc("2024-06-15T14:23:00.000Z");

      // Missing the 5th quintile needed to complete the pentagram
      const storedAspects: Event[] = [
        {
          start: new Date("2024-06-15T14:20:00.000Z"),
          end: new Date("2024-06-15T14:30:00.000Z"),
          summary: "Sun quintile Mars",
          description: "Sun quintile Mars",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Sun",
            "Mars",
            "Quintile",
            "exact",
          ],
        },
        {
          start: new Date("2024-06-15T14:20:00.000Z"),
          end: new Date("2024-06-15T14:30:00.000Z"),
          summary: "Moon quintile Jupiter",
          description: "Moon quintile Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Moon",
            "Jupiter",
            "Quintile",
            "exact",
          ],
        },
        {
          start: new Date("2024-06-15T14:20:00.000Z"),
          end: new Date("2024-06-15T14:30:00.000Z"),
          summary: "Mars quintile Venus",
          description: "Mars quintile Venus",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Mars",
            "Venus",
            "Quintile",
            "exact",
          ],
        },
        {
          start: new Date("2024-06-15T14:20:00.000Z"),
          end: new Date("2024-06-15T14:30:00.000Z"),
          summary: "Jupiter quintile Sun",
          description: "Jupiter quintile Sun",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Jupiter",
            "Sun",
            "Quintile",
            "exact",
          ],
        },
        // Missing: Venus quintile Moon (the 5th edge to complete the star)
      ];

      const events = getQuintupleAspectEvents(storedAspects, currentMinute);

      expect(events).toHaveLength(0);
    });

    it("should not detect Pentagram when pattern has wrong aspect types", () => {
      const currentMinute = moment.utc("2024-06-15T14:23:00.000Z");

      // Has 5 edges but one is a sextile instead of quintile
      const storedAspects: Event[] = [
        {
          start: new Date("2024-06-15T14:20:00.000Z"),
          end: new Date("2024-06-15T14:30:00.000Z"),
          summary: "Sun quintile Mars",
          description: "Sun quintile Mars",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Sun",
            "Mars",
            "Quintile",
            "exact",
          ],
        },
        {
          start: new Date("2024-06-15T14:20:00.000Z"),
          end: new Date("2024-06-15T14:30:00.000Z"),
          summary: "Moon quintile Jupiter",
          description: "Moon quintile Jupiter",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Moon",
            "Jupiter",
            "Quintile",
            "exact",
          ],
        },
        {
          start: new Date("2024-06-15T14:20:00.000Z"),
          end: new Date("2024-06-15T14:30:00.000Z"),
          summary: "Mars sextile Venus", // WRONG ASPECT TYPE
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
          start: new Date("2024-06-15T14:20:00.000Z"),
          end: new Date("2024-06-15T14:30:00.000Z"),
          summary: "Jupiter quintile Sun",
          description: "Jupiter quintile Sun",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Jupiter",
            "Sun",
            "Quintile",
            "exact",
          ],
        },
        {
          start: new Date("2024-06-15T14:20:00.000Z"),
          end: new Date("2024-06-15T14:30:00.000Z"),
          summary: "Venus quintile Moon",
          description: "Venus quintile Moon",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Venus",
            "Moon",
            "Quintile",
            "exact",
          ],
        },
      ];

      const events = getQuintupleAspectEvents(storedAspects, currentMinute);

      expect(events).toHaveLength(0);
    });
  });
});
