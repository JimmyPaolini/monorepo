import { constants, set_ephe_path } from "sweph";

import type { Asteroid, Node, Planet } from "../types";

export const ECLIPTIC_TO_HORIZONTAL_FLAG: number = constants.SE_ECL2HOR;
export const GREGORIAN_CALENDAR_FLAG: number = constants.SE_GREG_CAL;
export const OSCULATING_ORBITAL_ELEMENTS_FLAG: number =
  constants.SE_NODBIT_OSCU;
export const SWISS_EPHEMERIS_FLAGS: number =
  constants.SEFLG_SWIEPH | constants.SEFLG_SPEED;

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

export const swissEphemerisConstantByAsteroid: Record<Asteroid, number> = {
  chiron: constants.SE_CHIRON,
  lilith: constants.SE_MEAN_APOG,
  ceres: constants.SE_CERES,
  pallas: constants.SE_PALLAS,
  juno: constants.SE_JUNO,
  vesta: constants.SE_VESTA,
};

export const swissEphemerisConstantByNode: Record<Node, number | null> = {
  "north lunar node": constants.SE_TRUE_NODE,
  "south lunar node": constants.SE_TRUE_NODE,
  "lunar apogee": constants.SE_OSCU_APOG,
  "lunar perigee": null,
};

/**
 *
 */
export function initializeSwissEphemeris(): void {
  set_ephe_path("./data/ephemeris");
}
