import fs from "node:fs";
import path from "node:path";

import _ from "lodash";
import moment from "moment-timezone";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { CalendarService } from "./calendar/calendar.service";

// Mock environment for testing
const TEST_OUTPUT_DIR = "./output/e2e-test";

const calendarService = new CalendarService();

describe("calendar generation e2e", { timeout: 10_000 }, () => {
  // E2E tests may need more time
  beforeAll(() => {
    // Ensure test output directory exists
    if (!fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      const files = fs.readdirSync(TEST_OUTPUT_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(TEST_OUTPUT_DIR, file));
      }
      fs.rmdirSync(TEST_OUTPUT_DIR);
    }
  });

  describe("ICS file generation", () => {
    it("should generate valid ICS file structure", () => {
      const getCalendar =
        calendarService.buildFileContent.bind(calendarService);

      const events = [
        {
          start: moment.utc("2025-03-20T09:06:00Z"),
          end: moment.utc("2025-03-20T09:06:00Z"),
          summary: "☀️ → ♈ Sun ingress Aries",
          description: "Vernal Equinox - Sun enters Aries",
          categories: ["Astronomy", "Astrology", "Ingress", "Sun", "Aries"],
        },
        {
          start: moment.utc("2025-03-29T10:58:00Z"),
          end: moment.utc("2025-03-29T10:58:00Z"),
          summary: "🌕 Full Moon",
          description: "Full Moon in Libra",
          categories: ["Astronomy", "Lunar Phase", "Moon"],
        },
      ];

      const calendar = getCalendar({
        events,
        name: "Test Caelundas Calendar",
        description: "E2E test calendar",
        timezone: "America/New_York",
      });

      // Write to test file
      const outputPath = path.join(TEST_OUTPUT_DIR, "test-calendar.ics");
      fs.writeFileSync(outputPath, calendar);

      // Verify file was created
      expect(fs.existsSync(outputPath)).toBe(true);

      // Read and validate content
      const content = fs.readFileSync(outputPath, "utf8");

      // Check required ICS components
      expect(content).toContain("BEGIN:VCALENDAR");
      expect(content).toContain("END:VCALENDAR");
      expect(content).toContain("VERSION:2.0");
      expect(content).toContain(
        "PRODID:-//Caelundas//Astronomical Calendar//EN",
      );
      expect(content).toContain("CALSCALE:GREGORIAN");
      expect(content).toContain("METHOD:PUBLISH");

      // Check calendar metadata
      expect(content).toContain("X-WR-CALNAME:Test Caelundas Calendar");
      expect(content).toContain("X-WR-CALDESC:E2E test calendar");
      expect(content).toContain("X-WR-TIMEZONE:America/New_York");

      // Check events
      expect(content).toContain("BEGIN:VEVENT");
      expect(content).toContain("END:VEVENT");
      expect(content).toContain("Sun ingress Aries");
      expect(content).toContain("Full Moon");

      // Verify event count
      const veventCount = (content.match(/BEGIN:VEVENT/g) ?? []).length;
      expect(veventCount).toBe(2);
    });

    it("should include timezone definitions", () => {
      const getCalendar =
        calendarService.buildFileContent.bind(calendarService);

      const events = [
        {
          start: moment.utc("2025-06-21T12:00:00Z"),
          end: moment.utc("2025-06-21T12:00:00Z"),
          summary: "Summer Solstice",
          description: "Summer Solstice",
          categories: ["Astronomy"],
        },
      ];

      const calendar = getCalendar({
        events,
        name: "Timezone Test",
        description: "E2E timezone test calendar",
        timezone: "America/New_York",
      });

      expect(calendar).toContain("BEGIN:VTIMEZONE");
      expect(calendar).toContain("TZID:America/New_York");
      expect(calendar).toContain("END:VTIMEZONE");
      expect(calendar).toContain("BEGIN:DAYLIGHT");
      expect(calendar).toContain("END:DAYLIGHT");
      expect(calendar).toContain("BEGIN:STANDARD");
      expect(calendar).toContain("END:STANDARD");
    });

    it("should handle events with all optional fields", () => {
      const getCalendar =
        calendarService.buildFileContent.bind(calendarService);

      const events = [
        {
          start: moment.utc("2025-04-08T18:00:00Z"),
          end: moment.utc("2025-04-08T20:00:00Z"),
          summary: "Total Solar Eclipse",
          description: "Total Solar Eclipse visible from North America",
          categories: ["Astronomy", "Eclipse", "Solar"],
          location: "Dallas, Texas, USA",
          geography: { latitude: 32.7767, longitude: -96.797 },
          url: "https://eclipse.nasa.gov",
          priority: 1,
          color: "red",
        },
      ];

      const calendar = getCalendar({
        events,
        name: "Eclipse Calendar",
        description: "E2E optional fields test calendar",
        timezone: "America/New_York",
      });

      expect(calendar).toContain("LOCATION:Dallas, Texas, USA");
      expect(calendar).toContain("GEO:32.7767;-96.797");
      expect(calendar).toContain("URL:https://eclipse.nasa.gov");
      expect(calendar).toContain("PRIORITY:1");
      expect(calendar).toContain("COLOR:red");
    });
  });

  describe("input validation e2e", () => {
    it("should validate and transform coordinates correctly", async () => {
      const { inputSchema } = await import("./input.schema");

      const result = inputSchema.parse({
        latitude: "40.7128",
        longitude: "-74.006",
        startDate: "2025-03-01",
        endDate: "2025-03-31",
      });

      expect(result.latitude).toBe(40.7128);
      expect(result.longitude).toBe(-74.006);
      expect(result.timezone).toBe("America/New_York");
      expect(result.start).toBeInstanceOf(Date);
      expect(result.end).toBeInstanceOf(Date);
    });

    it("should infer correct timezone for different locations", async () => {
      const { inputSchema } = await import("./input.schema");

      // Tokyo
      const tokyoResult = inputSchema.parse({
        latitude: "35.6762",
        longitude: "139.6503",
        startDate: "2025-01-01",
        endDate: "2025-01-02",
      });
      expect(tokyoResult.timezone).toBe("Asia/Tokyo");

      // London
      const londonResult = inputSchema.parse({
        latitude: "51.5074",
        longitude: "-0.1278",
        startDate: "2025-01-01",
        endDate: "2025-01-02",
      });
      expect(londonResult.timezone).toBe("Europe/London");

      // Sydney
      const sydneyResult = inputSchema.parse({
        latitude: "-33.8688",
        longitude: "151.2093",
        startDate: "2025-01-01",
        endDate: "2025-01-02",
      });
      expect(sydneyResult.timezone).toBe("Australia/Sydney");
    });
  });

  describe("event detection e2e", () => {
    it("should correctly identify zodiac signs from longitude", async () => {
      const { IngressesService } =
        await import("./events/ingresses/ingresses.service");

      // Test all 12 signs at their starting degrees
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

    it("should correctly identify aspects from angular separation", async () => {
      const { MajorAspectsService } =
        await import("./events/aspects/major/major-aspects.service");
      const { AspectsUtilitiesService } =
        await import("./events/aspects/aspects.utilities");
      const { EphemerisService } =
        await import("./ephemeris/ephemeris.service");
      const { MathService } = await import("./math/math.service");
      const mathService = new MathService();
      const service = new MajorAspectsService(
        new AspectsUtilitiesService(mathService),
        new EphemerisService(mathService),
      );

      // Test exact aspects
      expect(
        service.getMajorAspect({ longitudeBody1: 0, longitudeBody2: 0 }),
      ).toBe("conjunct");
      expect(
        service.getMajorAspect({ longitudeBody1: 0, longitudeBody2: 60 }),
      ).toBe("sextile");
      expect(
        service.getMajorAspect({ longitudeBody1: 0, longitudeBody2: 90 }),
      ).toBe("square");
      expect(
        service.getMajorAspect({ longitudeBody1: 0, longitudeBody2: 120 }),
      ).toBe("trine");
      expect(
        service.getMajorAspect({ longitudeBody1: 0, longitudeBody2: 180 }),
      ).toBe("opposite");

      // Test aspects with orb
      expect(
        service.getMajorAspect({ longitudeBody1: 0, longitudeBody2: 5 }),
      ).toBe("conjunct"); // 5° orb
      expect(
        service.getMajorAspect({ longitudeBody1: 0, longitudeBody2: 175 }),
      ).toBe("opposite"); // 5° orb
    });

    it("should calculate progressive event pairs correctly", async () => {
      const { ProgressiveEventsService } =
        await import("./progressive-events/progressive-events.service");

      const beginnings = [
        {
          start: moment.utc("2025-03-01T10:00:00Z"),
          end: moment.utc("2025-03-01T10:00:00Z"),
          summary: "Forming 1",
          description: "First forming",
          categories: ["Test"],
        },
        {
          start: moment.utc("2025-03-05T10:00:00Z"),
          end: moment.utc("2025-03-05T10:00:00Z"),
          summary: "Forming 2",
          description: "Second forming",
          categories: ["Test"],
        },
      ];

      const endings = [
        {
          start: moment.utc("2025-03-03T10:00:00Z"),
          end: moment.utc("2025-03-03T10:00:00Z"),
          summary: "Dissolving 1",
          description: "First dissolving",
          categories: ["Test"],
        },
        {
          start: moment.utc("2025-03-07T10:00:00Z"),
          end: moment.utc("2025-03-07T10:00:00Z"),
          summary: "Dissolving 2",
          description: "Second dissolving",
          categories: ["Test"],
        },
      ];

      const pairs = ProgressiveEventsService.pairProgressiveEvents(
        beginnings,
        endings,
        "test",
      );

      expect(pairs.length).toBe(2);
      expect(pairs[0]?.[0]?.start.toISOString()).toBe(
        "2025-03-01T10:00:00.000Z",
      );
      expect(pairs[0]?.[1]?.start.toISOString()).toBe(
        "2025-03-03T10:00:00.000Z",
      );
      expect(pairs[1]?.[0]?.start.toISOString()).toBe(
        "2025-03-05T10:00:00.000Z",
      );
      expect(pairs[1]?.[1]?.start.toISOString()).toBe(
        "2025-03-07T10:00:00.000Z",
      );
    });
  });

  describe("math utilities e2e", () => {
    it("should normalize degrees correctly across edge cases", async () => {
      const { MathService } = await import("./math/math.service");
      const mathService = new MathService();
      const normalizeDegrees = (d: number): number =>
        mathService.normalizeDegrees(d);
      const getAngle = (a: number, b: number): number =>
        mathService.getAngle(a, b);

      // Edge case: wrapping at 360
      expect(normalizeDegrees(360)).toBe(0);
      expect(normalizeDegrees(720)).toBe(0);

      // Edge case: negative degrees
      expect(normalizeDegrees(-1)).toBe(359);
      expect(normalizeDegrees(-360)).toBe(0);

      // Angle calculation across 0/360 boundary
      expect(getAngle(350, 10)).toBe(20); // Shortest path is 20°
      expect(getAngle(10, 350)).toBe(20);
    });

    it("should generate correct combinations", async () => {
      const { MathService } = await import("./math/math.service");
      const mathService = new MathService();
      const getCombinations = <T>(arr: T[], k: number): T[][] =>
        mathService.getCombinations(arr, k);

      const planets = ["sun", "moon", "mercury", "venus", "mars"];

      // Get all pairs
      const pairs = getCombinations(planets, 2);
      expect(pairs.length).toBe(10); // C(5,2) = 10

      // Get all triplets
      const triplets = getCombinations(planets, 3);
      expect(triplets.length).toBe(10); // C(5,3) = 10

      // Verify no duplicates in pairs
      const pairStrings = pairs.map((p) => _.sortBy(p).join("-"));
      const uniquePairs = new Set(pairStrings);
      expect(uniquePairs.size).toBe(10);
    });
  });
});
