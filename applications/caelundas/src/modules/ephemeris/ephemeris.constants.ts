// ♟️ Constants
import { constants, set_ephe_path } from "sweph";

import type { Asteroid, Node, Planet } from "@caelundas/src/caelundas.types";

/** Swiss Ephemeris flag for converting ecliptic coordinates to horizontal (azimuth/elevation). */
export const ECLIPTIC_TO_HORIZONTAL_FLAG: number = constants.SE_ECL2HOR;
/** Swiss Ephemeris flag selecting the proleptic Gregorian calendar for Julian Day conversions. */
export const GREGORIAN_CALENDAR_FLAG: number = constants.SE_GREG_CAL;
/** Swiss Ephemeris flag requesting osculating (instantaneous) orbital elements for the Moon. */
export const OSCULATING_ORBITAL_ELEMENTS_FLAG: number =
  constants.SE_NODBIT_OSCU;
/**
 * Combined Swiss Ephemeris computation flags applied to every body calculation.
 * `SEFLG_SWIEPH` uses the built-in Swiss Ephemeris data files; `SEFLG_SPEED`
 * requests daily velocity alongside position, enabling retrograde detection.
 */
export const SWISS_EPHEMERIS_FLAGS: number =
  constants.SEFLG_SWIEPH | constants.SEFLG_SPEED;

/** Maps each planet name to its Swiss Ephemeris integer body identifier. */
export const swissEphemerisConstantByPlanet: Record<Planet, number> = {
  sun: constants.SE_SUN,
  moon: constants.SE_MOON,
  mercury: constants.SE_MERCURY,
  venus: constants.SE_VENUS,
  mars: constants.SE_MARS,
  jupiter: constants.SE_JUPITER,
  saturn: constants.SE_SATURN,
  uranus: constants.SE_URANUS,
  neptune: constants.SE_NEPTUNE,
  pluto: constants.SE_PLUTO,
};

/** Maps each asteroid name to its Swiss Ephemeris integer body identifier. */
export const swissEphemerisConstantByAsteroid: Record<Asteroid, number> = {
  chiron: constants.SE_CHIRON,
  lilith: constants.SE_MEAN_APOG,
  ceres: constants.SE_CERES,
  pallas: constants.SE_PALLAS,
  juno: constants.SE_JUNO,
  vesta: constants.SE_VESTA,
};

/**
 * Maps each lunar node / apside name to its Swiss Ephemeris integer body identifier.
 * Lunar perigee has no direct SE constant and is derived from osculating elements, so its value is `null`.
 */
export const swissEphemerisConstantByNode: Record<Node, number | null> = {
  "north lunar node": constants.SE_TRUE_NODE,
  "south lunar node": constants.SE_TRUE_NODE,
  "lunar apogee": constants.SE_OSCU_APOG,
  "lunar perigee": null,
};

/**
 * Configures the Swiss Ephemeris data path before any calculations are performed.
 *
 * Must be called once at application startup. The `./data/ephemeris` directory
 * contains the `.se1` binary data files bundled with the caelundas Docker image.
 */
export function initializeSwissEphemeris(): void {
  set_ephe_path("./data/ephemeris");
}
