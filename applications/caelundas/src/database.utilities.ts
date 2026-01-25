import { type Database, open } from "sqlite";
import sqlite3 from "sqlite3";

import { getOutputPath } from "./output.utilities";

import type { Event } from "./calendar.utilities";
import type { Body } from "./types";

/**
 * Database record structure for calendar events.
 *
 * Represents the schema of the `events` table. Differs from Event type by storing
 * categories as CSV string and geographic data as separate latitude/longitude columns.
 */
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

/**
 * Database connection promise for SQLite database.
 *
 * Created on module load, shared across all operations, stored in output directory.
 */
const databasePromise: Promise<Database> = open({
  filename: getOutputPath("database.db"),
  driver: sqlite3.Database,
});

/**
 * Initializes the SQLite database schema for ephemeris and event caching.
 *
 * Creates tables and indices: ephemeris (planetary data), events (calendar events).
 * Silently ignores SQLITE_MISUSE errors during initialization.
 *
 * @throws Error - SQLite errors other than SQLITE_MISUSE
 */
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

/**
 * Ephemeris data record for database storage.
 *
 * Represents a single ephemeris data point for a celestial body at a specific timestamp.
 * Different ephemeris types populate different fields (coordinate, azimuthElevation,
 * illumination, diameter, distance).
 */
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

/**
 * Inserts or updates ephemeris values in the database in batched transactions.
 *
 * Performs bulk upserts with automatic batching (96 records per batch) to respect
 * SQLite's variable limit. Uses COALESCE to preserve existing non-NULL values.
 *
 * @param ephemerisValues - Array of ephemeris records to insert or update
 */
export async function upsertEphemerisValues(
  ephemerisValues: EphemerisRecord[],
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
      ],
    );

    await db.run(query, parameters);
  }
}

/**
 * Types of ephemeris data available in the database.
 *
 * Each type corresponds to a specific set of fields in the ephemeris table:
 * - `coordinate`: Ecliptic latitude and longitude
 * - `azimuthElevation`: Horizontal coordinates (azimuth and elevation)
 * - `illumination`: Percent of disk illuminated
 * - `diameter`: Angular diameter in arcseconds
 * - `distance`: Distance from Earth in astronomical units
 *
 * @see EphemerisRecord for the complete record structure
 * @see getEphemerisRecords for type-specific queries
 */
export type EphemerisType =
  | "coordinate"
  | "azimuthElevation"
  | "illumination"
  | "diameter"
  | "distance";

/**
 * Retrieves ephemeris records for a specific body, time range, and data type.
 *
 * This function queries the SQLite cache for ephemeris data, filtering by
 * ephemeris type to ensure only records with the required fields are returned.
 * Results are ordered chronologically.
 *
 * @param args - Query parameters object with body, start, end, and type properties
 * @returns Array of ephemeris records matching the query, sorted by timestamp
 *
 * @remarks
 * **Performance note:**
 * Queries include type-specific WHERE clauses to filter out incomplete records:
 * - `coordinate`: Requires non-NULL latitude AND longitude
 * - `azimuthElevation`: Requires non-NULL azimuth AND elevation
 * - `illumination`: Requires non-NULL illumination
 * - `diameter`: Requires non-NULL diameter
 * - `distance`: Requires non-NULL distance
 *
 * **Use cases:**
 * - Retrieving cached ephemeris to avoid redundant API calls
 * - Loading data for aspect detection algorithms
 * - Fetching specific data types for specialized calculations
 *
 * @see EphemerisType for available data types
 * @see upsertEphemerisValues for populating the cache
 *
 * @example
 * ```typescript
 * const sunPositions = await getEphemerisRecords({
 *   body: 'Sun',
 *   start: new Date('2026-01-01'),
 *   end: new Date('2026-01-31'),
 *   type: 'coordinate'
 * });
 * // Returns array of Sun ephemeris with longitude/latitude for January 2026
 * ```
 */
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

/**
 * Converts a database event record to an application Event object.
 *
 * This helper function transforms the database representation (CSV categories,
 * separate lat/lon columns) to the application format (array categories,
 * geography object).
 *
 * @param row - Event record from database query
 * @returns Event object for application use
 *
 * @remarks
 * **Transformations:**
 * - `categories`: Split CSV string into array
 * - `geography`: Combine latitude/longitude into object (if both present)
 * - Optional fields: Convert null to undefined
 *
 * @see EventRecord for database schema
 * @see Event for application type
 */
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

/**
 * Inserts or updates a single event in the database.
 *
 * If an event with the same summary and start time exists, it is replaced
 * with the new event data.
 *
 * @param event - Calendar event to insert or update
 *
 * @remarks
 * **Primary key:** (summary, start)
 * - Events are uniquely identified by their summary and start timestamp
 * - Use {@link upsertEvents} for bulk operations (more efficient)
 *
 * **Data transformation:**
 * - Categories array joined to CSV string
 * - Geography object split into latitude/longitude columns
 * - Undefined optional fields stored as NULL
 *
 * @see upsertEvents for bulk insertion (preferred for performance)
 * @see Event for event structure
 *
 * @example
 * ```typescript
 * await upsertEvent({
 *   summary: 'Sun conjunct Moon',
 *   description: 'New Moon at 0° Aries',
 *   start: new Date('2026-03-20T12:00:00Z'),
 *   end: new Date('2026-03-20T18:00:00Z'),
 *   categories: ['Astronomy', 'Lunar Phase'],
 * });
 * ```
 */
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
    ],
  );
}

