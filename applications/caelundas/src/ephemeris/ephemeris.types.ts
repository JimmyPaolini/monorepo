import type { Body } from "../types";

/**
 * Ecliptic latitude in degrees.
 * Range: -90° (south) to +90° (north) from the ecliptic plane.
 */
export type Latitude = number;

/**
 * Ecliptic longitude in degrees.
 * Range: 0° to 360° along the ecliptic, starting from the vernal equinox.
 */
export type Longitude = number;

/**
 * Coordinate pair representing a position on the celestial sphere.
 * Format: [longitude, latitude] in degrees.
 */
export type Coordinates = [Longitude, Latitude];

/**
 * Time-indexed ephemeris of ecliptic coordinates for a celestial body.
 *
 * Keys are ISO 8601 timestamp strings, values contain longitude and latitude
 * in degrees. Used for tracking body positions through the zodiac.
 *
 * @see {@link getCoordinateFromEphemeris} for data retrieval
 */
export type CoordinateEphemeris = Record<
  string,
  { longitude: number; latitude: number }
>;

/**
 * Time-indexed ephemeris of orbital elements.
 *
 * Contains Keplerian orbital elements at each timestamp, used for
 * detailed orbital mechanics calculations.
 *
 * @remarks
 * Currently only used for lunar orbit calculations.
 */
export type OrbitEphemeris = Record<
  string,
  {
    argumentOfPerifocus: number;
    eccentricity: number;
    inclination: number;
    timeOfPeriapsis: number;
    longitudeOfAscendingNode: number;
    meanAnomaly: number;
    periapsisDistance: number;
    meanMotion: number;
    trueAnomaly: number;
    semiMajorAxis: number;
    apoapsisDistance: number;
    siderealOrbitPeriod: number;
  }
>;

/**
 * Time-indexed ephemeris of horizontal coordinates (observer frame).
 *
 * Keys are ISO timestamps, values contain azimuth and elevation in degrees.
 * Used for calculating rise, set, and culmination events.
 *
 * @see {@link getAzimuthElevationFromEphemeris} for data retrieval
 */
export type AzimuthElevationEphemeris = Record<
  string,
  { azimuth: number; elevation: number }
>;

/**
 * Time-indexed ephemeris of illumination fraction.
 *
 * Keys are ISO timestamps, values are illumination percentages (0-100).
 * Used for lunar phase and planetary phase calculations.
 */
export type IlluminationEphemeris = Record<string, { illumination: number }>;

/**
 * Time-indexed ephemeris of observer-body distance.
 *
 * Keys are ISO timestamps, values are distances in astronomical units (AU).
 * Used for apsis detection (perihelion/aphelion, perigee/apogee).
 */
export type DistanceEphemeris = Record<string, { distance: number }>;

/**
 * Time-indexed ephemeris of apparent angular diameter.
 *
 * Keys are ISO timestamps, values are angular diameters in degrees.
 * Used for eclipse predictions and occultation calculations.
 */
export type DiameterEphemeris = Record<string, { diameter: number }>;

/**
 * Bodies for which coordinate ephemerides are generated.
 * Includes all tracked planets, asteroids, comets, and lunar nodes.
 */
export type CoordinateEphemerisBody = Body;

/**
 * Bodies for which orbital element ephemerides are generated.
 * Currently limited to the Moon.
 */
export type OrbitEphemerisBody = Extract<Body, "moon">;

/**
 * Bodies for which azimuth/elevation ephemerides are generated.
 * Limited to Sun and Moon for rise/set calculations.
 */
export type AzimuthElevationEphemerisBody = Extract<Body, "sun" | "moon">;

/**
 * Bodies for which illumination ephemerides are generated.
 * Includes bodies with visible phases: Sun (always 100%), Moon, and inner planets.
 */
export type IlluminationEphemerisBody = Extract<
  Body,
  "sun" | "moon" | "venus" | "mercury" | "mars"
>;

/**
 * Bodies for which diameter ephemerides are generated.
 * Limited to Sun and Moon for eclipse calculations.
 */
export type DiameterEphemerisBody = Extract<Body, "sun" | "moon">;

/**
 * Bodies for which distance ephemerides are generated.
 * Includes Sun (for apsis) and inner planets with visible orbital variations.
 */
export type DistanceEphemerisBody = Extract<
  Body,
  "sun" | "venus" | "mercury" | "mars"
>;
