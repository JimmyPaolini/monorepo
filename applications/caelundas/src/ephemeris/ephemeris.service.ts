/**
 * Core ephemeris calculation service using NASA JPL Horizons data.
 *
 * This module provides functions to query NASA's JPL Horizons system for precise
 * celestial body positions and properties. It handles data retrieval, parsing,
 * caching, and type-safe access to ephemeris values.
 *
 * @remarks
 * Data sources:
 * - NASA JPL Horizons API (https://ssd.jpl.nasa.gov/horizons/)
 * - DE431 ephemeris for planetary positions
 * - 1-minute sampling interval for high temporal resolution
 * - SQLite caching to minimize API calls and improve performance
 *
 * Ephemeris types:
 * - Coordinate: Ecliptic longitude/latitude for aspect calculations
 * - Orbit: Orbital elements for lunar nodes and apsides
 * - Azimuth/Elevation: Horizon coordinates for rise/set/culmination
 * - Illumination: Illuminated fraction for phase detection
 * - Diameter: Angular diameter for eclipse calculations
 * - Distance: Distance from Earth for phase and apsis events
 *
 * @see {@link https://ssd.jpl.nasa.gov/horizons/manual.html} for Horizons documentation
 * @see {@link ./ephemeris.constants#} for API configuration
 * @see {@link ./ephemeris.types#} for data structures
 */

import _ from "lodash";
import moment from "moment-timezone";

import { nodes } from "../constants";
import {
  type EphemerisRecord,
  getEphemerisRecords,
  upsertEphemerisValues,
} from "../database.utilities";
import { fetchWithRetry } from "../fetch.utilities";
import { arcsecondsPerDegree, normalizeDegrees } from "../math.utilities";
import { symbolByBody } from "../symbols";

import {
  commandIdByBody,
  dateRegex,
  decimalRegex,
  horizonsUrl,
  QUANTITY_ANGULAR_DIAMETER,
  QUANTITY_APPARENT_AZIMUTH_ELEVATION,
  QUANTITY_ECLIPTIC_LONGITUDE_LATITUDE,
  QUANTITY_ILLUMINATED_FRACTION,
  QUANTITY_RANGE_RATE,
} from "./ephemeris.constants";

import type { Asteroid, Body, Comet, Node, Planet } from "../types";
import type {
  AzimuthElevationEphemeris,
  AzimuthElevationEphemerisBody,
  CoordinateEphemeris,
  Coordinates,
  DiameterEphemeris,
  DiameterEphemerisBody,
  DistanceEphemeris,
  DistanceEphemerisBody,
  IlluminationEphemeris,
  IlluminationEphemerisBody,
  Latitude,
  Longitude,
  OrbitEphemeris,
  OrbitEphemerisBody,
} from "./ephemeris.types";

// #region Utilities

/**
 * Calculates the expected number of ephemeris records for a date range.
 *
 * Ephemeris data is sampled at 1-minute intervals, so this returns the number
 * of minutes between start and end (inclusive).
 *
 * @param start - Range start date
 * @param end - Range end date
 * @returns Expected number of 1-minute interval records
 *
 * @remarks
 * Used for cache validation to detect incomplete data requiring API refetch.
 * Adds 1 to include both boundary timestamps (inclusive range).
 *
 * @example
 * ```typescript
 * const start = new Date('2026-01-21T00:00:00');
 * const end = new Date('2026-01-21T01:00:00');
 * const count = getExpectedRecordCount(start, end);
 * // count === 61 (0:00, 0:01, 0:02, ..., 1:00)
 * ```
 */
function getExpectedRecordCount(start: Date, end: Date): number {
  // Ephemeris data is fetched at 1-minute intervals
  const diffInMs = end.getTime() - start.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  // Add 1 to include both start and end timestamps
  return diffInMinutes + 1;
}

/**
 * Safely extracts coordinate data (longitude or latitude) from ephemeris at a timestamp.
 *
 * Provides type-safe access to ephemeris values with null-checking to prevent
 * runtime errors from missing data.
 *
 * @param ephemeris - Coordinate ephemeris object indexed by ISO timestamp
 * @param timestamp - ISO 8601 timestamp string (e.g., "2026-01-21T12:00:00.000Z")
 * @param fieldName - Field to extract ("longitude" or "latitude")
 * @returns Coordinate value in degrees
 * @throws When timestamp is missing from ephemeris
 * @throws When specified field is undefined at timestamp
 *
 * @remarks
 * - Longitude: 0-360° along ecliptic (0° = vernal equinox)
 * - Latitude: -90° to +90° perpendicular to ecliptic
 *
 * @see {@link getCoordinatesEphemeris} for ephemeris retrieval
 * @see {@link CoordinateEphemeris} for data structure
 *
 * @example
 * ```typescript
 * const ephemeris = await getCoordinatesEphemeris({...});
 * const longitude = getCoordinateFromEphemeris(
 *   ephemeris,
 *   '2026-01-21T12:00:00.000Z',
 *   'longitude'
 * );
 * // Returns: 125.4 (degrees along ecliptic)
 * ```
 */
export function getCoordinateFromEphemeris(
  ephemeris: CoordinateEphemeris,
  timestamp: string,
  fieldName: "longitude" | "latitude",
): number {
  const data = ephemeris[timestamp];
  if (data?.[fieldName] === undefined) {
    throw new Error(`Missing ${fieldName} at ${timestamp}`);
  }
  return data[fieldName];
}

