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
 * @see {@link ./ephemeris.service} for individual ephemeris queries
 * @see {@link ./ephemeris.types} for ephemeris data structures
 */

import { bodies } from "../constants";
import {
  getAzimuthElevationEphemerisByBody,
  getCoordinateEphemerisByBody,
  getDiameterEphemerisByBody,
  getDistanceEphemerisByBody,
  getIlluminationEphemerisByBody,
} from "../ephemeris/ephemeris.service";

import type {
  AzimuthElevationEphemeris,
  AzimuthElevationEphemerisBody,
  CoordinateEphemeris,
  CoordinateEphemerisBody,
  Coordinates,
  DiameterEphemeris,
  DiameterEphemerisBody,
  DistanceEphemeris,
  DistanceEphemerisBody,
  IlluminationEphemeris,
  IlluminationEphemerisBody,
} from "../ephemeris/ephemeris.types";
import type { Body } from "../types";

// #region getEphemerides
/**
 * Aggregates all ephemeris data types for all relevant bodies across a date range.
 *
 * This function coordinates multiple ephemeris queries to NASA JPL Horizons,
 * retrieving all data needed for comprehensive astronomical event detection.
 * Results are organized by body for efficient lookup during event generation.
 *
 * @param args - Ephemeris query parameters
 * @param args.coordinates - Observer location [longitude, latitude] in degrees
 * @param args.start - Range start date (inclusive)
 * @param args.end - Range end date (inclusive)
 * @param args.timezone - IANA timezone identifier for the observer
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
 * @throws {Error} When NASA JPL Horizons API is unavailable
 * @throws {Error} When date range exceeds ephemeris data availability
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
 *   start: new Date('2026-01-21T00:00:00'),
 *   end: new Date('2026-01-22T00:00:00'),
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
export async function getEphemerides(args: {
  coordinates: Coordinates;
  end: Date;
  start: Date;
  timezone: string;
}): Promise<{
  azimuthElevationEphemerisByBody: Record<Body, AzimuthElevationEphemeris>;
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  diameterEphemerisByBody: Record<Body, DiameterEphemeris>;
  distanceEphemerisByBody: Record<Body, DistanceEphemeris>;
  illuminationEphemerisByBody: Record<Body, IlluminationEphemeris>;
}> {
  const { coordinates, end, start, timezone } = args;

  // Fetch coordinate ephemeris for all bodies
  const coordinateEphemerisBodies: CoordinateEphemerisBody[] = bodies;

  // Fetch diameter ephemeris for sun and moon (needed for eclipses)
  const diameterEphemerisBodies: DiameterEphemerisBody[] = ["sun", "moon"];

  // Fetch illumination ephemeris for moon and inner planets (needed for phases)
  const illuminationEphemerisBodies: IlluminationEphemerisBody[] = [
    "moon",
    "mercury",
    "venus",
    "mars",
  ];

  // Fetch distance ephemeris for sun and inner planets (needed for apsides and phases)
  const distanceEphemerisBodies: DistanceEphemerisBody[] = [
    "sun",
    "mercury",
    "venus",
    "mars",
  ];

  // Fetch azimuth/elevation ephemeris for sun and moon (needed for daily cycles)
  const azimuthElevationEphemerisBodies: AzimuthElevationEphemerisBody[] = [
    "sun",
    "moon",
  ];

  const coordinateEphemerisByBody = await getCoordinateEphemerisByBody({
    bodies: coordinateEphemerisBodies,
    start,
    end,
    timezone,
  });

  const azimuthElevationEphemerisByBody =
    await getAzimuthElevationEphemerisByBody({
      bodies: azimuthElevationEphemerisBodies,
      start,
      end,
      coordinates,
      timezone,
    });

  const illuminationEphemerisByBody = await getIlluminationEphemerisByBody({
    bodies: illuminationEphemerisBodies,
    start,
    end,
    coordinates,
    timezone,
  });

  const diameterEphemerisByBody = await getDiameterEphemerisByBody({
    bodies: diameterEphemerisBodies,
    start,
    end,
    timezone,
  });

  const distanceEphemerisByBody = await getDistanceEphemerisByBody({
    bodies: distanceEphemerisBodies,
    start,
    end,
    timezone,
  });

  return {
    azimuthElevationEphemerisByBody,
    coordinateEphemerisByBody,
    diameterEphemerisByBody,
    distanceEphemerisByBody,
    illuminationEphemerisByBody,
  };
}
