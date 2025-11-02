import sqlite3 from "sqlite3";
import { open, type Database } from "sqlite";
import type { Body } from "./symbols.constants";
import type { Event } from "./calendar.utilities";

const databasePromise: Promise<Database> = open({
  filename: "./database.db",
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

export interface EventRecord {
  summary: string;
  description: string;
  timestamp: Date;
}

export async function upsertEvent(event: Event) {
  const db = await databasePromise;
  const { summary, description, start } = event;
  const result = await db.run(
    "INSERT OR REPLACE INTO events (summary, description, start) VALUES (?, ?, ?)",
    [summary, description, start.toISOString()]
  );
  return result;
}

export async function upsertEvents(events: Event[]) {
  if (events.length === 0) return;

  const placeholders = events.map(() => "(?, ?, ?)").join(", ");
  const query = `
    INSERT INTO events (summary, description, start)
    VALUES ${placeholders}
    ON CONFLICT(summary, start) DO UPDATE SET
      description = excluded.description
  `;

  const parameters = events.flatMap(({ summary, description, start }) => [
    summary,
    description,
    start.toISOString(),
  ]);

  const db = await databasePromise;
  await db.run(query, parameters);
}
