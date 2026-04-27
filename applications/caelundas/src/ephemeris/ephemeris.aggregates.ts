/**
 * Ephemeris data aggregation for multi-body calculations across date ranges.
 *
 * This module coordinates the retrieval of various ephemeris types (coordinates,
 * azimuth/elevation, illumination, diameter, distance) for all celestial bodies
 * tracked by caelundas. It acts as a high-level interface to the ephemeris service,
 * fetching all data needed for a complete astronomical calendar generation.
 *
 * @remarks
 * Ephemeris types:
 * - Coordinate ephemeris: Ecliptic longitude and latitude for aspect calculations
 * - Azimuth/elevation ephemeris: Horizon coordinates for rise/set/culmination events
 * - Illumination ephemeris: Illuminated fraction for phase detection
 * - Diameter ephemeris: Angular diameter for eclipse calculations
 * - Distance ephemeris: Distance from Earth for phase and apsis detection
 *
 * @see {@link getEphemerides} for main aggregation function
 * @see {@link ./ephemeris.service#} for individual ephemeris queries
 * @see {@link ./ephemeris.types#} for ephemeris data structures
 */

import { bodies } from "../constants";

import { computeAllEphemerides } from "./ephemeris.service";

import type {
  AzimuthElevationEphemeris,
  CoordinateEphemeris,
  Coordinates,
  DiameterEphemeris,
  DistanceEphemeris,
  IlluminationEphemeris,
} from "../ephemeris/ephemeris.types";
import type { Body } from "../types";
import type { Moment } from "moment-timezone";

// #region getEphemerides
/**
 * Aggregates all ephemeris data types for all relevant bodies across a date range.
 *
 * This function coordinates multiple ephemeris queries to NASA JPL Horizons,
 * retrieving all data needed for comprehensive astronomical event detection.
 * Results are organized by body for efficient lookup during event generation.
 *
 * @param args - Ephemeris query parameters
 * @param coordinates - Observer location [longitude, latitude] in degrees
 * @param start - Range start date (inclusive)
 * @param end - Range end date (inclusive)
 * @param timezone - IANA timezone identifier for the observer
 * @returns Object containing ephemeris data organized by body and type
 *
 * @remarks
 * Data retrieval strategy:
 * - Coordinate ephemeris: All bodies (needed for aspects and ingresses)
 * - Diameter ephemeris: Sun and Moon only (needed for eclipse calculations)
 * - Illumination ephemeris: Moon and inner planets (needed for phases)
 * - Distance ephemeris: Sun and inner planets (needed for apsides and phases)
 * - Azimuth/elevation ephemeris: Sun and Moon only (needed for daily cycles)
 *
 * All queries use 1-minute interval sampling for high temporal resolution.
 * Data is cached in SQLite to minimize redundant API calls.
 *
 * @throws When NASA JPL Horizons API is unavailable
 * @throws When date range exceeds ephemeris data availability
 *
 * @see {@link getCoordinateEphemerisByBody} for coordinate ephemeris retrieval
 * @see {@link getAzimuthElevationEphemerisByBody} for horizon coordinate retrieval
 * @see {@link getIlluminationEphemerisByBody} for illumination data
 * @see {@link getDiameterEphemerisByBody} for angular diameter data
 * @see {@link getDistanceEphemerisByBody} for distance data
 *
 * @example
 * ```typescript
 * const ephemerides = await getEphemerides({
 *   coordinates: [-74.0060, 40.7128], // New York City
 *   start: moment.tz('2026-01-21T00:00:00', 'America/New_York'),
 *   end: moment.tz('2026-01-22T00:00:00', 'America/New_York'),
 *   timezone: 'America/New_York',
 * });
 *
 * // Access Moon's ecliptic longitude at specific timestamp
 * const moonLongitude = ephemerides.coordinateEphemerisByBody.moon['2026-01-21T12:00:00.000Z'].longitude;
 *
 * // Access Sun's elevation for sunrise calculation
 * const sunElevation = ephemerides.azimuthElevationEphemerisByBody.sun['2026-01-21T06:30:00.000Z'].elevation;
 * ```
 */
export function getEphemerides(args: {
  coordinates: Coordinates;
  end: Moment;
  start: Moment;
  timezone: string;
}): {
  azimuthElevationEphemerisByBody: Record<Body, AzimuthElevationEphemeris>;
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  diameterEphemerisByBody: Record<Body, DiameterEphemeris>;
  distanceEphemerisByBody: Record<Body, DistanceEphemeris>;
  illuminationEphemerisByBody: Record<Body, IlluminationEphemeris>;
} {
  const { coordinates, end, start } = args;

  return computeAllEphemerides({
    coordinateBodies: bodies,
    azimuthElevationBodies: ["sun", "moon"],
    illuminationBodies: ["moon", "mercury", "venus", "mars"],
    diameterBodies: ["sun", "moon"],
    distanceBodies: ["sun", "mercury", "venus", "mars"],
    coordinates,
    start,
    end,
  });
}
