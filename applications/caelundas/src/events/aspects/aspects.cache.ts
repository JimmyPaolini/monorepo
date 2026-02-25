import { getAngle } from "../../math.utilities";

import type { Body } from "../../types";

/**
 * Cache for angle calculations to avoid redundant computation
 * Key format: "timestamp1:timestamp2:body1:body2"
 */
const angleCache = new Map<string, number>();

/**
 * Cache for ephemeris lookups
 * Key format: "timestamp:body"
 */
const ephemerisCache = new Map<
  string,
  { longitude: number; latitude: number }
>();

/**
 * Retrieves cached angle between two bodies or calculates and caches if not present.
 *
 * Caching reduces redundant calculations when the same body pairs are checked
 * multiple times during aspect detection. The cache key is deterministic
 * (alphabetically sorted) to handle both (body1, body2) and (body2, body1) lookups.
 *
 * @param args - Calculation parameters
 * @param timestamp1 - ISO timestamp for first body position
 * @param timestamp2 - ISO timestamp for second body position
 * @param body1 - First celestial body
 * @param body2 - Second celestial body
 * @param longitude1 - Ecliptic longitude of first body in degrees
 * @param longitude2 - Ecliptic longitude of second body in degrees
 * @returns Angle between bodies in degrees (0-180°)
 * @see {@link getAngle} for angle calculation algorithm
 */
export function getCachedAngle(args: {
  timestamp1: string;
  timestamp2: string;
  body1: Body;
  body2: Body;
  longitude1: number;
  longitude2: number;
}): number {
  const { timestamp1, timestamp2, body1, body2, longitude1, longitude2 } = args;

  // Create a deterministic cache key (alphabetically sorted to handle reversed pairs)
  const key = [timestamp1, timestamp2, body1, body2].sort().join(":");

  let angle = angleCache.get(key);
  if (angle === undefined) {
    angle = getAngle(longitude1, longitude2);
    angleCache.set(key, angle);
  }

  return angle;
}

/**
 * Clears the angle calculation cache.
 *
 * Should be called at the start of processing each day or time period
 * to prevent unbounded memory growth. The cache is effective for a single
 * processing batch but shouldn't persist indefinitely.
 */
export function clearAngleCache(): void {
  angleCache.clear();
}

/**
 * Retrieves cache size statistics for monitoring and debugging.
 *
 * Useful for understanding cache effectiveness and identifying potential
 * memory issues or optimization opportunities.
 *
 * @returns Object containing cache sizes for different data types
 */
export function getAngleCacheStats(): {
  size: number;
  ephemerisSize: number;
} {
  return {
    size: angleCache.size,
    ephemerisSize: ephemerisCache.size,
  };
}

/**
 * Pre-checks if a combination of bodies could possibly form an aspect pattern.
 *
 * Uses rough angle calculations to quickly eliminate impossible combinations
 * before performing expensive detailed checks. This is a performance optimization
 * for multi-body aspects (3+ bodies).
 *
 * For example, a T-Square requires specific angles (180°, 90°, 90°). If the
 * actual angles between bodies don't approximately match this pattern (within
 * a generous buffer), we can skip detailed validation.
 *
 * @param args - Filter parameters
 * @param longitudes - Ecliptic longitudes of all bodies in degrees
 * @param requiredAngles - Expected angles for the pattern in degrees
 * @param maxOrb - Maximum orb tolerance in degrees
 * @returns True if pattern is possible, false if definitely impossible
 */
export function canFormAspect(args: {
  longitudes: number[];
  requiredAngles: number[];
  maxOrb: number;
}): boolean {
  const { longitudes, requiredAngles, maxOrb } = args;

  // For 3+ body aspects, check if any configuration of the required angles
  // could possibly exist within the orb tolerance
  // This is a fast pre-filter before doing detailed checks

  if (longitudes.length === 3 && requiredAngles.length === 3) {
    // For triple aspects (T-Square, Yod, etc.)
    const long0 = longitudes[0];
    const long1 = longitudes[1];
    const long2 = longitudes[2];
    if (long0 === undefined || long1 === undefined || long2 === undefined) {
      return true;
    }

    const angles = [
      getAngle(long0, long1),
      getAngle(long0, long2),
      getAngle(long1, long2),
    ];

    // Check if any permutation of angles could match the required pattern
    // within the maximum orb tolerance (use a slightly larger buffer for efficiency)
    const buffer = maxOrb * 2;

    for (let i = 0; i < 3; i++) {
      const angle0 = angles[0];
      const angle1 = angles[1];
      const angle2 = angles[2];
      const req0 = requiredAngles[(i + 0) % 3];
      const req1 = requiredAngles[(i + 1) % 3];
      const req2 = requiredAngles[(i + 2) % 3];

      if (
        angle0 === undefined ||
        angle1 === undefined ||
        angle2 === undefined ||
        req0 === undefined ||
        req1 === undefined ||
        req2 === undefined
      ) {
        continue;
      }

      const deviations = [
        Math.abs(angle0 - req0),
        Math.abs(angle1 - req1),
        Math.abs(angle2 - req2),
      ];

      // If all angles are within buffer range, this could be an aspect
      if (deviations.every((d) => d <= buffer)) {
        return true;
      }
    }

    return false;
  }

  // For other cases, default to true (no filtering)
  return true;
}

