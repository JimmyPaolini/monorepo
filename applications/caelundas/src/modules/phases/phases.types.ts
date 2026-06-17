// 🏷️ Types
import type {
  CoordinateEphemeris,
  CoordinateEphemerisBody,
  DistanceEphemeris,
  DistanceEphemerisBody,
  IlluminationEphemeris,
  IlluminationEphemerisBody,
} from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

/**
 * Per-minute ephemeris inputs required to evaluate planetary phase predicates.
 */
export interface DetectPhaseArguments {
  coordinateEphemerisByBody: Record<
    CoordinateEphemerisBody,
    CoordinateEphemeris
  >;
  distanceEphemerisByBody: Record<DistanceEphemerisBody, DistanceEphemeris>;
  illuminationEphemerisByBody: Record<
    IlluminationEphemerisBody,
    IlluminationEphemeris
  >;
  minute: Moment;
}

/**
 * Sliding-window scalar values consumed by phase checks (rise/set, elongation, brightness).
 */
export interface PhaseParameters {
  currentDistance: number;
  currentIllumination: number;
  currentLongitudePlanet: number;
  currentLongitudeSun: number;
  nextDistances: number[];
  nextIlluminations: number[];
  nextLongitudePlanet: number;
  nextLongitudeSun: number;
  previousDistances: number[];
  previousIlluminations: number[];
  previousLongitudePlanet: number;
  previousLongitudeSun: number;
}
