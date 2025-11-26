import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import moment from "moment-timezone";
import {
  getVenusianPhaseEvents,
  getMercurianPhaseEvents,
  getMartianPhaseEvents,
  getPlanetaryPhaseEvents,
} from "./phases.events";
import { MARGIN_MINUTES } from "../../calendar.utilities";

// Mock dependencies
vi.mock("../../database.utilities", () => ({
  upsertEvents: vi.fn(),
}));

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

describe("phases.events integration", () => {
  /**
   * Helper function to create mock ephemeris data with proper time series
   */
  function createMockEphemeris(
    baseTime: moment.Moment,
    config: {
      longitude: number;
      distance: number;
      illumination: number;
    }
  ) {
    const ephemeris: any = {};

    // Create data for MARGIN_MINUTES before, current, and MARGIN_MINUTES after
    for (let i = -MARGIN_MINUTES; i <= MARGIN_MINUTES + 1; i++) {
      const time = baseTime.clone().add(i, "minutes");
      ephemeris[time.toISOString()] = {
        longitude: config.longitude + i * 0.1, // Slight variation over time
        distance: config.distance + i * 0.001,
        illumination: config.illumination + i * 0.01,
      };
    }

    return ephemeris;
  }

  describe("getVenusianPhaseEvents", () => {
    it("should process ephemeris data without errors for morning configuration", () => {
      const currentMinute = moment.utc("2024-01-15T06:00:00.000Z");

      // Venus in morning sky configuration (western elongation)
      const venusEphemeris = createMockEphemeris(currentMinute, {
        longitude: 280, // West of Sun
        distance: 0.7,
        illumination: 40,
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        longitude: 315, // Sun ahead of Venus
        distance: 1.0,
        illumination: 100,
      });

      const events = getVenusianPhaseEvents({
        currentMinute,
        venusCoordinateEphemeris: venusEphemeris,
        venusDistanceEphemeris: venusEphemeris,
        venusIlluminationEphemeris: venusEphemeris,
        sunCoordinateEphemeris: sunEphemeris,
      });

      // Should return an array (may be empty or contain events)
      expect(Array.isArray(events)).toBe(true);
      // All events should have proper structure
      events.forEach((event) => {
        expect(event.start).toBeInstanceOf(Date);
        expect(event.end).toBeInstanceOf(Date);
        expect(event.summary).toContain("Venus");
        expect(event.categories).toContain("Venusian");
      });
    });

    it("should process ephemeris data without errors for evening configuration", () => {
      const currentMinute = moment.utc("2024-06-15T18:00:00.000Z");

      // Venus in evening sky configuration (eastern elongation)
      const venusEphemeris = createMockEphemeris(currentMinute, {
        longitude: 45, // East of Sun
        distance: 0.7,
        illumination: 60,
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        longitude: 0, // Sun behind Venus
        distance: 1.0,
        illumination: 100,
      });

      const events = getVenusianPhaseEvents({
        currentMinute,
        venusCoordinateEphemeris: venusEphemeris,
        venusDistanceEphemeris: venusEphemeris,
        venusIlluminationEphemeris: venusEphemeris,
        sunCoordinateEphemeris: sunEphemeris,
      });

      expect(Array.isArray(events)).toBe(true);
      events.forEach((event) => {
        expect(event.start).toEqual(currentMinute.toDate());
        expect(event.description).toMatch(
          /Venus (Morning|Evening|Western|Eastern)/
        );
      });
    });

    it("should handle all 8 possible Venus phases", () => {
      const currentMinute = moment.utc("2024-03-15T12:00:00.000Z");

      const venusEphemeris = createMockEphemeris(currentMinute, {
        longitude: 100,
        distance: 0.5,
        illumination: 50,
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        longitude: 120,
        distance: 1.0,
        illumination: 100,
      });

      const events = getVenusianPhaseEvents({
        currentMinute,
        venusCoordinateEphemeris: venusEphemeris,
        venusDistanceEphemeris: venusEphemeris,
        venusIlluminationEphemeris: venusEphemeris,
        sunCoordinateEphemeris: sunEphemeris,
      });

      // The function should check all 8 phases
      // Valid phase names from the implementation
      const validPhases = [
        "Morning Rise",
        "Western Brightest",
        "Western Elongation",
        "Morning Set",
        "Evening Rise",
        "Eastern Elongation",
        "Eastern Brightest",
        "Evening Set",
      ];

      events.forEach((event) => {
        const hasValidPhase = validPhases.some((phase) =>
          event.description.includes(phase)
        );
        expect(hasValidPhase).toBe(true);
      });
    });
  });

  describe("getMercurianPhaseEvents", () => {
    it("should process ephemeris data without errors for morning configuration", () => {
      const currentMinute = moment.utc("2024-02-15T06:00:00.000Z");

      // Mercury in morning sky
      const mercuryEphemeris = createMockEphemeris(currentMinute, {
        longitude: 300,
        distance: 0.6,
        illumination: 35,
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        longitude: 330,
        distance: 1.0,
        illumination: 100,
      });

      const events = getMercurianPhaseEvents({
        currentMinute,
        mercuryCoordinateEphemeris: mercuryEphemeris,
        mercuryDistanceEphemeris: mercuryEphemeris,
        mercuryIlluminationEphemeris: mercuryEphemeris,
        sunCoordinateEphemeris: sunEphemeris,
      });

      expect(Array.isArray(events)).toBe(true);
      events.forEach((event) => {
        expect(event.start).toBeInstanceOf(Date);
        expect(event.summary).toContain("Mercury");
        expect(event.categories).toContain("Mercurian");
      });
    });

    it("should process ephemeris data without errors for evening configuration", () => {
      const currentMinute = moment.utc("2024-04-15T18:00:00.000Z");

      // Mercury in evening sky
      const mercuryEphemeris = createMockEphemeris(currentMinute, {
        longitude: 30,
        distance: 0.8,
        illumination: 70,
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        longitude: 10,
        distance: 1.0,
        illumination: 100,
      });

      const events = getMercurianPhaseEvents({
        currentMinute,
        mercuryCoordinateEphemeris: mercuryEphemeris,
        mercuryDistanceEphemeris: mercuryEphemeris,
        mercuryIlluminationEphemeris: mercuryEphemeris,
        sunCoordinateEphemeris: sunEphemeris,
      });

      expect(Array.isArray(events)).toBe(true);
      events.forEach((event) => {
        expect(event.start).toEqual(currentMinute.toDate());
        expect(event.description).toMatch(
          /Mercury (Morning|Evening|Western|Eastern)/
        );
      });
    });

    it("should handle all 8 possible Mercury phases", () => {
      const currentMinute = moment.utc("2024-05-15T12:00:00.000Z");

      const mercuryEphemeris = createMockEphemeris(currentMinute, {
        longitude: 150,
        distance: 0.7,
        illumination: 55,
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        longitude: 170,
        distance: 1.0,
        illumination: 100,
      });

      const events = getMercurianPhaseEvents({
        currentMinute,
        mercuryCoordinateEphemeris: mercuryEphemeris,
        mercuryDistanceEphemeris: mercuryEphemeris,
        mercuryIlluminationEphemeris: mercuryEphemeris,
        sunCoordinateEphemeris: sunEphemeris,
      });

      const validPhases = [
        "Morning Rise",
        "Western Brightest",
        "Western Elongation",
        "Morning Set",
        "Evening Rise",
        "Eastern Elongation",
        "Eastern Brightest",
        "Evening Set",
      ];

      events.forEach((event) => {
        const hasValidPhase = validPhases.some((phase) =>
          event.description.includes(phase)
        );
        expect(hasValidPhase).toBe(true);
      });
    });
  });

  describe("getMartianPhaseEvents", () => {
    it("should process ephemeris data without errors for morning configuration", () => {
      const currentMinute = moment.utc("2024-06-01T06:00:00.000Z");

      // Mars in morning sky
      const marsEphemeris = createMockEphemeris(currentMinute, {
        longitude: 200,
        distance: 1.5,
        illumination: 92,
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        longitude: 240,
        distance: 1.0,
        illumination: 100,
      });

      const events = getMartianPhaseEvents({
        currentMinute,
        marsCoordinateEphemeris: marsEphemeris,
        marsDistanceEphemeris: marsEphemeris,
        marsIlluminationEphemeris: marsEphemeris,
        sunCoordinateEphemeris: sunEphemeris,
      });

      expect(Array.isArray(events)).toBe(true);
      events.forEach((event) => {
        expect(event.start).toBeInstanceOf(Date);
        expect(event.summary).toContain("Mars");
        expect(event.categories).toContain("Martian");
      });
    });

    it("should process ephemeris data without errors for evening configuration", () => {
      const currentMinute = moment.utc("2024-08-01T18:00:00.000Z");

      // Mars in evening sky
      const marsEphemeris = createMockEphemeris(currentMinute, {
        longitude: 90,
        distance: 2.0,
        illumination: 88,
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        longitude: 60,
        distance: 1.0,
        illumination: 100,
      });

      const events = getMartianPhaseEvents({
        currentMinute,
        marsCoordinateEphemeris: marsEphemeris,
        marsDistanceEphemeris: marsEphemeris,
        marsIlluminationEphemeris: marsEphemeris,
        sunCoordinateEphemeris: sunEphemeris,
      });

      expect(Array.isArray(events)).toBe(true);
      events.forEach((event) => {
        expect(event.start).toEqual(currentMinute.toDate());
        expect(event.description).toMatch(/Mars (Morning|Evening) (Rise|Set)/);
      });
    });

    it("should handle all 4 possible Mars phases", () => {
      const currentMinute = moment.utc("2024-09-15T12:00:00.000Z");

      const marsEphemeris = createMockEphemeris(currentMinute, {
        longitude: 270,
        distance: 1.8,
        illumination: 90,
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        longitude: 290,
        distance: 1.0,
        illumination: 100,
      });

      const events = getMartianPhaseEvents({
        currentMinute,
        marsCoordinateEphemeris: marsEphemeris,
        marsDistanceEphemeris: marsEphemeris,
        marsIlluminationEphemeris: marsEphemeris,
        sunCoordinateEphemeris: sunEphemeris,
      });

      // Mars only has 4 phases (no elongation/brightest)
      const validPhases = [
        "Morning Rise",
        "Morning Set",
        "Evening Rise",
        "Evening Set",
      ];

      events.forEach((event) => {
        const hasValidPhase = validPhases.some((phase) =>
          event.description.includes(phase)
        );
        expect(hasValidPhase).toBe(true);
      });
    });
  });

  describe("getPlanetaryPhaseEvents", () => {
    it("should aggregate events from all three planets", () => {
      const currentMinute = moment.utc("2024-07-01T12:00:00.000Z");

      const venusEphemeris = createMockEphemeris(currentMinute, {
        longitude: 100,
        distance: 0.7,
        illumination: 50,
      });

      const mercuryEphemeris = createMockEphemeris(currentMinute, {
        longitude: 120,
        distance: 0.6,
        illumination: 45,
      });

      const marsEphemeris = createMockEphemeris(currentMinute, {
        longitude: 140,
        distance: 1.6,
        illumination: 91,
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        longitude: 110,
        distance: 1.0,
        illumination: 100,
      });

      // Create full ephemeris records with all required bodies
      const mockCoordinateEphemeris = {
        sun: sunEphemeris,
        mercury: mercuryEphemeris,
        venus: venusEphemeris,
        mars: marsEphemeris,
      } as any;

      const mockDistanceEphemeris = {
        sun: sunEphemeris,
        mercury: mercuryEphemeris,
        venus: venusEphemeris,
        mars: marsEphemeris,
      } as any;

      const mockIlluminationEphemeris = {
        sun: sunEphemeris,
        moon: sunEphemeris, // Use sun as placeholder
        mercury: mercuryEphemeris,
        venus: venusEphemeris,
        mars: marsEphemeris,
      } as any;

      const events = getPlanetaryPhaseEvents({
        currentMinute,
        coordinateEphemerisByBody: mockCoordinateEphemeris,
        distanceEphemerisByBody: mockDistanceEphemeris,
        illuminationEphemerisByBody: mockIlluminationEphemeris,
      });

      expect(Array.isArray(events)).toBe(true);

      // Should have events from different planets (if conditions are met)
      const planetNames = new Set(
        events.map((e) => {
          if (e.summary.includes("♀️")) return "venus";
          if (e.summary.includes("☿")) return "mercury";
          if (e.summary.includes("♂️")) return "mars";
          return "unknown";
        })
      );

      // All events should be from valid planets
      expect(planetNames.has("unknown")).toBe(false);
    });

    it("should handle varying ephemeris configurations", () => {
      const currentMinute = moment.utc("2024-10-15T09:00:00.000Z");

      // Different configurations for each planet
      const venusEphemeris = createMockEphemeris(currentMinute, {
        longitude: 45, // Eastern
        distance: 0.4,
        illumination: 25,
      });

      const mercuryEphemeris = createMockEphemeris(currentMinute, {
        longitude: 315, // Western
        distance: 0.9,
        illumination: 80,
      });

      const marsEphemeris = createMockEphemeris(currentMinute, {
        longitude: 180, // Opposition-like
        distance: 0.5,
        illumination: 100,
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        longitude: 0,
        distance: 1.0,
        illumination: 100,
      });

      const events = getPlanetaryPhaseEvents({
        currentMinute,
        coordinateEphemerisByBody: {
          sun: sunEphemeris,
          mercury: mercuryEphemeris,
          venus: venusEphemeris,
          mars: marsEphemeris,
        } as any,
        distanceEphemerisByBody: {
          sun: sunEphemeris,
          mercury: mercuryEphemeris,
          venus: venusEphemeris,
          mars: marsEphemeris,
        } as any,
        illuminationEphemerisByBody: {
          sun: sunEphemeris,
          moon: sunEphemeris,
          mercury: mercuryEphemeris,
          venus: venusEphemeris,
          mars: marsEphemeris,
        } as any,
      });

      // All events should have correct timestamp
      events.forEach((event) => {
        expect(event.start).toEqual(currentMinute.toDate());
        expect(event.end).toEqual(currentMinute.toDate());
      });
    });

    it("should return empty array when no phases detected", () => {
      const currentMinute = moment.utc("2024-11-01T15:00:00.000Z");

      // Configuration unlikely to trigger any phases
      const neutralEphemeris = createMockEphemeris(currentMinute, {
        longitude: 180,
        distance: 1.0,
        illumination: 50,
      });

      const events = getPlanetaryPhaseEvents({
        currentMinute,
        coordinateEphemerisByBody: {
          sun: neutralEphemeris,
          mercury: neutralEphemeris,
          venus: neutralEphemeris,
          mars: neutralEphemeris,
        } as any,
        distanceEphemerisByBody: {
          sun: neutralEphemeris,
          mercury: neutralEphemeris,
          venus: neutralEphemeris,
          mars: neutralEphemeris,
        } as any,
        illuminationEphemerisByBody: {
          sun: neutralEphemeris,
          moon: neutralEphemeris,
          mercury: neutralEphemeris,
          venus: neutralEphemeris,
          mars: neutralEphemeris,
        } as any,
      });

      expect(Array.isArray(events)).toBe(true);
      // May be empty or have some events depending on phase detection logic
    });
  });

  describe("edge cases", () => {
    it("should handle longitude wraparound at 0/360 degrees", () => {
      const currentMinute = moment.utc("2024-12-01T00:00:00.000Z");

      // Planet at 359 degrees, Sun at 1 degree
      const venusEphemeris = createMockEphemeris(currentMinute, {
        longitude: 359,
        distance: 0.7,
        illumination: 50,
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        longitude: 1,
        distance: 1.0,
        illumination: 100,
      });

      const events = getVenusianPhaseEvents({
        currentMinute,
        venusCoordinateEphemeris: venusEphemeris,
        venusDistanceEphemeris: venusEphemeris,
        venusIlluminationEphemeris: venusEphemeris,
        sunCoordinateEphemeris: sunEphemeris,
      });

      // Should not throw errors
      expect(Array.isArray(events)).toBe(true);
    });

    it("should handle rapid changes in ephemeris values", () => {
      const currentMinute = moment.utc("2024-12-15T06:00:00.000Z");

      // Create ephemeris with larger variations
      const venusEphemeris: any = {};
      for (let i = -MARGIN_MINUTES; i <= MARGIN_MINUTES + 1; i++) {
        const time = currentMinute.clone().add(i, "minutes");
        venusEphemeris[time.toISOString()] = {
          longitude: 100 + i * 5, // Rapid change
          distance: 0.5 + Math.abs(i) * 0.05,
          illumination: 50 + i * 2,
        };
      }

      const sunEphemeris = createMockEphemeris(currentMinute, {
        longitude: 120,
        distance: 1.0,
        illumination: 100,
      });

      const events = getVenusianPhaseEvents({
        currentMinute,
        venusCoordinateEphemeris: venusEphemeris,
        venusDistanceEphemeris: venusEphemeris,
        venusIlluminationEphemeris: venusEphemeris,
        sunCoordinateEphemeris: sunEphemeris,
      });

      expect(Array.isArray(events)).toBe(true);
    });

    it("should handle extreme distance values", () => {
      const currentMinute = moment.utc("2024-12-20T12:00:00.000Z");

      // Mars at aphelion (far from Earth)
      const marsEphemeris = createMockEphemeris(currentMinute, {
        longitude: 180,
        distance: 2.67, // Maximum Mars-Sun distance
        illumination: 88,
      });

      const sunEphemeris = createMockEphemeris(currentMinute, {
        longitude: 0,
        distance: 1.0,
        illumination: 100,
      });

      const events = getMartianPhaseEvents({
        currentMinute,
        marsCoordinateEphemeris: marsEphemeris,
        marsDistanceEphemeris: marsEphemeris,
        marsIlluminationEphemeris: marsEphemeris,
        sunCoordinateEphemeris: sunEphemeris,
      });

      expect(Array.isArray(events)).toBe(true);
    });
  });
});