/**
 * Pre-filters for T-Square pattern possibility.
 *
 * A T-Square requires one opposition (180°) and two squares (90°).
 * Uses generous orb for initial filtering to avoid false negatives.
 *
 * @param longitudes - Ecliptic longitudes of 3 bodies in degrees
 * @returns True if T-Square is geometrically possible
 * @see {@link canFormAspect} for generic filtering logic
 */
export function couldBeTSquare(longitudes: [number, number, number]): boolean {
  return canFormAspect({
    longitudes,
    requiredAngles: [180, 90, 90],
    maxOrb: 10, // Use a generous orb for pre-filtering
  });
}

/**
 * Pre-filters for Yod pattern possibility.
 *
 * A Yod requires one sextile (60°) and two quincunxes (150°).
 * Uses generous orb for initial filtering to avoid false negatives.
 *
 * @param longitudes - Ecliptic longitudes of 3 bodies in degrees
 * @returns True if Yod is geometrically possible
 * @see {@link canFormAspect} for generic filtering logic
 */
export function couldBeYod(longitudes: [number, number, number]): boolean {
  return canFormAspect({
    longitudes,
    requiredAngles: [60, 150, 150],
    maxOrb: 10,
  });
}

/**
 * Pre-filters for Grand Trine pattern possibility.
 *
 * A Grand Trine requires three trines (120° each) forming an equilateral triangle.
 * Uses generous orb for initial filtering to avoid false negatives.
 *
 * @param longitudes - Ecliptic longitudes of 3 bodies in degrees
 * @returns True if Grand Trine is geometrically possible
 * @see {@link canFormAspect} for generic filtering logic
 */
export function couldBeGrandTrine(
  longitudes: [number, number, number],
): boolean {
  return canFormAspect({
    longitudes,
    requiredAngles: [120, 120, 120],
    maxOrb: 10,
  });
}

/**
 * Pre-filter for Kite: requires specific angle pattern
 */
export function couldBeKite(
  longitudes: [number, number, number, number],
): boolean {
  // Kite: Grand Trine plus one opposition
  // Quick check: need at least one pair ~180° apart
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      const longI = longitudes[i];
      const longJ = longitudes[j];
      if (longI === undefined || longJ === undefined) {
        continue;
      }
      const angle = getAngle(longI, longJ);
      if (Math.abs(angle - 180) <= 20) {
        // Generous pre-filter
        return true;
      }
    }
  }
  return false;
}

/**
 * Pre-filter for Grand Cross: requires four squares forming a cross
 */
export function couldBeGrandCross(
  longitudes: [number, number, number, number],
): boolean {
  // Grand Cross: two oppositions at 90° to each other
  // Quick check: need at least two pairs ~180° apart
  let oppositionCount = 0;

  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      const longI = longitudes[i];
      const longJ = longitudes[j];
      if (longI === undefined || longJ === undefined) {
        continue;
      }
      const angle = getAngle(longI, longJ);
      if (Math.abs(angle - 180) <= 20) {
        oppositionCount++;
      }
    }
  }

  return oppositionCount >= 2;
}

/**
 * Pre-filters for Pentagram pattern possibility.
 *
 * A Pentagram requires 5 bodies with all pairs at quintile (72°) or
 * biquintile (144°) aspects, forming a 5-pointed star. Checks if at least
 * 7 out of 10 possible pairs are roughly in quintile relationship.
 *
 * @param longitudes - Ecliptic longitudes of 5 bodies in degrees
 * @returns True if Pentagram is geometrically possible
 */
