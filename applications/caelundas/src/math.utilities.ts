import type { Longitude } from "./ephemeris/ephemeris.types";

/**
 * Number of arcseconds in one arcminute (60).
 */
export const arcsecondsPerArcminute = 60;

/**
 * Number of arcminutes in one degree (60).
 */
export const arcminutesPerDegree = 60;

/**
 * Number of arcseconds in one degree (3600).
 */
export const arcsecondsPerDegree = arcsecondsPerArcminute * arcminutesPerDegree;

/**
 * Normalizes an angle in degrees to the range [0, 360).
 *
 * @param degrees - Angle in degrees (can be any real number)
 * @returns Normalized angle in the range [0, 360)
 *
 * @example
 * ```typescript
 * normalizeDegrees(450);  // Returns 90
 * normalizeDegrees(-45);  // Returns 315
 * ```
 */
export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/**
 * Calculates the shortest angular distance between two ecliptic longitudes.
 *
 * This function computes the minimum arc length between two positions on the
 * ecliptic circle. The result is always in the range [0, 180] degrees, as it
 * measures the shorter of the two possible arcs between the points.
 *
 * @param longitude1 - First ecliptic longitude in degrees
 * @param longitude2 - Second ecliptic longitude in degrees
 * @returns Shortest angular distance between the two longitudes in degrees [0, 180]
 *
 * @remarks
 * Algorithm:
 * 1. Normalize both longitudes to [0, 360)
 * 2. Calculate absolute difference
 * 3. If difference \> 180°, take the reflex angle (360° - angle)
 *
 * This is used extensively in aspect detection to determine the angular
 * separation between celestial bodies.
 *
 * @see normalizeDegrees for angle normalization
 *
 * @example
 * ```typescript
 * getAngle(10, 350);   // Returns 20 (not 340)
 * getAngle(0, 180);    // Returns 180
 * getAngle(45, 135);   // Returns 90
 * getAngle(350, 10);   // Returns 20 (symmetric)
 * ```
 */
export function getAngle(longitude1: Longitude, longitude2: Longitude): number {
  const normalizedLongitude1 = normalizeDegrees(longitude1);
  const normalizedLongitude2 = normalizeDegrees(longitude2);

  let angle = Math.abs(normalizedLongitude1 - normalizedLongitude2);
  if (angle > 180) {
    angle = 360 - angle;
  }
  return angle;
}

/**
 * Normalizes a longitude value for continuous comparison with a reference longitude.
 *
 * Adjusts longitude to eliminate discontinuities when comparing or interpolating
 * across the 0°/360° boundary. Essential for root-finding algorithms and aspect
 * detection. Unlike {@link normalizeDegrees}, can return values outside [0, 360).
 *
 * @param current - Longitude to normalize
 * @param reference - Reference longitude for comparison
 * @returns Adjusted longitude in the range that minimizes distance from reference
 *
 * @example
 * ```typescript
 * normalizeForComparison(10, 350);  // Returns 370
 * normalizeForComparison(350, 10);  // Returns -10
 * ```
 */
export function normalizeForComparison(
  current: Longitude,
  reference: Longitude,
): number {
  if (Math.abs(current - reference) > 180) {
    return current < reference ? current + 360 : current - 360;
  }
  return current;
}

/**
 * Determines whether a value is a local maximum in a discrete sequence.
 *
 * @param args - Object containing current, previous, and next values for comparison
 * @returns `true` if current is a local maximum (previous < current > next)
 *
 * @example
 * ```typescript
 * isMaximum({ current: 100, previous: 99, next: 98 });  // true
 * isMaximum({ current: 100, previous: 100, next: 99 }); // false
 * ```
 */
export function isMaximum(args: {
  current: number;
  previous: number;
  next: number;
}): boolean {
  const { current, previous, next } = args;
  return previous < current && current > next;
}

/**
 * Determines whether a value is a local minimum in a discrete sequence.
 *
 * @param args - Object containing current, previous, and next values for comparison
 * @returns `true` if current is a local minimum (previous > current < next)
 *
 * @example
 * ```typescript
 * isMinimum({ current: 10, previous: 15, next: 12 });  // true
 * isMinimum({ current: 10, previous: 10, next: 12 });  // false
 * ```
 */
export function isMinimum(args: {
  current: number;
  previous: number;
  next: number;
}): boolean {
  const { current, previous, next } = args;
  return previous > current && current < next;
}

/**
 * Generates all combinations of k elements from an array.
 *
 * Uses recursive backtracking algorithm. Time complexity: O(n choose k).
 *
 * @param array - Source array of elements
 * @param k - Number of elements to select in each combination
 * @returns Array of all possible k-combinations
 *
 * @typeParam T - Type of elements in the array
 *
 * @example
 * ```typescript
 * getCombinations(['Sun', 'Moon', 'Mars'], 2);
 * // Returns: [['Sun','Moon'], ['Sun','Mars'], ['Moon','Mars']]
 * ```
 */
export function getCombinations<T>(array: T[], k: number): T[][] {
  const result: T[][] = [];

  function combine(start: number, chosen: T[]): void {
    if (chosen.length === k) {
      result.push([...chosen]);
      return;
    }

    for (let i = start; i < array.length; i++) {
      const element = array[i];
      if (element) {
        chosen.push(element);
        combine(i + 1, chosen);
        chosen.pop();
      }
    }
  }

  combine(0, []);
  return result;
}
