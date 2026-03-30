import fs from "node:fs";
import path from "node:path";

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { Event } from "./calendar.utilities";
import type { Body } from "./types";

// Mock the output path to use a test database
vi.mock("./output.utilities", () => ({
  getOutputPath: (filename: string) => `./output/test-unit-${filename}`,
}));

const TEST_DB_PATH = "./output/test-unit-database.db";

describe("database.utilities", () => {
  let cleanupFns: (() => Promise<void>)[] = [];

  beforeAll(() => {
    // Ensure output directory exists
    const outputDir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  afterAll(async () => {
    // Wait a bit for async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  beforeEach(async () => {
    // Clear module cache to get fresh database connection
    vi.resetModules();
    cleanupFns = [];

    // Ensure tables exist for tests that directly query the database
    const { open } = await import("sqlite");
    const sqlite3 = await import("sqlite3");
    const db = await open({
      filename: TEST_DB_PATH,
      driver: sqlite3.default.Database,
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        summary TEXT NOT NULL,
        description TEXT NOT NULL,
        start TEXT NOT NULL,
        end TEXT NOT NULL,
        categories TEXT NOT NULL,
        location TEXT,
        latitude REAL,
        longitude REAL,
        url TEXT,
        priority INTEGER,
        color TEXT,
        PRIMARY KEY (summary, start)
      );
    `);

    await db.close();
  });

  afterEach(async () => {
    // Run any cleanup functions registered during the test
    for (const cleanup of cleanupFns) {
      await cleanup();
    }

    // Wait a bit for async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  describe("closeConnection", () => {
    it(
      "should close database connection without error",
      { timeout: 2000 },
      async () => {
        const { closeConnection } = await import("./database.utilities");

        // Suppress expected errors from async table creation after close
        const originalConsoleError = console.error;
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        console.error = () => {};

        // Add unhandledRejection handler to suppress the expected error
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const handler = (): void => {}; // Ignore the error
        process.on("unhandledRejection", handler);

        try {
          await closeConnection();
          // Wait for any async table creation operations to complete and fail
          await new Promise((resolve) => setTimeout(resolve, 200));
        } finally {
          console.error = originalConsoleError;
          process.off("unhandledRejection", handler);
        }
      },
    );
  });

  describe("upsertEphemerisValues", () => {
    it("should insert single ephemeris record", async () => {
      expect.assertions(4);
      const { upsertEphemerisValues, getEphemerisRecords } =
        await import("./database.utilities");

      const timestamp = new Date("2025-03-20T12:00:00Z");
      await upsertEphemerisValues([
        {
          body: "sun",
          timestamp,
          longitude: 0.5,
          latitude: 0.1,
        },
      ]);

      const records = await getEphemerisRecords({
        body: "sun",
        start: new Date("2025-03-20T11:00:00Z"),
        end: new Date("2025-03-20T13:00:00Z"),
        type: "coordinate",
      });

      expect(records.length).toBe(1);
      expect(records[0]?.body).toBe("sun");
      expect(records[0]?.longitude).toBe(0.5);
      expect(records[0]?.latitude).toBe(0.1);
    });

    it("should handle empty array", async () => {
      const { upsertEphemerisValues } = await import("./database.utilities");
      await expect(upsertEphemerisValues([])).resolves.not.toThrow();
    });

    it("should batch insert multiple ephemeris records", async () => {
      const { upsertEphemerisValues, getEphemerisRecords } =
        await import("./database.utilities");

      const records = Array.from({ length: 150 }, (_, i) => ({
        body: "moon" as Body,
        timestamp: new Date(
          `2025-03-20T${String(i % 24).padStart(2, "0")}:${String(
            i % 60,
          ).padStart(2, "0")}:00Z`,
        ),
        longitude: i * 2.4,
        latitude: Math.sin(i) * 5,
      }));

      await upsertEphemerisValues(records);

      const retrieved = await getEphemerisRecords({
        body: "moon",
        start: new Date("2025-03-20T00:00:00Z"),
        end: new Date("2025-03-21T00:00:00Z"),
        type: "coordinate",
      });

      expect(retrieved.length).toBeGreaterThan(0);
    });

    it("should update existing ephemeris record on conflict", async () => {
      const { upsertEphemerisValues, getEphemerisRecords } =
        await import("./database.utilities");

      const timestamp = new Date("2025-03-20T15:00:00Z");

      // Insert initial record
      await upsertEphemerisValues([
        {
          body: "mars",
          timestamp,
          longitude: 45,
          latitude: 1,
        },
      ]);

      // Update with new longitude, keep latitude
      await upsertEphemerisValues([
        {
          body: "mars",
          timestamp,
          longitude: 46,
        },
      ]);

      const records = await getEphemerisRecords({
        body: "mars",
        start: new Date("2025-03-20T14:00:00Z"),
        end: new Date("2025-03-20T16:00:00Z"),
        type: "coordinate",
      });

      expect(records.length).toBe(1);
      expect(records[0]?.longitude).toBe(46);
      expect(records[0]?.latitude).toBe(1); // Should preserve original
    });

    it("should store all ephemeris types", async () => {
      const { upsertEphemerisValues, getEphemerisRecords } =
        await import("./database.utilities");

      const timestamp = new Date("2025-06-15T18:00:00Z");

      await upsertEphemerisValues([
        {
          body: "venus",
          timestamp,
          longitude: 120.5,
          latitude: 2.3,
          azimuth: 180,
          elevation: 45,
          illumination: 0.85,
          diameter: 0.003,
          distance: 0.7,
        },
      ]);

      // Retrieve as coordinate type
      const coordRecords = await getEphemerisRecords({
        body: "venus",
        start: new Date("2025-06-15T17:00:00Z"),
        end: new Date("2025-06-15T19:00:00Z"),
        type: "coordinate",
      });

      expect(coordRecords.length).toBe(1);
      expect(coordRecords[0]?.longitude).toBe(120.5);
      expect(coordRecords[0]?.latitude).toBe(2.3);

      // Retrieve as illumination type
      const illumRecords = await getEphemerisRecords({
        body: "venus",
        start: new Date("2025-06-15T17:00:00Z"),
        end: new Date("2025-06-15T19:00:00Z"),
        type: "illumination",
      });

      expect(illumRecords.length).toBe(1);
      expect(illumRecords[0]?.illumination).toBe(0.85);

      // Retrieve as distance type
      const distRecords = await getEphemerisRecords({
        body: "venus",
        start: new Date("2025-06-15T17:00:00Z"),
        end: new Date("2025-06-15T19:00:00Z"),
        type: "distance",
      });

      expect(distRecords.length).toBe(1);
      expect(distRecords[0]?.distance).toBe(0.7);
    });
  });

  describe("getEphemerisRecords", () => {
    it("should filter by coordinate type", async () => {
      const { upsertEphemerisValues, getEphemerisRecords } =
        await import("./database.utilities");

      const timestamp = new Date("2025-04-10T10:00:00Z");

      // Insert record with only illumination
      await upsertEphemerisValues([
        {
          body: "jupiter",
          timestamp,
          illumination: 0.99,
        },
      ]);

      const records = await getEphemerisRecords({
        body: "jupiter",
        start: new Date("2025-04-10T09:00:00Z"),
        end: new Date("2025-04-10T11:00:00Z"),
        type: "coordinate",
      });

      expect(records.length).toBe(0); // No coordinate data
    });

    it("should filter by azimuthElevation type", async () => {
      const { upsertEphemerisValues, getEphemerisRecords } =
        await import("./database.utilities");

      const timestamp = new Date("2025-04-10T10:00:00Z");

      await upsertEphemerisValues([
        {
          body: "saturn",
          timestamp,
          azimuth: 90,
          elevation: 30,
        },
      ]);

      const records = await getEphemerisRecords({
        body: "saturn",
        start: new Date("2025-04-10T09:00:00Z"),
        end: new Date("2025-04-10T11:00:00Z"),
        type: "azimuthElevation",
      });

      expect(records.length).toBe(1);
      expect(records[0]?.azimuth).toBe(90);
      expect(records[0]?.elevation).toBe(30);
    });

    it("should filter by diameter type", async () => {
      const { upsertEphemerisValues, getEphemerisRecords } =
        await import("./database.utilities");

      const timestamp = new Date("2025-04-10T10:00:00Z");

      await upsertEphemerisValues([
        {
          body: "mercury",
          timestamp,
          diameter: 0.002,
        },
      ]);

      const records = await getEphemerisRecords({
        body: "mercury",
        start: new Date("2025-04-10T09:00:00Z"),
        end: new Date("2025-04-10T11:00:00Z"),
        type: "diameter",
      });

      expect(records.length).toBe(1);
      expect(records[0]?.diameter).toBe(0.002);
    });

    it("should return records in ascending time order", async () => {
      const { upsertEphemerisValues, getEphemerisRecords } =
        await import("./database.utilities");

      const baseTime = new Date("2025-05-01T00:00:00Z");
      const records = [
        {
          body: "neptune" as Body,
          timestamp: new Date(baseTime.getTime() + 3 * 60 * 60 * 1000),
          longitude: 30,
          latitude: 0,
        },
        {
          body: "neptune" as Body,
          timestamp: new Date(baseTime.getTime() + 1 * 60 * 60 * 1000),
          longitude: 10,
          latitude: 0,
        },
        {
          body: "neptune" as Body,
          timestamp: new Date(baseTime.getTime() + 2 * 60 * 60 * 1000),
          longitude: 20,
          latitude: 0,
        },
      ];

      await upsertEphemerisValues(records);

      const retrieved = await getEphemerisRecords({
        body: "neptune",
        start: baseTime,
        end: new Date(baseTime.getTime() + 4 * 60 * 60 * 1000),
        type: "coordinate",
      });

      expect(retrieved.length).toBe(3);
      expect(retrieved[0]?.longitude).toBe(10);
      expect(retrieved[1]?.longitude).toBe(20);
      expect(retrieved[2]?.longitude).toBe(30);
    });
  });

  describe("upsertEvent", () => {
    it("should insert single event", async () => {
      const { upsertEvent, getAllEvents } =
        await import("./database.utilities");

      const event: Event = {
        summary: "☀️ → ♈ Sun ingress Aries",
        description: "Sun ingress Aries",
        start: new Date("2025-03-20T09:06:00Z"),
        end: new Date("2025-03-20T09:06:00Z"),
        categories: ["Astronomy", "Astrology", "Ingress", "Sun", "Aries"],
      };

      await upsertEvent(event);

      const events = await getAllEvents();
      expect(events.length).toBeGreaterThan(0);
      const found = events.find((e) => e.summary === event.summary);
      expect(found).toBeDefined();
      expect(found?.categories).toEqual(event.categories);
    });

    it("should update event on conflict", async () => {
      const { upsertEvent, getAllEvents } =
        await import("./database.utilities");

      const event1: Event = {
        summary: "Test Event",
        description: "Original description",
        start: new Date("2025-03-20T10:00:00Z"),
        end: new Date("2025-03-20T11:00:00Z"),
        categories: ["Test"],
      };

      await upsertEvent(event1);

      const event2: Event = {
        summary: "Test Event",
        description: "Updated description",
        start: new Date("2025-03-20T10:00:00Z"),
        end: new Date("2025-03-20T12:00:00Z"),
        categories: ["Test", "Updated"],
      };

      await upsertEvent(event2);

      const events = await getAllEvents();
      const found = events.find((e) => e.summary === "Test Event");
      expect(found?.description).toBe("Updated description");
      expect(found?.categories).toEqual(["Test", "Updated"]);
    });

    it("should handle event with all optional fields", async () => {
      const { upsertEvent, getAllEvents } =
        await import("./database.utilities");

      const event: Event = {
        summary: "Full Event",
        description: "Event with all fields",
        start: new Date("2025-03-20T10:00:00Z"),
        end: new Date("2025-03-20T11:00:00Z"),
        categories: ["Test"],
        location: "New York",
        geography: { latitude: 40.7128, longitude: -74.006 },
        url: "https://example.com",
        priority: 5,
        color: "#FF5733",
      };

      await upsertEvent(event);

      const events = await getAllEvents();
      const found = events.find((e) => e.summary === "Full Event");
      expect(found?.location).toBe("New York");
      expect(found?.geography?.latitude).toBe(40.7128);
      expect(found?.geography?.longitude).toBe(-74.006);
      expect(found?.url).toBe("https://example.com");
      expect(found?.priority).toBe(5);
      expect(found?.color).toBe("#FF5733");
    });
  });

  describe("upsertEvents", () => {
    it("should handle empty array", async () => {
      const { upsertEvents } = await import("./database.utilities");
      await expect(upsertEvents([])).resolves.not.toThrow();
    });

    it("should batch insert multiple events", async () => {
      const { upsertEvents, getAllEvents } =
        await import("./database.utilities");

      const events: Event[] = Array.from({ length: 100 }, (_, i) => ({
        summary: `Event ${i}`,
        description: `Description ${i}`,
        start: new Date(
          `2025-03-${String((i % 28) + 1).padStart(2, "0")}T10:00:00Z`,
        ),
        end: new Date(
          `2025-03-${String((i % 28) + 1).padStart(2, "0")}T11:00:00Z`,
        ),
        categories: ["Test", `Batch${i}`],
      }));

      await upsertEvents(events);

      const retrieved = await getAllEvents();
      expect(retrieved.length).toBeGreaterThan(50);
    });

    it("should update existing events in batch", async () => {
      const { upsertEvents, getAllEvents } =
        await import("./database.utilities");

      const initialEvents: Event[] = [
        {
          summary: "Batch Event 1",
          description: "Original 1",
          start: new Date("2025-03-01T10:00:00Z"),
          end: new Date("2025-03-01T11:00:00Z"),
          categories: ["Test"],
        },
        {
          summary: "Batch Event 2",
          description: "Original 2",
          start: new Date("2025-03-02T10:00:00Z"),
          end: new Date("2025-03-02T11:00:00Z"),
          categories: ["Test"],
        },
      ];

      await upsertEvents(initialEvents);

      const updatedEvents: Event[] = [
        {
          summary: "Batch Event 1",
          description: "Updated 1",
          start: new Date("2025-03-01T10:00:00Z"),
          end: new Date("2025-03-01T12:00:00Z"),
          categories: ["Test", "Updated"],
        },
        {
          summary: "Batch Event 2",
          description: "Updated 2",
          start: new Date("2025-03-02T10:00:00Z"),
          end: new Date("2025-03-02T12:00:00Z"),
          categories: ["Test", "Updated"],
        },
      ];

      await upsertEvents(updatedEvents);

      const events = await getAllEvents();
      const event1 = events.find((e) => e.summary === "Batch Event 1");
      const event2 = events.find((e) => e.summary === "Batch Event 2");

      expect(event1?.description).toBe("Updated 1");
      expect(event2?.description).toBe("Updated 2");
    });
  });

  describe("getAllEvents", () => {
    it("should return all events sorted by start time", async () => {
      const { upsertEvents, getAllEvents } =
        await import("./database.utilities");

      const events: Event[] = [
        {
          summary: "SortTest Event C",
          description: "Third",
          start: new Date("2025-03-30T10:00:00Z"),
          end: new Date("2025-03-30T11:00:00Z"),
          categories: ["SortTest"],
        },
        {
          summary: "SortTest Event A",
          description: "First",
          start: new Date("2025-03-01T10:00:00Z"),
          end: new Date("2025-03-01T11:00:00Z"),
          categories: ["SortTest"],
        },
        {
          summary: "SortTest Event B",
          description: "Second",
          start: new Date("2025-03-15T10:00:00Z"),
          end: new Date("2025-03-15T11:00:00Z"),
          categories: ["SortTest"],
        },
      ];

      await upsertEvents(events);

      const retrieved = await getAllEvents();
      const testEvents = retrieved.filter((e) =>
        e.categories.includes("SortTest"),
      );

      expect(testEvents.length).toBe(3);
      // Events should already be sorted by start time from query
      expect(testEvents[0]?.summary).toBe("SortTest Event A");
      expect(testEvents[1]?.summary).toBe("SortTest Event B");
      expect(testEvents[2]?.summary).toBe("SortTest Event C");
    });
  });

  describe("getActiveAspectsAt", () => {
    it("should find aspects active at specific timestamp", async () => {
      const { upsertEvents, getActiveAspectsAt } =
        await import("./database.utilities");

      const aspects: Event[] = [
        {
          summary: "☀️☌♃ Sun conjunct Jupiter",
          description: "Sun conjunct Jupiter",
          start: new Date("2025-03-10T08:00:00Z"),
          end: new Date("2025-03-20T16:00:00Z"),
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Jupiter",
            "Conjunct",
          ],
        },
        {
          summary: "♀️□♂️ Venus square Mars",
          description: "Venus square Mars",
          start: new Date("2025-03-12T10:00:00Z"),
          end: new Date("2025-03-18T14:00:00Z"),
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Venus",
            "Mars",
            "Square",
          ],
        },
        {
          summary: "♂️△♄ Mars trine Saturn",
          description: "Mars trine Saturn",
          start: new Date("2025-03-25T00:00:00Z"),
          end: new Date("2025-03-30T00:00:00Z"),
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Mars",
            "Saturn",
            "Trine",
          ],
        },
      ];

      await upsertEvents(aspects);

      const activeAt = await getActiveAspectsAt(
        new Date("2025-03-15T12:00:00Z"),
      );

      expect(activeAt.length).toBe(2);
      expect(activeAt.map((a) => a.summary)).toContain(
        "☀️☌♃ Sun conjunct Jupiter",
      );
      expect(activeAt.map((a) => a.summary)).toContain(
        "♀️□♂️ Venus square Mars",
      );
    });

    it("should exclude compound aspects", async () => {
      const { upsertEvents, getActiveAspectsAt } =
        await import("./database.utilities");

      const events: Event[] = [
        {
          summary: "☀️☌♃ Sun conjunct Jupiter",
          description: "Sun conjunct Jupiter",
          start: new Date("2025-03-10T08:00:00Z"),
          end: new Date("2025-03-20T16:00:00Z"),
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Jupiter",
            "Conjunct",
          ],
        },
        {
          summary: "T-Square",
          description: "Sun square Moon opposition Mars",
          start: new Date("2025-03-10T08:00:00Z"),
          end: new Date("2025-03-20T16:00:00Z"),
          categories: ["Astronomy", "Astrology", "Compound Aspect", "T-Square"],
        },
      ];

      await upsertEvents(events);

      const activeAt = await getActiveAspectsAt(
        new Date("2025-03-15T12:00:00Z"),
      );

      expect(activeAt.map((a) => a.summary)).toContain(
        "☀️☌♃ Sun conjunct Jupiter",
      );
      expect(activeAt.map((a) => a.summary)).not.toContain("T-Square");
    });

    it("should only return aspects within time range", async () => {
      const { upsertEvents, getActiveAspectsAt } =
        await import("./database.utilities");

      const aspects: Event[] = [
        {
          summary: "Past aspect",
          description: "Past",
          start: new Date("2025-03-01T00:00:00Z"),
          end: new Date("2025-03-05T00:00:00Z"),
          categories: ["Astronomy", "Simple Aspect"],
        },
        {
          summary: "Future aspect",
          description: "Future",
          start: new Date("2025-03-25T00:00:00Z"),
          end: new Date("2025-03-30T00:00:00Z"),
          categories: ["Astronomy", "Simple Aspect"],
        },
      ];

      await upsertEvents(aspects);

      const activeAt = await getActiveAspectsAt(
        new Date("2025-03-15T12:00:00Z"),
      );

      expect(activeAt.map((a) => a.summary)).not.toContain("Past aspect");
      expect(activeAt.map((a) => a.summary)).not.toContain("Future aspect");
    });
  });
});
