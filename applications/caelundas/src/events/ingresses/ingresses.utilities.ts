import type { Sign } from "../../types";

/**
 * Maps each zodiac sign to its ecliptic longitude range.
 *
 * The ecliptic is divided into 12 equal 30° segments, starting with Aries at 0°.
 *
 * @remarks
 * Tropical zodiac (aligned with seasons, not constellations)
 */
export const degreeRangeBySign: Record<Sign, { min: number; max: number }> = {
  aries: { min: 0, max: 30 },
  taurus: { min: 30, max: 60 },
  gemini: { min: 60, max: 90 },
  cancer: { min: 90, max: 120 },
  leo: { min: 120, max: 150 },
  virgo: { min: 150, max: 180 },
  libra: { min: 180, max: 210 },
  scorpio: { min: 210, max: 240 },
  sagittarius: { min: 240, max: 270 },
  capricorn: { min: 270, max: 300 },
  aquarius: { min: 300, max: 330 },
  pisces: { min: 330, max: 360 },
};

/**
 * Determines which zodiac sign corresponds to an ecliptic longitude.
 *
 * @param longitude - Ecliptic longitude in degrees (0-360)
 * @returns The zodiac sign name
 * @throws If longitude is outside valid range
 * @see {@link degreeRangeBySign} for sign boundaries
 */
export function getSign(longitude: number): Sign {
  const entry = Object.entries(degreeRangeBySign).find(([, { min, max }]) => {
    return longitude >= min && longitude < max;
  });
  if (!entry) {
    throw new Error(`🚫 Longitude ${longitude} not in any sign.`);
  }
  return entry[0] as Sign;
};

/**
 * Determines if a sign ingress is occurring.
 *
 * A sign ingress occurs when the body's sign changes between consecutive minutes.
 *
 * @param args - Configuration object
 * @param previousLongitude - Previous minute's longitude in degrees
 * @param currentLongitude - Current longitude in degrees
 * @returns True if crossing a sign boundary
 */
export const isSignIngress = (args: {
  previousLongitude: number;
  currentLongitude: number;
}): boolean => {
  const { currentLongitude, previousLongitude } = args;
  return getSign(currentLongitude) !== getSign(previousLongitude);
};

/**
 * Determines which decan (1-3) within a sign corresponds to a longitude.
 *
 * Each sign is divided into three decans of 10° each:
 * - Decan 1: 0-10° within sign
 * - Decan 2: 10-20° within sign
 * - Decan 3: 20-30° within sign
 *
 * @param longitude - Ecliptic longitude in degrees (0-360)
 * @returns Decan number (1, 2, or 3)
 */
export function getDecan(longitude: number): number {
  const sign = getSign(longitude);
  const { min } = degreeRangeBySign[sign];
  return Math.floor((longitude - min) / 10) + 1;
}

/**
 * Determines if a decan ingress is occurring.
 *
 * @param args - Configuration object
 * @returns True if crossing a decan boundary (every 10°)
 */
export function isDecanIngress(args: {
  previousLongitude: number;
  currentLongitude: number;
}): boolean {
  const { currentLongitude, previousLongitude } = args;
  return getDecan(currentLongitude) !== getDecan(previousLongitude);
}

/**
 * Determines if a peak ingress is occurring (15° mark within a sign).
 *
 * Peak ingresses mark the midpoint of each sign, representing the "peak"
 * or strongest expression of that sign's energy.
 *
 * @param args - Configuration object
 * @returns True if crossing the 15° mark within a sign
 */
export function isPeakIngress(args: {
  previousLongitude: number;
  currentLongitude: number;
}): boolean {
  const { currentLongitude, previousLongitude } = args;

  const previousSign = getSign(previousLongitude);
  const { min: previousMin } = degreeRangeBySign[previousSign];
  const previousDifference = previousLongitude - previousMin;

  const currentSign = getSign(currentLongitude);
  const { min: currentMin } = degreeRangeBySign[currentSign];
  const currentDifference = currentLongitude - currentMin;

  return currentDifference >= 15 && previousDifference < 15;
}
