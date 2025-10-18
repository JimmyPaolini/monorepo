import type { Longitude } from "./ephemeris/ephemeris.types.ts";

export const arcsecondsPerArcminute = 60;
export const arcminutesPerDegree = 60;
export const arcsecondsPerDegree = arcsecondsPerArcminute * arcminutesPerDegree;

export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export function getAngle(longitude1: Longitude, longitude2: Longitude) {
  const normalizedLongitude1 = normalizeDegrees(longitude1);
  const normalizedLongitude2 = normalizeDegrees(longitude2);

  let angle = Math.abs(normalizedLongitude1 - normalizedLongitude2);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

export function normalizeForComparison(
  current: Longitude,
  reference: Longitude
) {
  if (Math.abs(current - reference) > 180) {
    return current < reference ? current + 360 : current - 360;
  }
  return current;
}

export function isMaximum(args: {
  current: number;
  previous: number;
  next: number;
}) {
  const { current, previous, next } = args;
  return previous < current && current > next;
}

export function isMinimum(args: {
  current: number;
  previous: number;
  next: number;
}) {
  const { current, previous, next } = args;
  return previous > current && current < next;
}