export function couldBePentagram(
  longitudes: [number, number, number, number, number],
): boolean {
  // Pentagram: All 10 pairs should be ~72° or ~144° apart
  // Quick check: planets should be roughly evenly distributed with 72° spacing
  // Check if at least some pairs are close to quintile aspects

  let quintileCount = 0;
  const buffer = 15; // Generous buffer for pre-filtering

  for (let i = 0; i < 5; i++) {
    for (let j = i + 1; j < 5; j++) {
      const longI = longitudes[i];
      const longJ = longitudes[j];
      if (longI === undefined || longJ === undefined) {
        continue;
      }
      const angle = getAngle(longI, longJ);
      // Check if close to 72° or 144°
      if (Math.abs(angle - 72) <= buffer || Math.abs(angle - 144) <= buffer) {
        quintileCount++;
      }
    }
  }

  // Need at least 7 out of 10 pairs to be roughly quintile/biquintile
  // (relaxed requirement for pre-filtering)
  return quintileCount >= 7;
}

/**
 * Pre-filters for Hexagram/Grand Sextile pattern possibility.
 *
 * A Hexagram requires 6 bodies evenly spaced at 60° intervals around
 * the zodiac. Checks for:
 * - Consecutive spacing of approximately 60°
 * - At least 2 opposition (180°) relationships
 *
 * @param longitudes - Ecliptic longitudes of 6 bodies in degrees
 * @returns True if Hexagram is geometrically possible
 */
export function couldBeHexagram(
  longitudes: [number, number, number, number, number, number],
): boolean {
  // Hexagram: 6 planets evenly spaced at 60° intervals
  // Quick check: sort longitudes and check if consecutive spacing is ~60°

  const sorted = [...longitudes].sort((a, b) => a - b);
  const buffer = 15; // Generous buffer for pre-filtering

  let validSpacingCount = 0;

  // Check consecutive spacing
  for (let i = 0; i < 6; i++) {
    const current = sorted[i];
    const next = sorted[(i + 1) % 6];
    if (current === undefined || next === undefined) {
      return false; // Should never happen with valid input
    }
    const spacing =
      i === 5
        ? 360 - current + next // Wrap around from last to first
        : next - current;

    // Should be ~60° apart
    if (Math.abs(spacing - 60) <= buffer) {
      validSpacingCount++;
    }
  }

  // Also check for oppositions (180°) which should exist in a hexagram
  let oppositionCount = 0;
  for (let i = 0; i < 6; i++) {
    for (let j = i + 1; j < 6; j++) {
      const longI = longitudes[i];
      const longJ = longitudes[j];
      if (longI === undefined || longJ === undefined) {
        continue;
      }
      const angle = getAngle(longI, longJ);
      if (Math.abs(angle - 180) <= buffer) {
        oppositionCount++;
      }
    }
  }

  // Need good spacing AND some oppositions
  return validSpacingCount >= 4 && oppositionCount >= 2;
}

/**
 * Pre-filters for Stellium pattern possibility.
 *
 * A Stellium requires 3+ bodies closely grouped together (within
 * conjunction orb). Calculates the span from minimum to maximum
 * longitude, accounting for zodiac wrap-around at 0°/360°.
 *
 * @param longitudes - Ecliptic longitudes of bodies in degrees
 * @param maxOrb - Maximum orb for conjunction (default 10°)
 * @returns True if bodies are close enough to form a stellium
 */
export function couldBeStellium(longitudes: number[], maxOrb = 10): boolean {
  // Stellium: 3+ planets all within a tight orb (typically 8-10°)
  // Quick check: find the span from min to max longitude

  if (longitudes.length < 3) {
    return false;
  }

  // Sort longitudes to find the span
  const sorted = [...longitudes].sort((a, b) => a - b);

  // Calculate the span (accounting for zodiac wrap-around at 0°/360°)
  const sortedLast = sorted.at(-1);
  const sortedFirst = sorted[0];
  if (sortedLast === undefined || sortedFirst === undefined) {
    return false;
  }
  const span1 = sortedLast - sortedFirst; // Direct span
  const span2 = 360 - span1; // Wrap-around span

  const minSpan = Math.min(span1, span2);

  // If the span is larger than the maximum orb, it can't be a stellium
  // Use a slightly larger buffer to avoid false negatives
  return minSpan <= maxOrb * 1.5;
}
