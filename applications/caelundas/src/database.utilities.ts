import sqlite3 from "sqlite3";
import { open, type Database } from "sqlite";
import type { Body } from "./constants";
import type { Event } from "./calendar.utilities";
import { getOutputPath } from "./output.utilities";

const databasePromise: Promise<Database> = open({
  filename: getOutputPath("database.db"),
  driver: sqlite3.Database,
});

export async function closeConnection() {
  const db = await databasePromise;
  await db.close();
}

// #region Ephemeris

(async () => {
  const db = await databasePromise;

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
})();

export interface EphemerisRecord {
  body: Body;
  timestamp: Date;
  // Coordinate/Orbit ephemeris
  latitude?: number;
  longitude?: number;
  // Azimuth/Elevation ephemeris
  azimuth?: number;
  elevation?: number;
  // Illumination ephemeris
  illumination?: number;
  // Diameter ephemeris
  diameter?: number;
  // Distance ephemeris
  distance?: number;
}

export async function upsertEphemerisValues(
  ephemerisValues: EphemerisRecord[]
) {
  if (ephemerisValues.length === 0) return;

  const db = await databasePromise;

  // SQLite has a limit of 999 variables per query (SQLITE_MAX_VARIABLE_NUMBER)
  // With 9 fields per record, we can insert ~111 records at once (999 / 9 ≈ 111)
  // 96 leaves some room for safety
  const BATCH_SIZE = 96;

  for (let i = 0; i < ephemerisValues.length; i += BATCH_SIZE) {
    const batch = ephemerisValues.slice(i, i + BATCH_SIZE);

    const placeholders = batch
      .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .join(", ");
    const query = `
      INSERT INTO ephemeris (
        body, timestamp, latitude, longitude, azimuth, elevation, illumination,
        diameter, distance
      )
      VALUES ${placeholders}
      ON CONFLICT(body, timestamp) DO UPDATE SET
        latitude = COALESCE(excluded.latitude, latitude),
        longitude = COALESCE(excluded.longitude, longitude),
        azimuth = COALESCE(excluded.azimuth, azimuth),
        elevation = COALESCE(excluded.elevation, elevation),
        illumination = COALESCE(excluded.illumination, illumination),
        diameter = COALESCE(excluded.diameter, diameter),
        distance = COALESCE(excluded.distance, distance)
    `;

    const parameters = batch.flatMap(
      ({
        body,
        timestamp,
        latitude,
        longitude,
        azimuth,
        elevation,
        illumination,
        diameter,
        distance,
      }) => [
        body,
        timestamp.toISOString(),
        latitude ?? null,
        longitude ?? null,
        azimuth ?? null,
        elevation ?? null,
        illumination ?? null,
        diameter ?? null,
        distance ?? null,
      ]
    );

    await db.run(query, parameters);
  }
}

// #region Events

(async () => {
  const db = await databasePromise;

  await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      summary TEXT,
      description TEXT,
      start TEXT,
      end TEXT,
      categories TEXT,
      location TEXT,
      latitude REAL,
      longitude REAL,
      url TEXT,
      priority INTEGER,
      color TEXT,
      PRIMARY KEY (summary, start)
    );
  `);
})();

function mapRowToEvent(row: any): Event {
  return {
    summary: row.summary,
    description: row.description,
    start: new Date(row.start),
    end: row.end ? new Date(row.end) : undefined,
    categories: row.categories ? row.categories.split(",") : [],
    location: row.location || undefined,
    geography:
      row.latitude !== null && row.longitude !== null
        ? { latitude: row.latitude, longitude: row.longitude }
        : undefined,
    url: row.url || undefined,
    priority: row.priority !== null ? row.priority : undefined,
    color: row.color || undefined,
  };
}

export async function upsertEvent(event: Event) {
  const db = await databasePromise;
  const result = await db.run(
    `INSERT OR REPLACE INTO events
     (summary, description, start, end, categories, location, latitude, longitude, url, priority, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.summary,
      event.description,
      event.start.toISOString(),
      event.end?.toISOString() || null,
      event.categories.join(","),
      event.location || null,
      event.geography?.latitude || null,
      event.geography?.longitude || null,
      event.url || null,
      event.priority ?? null,
      event.color || null,
    ]
  );
  return result;
}

export async function upsertEvents(events: Event[]) {
  if (events.length === 0) return;

  const db = await databasePromise;

  // SQLite has a limit of 999 variables per query (SQLITE_MAX_VARIABLE_NUMBER)
  // With 11 fields per event, we can insert ~90 events at once (999 / 11 ≈ 90)
  // Using 80 as a safe batch size
  const BATCH_SIZE = 80;

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);

    const placeholders = batch
      .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .join(", ");
    const query = `
      INSERT INTO events (summary, description, start, end, categories, location, latitude, longitude, url, priority, color)
      VALUES ${placeholders}
      ON CONFLICT(summary, start) DO UPDATE SET
        description = excluded.description,
        end = excluded.end,
        categories = excluded.categories,
        location = excluded.location,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        url = excluded.url,
        priority = excluded.priority,
        color = excluded.color
    `;

    const parameters = batch.flatMap((event) => [
      event.summary,
      event.description,
      event.start.toISOString(),
      event.end?.toISOString() || null,
      event.categories.join(","),
      event.location || null,
      event.geography?.latitude || null,
      event.geography?.longitude || null,
      event.url || null,
      event.priority ?? null,
      event.color || null,
    ]);

    await db.run(query, parameters);
  }
}

export async function getAllEvents(): Promise<Event[]> {
  const db = await databasePromise;
  const rows = await db.all(
    `SELECT summary, description, start, end, categories, location, latitude, longitude, url, priority, color
     FROM events
     ORDER BY start ASC`
  );

  const events: Event[] = rows.map(mapRowToEvent);

  return events;
}