/**
 * Safely extracts azimuth or elevation data from horizon coordinate ephemeris.
 *
 * Provides type-safe access to horizon coordinate values for rise/set/culmination calculations.
 *
 * @param ephemeris - Azimuth/elevation ephemeris indexed by ISO timestamp
 * @param timestamp - ISO 8601 timestamp string
 * @param fieldName - Field to extract ("azimuth" or "elevation")
 * @returns Coordinate value in degrees
 * @throws When timestamp is missing from ephemeris
 * @throws When specified field is undefined at timestamp
 *
 * @remarks
 * - Azimuth: 0-360° measured clockwise from north (0°=N, 90°=E, 180°=S, 270°=W)
 * - Elevation: -90° to +90° above horizon (0°=horizon, 90°=zenith, -90°=nadir)
 * - Negative elevation indicates body is below horizon (not visible)
 *
 * @see {@link getAzimuthElevationEphemeris} for ephemeris retrieval
 * @see {@link getDailySolarCycleEvents} for sunrise/sunset detection using elevation
 *
 * @example
 * ```typescript
 * const sunEphemeris = await getAzimuthElevationEphemeris({body: 'sun', ...});
 * const elevation = getAzimuthElevationFromEphemeris(
 *   sunEphemeris,
 *   '2026-01-21T06:30:00.000Z',
 *   'elevation'
 * );
 * // Returns: -6.2 (degrees below horizon, civil twilight)
 * ```
 */
export function getAzimuthElevationFromEphemeris(
  ephemeris: AzimuthElevationEphemeris,
  timestamp: string,
  fieldName: "azimuth" | "elevation",
): number {
  const data = ephemeris[timestamp];
  if (data?.[fieldName] === undefined) {
    throw new Error(`Missing ${fieldName} at ${timestamp}`);
  }
  return data[fieldName];
}

/**
 * Safely extracts illumination fraction from ephemeris for phase calculations.
 *
 * Provides type-safe access to illuminated fraction values used for detecting
 * lunar phases and planetary phase events.
 *
 * @param ephemeris - Illumination ephemeris indexed by ISO timestamp
 * @param timestamp - ISO 8601 timestamp string
 * @param fieldName - Field description (unused but kept for API consistency)
 * @returns Illuminated fraction as a decimal (0.0 to 1.0)
 * @throws When timestamp is missing from ephemeris
 * @throws When illumination value is undefined at timestamp
 *
 * @remarks
 * Illumination values:
 * - 0.0: New moon (not illuminated)
 * - 0.5: First/last quarter (half illuminated)
 * - 1.0: Full moon (fully illuminated)
 *
 * For inner planets (Venus, Mercury, Mars), illumination varies based on
 * their position relative to Earth and Sun.
 *
 * @see {@link getIlluminationEphemeris} for ephemeris retrieval
 * @see {@link getMonthlyLunarCycleEvents} for lunar phase detection
 * @see {@link getPlanetaryPhaseEvents} for planetary phase detection
 *
 * @example
 * ```typescript
 * const moonEphemeris = await getIlluminationEphemeris({body: 'moon', ...});
 * const illumination = getIlluminationFromEphemeris(
 *   moonEphemeris,
 *   '2026-01-21T12:00:00.000Z',
 *   'illumination'
 * );
 * // Returns: 0.87 (87% illuminated, waxing gibbous)
 * ```
 */
export function getIlluminationFromEphemeris(
  ephemeris: IlluminationEphemeris,
  timestamp: string,
  fieldName: string,
): number {
  const data = ephemeris[timestamp];
  if (data?.illumination === undefined) {
    throw new Error(`Missing ${fieldName} at ${timestamp}`);
  }
  return data.illumination;
}

/**
 * Safely extracts distance from Earth from ephemeris for apsis and phase calculations.
 *
 * Provides type-safe access to distance values used for detecting perihelion/aphelion
 * and determining planetary phase transitions.
 *
 * @param ephemeris - Distance ephemeris indexed by ISO timestamp
 * @param timestamp - ISO 8601 timestamp string
 * @param fieldName - Field description (unused but kept for API consistency)
 * @returns Distance from Earth in astronomical units (AU)
 * @throws When timestamp is missing from ephemeris
 * @throws When distance value is undefined at timestamp
 *
 * @remarks
 * Distance values are heliocentric for planets and geocentric for the Moon.
 * 1 AU ≈ 149,597,871 km (average Earth-Sun distance).
 *
 * Typical distances:
 * - Sun: 0.983-1.017 AU (perihelion-aphelion)
 * - Venus: 0.27-1.72 AU (varies greatly with orbital position)
 * - Mars: 0.37-2.68 AU (large variation due to orbital eccentricity)
 *
 * @see {@link getDistanceEphemeris} for ephemeris retrieval
 * @see {@link getSolarApsisEvents} for perihelion/aphelion detection
 *
 * @example
 * ```typescript
 * const sunEphemeris = await getDistanceEphemeris({body: 'sun', ...});
 * const distance = getDistanceFromEphemeris(
 *   sunEphemeris,
 *   '2026-01-21T12:00:00.000Z',
 *   'distance'
 * );
 * // Returns: 0.984 (AU, near perihelion)
 * ```
 */
export function getDistanceFromEphemeris(
  ephemeris: DistanceEphemeris,
  timestamp: string,
  fieldName: string,
): number {
  const data = ephemeris[timestamp];
  if (data?.distance === undefined) {
    throw new Error(`Missing ${fieldName} at ${timestamp}`);
  }
  return data.distance;
}

