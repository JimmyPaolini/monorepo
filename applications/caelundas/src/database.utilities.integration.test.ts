import fs from "fs";
import path from "path";

import { type Database, open } from "sqlite";
import sqlite3 from "sqlite3";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { Event } from "./calendar.utilities";
import type { EphemerisRecord } from "./database.utilities";

// Use a temporary database file for testing
const TEST_DB_PATH = "./output/test-database.db";

describe("database.utilities integration", () => {
  let db: Database;

  beforeAll(async () => {
    // Ensure output directory exists
    const outputDir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create test database
    db = await open({
      filename: TEST_DB_PATH,
      driver: sqlite3.Database,
    });

    // Create ephemeris table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ephemeris (
        body TEXT,
        timestamp TEXT,
        latitude REAL,
        longitude REAL,
        azimuth REAL,
        elevation REAL,
        illumination REAL,
        diameter REAL,
        distance REAL,
        PRIMARY KEY (body, timestamp)
      );
    `);

    // Create events table
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
  });

  afterAll(async () => {
    await db.close();
    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  beforeEach(async () => {
    // Clear tables before each test
    await db.exec("DELETE FROM ephemeris");
    await db.exec("DELETE FROM events");
  });

  describe("ephemeris operations", () => {
    it("should insert and retrieve coordinate ephemeris data", async () => {
      const body = "sun";
      const timestamp = new Date("2025-03-20T12:00:00Z");

      await db.run(
        `INSERT INTO ephemeris (body, timestamp, latitude, longitude)
         VALUES (?, ?, ?, ?)`,
        [body, timestamp.toISOString(), 0, 0.5]
      );

      const rows: EphemerisRecord[] = await db.all(
        `SELECT * FROM ephemeris WHERE body = ? AND timestamp = ?`,
        [body, timestamp.toISOString()]
      );

      expect(rows).toHaveLength(1);
      expect(rows[0]?.body).toBe("sun");
      expect(rows[0]?.longitude).toBe(0.5);
      expect(rows[0]?.latitude).toBe(0);
    });

    it("should upsert ephemeris data (update on conflict)", async () => {
      const body = "moon";
      const timestamp = new Date("2025-03-20T12:00:00Z");

      // Insert initial data
      await db.run(
        `INSERT INTO ephemeris (body, timestamp, longitude, latitude)
         VALUES (?, ?, ?, ?)`,
        [body, timestamp.toISOString(), 100, 5]
      );

      // Upsert with new longitude
      await db.run(
        `INSERT INTO ephemeris (body, timestamp, longitude)
         VALUES (?, ?, ?)
         ON CONFLICT(body, timestamp) DO UPDATE SET
           longitude = COALESCE(excluded.longitude, longitude)`,
        [body, timestamp.toISOString(), 105]
      );

      const rows: EphemerisRecord[] = await db.all(
        `SELECT * FROM ephemeris WHERE body = ?`,
        [body]
      );

      expect(rows).toHaveLength(1);
      expect(rows[0]?.longitude).toBe(105);
      expect(rows[0]?.latitude).toBe(5); // Should preserve original value
    });

    it("should store and retrieve different ephemeris types", async () => {
      const body = "mars";
      const timestamp = new Date("2025-06-15T18:00:00Z");

      await db.run(
        `INSERT INTO ephemeris (body, timestamp, longitude, latitude, azimuth, elevation, illumination, diameter, distance)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [body, timestamp.toISOString(), 45.5, 1.2, 180, 45, 0.95, 0.004, 1.5]
      );

      const row: EphemerisRecord | undefined = await db.get(
        `SELECT * FROM ephemeris WHERE body = ? AND timestamp = ?`,
        [body, timestamp.toISOString()]
      );

      expect(row?.longitude).toBe(45.5);
      expect(row?.latitude).toBe(1.2);
      expect(row?.azimuth).toBe(180);
      expect(row?.elevation).toBe(45);
      expect(row?.illumination).toBe(0.95);
      expect(row?.diameter).toBe(0.004);
      expect(row?.distance).toBe(1.5);
    });
  });

  describe("events operations", () => {
    it("should insert and retrieve events", async () => {
      const event: Event = {
        summary: "☀️ → ♈ Sun ingress Aries",
        description: "Sun ingress Aries",
        start: new Date("2025-03-20T09:06:00Z"),
        end: new Date("2025-03-20T09:06:00Z"),
        categories: ["Astronomy", "Astrology", "Ingress", "Sun", "Aries"],
      };

      await db.run(
        `INSERT INTO events (summary, description, start, end, categories)
         VALUES (?, ?, ?, ?, ?)`,
        [
          event.summary,
          event.description,
          event.start.toISOString(),
          event.end.toISOString(),
          event.categories.join(","),
        ]
      );

      const rows: Event[] = await db.all(`SELECT * FROM events`);

      expect(rows).toHaveLength(1);
      expect(rows[0]?.summary).toBe("☀️ → ♈ Sun ingress Aries");
      expect(rows[0]?.categories).toBe("Astronomy,Astrology,Ingress,Sun,Aries");
    });

    it("should upsert events (replace on conflict)", async () => {
      const event1: Event = {
        summary: "Test Event",
        description: "Original description",
        start: new Date("2025-03-20T09:06:00Z"),
        end: new Date("2025-03-20T09:06:00Z"),
        categories: ["Test"],
      };

      await db.run(
        `INSERT INTO events (summary, description, start, end, categories)
         VALUES (?, ?, ?, ?, ?)`,
        [
          event1.summary,
          event1.description,
          event1.start.toISOString(),
          event1.end.toISOString(),
          event1.categories.join(","),
        ]
      );

      // Upsert with updated description
      await db.run(
        `INSERT INTO events (summary, description, start, end, categories)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(summary, start) DO UPDATE SET
           description = excluded.description`,
        [
          event1.summary,
          "Updated description",
          event1.start.toISOString(),
          event1.end.toISOString(),
          event1.categories.join(","),
        ]
      );

      const rows: Event[] = await db.all(`SELECT * FROM events`);

      expect(rows).toHaveLength(1);
      expect(rows[0]?.description).toBe("Updated description");
    });

    it("should query events by category", async () => {
      // Insert multiple events
      const events = [
        {
          summary: "Sun ingress Aries",
          description: "Sun ingress Aries",
          start: new Date("2025-03-20T09:06:00Z"),
          end: new Date("2025-03-20T09:06:00Z"),
          categories: ["Astronomy", "Ingress", "Sun"],
        },
        {
          summary: "Full Moon",
          description: "Full Moon in Libra",
          start: new Date("2025-03-25T10:00:00Z"),
          end: new Date("2025-03-25T10:00:00Z"),
          categories: ["Astronomy", "Lunar Phase", "Moon"],
        },
        {
          summary: "Sun Square Mars",
          description: "Sun square Mars",
          start: new Date("2025-03-28T15:00:00Z"),
          end: new Date("2025-03-28T15:00:00Z"),
          categories: ["Astronomy", "Major Aspect", "Sun", "Mars"],
        },
      ];

      for (const event of events) {
        await db.run(
          `INSERT INTO events (summary, description, start, end, categories)
           VALUES (?, ?, ?, ?, ?)`,
          [
            event.summary,
            event.description,
            event.start.toISOString(),
            event.end.toISOString(),
            event.categories.join(","),
          ]
        );
      }

      // Query events containing Sun
      const sunEvents = await db.all(
        `SELECT * FROM events WHERE categories LIKE '%Sun%'`
      );
      expect(sunEvents.length).toBe(2);

      // Query aspects only
      const aspectEvents = await db.all(
        `SELECT * FROM events WHERE categories LIKE '%Major Aspect%'`
      );
      expect(aspectEvents.length).toBe(1);
    });

    it("should query events by time range", async () => {
      const events = [
        {
          summary: "Event 1",
          description: "First",
          start: new Date("2025-03-01T10:00:00Z"),
          end: new Date("2025-03-01T11:00:00Z"),
          categories: ["Test"],
        },
        {
          summary: "Event 2",
          description: "Second",
          start: new Date("2025-03-15T10:00:00Z"),
          end: new Date("2025-03-15T11:00:00Z"),
          categories: ["Test"],
        },
        {
          summary: "Event 3",
          description: "Third",
          start: new Date("2025-03-30T10:00:00Z"),
          end: new Date("2025-03-30T11:00:00Z"),
          categories: ["Test"],
        },
      ];

      for (const event of events) {
        await db.run(
          `INSERT INTO events (summary, description, start, end, categories)
           VALUES (?, ?, ?, ?, ?)`,
          [
            event.summary,
            event.description,
            event.start.toISOString(),
            event.end.toISOString(),
            event.categories.join(","),
          ]
        );
      }

      const midMonthEvents: Event[] = await db.all(
        `SELECT * FROM events
         WHERE start >= ? AND start <= ?
         ORDER BY start ASC`,
        [
          new Date("2025-03-10T00:00:00Z").toISOString(),
          new Date("2025-03-20T00:00:00Z").toISOString(),
        ]
      );

      expect(midMonthEvents.length).toBe(1);
      expect(midMonthEvents[0]?.summary).toBe("Event 2");
    });
  });

  describe("active aspects query", () => {
    it("should find aspects active at a specific time", async () => {
      // Insert aspect duration events
      const aspects = [
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

      for (const aspect of aspects) {
        await db.run(
          `INSERT INTO events (summary, description, start, end, categories)
           VALUES (?, ?, ?, ?, ?)`,
          [
            aspect.summary,
            aspect.description,
            aspect.start.toISOString(),
            aspect.end.toISOString(),
            aspect.categories.join(","),
          ]
        );
      }

      // Query for aspects active on March 15
      const queryTime = new Date("2025-03-15T12:00:00Z");
      const activeAspects: Event[] = await db.all(
        `SELECT * FROM events
         WHERE categories LIKE '%Simple Aspect%'
           AND start <= ?
           AND end >= ?
         ORDER BY start ASC`,
        [queryTime.toISOString(), queryTime.toISOString()]
      );

      expect(activeAspects.length).toBe(2);
      expect(activeAspects.map((a) => a.summary)).toContain(
        "☀️☌♃ Sun conjunct Jupiter"
      );
      expect(activeAspects.map((a) => a.summary)).toContain(
        "♀️□♂️ Venus square Mars"
      );
    });
  });
});
