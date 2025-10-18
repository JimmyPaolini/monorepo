import { type Body } from "../symbols.constants.ts";

export type Latitude = number;
export type Longitude = number;
export type Coordinates = [Longitude, Latitude];

export type CoordinateEphemeris = Record<
  string,
  { longitude: number; latitude: number }
>;
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
export type AzimuthElevationEphemeris = Record<
  string,
  { azimuth: number; elevation: number }
>;
export type IlluminationEphemeris = Record<string, { illumination: number }>;
export type DistanceEphemeris = Record<string, { distance: number }>;
export type DiameterEphemeris = Record<string, { diameter: number }>;

export type CoordinateEphemerisBody = Body;
export type OrbitEphemerisBody = Extract<Body, "moon">;
export type AzimuthElevationEphemerisBody = Extract<Body, "sun" | "moon">;
export type IlluminationEphemerisBody = Extract<
  Body,
  "sun" | "moon" | "venus" | "mercury" | "mars"
>;
export type DiameterEphemerisBody = Extract<Body, "sun" | "moon">;
export type DistanceEphemerisBody = Extract<
  Body,
  "sun" | "venus" | "mercury" | "mars"
>;