/**
 * Safely extracts angular diameter from ephemeris for eclipse calculations.
 *
 * Provides type-safe access to apparent angular diameter values used for
 * determining eclipse types (total vs. annular vs. partial).
 *
 * @param ephemeris - Diameter ephemeris indexed by ISO timestamp
 * @param timestamp - ISO 8601 timestamp string
 * @param fieldName - Field description (unused but kept for API consistency)
 * @returns Angular diameter in degrees
 * @throws When timestamp is missing from ephemeris
 * @throws When diameter value is undefined at timestamp
 *
 * @remarks
 * Angular diameter represents the apparent size of a body as seen from Earth.
 * Values are converted from arcseconds to degrees internally.
 *
 * Typical values:
 * - Sun: ~0.53° (31.6-32.7 arcminutes, varies with Earth's distance)
 * - Moon: ~0.52° (29.3-34.1 arcminutes, varies with lunar distance)
 *
 * Eclipse classification:
 * - Total solar eclipse: Moon's diameter \> Sun's diameter
 * - Annular solar eclipse: Moon's diameter \< Sun's diameter
 * - Total lunar eclipse: Moon fully within Earth's umbral shadow
 *
 * @see {@link getDiameterEphemeris} for ephemeris retrieval
 * @see {@link getEclipseEvents} for eclipse detection and classification
 *
 * @example
 * ```typescript
 * const moonEphemeris = await getDiameterEphemeris({body: 'moon', ...});
 * const diameter = getDiameterFromEphemeris(
 *   moonEphemeris,
 *   '2026-01-21T12:00:00.000Z',
 *   'diameter'
 * );
 * // Returns: 0.518 (degrees, ~31 arcminutes)
 * ```
 */
export function getDiameterFromEphemeris(
  ephemeris: DiameterEphemeris,
  timestamp: string,
  fieldName: string,
): number {
  const data = ephemeris[timestamp];
  if (data?.diameter === undefined) {
    throw new Error(`Missing ${fieldName} at ${timestamp}`);
  }
  return data.diameter;
}

function getHorizonsBaseUrl(args: {
  start: Date;
  end: Date;
  coordinates?: Coordinates;
}): URL {
  const { start, end, coordinates } = args;

  const url = new URL(horizonsUrl);

  url.searchParams.append("format", "text");
  url.searchParams.append("MAKE_EPHEM", "YES");
  url.searchParams.append("OBJ_DATA", "NO");

  url.searchParams.append("START_TIME", start.toISOString());
  url.searchParams.append("STOP_TIME", end.toISOString());
  url.searchParams.append("STEP_SIZE", `1m`);

  if (coordinates) {
    const [longitude, latitude] = coordinates;
    const siteCoords = `'${longitude},${latitude},0'`;
    url.searchParams.append("SITE_COORD", siteCoords);
  }

  return url;
}

// #region 💫 Orbit

function parseOrbitEphemeris(text: string): OrbitEphemeris {
  const ephemerisTable = text.split("$$SOE")[1]?.split("$$EOE")[0]?.trim();

  const datePattern = /\d{4}-[A-Za-z]{3}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{4})?/g;
  const pattern = new RegExp(
    `(${datePattern.source})${  String.raw`[\s\S]*?`  }(?=${datePattern.source}|$)`,
    "g",
  );

  const getPattern = (key: string): RegExp => {
    return new RegExp(String.raw`${key}.*?=.+?(\d+\.\d+(E[+-]\d{2})?)`, "g");
  };

  const orbitEphemeris: OrbitEphemeris = [
    ...(ephemerisTable?.matchAll(pattern) ?? []),
  ].reduce<OrbitEphemeris>((orbitEphemeris, match) => {
    const [fullMatch, dateString] = match;

    const date = moment
      .utc(dateString, ["YYYY-MMM-DD HH:mm:ss.SSSS", "YYYY-MMM-DD HH:mm:ss"])
      .toISOString();

    const ecMatch = [...fullMatch.matchAll(getPattern("EC"))][0]?.[1] ?? "";
    const qrMatch = [...fullMatch.matchAll(getPattern("QR"))][0]?.[1] ?? "";
    const inMatch = [...fullMatch.matchAll(getPattern("IN"))][0]?.[1] ?? "";
    const omMatch = [...fullMatch.matchAll(getPattern("OM"))][0]?.[1] ?? "";
    const wMatch = [...fullMatch.matchAll(getPattern("W"))][0]?.[1] ?? "";
    const tpMatch = [...fullMatch.matchAll(getPattern("Tp"))][0]?.[1] ?? "";
    const nMatch = [...fullMatch.matchAll(getPattern("N"))][0]?.[1] ?? "";
    const maMatch = [...fullMatch.matchAll(getPattern("MA"))][0]?.[1] ?? "";
    const taMatch = [...fullMatch.matchAll(getPattern("TA"))][0]?.[1] ?? "";
    const aMatch = [...fullMatch.matchAll(getPattern("A"))][0]?.[1] ?? "";
    const adMatch = [...fullMatch.matchAll(getPattern("AD"))][0]?.[1] ?? "";
    const prMatch = [...fullMatch.matchAll(getPattern("PR"))][0]?.[1] ?? "";

    return {
      ...orbitEphemeris,
      [date]: {
        argumentOfPerifocus: Number.parseFloat(wMatch),
        eccentricity: Number.parseFloat(ecMatch),
        inclination: Number.parseFloat(inMatch),
        timeOfPeriapsis: Number.parseFloat(tpMatch),
        longitudeOfAscendingNode: Number.parseFloat(omMatch),
        meanAnomaly: Number.parseFloat(maMatch),
        periapsisDistance: Number.parseFloat(qrMatch),
        meanMotion: Number.parseFloat(nMatch),
        trueAnomaly: Number.parseFloat(taMatch),
        semiMajorAxis: Number.parseFloat(aMatch),
        apoapsisDistance: Number.parseFloat(adMatch),
        siderealOrbitPeriod: Number.parseFloat(prMatch),
      },
    };
  }, {});

  return orbitEphemeris;
}

function getOrbitEphemerisUrl(args: {
  body: OrbitEphemerisBody;
  end: Date;
  start: Date;
}): URL {
  const { body, end, start } = args;

  const url = getHorizonsBaseUrl({ end, start });

  url.searchParams.append("EPHEM_TYPE", "ELEMENTS");
  url.searchParams.append("CENTER", "500@399");
  url.searchParams.append("COMMAND", commandIdByBody[body]);

  return url;
}

/**
 *
 */
