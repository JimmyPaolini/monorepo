import moment from "moment-timezone";
import { describe, expect, it } from "vitest";

import {
  getQuintupleAspectEvents,
  getQuintupleAspectProgressiveEvents,
} from "./quintupleAspects.events";

import type { Event } from "../../../calendar.utilities";
import type { AspectBodies } from "../aspects.store";

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

      // Star pattern: Sun(0) -> Mars(2), Moon(1) -> Jupiter(3), Mars(2) -> Venus(4), Jupiter(3) -> Sun(0), Venus(4) -> Moon(1)
      // Sun-Mars is the critical forming aspect; others are stable
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "mars"], aspect: "quintile" },
        { bodies: ["moon", "jupiter"], aspect: "quintile" },
        { bodies: ["mars", "venus"], aspect: "quintile" },
        { bodies: ["jupiter", "sun"], aspect: "quintile" },
        { bodies: ["venus", "moon"], aspect: "quintile" },
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["moon", "jupiter"], aspect: "quintile" },
        { bodies: ["mars", "venus"], aspect: "quintile" },
        { bodies: ["jupiter", "sun"], aspect: "quintile" },
        { bodies: ["venus", "moon"], aspect: "quintile" },
      ];

      const events = getQuintupleAspectEvents(
        currentAspectBodies,
        previousAspectBodies,
        currentMinute,
      );

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

      // Sun-Mars dissolving; others stable
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["moon", "jupiter"], aspect: "quintile" },
        { bodies: ["mars", "venus"], aspect: "quintile" },
        { bodies: ["jupiter", "sun"], aspect: "quintile" },
        { bodies: ["venus", "moon"], aspect: "quintile" },
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "mars"], aspect: "quintile" },
        { bodies: ["moon", "jupiter"], aspect: "quintile" },
        { bodies: ["mars", "venus"], aspect: "quintile" },
        { bodies: ["jupiter", "sun"], aspect: "quintile" },
        { bodies: ["venus", "moon"], aspect: "quintile" },
      ];

      const events = getQuintupleAspectEvents(
        currentAspectBodies,
        previousAspectBodies,
        currentMinute,
      );

      expect(events).toHaveLength(1);
      expect(events[0]?.categories).toContain("Pentagram");
      expect(events[0]?.categories).toContain("Dissolving");
      expect(events[0]?.description).toContain("pentagram dissolving");
      expect(events[0]?.summary).toContain("⬅️"); // Dissolving emoji
    });

    it("should create progressive event from forming/dissolving Pentagram pair", () => {
      const formingEvent: Event = {
        start: moment.utc("2024-06-15T14:23:00.000Z"),
        end: moment.utc("2024-06-15T14:23:00.000Z"),
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
        start: moment.utc("2024-06-15T14:30:00.000Z"),
        end: moment.utc("2024-06-15T14:30:00.000Z"),
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

      const progressiveEvents = getQuintupleAspectProgressiveEvents([
        formingEvent,
        dissolvingEvent,
      ]);

      expect(progressiveEvents).toHaveLength(1);
      expect(progressiveEvents[0]?.start).toEqual(
        moment.utc("2024-06-15T14:23:00.000Z"),
      );
      expect(progressiveEvents[0]?.end).toEqual(
        moment.utc("2024-06-15T14:30:00.000Z"),
      );
      expect(progressiveEvents[0]?.categories).toContain("Quintuple Aspect");
      expect(progressiveEvents[0]?.categories).toContain("Pentagram");
      expect(progressiveEvents[0]?.categories).not.toContain("Forming");
      expect(progressiveEvents[0]?.categories).not.toContain("Dissolving");
      expect(progressiveEvents[0]?.description).toContain("pentagram");
      expect(progressiveEvents[0]?.description).not.toMatch(
        /(forming|dissolving)$/i,
      );
    });
  });

  describe("Pentagram with different body combinations", () => {
    it("should detect Pentagram with outer planets", () => {
      const currentMinute = moment.utc("2024-08-10T09:15:00.000Z");

      // Saturn-Neptune forming; others stable
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["saturn", "neptune"], aspect: "quintile" },
        { bodies: ["uranus", "pluto"], aspect: "quintile" },
        { bodies: ["neptune", "jupiter"], aspect: "quintile" },
        { bodies: ["pluto", "saturn"], aspect: "quintile" },
        { bodies: ["jupiter", "uranus"], aspect: "quintile" },
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["uranus", "pluto"], aspect: "quintile" },
        { bodies: ["neptune", "jupiter"], aspect: "quintile" },
        { bodies: ["pluto", "saturn"], aspect: "quintile" },
        { bodies: ["jupiter", "uranus"], aspect: "quintile" },
      ];

      const events = getQuintupleAspectEvents(
        currentAspectBodies,
        previousAspectBodies,
        currentMinute,
      );

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
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "mars"], aspect: "quintile" },
        { bodies: ["moon", "jupiter"], aspect: "quintile" },
        { bodies: ["mars", "venus"], aspect: "quintile" },
        { bodies: ["jupiter", "sun"], aspect: "quintile" },
        // Missing: Venus quintile Moon (the 5th edge to complete the star)
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "mars"], aspect: "quintile" },
        { bodies: ["moon", "jupiter"], aspect: "quintile" },
        { bodies: ["mars", "venus"], aspect: "quintile" },
        { bodies: ["jupiter", "sun"], aspect: "quintile" },
      ];

      const events = getQuintupleAspectEvents(
        currentAspectBodies,
        previousAspectBodies,
        currentMinute,
      );

      expect(events).toHaveLength(0);
    });

    it("should not detect Pentagram when pattern has wrong aspect types", () => {
      const currentMinute = moment.utc("2024-06-15T14:23:00.000Z");

      // Has 5 edges but one is a sextile instead of quintile
      const currentAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "mars"], aspect: "quintile" },
        { bodies: ["moon", "jupiter"], aspect: "quintile" },
        { bodies: ["mars", "venus"], aspect: "sextile" }, // WRONG ASPECT TYPE
        { bodies: ["jupiter", "sun"], aspect: "quintile" },
        { bodies: ["venus", "moon"], aspect: "quintile" },
      ];
      const previousAspectBodies: AspectBodies[] = [
        { bodies: ["sun", "mars"], aspect: "quintile" },
        { bodies: ["moon", "jupiter"], aspect: "quintile" },
        { bodies: ["mars", "venus"], aspect: "sextile" },
        { bodies: ["jupiter", "sun"], aspect: "quintile" },
        { bodies: ["venus", "moon"], aspect: "quintile" },
      ];

      const events = getQuintupleAspectEvents(
        currentAspectBodies,
        previousAspectBodies,
        currentMinute,
      );

      expect(events).toHaveLength(0);
    });
  });
});
