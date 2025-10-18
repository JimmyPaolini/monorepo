import { getAngle, isMaximum, isMinimum } from "../../math.utilities.ts";

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
}) {
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
  const isLatitudeAngleSmallEnough = currentLatitudeAngle < currentDiameter;

  const isSolarEclipse = isMinimumLongitudeAngle && isLatitudeAngleSmallEnough;
  return isSolarEclipse;
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
}) {
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
  const isLatitudeAngleSmallEnough = currentLatitudeAngle < currentDiameter;

  const isLunarEclipse = isMaximumLongitudeAngle && isLatitudeAngleSmallEnough;
  return isLunarEclipse;
}