export async function getOrbitEphemeris(args: {
  body: OrbitEphemerisBody;
  end: Date;
  start: Date;
  timezone: string;
}): Promise<OrbitEphemeris> {
  const { body, end, start, timezone } = args;

  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `orbit ephemeris 💫 for ${symbolByBody[body]} from ${timespan}`;

  console.log(`🌐 Fetching ${message}`);

  const url = getOrbitEphemerisUrl({ body, end, start });
  const text = await fetchWithRetry(url.toString());
  const orbitEphemeris = parseOrbitEphemeris(text);

  console.log(`🌐 Fetched ${message}`);

  return orbitEphemeris;
}

/**
 *
 */
export async function getNodeCoordinatesEphemeris(args: {
  end: Date;
  node: Node;
  start: Date;
  timezone: string;
}): Promise<CoordinateEphemeris> {
  const { end, node, start, timezone } = args;

  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `coordinate ephemeris 🎯 for ${symbolByBody[node]} from ${timespan}`;

  // Check if data exists in database
  console.log(`🔍 Querying database for ${message}`);
  const existingRecords = await getEphemerisRecords({
    body: node,
    start,
    end,
    type: "coordinate",
  });

  const expectedCount = getExpectedRecordCount(start, end);
  const hasAllValues = existingRecords.every(
    (record) => record.latitude && record.longitude,
  );
  if (existingRecords.length === expectedCount && hasAllValues) {
    console.log(`🛢️ Found complete database data for ${message}`);
    return convertRecordsToCoordinateEphemeris(existingRecords);
  } else if (existingRecords.length > 0) {
    console.log(
      `🛢️ Found incomplete database data (${existingRecords.length}/${expectedCount} records) for ${message}, fetching from API`,
    );
  }

  console.log(`🌐 Fetching ${message}`);

  const nodeOrbitEphemeris = await getOrbitEphemeris({
    body: "moon",
    start,
    end,
    timezone,
  });

  const nodeEphemeris: CoordinateEphemeris = _.mapValues(
    nodeOrbitEphemeris,
    (nodeOrbitEphemerisValue: OrbitEphemeris[string]) => {
      const { longitudeOfAscendingNode, argumentOfPerifocus } =
        nodeOrbitEphemerisValue;

      switch (node) {
        case "north lunar node": {
          return { longitude: longitudeOfAscendingNode, latitude: 0 };
        }
        case "south lunar node": {
          return {
            longitude: normalizeDegrees(longitudeOfAscendingNode + 180),
            latitude: 0,
          };
        }
        case "lunar perigee": {
          return {
            longitude: normalizeDegrees(
              longitudeOfAscendingNode + argumentOfPerifocus,
            ),
            latitude: 0,
          };
        }
        case "lunar apogee": {
          return {
            longitude: normalizeDegrees(
              longitudeOfAscendingNode + argumentOfPerifocus + 180,
            ),
            latitude: 0,
          };
        }
        default: {
          throw new Error(`Unknown node: ${node}`);
        }
      }
    },
  );

  console.log(`🌐 Fetched ${message}`);

  console.log(`🛢️ Upserting ${message}`);
  await upsertEphemerisValues(
    convertCoordinateEphemerisToRecords(node, nodeEphemeris),
  );
  console.log(`🛢️ Upserted ${message}`);

  return nodeEphemeris;
}

// #region 📐 Coordinates

function parseCoordinatesEphemeris(text: string): CoordinateEphemeris {
  const ephemerisTable = text.split("$$SOE")[1]?.split("$$EOE")[0]?.trim();
  if (!ephemerisTable) {
    throw new Error("No coordinate ephemeris data found");
  }

  const ephemeris: CoordinateEphemeris = ephemerisTable
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .reduce<CoordinateEphemeris>((ephemeris, ephemerisLine) => {
      const parts = ephemerisLine.trim().split(/\s+/);

      // Format: "YYYY-MMM-DD HH:mm longitude latitude"
      const dateString = `${parts[0]} ${parts[1]}`;
      const longitudeString = parts[2];
      const latitudeString = parts[3];

      const date = moment.utc(dateString, "YYYY-MMM-DD HH:mm").toDate();
      const latitude: Latitude = Number(latitudeString);
      const longitude: Longitude = Number(longitudeString);

      return { ...ephemeris, [date.toISOString()]: { latitude, longitude } };
    }, {});

  return ephemeris;
}

function convertCoordinateEphemerisToRecords(
  body: Body,
  coordinateEphemeris: CoordinateEphemeris,
): EphemerisRecord[] {
  return _.map(
    _.toPairs(coordinateEphemeris),
    ([timestampIso, { latitude, longitude }]) => ({
      body,
      timestamp: new Date(timestampIso),
      latitude,
      longitude,
    }),
  );
}

function convertRecordsToCoordinateEphemeris(
  records: EphemerisRecord[],
): CoordinateEphemeris {
  return records.reduce<CoordinateEphemeris>((acc, record) => {
    if (record.latitude === undefined || record.longitude === undefined) {
      throw new Error(
        `Record at ${record.timestamp.toISOString()} is missing latitude or longitude value`,
      );
    }
    return {
      ...acc,
      [record.timestamp.toISOString()]: {
        latitude: record.latitude,
        longitude: record.longitude,
      },
    };
  }, {});
}

function getCoordinatesEphemerisUrl(args: {
  body: Planet | Asteroid | Comet;
  start: Date;
  end: Date;
}): URL {
  const { body, start, end } = args;

  const url = getHorizonsBaseUrl({ start, end });

  url.searchParams.append("EPHEM_TYPE", "OBSERVER");
  url.searchParams.append("QUANTITIES", QUANTITY_ECLIPTIC_LONGITUDE_LATITUDE);
  url.searchParams.append("CENTER", "500@399"); // earth
  url.searchParams.append("COMMAND", commandIdByBody[body]);

  return url;
}

