import { type Database, open } from "sqlite";
import sqlite3 from "sqlite3";

import { getOutputPath } from "./output.utilities";

import type { Event } from "./calendar.utilities";
import type { Body } from "./types";

interface EventRecord {
  summary: string;
  description: string;
  start: string;
  end: string;
  categories: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  url?: string;
  priority?: number;
  color?: string;
}

const databasePromise: Promise<Database> = open({
  filename: getOutputPath("database.db"),
  driver: sqlite3.Database,
});

async function initializeDatabase(): Promise<void> {
  try {
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

    // Create index on categories for faster LIKE queries
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_events_categories
      ON events(categories);
    `);

    // Create index on start/end timestamps for temporal queries
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_events_time_range
      ON events(start, end);
    `);
  } catch (error) {
    // Ignore errors if database is closed during initialization
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "SQLITE_MISUSE"
    ) {
      return;
    }
    throw error;
  }
}

// Initialize database on module load
void initializeDatabase();

// #region Ephemeris

export interface EphemerisRecord {
  body: Body;
  timestamp: Date;
  // Coordinate/Orbit ephemeris
  latitude?: number | undefined;
  longitude?: number | undefined;
  // Azimuth/Elevation ephemeris
  azimuth?: number | undefined;
  elevation?: number | undefined;
  // Illumination ephemeris
  illumination?: number | undefined;
  // Diameter ephemeris
  diameter?: number | undefined;
  // Distance ephemeris
  distance?: number | undefined;
}

export async function upsertEphemerisValues(
  ephemerisValues: EphemerisRecord[]
): Promise<void> {
  if (ephemerisValues.length === 0) {
    return;
  }

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

export type EphemerisType =
  | "coordinate"
  | "azimuthElevation"
  | "illumination"
  | "diameter"
  | "distance";

export async function getEphemerisRecords(args: {
  body: Body;
  start: Date;
  end: Date;
  type: EphemerisType;
}): Promise<EphemerisRecord[]> {
  const { body, start, end, type } = args;
  const db = await databasePromise;

  // Build WHERE clause based on ephemeris type
  let additionalConditions = "";
  switch (type) {
    case "coordinate":
      additionalConditions =
        "AND latitude IS NOT NULL AND longitude IS NOT NULL";
      break;
    case "azimuthElevation":
      additionalConditions =
        "AND azimuth IS NOT NULL AND elevation IS NOT NULL";
      break;
    case "illumination":
      additionalConditions = "AND illumination IS NOT NULL";
      break;
    case "diameter":
      additionalConditions = "AND diameter IS NOT NULL";
      break;
    case "distance":
      additionalConditions = "AND distance IS NOT NULL";
      break;
  }

  const query = `
    SELECT body, timestamp, latitude, longitude, azimuth, elevation, illumination, diameter, distance
    FROM ephemeris
    WHERE body = ?
      AND timestamp >= ?
      AND timestamp <= ?
      ${additionalConditions}
    ORDER BY timestamp ASC
  `;

  const rows: EphemerisRecord[] = await db.all(query, [
    body,
    start.toISOString(),
    end.toISOString(),
  ]);

  return rows.map((row) => {
    const record: EphemerisRecord = {
      body: row.body,
      timestamp: new Date(row.timestamp),
      latitude: row.latitude,
      longitude: row.longitude,
      azimuth: row.azimuth,
      elevation: row.elevation,
      illumination: row.illumination,
      diameter: row.diameter,
      distance: row.distance,
    };
    return record;
  });
}

// #region Events

function mapRowToEvent(row: EventRecord): Event {
  return {
    summary: row.summary,
    description: row.description,
    start: new Date(row.start),
    end: row.end ? new Date(row.end) : new Date(row.start),
    categories: row.categories ? row.categories.split(",") : [],
    location: row.location || undefined,
    geography:
      row.latitude && row.longitude
        ? { latitude: row.latitude, longitude: row.longitude }
        : undefined,
    url: row.url || undefined,
    priority: row.priority ? row.priority : undefined,
    color: row.color || undefined,
  };
}

export async function upsertEvent(event: Event): Promise<void> {
  const db = await databasePromise;
  await db.run(
    `INSERT OR REPLACE INTO events
     (summary, description, start, end, categories, location, latitude, longitude, url, priority, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.summary,
      event.description,
      event.start.toISOString(),
      event.end.toISOString(),
      event.categories.join(","),
      event.location || null,
      event.geography?.latitude || null,
      event.geography?.longitude || null,
      event.url || null,
      event.priority ?? null,
      event.color || null,
    ]
  );
}

export async function upsertEvents(events: Event[]): Promise<void> {
  if (events.length === 0) {
    return;
  }

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
      event.end.toISOString() || null,
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

/**
 * Get active 2-body aspect events at a specific timestamp
 * Used for composing multi-body aspects from existing aspect relationships
 *
 * Note: Queries for "Simple Aspect" category to get 2-body aspects only,
 * excluding "Compound Aspect" (multi-body patterns like T-Squares, Grand Trines, etc.)
 *
 * Categories format: "Astronomy,Astrology,Simple Aspect,Major Aspect,Body1,Body2,AspectType,Phase"
 */
export async function getActiveAspectsAt(timestamp: Date): Promise<Event[]> {
  const db = await databasePromise;
  const timestampISO = timestamp.toISOString();

  const rows = await db.all(
    `SELECT summary, description, start, end, categories, location, latitude, longitude, url, priority, color
     FROM events
     WHERE categories LIKE '%Simple Aspect%'
       AND categories NOT LIKE '%Compound Aspect%'
       AND start <= ?
       AND end >= ?
     ORDER BY start ASC`,
    [timestampISO, timestampISO]
  );

  return rows.map(mapRowToEvent);
}

// #region Cleanup

export async function closeConnection(): Promise<void> {
  const db = await databasePromise;
  await db.close();
}
