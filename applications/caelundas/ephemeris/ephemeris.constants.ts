import { Asteroid, Comet, Planet } from "../symbols.constants.ts";

export const horizonsUrl = "https://ssd.jpl.nasa.gov/api/horizons.api";

export const dateRegex = /(\d{4}-[A-Za-z]{3}-\d{2}\s\d{2}:\d{2})/;
export const decimalRegex = /(-?\d+\.\d+)/;

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

export const commandIdByAsteroid = {
  chiron: "'DES=20002060;'",
  lilith: "'DES=20001181;'",
  ceres: "'DES=2000001;'",
  pallas: "'DES=2000002;'",
  juno: "'DES=20000003;'",
  vesta: "'DES=2000004;'",
} satisfies Record<Asteroid, string>;

export const commandIdByComet = {
  halley: "'DES=20002688;'",
} satisfies Record<Comet, string>;

export const commandIdByBody = {
  ...commandIdByPlanet,
  ...commandIdByAsteroid,
  ...commandIdByComet,
} satisfies Record<Planet | Asteroid | Comet, string>;

export const centerIdByBody = {
  earth: "500@399",
  sun: "500@10",
} satisfies Record<Extract<Body, "sun" | "earth">, string>;

export const QUANTITY_APPARENT_AZIMUTH_ELEVATION = "4";
export const QUANTITY_ILLUMINATED_FRACTION = "10";
export const QUANTITY_ANGULAR_DIAMETER = "13";
export const QUANTITY_RANGE_RATE = "20";
export const QUANTITY_ECLIPTIC_LONGITUDE_LATITUDE = "31";