/**
 *
 */
export async function getCoordinatesEphemeris(args: {
  body: Planet | Asteroid | Comet;
  start: Date;
  end: Date;
  timezone: string;
}): Promise<CoordinateEphemeris> {
  const { body, start, end, timezone } = args;

  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `coordinate ephemeris 🎯 for ${symbolByBody[body]} from ${timespan}`;

  // Check if data exists in database
  console.log(`🔍 Querying database for ${message}`);
  const existingRecords = await getEphemerisRecords({
    body,
    start,
    end,
    type: "coordinate",
  });

  const expectedCount = getExpectedRecordCount(start, end);
  const hasAllValues = existingRecords.every(
    (record) => record.latitude !== undefined && record.longitude !== undefined,
  );
  if (existingRecords.length === expectedCount && hasAllValues) {
    console.log(`🛢️ Found complete database data for ${message}`);
    return convertRecordsToCoordinateEphemeris(existingRecords);
  } else {
    console.log(
      `🛢️ Found incomplete database data (${existingRecords.length}/${expectedCount} records) for ${message}, fetching from API`,
    );
  }

  console.log(`🌐 Fetching ${message}`);

  const url = getCoordinatesEphemerisUrl({ body, start, end });
  const text = await fetchWithRetry(url.toString());
  const ephemeris = parseCoordinatesEphemeris(text);

  console.log(`🌐 Fetched ${message}`);

  console.log(`🛢️ Upserting ${message}`);
  await upsertEphemerisValues(
    convertCoordinateEphemerisToRecords(body, ephemeris),
  );
  console.log(`🛢️ Upserted ${message}`);

  return ephemeris;
}

function isNode(body: string): body is Node {
  return nodes.includes(body as Node);
}

/**
 *
 */
export async function getCoordinateEphemerisByBody(args: {
  bodies: Body[];
  start: Date;
  end: Date;
  timezone: string;
}): Promise<Record<Body, CoordinateEphemeris>> {
  const { bodies, start, end, timezone } = args;

  const bodiesString = bodies.map((body: Body) => symbolByBody[body]).join(" ");
  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `coordinate ephemerides 🎯 for ${bodiesString} from ${timespan}`;

  console.log(`🔭 Getting ${message}`);

  const coordinateEphemerisByBody = {} as Record<Body, CoordinateEphemeris>;

  for (const body of bodies) {
    coordinateEphemerisByBody[body] = await (isNode(body) ? getNodeCoordinatesEphemeris({
        end,
        node: body,
        start,
        timezone,
      }) : getCoordinatesEphemeris({
        body,
        end,
        start,
        timezone,
      }));
  }

  console.log(`🔭 Got ${message}`);

  return coordinateEphemerisByBody;
}

// #region ⏫ Azimuth Elevation

function parseAzimuthElevationEphemeris(
  text: string,
): AzimuthElevationEphemeris {
  const ephemerisTable = text.split("$$SOE")[1]?.split("$$EOE")[0]?.trim();
  if (!ephemerisTable) {
    throw new Error("No azimuth elevation ephemeris data found");
  }

  const ephemeris: AzimuthElevationEphemeris = ephemerisTable
    .split("\n ")
    .reduce<AzimuthElevationEphemeris>((ephemeris, ephemerisLine) => {
      const regexString = String.raw`${dateRegex.source}.+?${decimalRegex.source}\s+?${decimalRegex.source}`;
      const azimuthElevationRegex = new RegExp(regexString);

      const match = ephemerisLine.match(azimuthElevationRegex);

      if (!match) {
        return ephemeris;
      }

      const [, dateString, azimuthString, elevationString] = match;

      const date = moment.utc(dateString, "YYYY-MMM-DD HH:mm").toDate();
      const elevation = Number(elevationString);
      const azimuth = Number(azimuthString);

      return { ...ephemeris, [date.toISOString()]: { elevation, azimuth } };
    }, {});

  return ephemeris;
}

function convertAzimuthElevationEphemerisToRecords(
  body: Body,
  azimuthElevationEphemeris: AzimuthElevationEphemeris,
): EphemerisRecord[] {
  return _.map(
    _.toPairs(azimuthElevationEphemeris),
    ([timestampIso, { azimuth, elevation }]) => ({
      body,
      timestamp: new Date(timestampIso),
      azimuth,
      elevation,
    }),
  );
}

function convertRecordsToAzimuthElevationEphemeris(
  records: EphemerisRecord[],
): AzimuthElevationEphemeris {
  return records.reduce<AzimuthElevationEphemeris>((acc, record) => {
    if (record.azimuth === undefined || record.elevation === undefined) {
      throw new Error(
        `Record at ${record.timestamp.toISOString()} is missing azimuth or elevation value`,
      );
    }
    return {
      ...acc,
      [record.timestamp.toISOString()]: {
        azimuth: record.azimuth,
        elevation: record.elevation,
      },
    };
  }, {});
}

function getAzimuthElevationEphemerisUrl(args: {
  body: AzimuthElevationEphemerisBody;
  coordinates: Coordinates;
  end: Date;
  start: Date;
}): URL {
  const { body, coordinates, end, start } = args;

  const url = getHorizonsBaseUrl({ start, end, coordinates });

  url.searchParams.append("EPHEM_TYPE", "OBSERVER");
  url.searchParams.append("QUANTITIES", QUANTITY_APPARENT_AZIMUTH_ELEVATION);
  url.searchParams.append("CENTER", "coord@399"); // earth, specific location
  url.searchParams.append("COMMAND", commandIdByBody[body]);

  return url;
}

/**
 *
 */
