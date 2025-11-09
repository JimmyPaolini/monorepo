import type { Body } from "../../types";
import { getAngle } from "../../math.utilities";

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
 * Get cached angle between two bodies at specific timestamps
 * This reduces redundant getAngle() calls
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
 * Clear the angle cache (call this at the start of processing each day)
 */
export function clearAngleCache(): void {
  angleCache.clear();
}

/**
 * Get cache statistics for debugging/monitoring
 */
export function getAngleCacheStats() {
  return {
    size: angleCache.size,
    ephemerisSize: ephemerisCache.size,
  };
}

/**
 * Pre-check if a combination of bodies could possibly form an aspect
 * This uses rough angle calculations to quickly eliminate impossible combinations
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
    const angles = [
      getAngle(longitudes[0], longitudes[1]),
      getAngle(longitudes[0], longitudes[2]),
      getAngle(longitudes[1], longitudes[2]),
    ];

    // Check if any permutation of angles could match the required pattern
    // within the maximum orb tolerance (use a slightly larger buffer for efficiency)
    const buffer = maxOrb * 2;

    for (let i = 0; i < 3; i++) {
      const deviations = [
        Math.abs(angles[0] - requiredAngles[(i + 0) % 3]),
        Math.abs(angles[1] - requiredAngles[(i + 1) % 3]),
        Math.abs(angles[2] - requiredAngles[(i + 2) % 3]),
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
 * Pre-filter for T-Square: requires one opposition (180°) and two squares (90°)
 */
export function couldBeTSquare(longitudes: [number, number, number]): boolean {
  return canFormAspect({
    longitudes,
    requiredAngles: [180, 90, 90],
    maxOrb: 10, // Use a generous orb for pre-filtering
  });
}

/**
 * Pre-filter for Yod: requires one sextile (60°) and two quincunxes (150°)
 */
export function couldBeYod(longitudes: [number, number, number]): boolean {
  return canFormAspect({
    longitudes,
    requiredAngles: [60, 150, 150],
    maxOrb: 10,
  });
}

/**
 * Pre-filter for Grand Trine: requires three trines (120°)
 */
export function couldBeGrandTrine(
  longitudes: [number, number, number]
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
  longitudes: [number, number, number, number]
): boolean {
  // Kite: Grand Trine plus one opposition
  // Quick check: need at least one pair ~180° apart
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      const angle = getAngle(longitudes[i], longitudes[j]);
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
  longitudes: [number, number, number, number]
): boolean {
  // Grand Cross: two oppositions at 90° to each other
  // Quick check: need at least two pairs ~180° apart
  let oppositionCount = 0;

  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      const angle = getAngle(longitudes[i], longitudes[j]);
      if (Math.abs(angle - 180) <= 20) {
        oppositionCount++;
      }
    }
  }

  return oppositionCount >= 2;
}

/**
 * Pre-filter for Pentagram: requires all pairs in quintile (72°) or biquintile (144°)
 */
export function couldBePentagram(
  longitudes: [number, number, number, number, number]
): boolean {
  // Pentagram: All 10 pairs should be ~72° or ~144° apart
  // Quick check: planets should be roughly evenly distributed with 72° spacing
  // Check if at least some pairs are close to quintile aspects

  let quintileCount = 0;
  const buffer = 15; // Generous buffer for pre-filtering

  for (let i = 0; i < 5; i++) {
    for (let j = i + 1; j < 5; j++) {
      const angle = getAngle(longitudes[i], longitudes[j]);
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
 * Pre-filter for Hexagram/Grand Sextile: requires six planets evenly spaced at 60°
 */
export function couldBeHexagram(
  longitudes: [number, number, number, number, number, number]
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
      const angle = getAngle(longitudes[i], longitudes[j]);
      if (Math.abs(angle - 180) <= buffer) {
        oppositionCount++;
      }
    }
  }

  // Need good spacing AND some oppositions
  return validSpacingCount >= 4 && oppositionCount >= 2;
}

/**
 * Pre-filter for Stellium: requires planets to be closely grouped (within conjunction orb)
 */
export function couldBeStellium(
  longitudes: number[],
  maxOrb: number = 10
): boolean {
  // Stellium: 3+ planets all within a tight orb (typically 8-10°)
  // Quick check: find the span from min to max longitude

  if (longitudes.length < 3) {
    return false;
  }

  // Sort longitudes to find the span
  const sorted = [...longitudes].sort((a, b) => a - b);

  // Calculate the span (accounting for zodiac wrap-around at 0°/360°)
  const span1 = sorted[sorted.length - 1] - sorted[0]; // Direct span
  const span2 = 360 - span1; // Wrap-around span

  const minSpan = Math.min(span1, span2);

  // If the span is larger than the maximum orb, it can't be a stellium
  // Use a slightly larger buffer to avoid false negatives
  return minSpan <= maxOrb * 1.5;
}