/**
 * Inserts or updates multiple events in the database using batched transactions.
 *
 * This is the preferred method for bulk event insertion. It automatically
 * batches the upserts to respect SQLite's parameter limit while maximizing
 * throughput.
 *
 * @param events - Array of calendar events to insert or update
 *
 * @remarks
 * **Performance optimization:**
 * - Batches inserts to avoid SQLite's 999-variable limit
 * - Batch size: 80 events (11 fields × 80 = 880 parameters)
 * - Uses single transaction per batch for speed
 *
 * **Upsert behavior:**
 * - ON CONFLICT: Replaces all fields of existing event
 * - Primary key: (summary, start)
 *
 * **Empty array handling:**
 * Returns immediately without database access if input is empty.
 *
 * @see upsertEvent for single event insertion
 * @see Event for event structure
 *
 * @example
 * ```typescript
 * const events = [
 *   { summary: 'Mars square Jupiter', start: new Date(), end: new Date(), ... },
 *   { summary: 'Venus trine Saturn', start: new Date(), end: new Date(), ... },
 * ];
 * await upsertEvents(events); // Efficiently batched
 * ```
 */
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

/**
 * Retrieves all events from the database, ordered chronologically.
 *
 * This function fetches the complete event set, sorted by start time.
 * Use this for generating full calendar exports or analyzing all detected
 * astronomical events.
 *
 * @returns Array of all calendar events, sorted by start time (ascending)
 *
 * @remarks
 * **Performance consideration:**
 * For large databases, consider filtering by date range or categories
 * instead of fetching all events.
 *
 * **Use cases:**
 * - Generating iCal calendar files
 * - Exporting events to JSON
 * - Analyzing complete event sets
 *
 * @see getActiveAspectsAt for time-specific queries
 *
 * @example
 * ```typescript
 * const allEvents = await getAllEvents();
 * console.log(`Total events: ${allEvents.length}`);
 * // Export to calendar format
 * const ical = getCalendar(allEvents);
 * ```
 */
export async function getAllEvents(): Promise<Event[]> {
  const db = await databasePromise;
  const rows = await db.all(
    `SELECT summary, description, start, end, categories, location, latitude, longitude, url, priority, color
     FROM events
     ORDER BY start ASC`,
  );

  const events: Event[] = rows.map(mapRowToEvent);

  return events;
}

/**
 * Retrieves all active 2-body aspect events at a specific timestamp.
 *
 * This function queries for aspects that are active (ongoing) at the given
 * timestamp, filtering for simple 2-body aspects only. It excludes compound
 * multi-body patterns like Grand Trines, T-Squares, etc.
 *
 * @param timestamp - The moment in time to query for active aspects
 * @returns Array of active 2-body aspect events at the specified timestamp
 *
 * @remarks
 * **Category filtering:**
 * - Includes: Events with "Simple Aspect" category (2-body aspects)
 * - Excludes: Events with "Compound Aspect" category (multi-body patterns)
 *
 * **Category format example:**
 * `"Astronomy,Astrology,Simple Aspect,Major Aspect,Sun,Mars,Square,Applying"`
 *
 * **Active event criteria:**
 * - Event start time ≤ timestamp
 * - Event end time ≥ timestamp
 *
 * **Use cases:**
 * - Composing multi-body aspect patterns from 2-body aspects
 * - Determining which aspects are active for stellium detection
 * - Caching aspect states for complex pattern recognition
 *
 * **Performance note:**
 * Uses indexed queries on `categories`, `start`, and `end` columns for
 * efficient temporal filtering.
 *
 * @see upsertEvents for storing aspect events
 * @see Event for event structure
 *
 * @example
 * ```typescript
 * const activeAspects = await getActiveAspectsAt(new Date('2026-01-21T12:00:00Z'));
 * // Returns: [Sun square Mars, Venus trine Jupiter, ...]
 *
 * // Use for composing compound patterns
 * const grandTrines = detectGrandTrines(activeAspects);
 * ```
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
    [timestampISO, timestampISO],
  );

  return rows.map(mapRowToEvent);
}

// #region Cleanup

/**
 * Closes the SQLite database connection.
 *
 * This function should be called at application shutdown to gracefully close
 * the database connection and release resources.
 *
 * @remarks
 * **Cleanup lifecycle:**
 * - Call this in the application's shutdown handler
 * - After closing, subsequent database operations will fail
 * - Connection is shared across all database functions via {@link databasePromise}
 *
 * **Error handling:**
 * Any errors during close are propagated to the caller.
 *
 * @see databasePromise for the connection being closed
 *
 * @example
 * ```typescript
 * // In main.ts cleanup
 * try {
 *   await closeConnection();
 *   console.log('Database closed successfully');
 * } catch (error) {
 *   console.error('Error closing database:', error);
 * }
 * ```
 */
export async function closeConnection(): Promise<void> {
  const db = await databasePromise;
  await db.close();
}