export async function getAzimuthElevationEphemeris(args: {
  body: AzimuthElevationEphemerisBody;
  coordinates: Coordinates;
  end: Date;
  start: Date;
  timezone: string;
}): Promise<AzimuthElevationEphemeris> {
  const { body, coordinates, end, start, timezone } = args;

  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `azimuth elevation ephemeris ⏫ for ${symbolByBody[body]} from ${timespan}`;

  // Check if data exists in database
  console.log(`🔍 Querying database for ${message}`);
  const existingRecords = await getEphemerisRecords({
    body,
    start,
    end,
    type: "azimuthElevation",
  });

  const expectedCount = getExpectedRecordCount(start, end);
  const hasAllValues = existingRecords.every(
    (record) => record.azimuth !== undefined && record.elevation !== undefined,
  );
  if (existingRecords.length === expectedCount && hasAllValues) {
    console.log(`🛢️ Found complete database data for ${message}`);
    return convertRecordsToAzimuthElevationEphemeris(existingRecords);
  } else {
    console.log(
      `🛢️ Found incomplete database data (${existingRecords.length}/${expectedCount} records) for ${message}, fetching from API`,
    );
  }

  console.log(`🌐 Fetching ${message}`);

  const url = getAzimuthElevationEphemerisUrl({
    start,
    end,
    coordinates,
    body,
  });
  const text = await fetchWithRetry(url.toString());
  const ephemeris = parseAzimuthElevationEphemeris(text);

  console.log(`🌐 Fetched ${message}`);

  console.log(`🛢️ Upserting ${message}`);
  await upsertEphemerisValues(
    convertAzimuthElevationEphemerisToRecords(body, ephemeris),
  );
  console.log(`🛢️ Upserted ${message}`);

  return ephemeris;
}

/**
 *
 */
export async function getAzimuthElevationEphemerisByBody(args: {
  bodies: AzimuthElevationEphemerisBody[];
  start: Date;
  end: Date;
  coordinates: Coordinates;
  timezone: string;
}): Promise<Record<Body, AzimuthElevationEphemeris>> {
  const { bodies, start, end, coordinates, timezone } = args;

  const bodiesString = bodies.map((body: Body) => symbolByBody[body]).join(" ");
  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `azimuth elevation ephemerides ⏫ for ${bodiesString} from ${timespan}`;

  console.log(`🔭 Getting ${message}`);

  const azimuthElevationEphemerisByBody = {} as Record<
    Body,
    AzimuthElevationEphemeris
  >;
  for (const body of bodies) {
    azimuthElevationEphemerisByBody[body] = await getAzimuthElevationEphemeris({
      body,
      end,
      start,
      coordinates,
      timezone,
    });
  }

  console.log(`🔭 Got ${message}`);

  return azimuthElevationEphemerisByBody;
}

// #region 🌒 Illumination

function parseIlluminationEphemeris(text: string): IlluminationEphemeris {
  const ephemerisTable = text.split("$$SOE")[1]?.split("$$EOE")[0]?.trim();
  if (!ephemerisTable) {
    throw new Error("No illumination ephemeris data found");
  }

  const ephemeris: IlluminationEphemeris = ephemerisTable
    .split("\n ")
    .reduce<IlluminationEphemeris>((ephemeris, ephemerisLine) => {
      const regexString = `${dateRegex.source}.+?${decimalRegex.source}`;
      const illuminatedFractionRegex = new RegExp(regexString);

      const match = ephemerisLine.match(illuminatedFractionRegex);

      if (!match) {
        return ephemeris;
      }

      const [, dateString, illuminationString] = match;

      const date = moment.utc(dateString, "YYYY-MMM-DD HH:mm").toDate();
      const illumination = Number(illuminationString);

      return { ...ephemeris, [date.toISOString()]: { illumination } };
    }, {});

  return ephemeris;
}

function convertIlluminationEphemerisToRecords(
  body: Body,
  illuminationEphemeris: IlluminationEphemeris,
): EphemerisRecord[] {
  return _.map(
    _.toPairs(illuminationEphemeris),
    ([timestampIso, { illumination }]) => ({
      body,
      timestamp: new Date(timestampIso),
      illumination,
    }),
  );
}

function convertRecordsToIlluminationEphemeris(
  records: EphemerisRecord[],
): IlluminationEphemeris {
  return records.reduce<IlluminationEphemeris>((acc, record) => {
    if (record.illumination === undefined) {
      throw new Error(
        `Record at ${record.timestamp.toISOString()} is missing illumination value`,
      );
    }
    return {
      ...acc,
      [record.timestamp.toISOString()]: {
        illumination: record.illumination,
      },
    };
  }, {});
}

function getIlluminationEphemerisUrl(args: {
  body: IlluminationEphemerisBody;
  start: Date;
  end: Date;
  coordinates: Coordinates;
}): URL {
  const { body, start, end, coordinates } = args;

  const url = getHorizonsBaseUrl({ start, end, coordinates });

  url.searchParams.append("EPHEM_TYPE", "OBSERVER");
  url.searchParams.append("QUANTITIES", QUANTITY_ILLUMINATED_FRACTION);
  url.searchParams.append("CENTER", "500@399"); // earth, geocentric
  url.searchParams.append("COMMAND", commandIdByBody[body]);

  return url;
}

/**
 *
 */
