import { getAngle, isMaximum, isMinimum } from "../../math.utilities";

import type { EclipsePhase } from "../../types";

/**
 * Determines if a solar eclipse is occurring and identifies its phase.
 *
 * Solar eclipses occur when the Sun and Moon are in conjunction (aligned in ecliptic
 * longitude) and the Moon's ecliptic latitude is small enough that shadows align.
 * Checks angular separation in both longitude and latitude against combined apparent diameters.
 *
 * @param args - Configuration object
 * @param currentDiameterMoon - Moon's apparent angular diameter in degrees
 * @param currentDiameterSun - Sun's apparent angular diameter in degrees
 * @param currentLatitudeMoon - Moon's ecliptic latitude in degrees
 * @param currentLatitudeSun - Sun's ecliptic latitude in degrees
 * @param currentLongitudeMoon - Moon's ecliptic longitude in degrees
 * @param currentLongitudeSun - Sun's ecliptic longitude in degrees
 * @param nextLongitudeMoon - Next minute's Moon longitude
 * @param nextLongitudeSun - Next minute's Sun longitude
 * @param previousLongitudeMoon - Previous minute's Moon longitude
 * @param previousLongitudeSun - Previous minute's Sun longitude
 * @returns Eclipse phase ('beginning' | 'maximum' | 'ending') or null if no eclipse
 * @see {@link getAngle} for angular separation calculation
 * @see {@link isMinimum} for maximum eclipse detection
 *
 * @remarks
 * Eclipse visibility depends on observer location (not calculated here).
 * This detects geometric alignment only.
 */
export function isSolarEclipse(args: {
  currentDiameterMoon: number;
  currentDiameterSun: number;
  currentLatitudeMoon: number;
  currentLatitudeSun: number;
  currentLongitudeMoon: number;
  currentLongitudeSun: number;
  nextLongitudeMoon: number;
  nextLongitudeSun: number;
  previousLongitudeMoon: number;
  previousLongitudeSun: number;
}): EclipsePhase | null {
  const {
    currentDiameterMoon,
    currentDiameterSun,
    currentLatitudeMoon,
    currentLatitudeSun,
    currentLongitudeMoon,
    currentLongitudeSun,
    nextLongitudeMoon,
    nextLongitudeSun,
    previousLongitudeMoon,
    previousLongitudeSun,
  } = args;

  const currentLongitudeAngle = getAngle(
    currentLongitudeMoon,
    currentLongitudeSun,
  );
  const nextLongitudeAngle = getAngle(nextLongitudeMoon, nextLongitudeSun);
  const previousLongitudeAngle = getAngle(
    previousLongitudeMoon,
    previousLongitudeSun,
  );

  const isMinimumLongitudeAngle = isMinimum({
    current: currentLongitudeAngle,
    previous: previousLongitudeAngle,
    next: nextLongitudeAngle,
  });

  const currentLatitudeAngle = getAngle(
    currentLatitudeMoon,
    currentLatitudeSun,
  );

  const currentDiameter = currentDiameterSun + currentDiameterMoon;
  const isCurrentInEclipse = currentLatitudeAngle < currentDiameter;

  const wasApproachingConjunction =
    previousLongitudeAngle > currentLongitudeAngle;
  const willBeLeavingConjunction = currentLongitudeAngle < nextLongitudeAngle;

  if (isMinimumLongitudeAngle && isCurrentInEclipse) {
    return "maximum";
  }

  if (
    wasApproachingConjunction &&
    isCurrentInEclipse &&
    currentLongitudeAngle <= currentDiameter &&
    previousLongitudeAngle > currentDiameter
  ) {
    return "beginning";
  }

  if (
    willBeLeavingConjunction &&
    isCurrentInEclipse &&
    currentLongitudeAngle <= currentDiameter &&
    nextLongitudeAngle > currentDiameter
  ) {
    return "ending";
  }

  return null;
}

/**
 * Determines if a lunar eclipse is occurring and identifies its phase.
 *
 * Lunar eclipses occur when the Sun and Moon are in opposition (180° apart in
 * ecliptic longitude) and the Moon passes through Earth's shadow cone.
 *
 * @param args - Configuration object (same parameters as isSolarEclipse)
 * @returns Eclipse phase ('beginning' | 'maximum' | 'ending') or null if no eclipse
 * @see {@link getAngle} for angular separation calculation
 * @see {@link isMaximum} for maximum eclipse detection
 *
 * @remarks
 * Lunar eclipses are visible from the entire night side of Earth,
 * unlike solar eclipses which have narrow visibility paths.
 */
export function isLunarEclipse(args: {
  currentDiameterMoon: number;
  currentDiameterSun: number;
  currentLatitudeMoon: number;
  currentLatitudeSun: number;
  currentLongitudeMoon: number;
  currentLongitudeSun: number;
  nextLongitudeMoon: number;
  nextLongitudeSun: number;
  previousLongitudeMoon: number;
  previousLongitudeSun: number;
}): EclipsePhase | null {
  const {
    currentDiameterMoon,
    currentDiameterSun,
    currentLatitudeMoon,
    currentLatitudeSun,
    currentLongitudeMoon,
    currentLongitudeSun,
    nextLongitudeMoon,
    nextLongitudeSun,
    previousLongitudeMoon,
    previousLongitudeSun,
  } = args;

  const currentLongitudeAngle = getAngle(
    currentLongitudeMoon,
    currentLongitudeSun,
  );
  const nextLongitudeAngle = getAngle(nextLongitudeMoon, nextLongitudeSun);
  const previousLongitudeAngle = getAngle(
    previousLongitudeMoon,
    previousLongitudeSun,
  );

  const isMaximumLongitudeAngle = isMaximum({
    current: currentLongitudeAngle,
    previous: previousLongitudeAngle,
    next: nextLongitudeAngle,
  });

  const currentLatitudeAngle = getAngle(
    currentLatitudeMoon,
    currentLatitudeSun,
  );

  const currentDiameter = currentDiameterSun + currentDiameterMoon;
  const isCurrentInEclipse = currentLatitudeAngle < currentDiameter;

  const wasApproachingOpposition =
    previousLongitudeAngle < currentLongitudeAngle;
  const willBeLeavingOpposition = currentLongitudeAngle > nextLongitudeAngle;

  if (isMaximumLongitudeAngle && isCurrentInEclipse) {
    return "maximum";
  }

  const oppositionThreshold = 180 - currentDiameter;
  if (
    wasApproachingOpposition &&
    isCurrentInEclipse &&
    previousLongitudeAngle < oppositionThreshold &&
    currentLongitudeAngle >= oppositionThreshold
  ) {
    return "beginning";
  }

  if (
    willBeLeavingOpposition &&
    isCurrentInEclipse &&
    nextLongitudeAngle < oppositionThreshold &&
    currentLongitudeAngle >= oppositionThreshold
  ) {
    return "ending";
  }

  return null;
}
