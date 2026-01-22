import type { Asteroid, Body, Comet, Planet } from "../types";

/**
 * NASA JPL Horizons API endpoint URL.
 *
 * The Horizons system provides access to solar system ephemerides computed
 * from JPL's DE-series planetary and lunar ephemerides.
 *
 * @see {@link https://ssd.jpl.nasa.gov/horizons/} for API documentation
 */
export const horizonsUrl = "https://ssd.jpl.nasa.gov/api/horizons.api";

/**
 * Regular expression for extracting dates from Horizons API responses.
 * Matches format: YYYY-MMM-DD HH:MM (e.g., "2025-Jan-21 12:30")
 */
export const dateRegex = /(\d{4}-[A-Za-z]{3}-\d{2}\s\d{2}:\d{2})/;

/**
 * Regular expression for extracting decimal numbers from API responses.
 * Matches optional negative sign followed by digits and decimal point.
 */
export const decimalRegex = /(-?\d+\.\d+)/;

/**
 * Maps planet names to their JPL Horizons command IDs.
 *
 * Command IDs identify specific bodies in the Horizons database:
 * - 10: Sun
 * - X99: Planet X's barycenter (e.g., 199 = Mercury, 299 = Venus)
 *
 * @see {@link https://ssd.jpl.nasa.gov/horizons/} for complete ID list
 */
export const commandIdByPlanet = {
  sun: "10",
  mercury: "199",
  venus: "299",
  moon: "301",
  mars: "499",
  jupiter: "599",
  saturn: "699",
  uranus: "799",
  neptune: "899",
  pluto: "999",
} satisfies Record<Planet, string>;

/**
 * Maps asteroid names to their JPL Horizons command IDs.
 *
 * Uses DES (designation) format for Small-Body Database lookup.
 */
export const commandIdByAsteroid = {
  chiron: "'DES=20002060;'",
  lilith: "'DES=20001181;'",
  ceres: "'DES=2000001;'",
  pallas: "'DES=2000002;'",
  juno: "'DES=20000003;'",
  vesta: "'DES=2000004;'",
} satisfies Record<Asteroid, string>;

/**
 * Maps comet names to their JPL Horizons command IDs.
 */
export const commandIdByComet = {
  halley: "'DES=20002688;'",
} satisfies Record<Comet, string>;

/**
 * Complete mapping of all tracked celestial bodies to their command IDs.
 * Combines planets, asteroids, and comets.
 */
export const commandIdByBody = {
  ...commandIdByPlanet,
  ...commandIdByAsteroid,
  ...commandIdByComet,
} satisfies Record<Planet | Asteroid | Comet, string>;

/**
 * Maps bodies to their center point ID for coordinate frame calculations.
 *
 * Currently only configured for heliocentric Sun calculations.
 * Format: "500@10" means geocentric (500) relative to Sun (10).
 */
export const centerIdByBody = {
  sun: "500@10",
} satisfies Record<Extract<Body, "sun">, string>;

/**
 * Horizons API quantity code for apparent azimuth and elevation.
 * Returns observer-centric horizontal coordinates.
 */
export const QUANTITY_APPARENT_AZIMUTH_ELEVATION = "4";

/**
 * Horizons API quantity code for illuminated fraction.
 * Returns percentage of body's visible disk that is illuminated.
 */
export const QUANTITY_ILLUMINATED_FRACTION = "10";

/**
 * Horizons API quantity code for angular diameter.
 * Returns apparent size of body in arcseconds.
 */
export const QUANTITY_ANGULAR_DIAMETER = "13";

/**
 * Horizons API quantity code for range rate (radial velocity).
 * Returns rate of change of observer-body distance.
 */
export const QUANTITY_RANGE_RATE = "20";

/**
 * Horizons API quantity code for ecliptic longitude and latitude.
 * Returns body's position on the ecliptic plane.
 */
export const QUANTITY_ECLIPTIC_LONGITUDE_LATITUDE = "31";