export async function getIlluminationEphemeris(args: {
  body: IlluminationEphemerisBody;
  coordinates: Coordinates;
  end: Date;
  start: Date;
  timezone: string;
}): Promise<IlluminationEphemeris> {
  const { body, start, end, coordinates, timezone } = args;

  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `illumination ephemeris 🌕 for ${symbolByBody[body]} from ${timespan}`;

  // Check if data exists in database
  console.log(`🔍 Querying database for ${message}`);
  const existingRecords = await getEphemerisRecords({
    body,
    start,
    end,
    type: "illumination",
  });

  const expectedCount = getExpectedRecordCount(start, end);
  const hasAllValues = existingRecords.every(
    (record) => record.illumination !== undefined,
  );
  if (existingRecords.length === expectedCount && hasAllValues) {
    console.log(`🛢️ Found complete database data for ${message}`);
    return convertRecordsToIlluminationEphemeris(existingRecords);
  } else {
    console.log(
      `🛢️ Found incomplete database data (${existingRecords.length}/${expectedCount} records) for ${message}, fetching from API`,
    );
  }

  console.log(`🌐 Fetching ${message}`);

  const url = getIlluminationEphemerisUrl({
    body,
    start,
    end,
    coordinates,
  });
  const text = await fetchWithRetry(url.toString());
  const ephemeris = parseIlluminationEphemeris(text);

  console.log(`🌐 Fetched ${message}`);

  console.log(`🛢️ Upserting ${message}`);
  await upsertEphemerisValues(
    convertIlluminationEphemerisToRecords(body, ephemeris),
  );
  console.log(`🛢️ Upserted ${message}`);

  return ephemeris;
}

/**
 *
 */
export async function getIlluminationEphemerisByBody(args: {
  bodies: IlluminationEphemerisBody[];
  start: Date;
  end: Date;
  coordinates: Coordinates;
  timezone: string;
}): Promise<Record<Body, IlluminationEphemeris>> {
  const { bodies, start, end, coordinates, timezone } = args;

  const bodiesString = bodies.map((body: Body) => symbolByBody[body]).join(" ");
  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `illumination ephemerides 🌕 for ${bodiesString} from ${timespan}`;
  console.log(`🔭 Getting ${message}`);

  const illuminationEphemerisByBody = {} as Record<Body, IlluminationEphemeris>;
  for (const body of bodies) {
    illuminationEphemerisByBody[body] = await getIlluminationEphemeris({
      body,
      end,
      start,
      coordinates,
      timezone,
    });
  }

  console.log(`🔭 Got ${message}`);

  return illuminationEphemerisByBody;
}

// #region 🛟 Diameter

function parseDiameterEphemeris(text: string): DiameterEphemeris {
  const ephemerisTable = text.split("$$SOE")[1]?.split("$$EOE")[0]?.trim();
  if (!ephemerisTable) {
    throw new Error("No diameter ephemeris data found");
  }

  const diameterEphemeris: DiameterEphemeris = ephemerisTable
    .split("\n ")
    .reduce<DiameterEphemeris>((diameterEphemeris, ephemerisLine) => {
      const regexString = `${dateRegex.source}.+?${decimalRegex.source}`;
      const diameterRegex = new RegExp(regexString);

      const match = ephemerisLine.match(diameterRegex);

      if (!match) {
        return diameterEphemeris;
      }

      const [, dateString, diameterString] = match;

      const date = moment.utc(dateString, "YYYY-MMM-DD HH:mm").toDate();
      const diameterArcseconds = Number(diameterString);
      const diameter = diameterArcseconds / arcsecondsPerDegree;

      return { ...diameterEphemeris, [date.toISOString()]: { diameter } };
    }, {});

  return diameterEphemeris;
}

function convertDiameterEphemerisToRecords(
  body: Body,
  diameterEphemeris: DiameterEphemeris,
): EphemerisRecord[] {
  return _.map(
    _.toPairs(diameterEphemeris),
    ([timestampIso, { diameter }]) => ({
      body,
      timestamp: new Date(timestampIso),
      diameter,
    }),
  );
}

function convertRecordsToDiameterEphemeris(
  records: EphemerisRecord[],
): DiameterEphemeris {
  return records.reduce<DiameterEphemeris>((acc, record) => {
    if (record.diameter === undefined) {
      throw new Error(
        `Record at ${record.timestamp.toISOString()} is missing diameter value`,
      );
    }
    return {
      ...acc,
      [record.timestamp.toISOString()]: {
        diameter: record.diameter,
      },
    };
  }, {});
}

function getDiameterEphemerisUrl(args: {
  start: Date;
  end: Date;
  body: DiameterEphemerisBody;
}): URL {
  const { start, end, body } = args;

  const url = getHorizonsBaseUrl({ start, end });

  url.searchParams.append("EPHEM_TYPE", "OBSERVER");
  url.searchParams.append("QUANTITIES", QUANTITY_ANGULAR_DIAMETER);
  url.searchParams.append("CENTER", "500@399"); // earth, geocentric
  url.searchParams.append("COMMAND", commandIdByBody[body]);

  return url;
}

/**
 *
 */
export async function getDiameterEphemeris(args: {
  start: Date;
  end: Date;
  body: DiameterEphemerisBody;
  timezone: string;
}): Promise<DiameterEphemeris> {
  const { start, end, body, timezone } = args;

  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `diameter ephemeris 🛟 for ${symbolByBody[body]} from ${timespan}`;

  // Check if data exists in database
  console.log(`🔍 Querying database for ${message}`);
  const existingRecords = await getEphemerisRecords({
    body,
    start,
    end,
    type: "diameter",
  });

  const expectedCount = getExpectedRecordCount(start, end);
  const hasAllValues = existingRecords.every(
    (record) => record.diameter !== undefined,
  );
  if (existingRecords.length === expectedCount && hasAllValues) {
    console.log(`🛢️ Found complete database data for ${message}`);
    return convertRecordsToDiameterEphemeris(existingRecords);
  } else {
    console.log(
      `🛢️ Found incomplete database data (${existingRecords.length}/${expectedCount} records) for ${message}, fetching from API`,
    );
  }

  console.log(`🌐 Fetching ${message}`);

  const url = getDiameterEphemerisUrl({ start, end, body });
  const text = await fetchWithRetry(url.toString());
  const ephemeris = parseDiameterEphemeris(text);

  console.log(`🌐 Fetched ${message}`);

  console.log(`🛢️ Upserting ${message}`);
  await upsertEphemerisValues(
    convertDiameterEphemerisToRecords(body, ephemeris),
  );
  console.log(`🛢️ Upserted ${message}`);

  return ephemeris;
}

