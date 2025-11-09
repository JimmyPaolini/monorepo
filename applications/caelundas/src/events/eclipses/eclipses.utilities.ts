import { getAngle, isMaximum, isMinimum } from "../../math.utilities";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type { EclipsePhase } from "../../types";

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
    currentLongitudeSun
  );
  const nextLongitudeAngle = getAngle(nextLongitudeMoon, nextLongitudeSun);
  const previousLongitudeAngle = getAngle(
    previousLongitudeMoon,
    previousLongitudeSun
  );

  const isMinimumLongitudeAngle = isMinimum({
    current: currentLongitudeAngle,
    previous: previousLongitudeAngle,
    next: nextLongitudeAngle,
  });

  const currentLatitudeAngle = getAngle(
    currentLatitudeMoon,
    currentLatitudeSun
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
    currentLongitudeSun
  );
  const nextLongitudeAngle = getAngle(nextLongitudeMoon, nextLongitudeSun);
  const previousLongitudeAngle = getAngle(
    previousLongitudeMoon,
    previousLongitudeSun
  );

  const isMaximumLongitudeAngle = isMaximum({
    current: currentLongitudeAngle,
    previous: previousLongitudeAngle,
    next: nextLongitudeAngle,
  });

  const currentLatitudeAngle = getAngle(
    currentLatitudeMoon,
    currentLatitudeSun
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
