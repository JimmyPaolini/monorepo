import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { type Body } from "./symbols.constants.ts";
import { type Event } from "./calendar.utilities.ts";

const db = new DB("database.db");

export function closeConnection() {
  db.close();
}

// #region Ephemeris

// db.execute(`
//   CREATE TABLE IF NOT EXISTS ephemeris (
//     body TEXT CHECK(body IN (${bodies.map((body) => `'${body}'`).join(", ")})),
//     timestamp TEXT,
//     latitude REAL CHECK(latitude >= -90 AND latitude <= 90),
//     longitude REAL CHECK(longitude >= 0 AND longitude <= 360),
//     PRIMARY KEY (body, timestamp)
//   );
// `);

export interface EphemerisRecord {
  body: Body;
  timestamp: Date;
  latitude: number;
  longitude: number;
}

export function upsertEphemerisValue(ephemerisValue: EphemerisRecord) {
  const { body, timestamp, latitude, longitude } = ephemerisValue;
  const result = db.query(
    "INSERT OR REPLACE INTO ephemeris (body, timestamp, latitude, longitude) VALUES (?, ?, ?, ?)",
    [body, timestamp.toISOString(), latitude, longitude]
  );
  return result;
}

export function upsertEphemerisValues(ephemerisValues: EphemerisRecord[]) {
  if (ephemerisValues.length === 0) return;

  const query = `
    INSERT INTO ephemeris (body, timestamp, latitude, longitude)
    VALUES ${ephemerisValues.map(() => "(?, ?, ?, ?)").join(", ")}
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

  db.query(query, parameters);
}

// #region Events

db.execute(`
  CREATE TABLE IF NOT EXISTS events (
    summary TEXT,
    description TEXT,
    start TEXT,
    end TEXT,
    PRIMARY KEY (summary, start)
  );
`);

export interface EventRecord {
  summary: string;
  description: string;
  timestamp: Date;
}

export function upsertEvent(event: Event) {
  const { summary, description, start } = event;
  const result = db.query(
    "INSERT OR REPLACE INTO events (summary, description, start) VALUES (?, ?, ?)",
    [summary, description, start.toISOString()]
  );
  return result;
}

export function upsertEvents(events: Event[]) {
  if (events.length === 0) return;

  const query = `
    INSERT INTO events (summary, description, start)
    VALUES ${events.map(() => "(?, ?, ?)").join(", ")}
    ON CONFLICT(summary, start) DO UPDATE SET
      description = excluded.description
  `;

  const parameters = events.flatMap(({ summary, description, start }) => [
    summary,
    description,
    start.toISOString(),
  ]);

  db.query(query, parameters);
}
