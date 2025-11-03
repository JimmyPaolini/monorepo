import sqlite3 from "sqlite3";
import { open, type Database } from "sqlite";
import type { Body } from "./symbols.constants";
import type { Event } from "./calendar.utilities";
import { getOutputPath } from "./output.utilities";

const databasePromise: Promise<Database> = open({
  filename: getOutputPath("database.db"),
  driver: sqlite3.Database,
});

// Ensure tables exist once DB is opened.
(async () => {
  const db = await databasePromise;

  // Ephemeris table — keep commented bodies creation in source if needed later.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ephemeris (
      body TEXT,
      timestamp TEXT,
      latitude REAL,
      longitude REAL,
      PRIMARY KEY (body, timestamp)
    );
  `);

  // Events table
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

export async function closeConnection() {
  const db = await databasePromise;
  await db.close();
}

// #region Ephemeris

export interface EphemerisRecord {
  body: Body;
  timestamp: Date;
  latitude: number;
  longitude: number;
}

export async function upsertEphemerisValue(ephemerisValue: EphemerisRecord) {
  const db = await databasePromise;
  const { body, timestamp, latitude, longitude } = ephemerisValue;
  const result = await db.run(
    "INSERT OR REPLACE INTO ephemeris (body, timestamp, latitude, longitude) VALUES (?, ?, ?, ?)",
    [body, timestamp.toISOString(), latitude, longitude]
  );
  return result;
}

export async function upsertEphemerisValues(
  ephemerisValues: EphemerisRecord[]
) {
  if (ephemerisValues.length === 0) return;

  const placeholders = ephemerisValues.map(() => "(?, ?, ?, ?)").join(", ");
  const query = `
    INSERT INTO ephemeris (body, timestamp, latitude, longitude)
    VALUES ${placeholders}
    ON CONFLICT(body, timestamp) DO UPDATE SET
      latitude = excluded.latitude,
      longitude = excluded.longitude
  `;

  const parameters = ephemerisValues.flatMap(
    ({ body, timestamp, latitude, longitude }) => [
      body,
      timestamp.toISOString(),
      latitude,
      longitude,
    ]
  );

  const db = await databasePromise;
  await db.run(query, parameters);
}

// #region Events

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

  const placeholders = events
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

  const parameters = events.flatMap((event) => [
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

  const db = await databasePromise;
  await db.run(query, parameters);
}

export async function getEventsByDateRange(
  start: Date,
  end: Date
): Promise<Event[]> {
  const db = await databasePromise;
  const rows = await db.all(
    `SELECT summary, description, start, end, categories, location, latitude, longitude, url, priority, color
     FROM events
     WHERE start >= ? AND start <= ?
     ORDER BY start ASC`,
    [start.toISOString(), end.toISOString()]
  );

  return rows.map(mapRowToEvent);
}

export async function getAllEvents(): Promise<Event[]> {
  const db = await databasePromise;
  const rows = await db.all(
    `SELECT summary, description, start, end, categories, location, latitude, longitude, url, priority, color
     FROM events
     ORDER BY start ASC`
  );

  return rows.map(mapRowToEvent);
}
