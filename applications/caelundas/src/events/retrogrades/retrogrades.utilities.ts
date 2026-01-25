import { normalizeForComparison } from "../../math.utilities";

/**
 * Determines if a planet is beginning retrograde motion.
 *
 * Retrograde motion occurs when a planet appears to move backward relative
 * to the stars from Earth's perspective. This is an optical illusion caused
 * by differences in orbital speeds. Detection requires confirming that the
 * planet was previously moving direct (forward) and will continue moving
 * retrograde (backward).
 *
 * @param args - Configuration object
 * @param currentLongitude - Current ecliptic longitude in degrees
 * @param previousLongitudes - Array of previous longitudes for trend confirmation
 * @param nextLongitudes - Array of future longitudes for trend confirmation
 * @returns True if retrograde motion is beginning at current moment
 * @see {@link normalizeForComparison} for handling 0°/360° wraparound
 *
 * @remarks
 * All planets except Sun and Moon exhibit retrograde motion periodically.
 * Retrograde periods are astrologically significant in many traditions.
 */
export function isRetrograde(args: {
  currentLongitude: number;
  previousLongitudes: number[];
  nextLongitudes: number[];
}): boolean {
  const { currentLongitude, previousLongitudes, nextLongitudes } = args;

  const hasBeenDirect = previousLongitudes.every((previousLongitude) => {
    const previousLongitudeNormalized = normalizeForComparison(
      previousLongitude,
      currentLongitude,
    );
    return previousLongitudeNormalized < currentLongitude;
  });

  const willBeRetrograde = nextLongitudes.every((nextLongitude) => {
    const nextLongitudeNormalized = normalizeForComparison(
      nextLongitude,
      currentLongitude,
    );
    return nextLongitudeNormalized <= currentLongitude;
  });

  const isRetrograde = hasBeenDirect && willBeRetrograde;

  return isRetrograde;
}

/**
 * Determines if a planet is resuming direct (forward) motion.
 *
 * Direct motion is the normal forward progression of a planet through
 * the zodiac. This function detects when a planet transitions from
 * retrograde back to direct motion (called a "station direct").
 *
 * @param args - Configuration object
 * @param currentLongitude - Current ecliptic longitude in degrees
 * @param previousLongitudes - Array of previous longitudes
 * @param nextLongitudes - Array of future longitudes
 * @returns True if direct motion is resuming at current moment
 * @see {@link normalizeForComparison} for wraparound handling
 * @see {@link isRetrograde} for retrograde detection
 */
export function isDirect(args: {
  currentLongitude: number;
  previousLongitudes: number[];
  nextLongitudes: number[];
}): boolean {
  const { currentLongitude, previousLongitudes, nextLongitudes } = args;

  const hasBeenRetrograde = previousLongitudes.every((previousLongitude) => {
    const previousLongitudeNormalized = normalizeForComparison(
      previousLongitude,
      currentLongitude,
    );
    return previousLongitudeNormalized > currentLongitude;
  });

  const willBeDirect = nextLongitudes.every((nextLongitude) => {
    const nextLongitudeNormalized = normalizeForComparison(
      nextLongitude,
      currentLongitude,
    );
    return nextLongitudeNormalized >= currentLongitude;
  });

  const isDirect = hasBeenRetrograde && willBeDirect;

  return isDirect;
}