/**
 *
 */
export async function getDiameterEphemerisByBody(args: {
  bodies: DiameterEphemerisBody[];
  start: Date;
  end: Date;
  timezone: string;
}): Promise<Record<Body, DiameterEphemeris>> {
  const { bodies, start, end, timezone } = args;

  const bodiesString = bodies.map((body: Body) => symbolByBody[body]).join(" ");
  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `diameter ephemerides 🛟 for ${bodiesString} from ${timespan}`;
  console.log(`🔭 Getting ${message}`);

  const diameterEphemerisByBody = {} as Record<Body, DiameterEphemeris>;
  for (const body of bodies) {
    diameterEphemerisByBody[body] = await getDiameterEphemeris({
      body,
      end,
      start,
      timezone,
    });
  }

  console.log(`🔭 Got ${message}`);

  return diameterEphemerisByBody;
}

// #region 📏 Distance

function parseDistanceEphemeris(text: string): DistanceEphemeris {
  const ephemerisTable = text.split("$$SOE")[1]?.split("$$EOE")[0]?.trim();
  if (!ephemerisTable) {
    throw new Error("No distance ephemeris data found");
  }

  const ephemeris: DistanceEphemeris = ephemerisTable
    .split("\n ")
    .reduce<DistanceEphemeris>((ephemeris, ephemerisLine) => {
      const regexString = String.raw`${dateRegex.source}.+?${decimalRegex.source}\s+?${decimalRegex.source}`;
      const distanceRegex = new RegExp(regexString);

      const match = ephemerisLine.match(distanceRegex);

      if (!match) {
        return ephemeris;
      }

      const [, dateString, distanceString, rangeRateString] = match;

      const date = moment.utc(dateString, "YYYY-MMM-DD HH:mm").toDate();
      const range = Number(rangeRateString);
      const distance = Number(distanceString);

      return { ...ephemeris, [date.toISOString()]: { range, distance } };
    }, {});

  return ephemeris;
}

function convertDistanceEphemerisToRecords(
  body: Body,
  distanceEphemeris: DistanceEphemeris,
): EphemerisRecord[] {
  return _.map(
    _.toPairs(distanceEphemeris),
    ([timestampIso, { distance }]) => ({
      body,
      timestamp: new Date(timestampIso),
      distance,
    }),
  );
}

function convertRecordsToDistanceEphemeris(
  records: EphemerisRecord[],
): DistanceEphemeris {
  return records.reduce<DistanceEphemeris>((acc, record) => {
    if (record.distance === undefined) {
      throw new Error(
        `Record at ${record.timestamp.toISOString()} is missing distance value`,
      );
    }
    return {
      ...acc,
      [record.timestamp.toISOString()]: {
        distance: record.distance,
        range: 0, // Note: range is not stored in database, using 0 as placeholder
      },
    };
  }, {});
}

function getDistanceEphemerisUrl(args: {
  body: DistanceEphemerisBody;
  end: Date;
  start: Date;
}): URL {
  const { body, end, start } = args;

  const url = getHorizonsBaseUrl({ start, end });

  url.searchParams.append("EPHEM_TYPE", "OBSERVER");
  url.searchParams.append("QUANTITIES", QUANTITY_RANGE_RATE);
  url.searchParams.append("CENTER", "500@399"); // earth, geocentric
  url.searchParams.append("COMMAND", commandIdByBody[body]);

  return url;
}

/**
 *
 */
export async function getDistanceEphemeris(args: {
  body: DistanceEphemerisBody;
  end: Date;
  start: Date;
  timezone: string;
}): Promise<DistanceEphemeris> {
  const { body, end, start, timezone } = args;

  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `distance ephemeris 📏 for ${symbolByBody[body]} from ${timespan}`;

  // Check if data exists in database
  console.log(`🔍 Querying database for ${message}`);
  const existingRecords = await getEphemerisRecords({
    body,
    start,
    end,
    type: "distance",
  });

  const expectedCount = getExpectedRecordCount(start, end);
  const hasAllValues = existingRecords.every(
    (record) => record.distance !== undefined,
  );
  if (existingRecords.length === expectedCount && hasAllValues) {
    console.log(`🛢️ Found complete database data for ${message}`);
    return convertRecordsToDistanceEphemeris(existingRecords);
  } else {
    console.log(
      `🛢️ Found incomplete database data (${existingRecords.length}/${expectedCount} records) for ${message}, fetching from API`,
    );
  }

  console.log(`🌐 Fetching ${message}`);

  const url = getDistanceEphemerisUrl({ body, end, start });
  const text = await fetchWithRetry(url.toString());
  const ephemeris = parseDistanceEphemeris(text);

  console.log(`🌐 Fetched ${message}`);

  console.log(`🛢️ Upserting ${message}`);
  await upsertEphemerisValues(
    convertDistanceEphemerisToRecords(body, ephemeris),
  );
  console.log(`🛢️ Upserted ${message}`);

  return ephemeris;
}

/**
 *
 */
export async function getDistanceEphemerisByBody(args: {
  bodies: DistanceEphemerisBody[];
  start: Date;
  end: Date;
  timezone: string;
}): Promise<Record<Body, DistanceEphemeris>> {
  const { bodies, start, end, timezone } = args;

  const bodiesString = bodies.map((body: Body) => symbolByBody[body]).join(" ");
  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `distance ephemerides 📏 for ${bodiesString} from ${timespan}`;

  console.log(`🔭 Getting ${message}`);

  const distanceEphemerisByBody = {} as Record<Body, DistanceEphemeris>;
  for (const body of bodies) {
    distanceEphemerisByBody[body] = await getDistanceEphemeris({
      body,
      end,
      start,
      timezone,
    });
  }

  console.log(`🔭 Got ${message}`);

  return distanceEphemerisByBody;
}
