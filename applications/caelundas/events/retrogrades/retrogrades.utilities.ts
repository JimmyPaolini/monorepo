import { normalizeForComparison } from "../../math.utilities.ts";

export function isRetrograde(args: {
  currentLongitude: number;
  previousLongitudes: number[];
  nextLongitudes: number[];
}) {
  const { currentLongitude, previousLongitudes, nextLongitudes } = args;

  const hasBeenDirect = previousLongitudes.every((previousLongitude) => {
    const previousLongitudeNormalized = normalizeForComparison(
      previousLongitude,
      currentLongitude
    );
    return previousLongitudeNormalized < currentLongitude;
  });

  const willBeRetrograde = nextLongitudes.every((nextLongitude) => {
    const nextLongitudeNormalized = normalizeForComparison(
      nextLongitude,
      currentLongitude
    );
    return nextLongitudeNormalized <= currentLongitude;
  });

  const isRetrograde = hasBeenDirect && willBeRetrograde;

  return isRetrograde;
}

export function isDirect(args: {
  currentLongitude: number;
  previousLongitudes: number[];
  nextLongitudes: number[];
}) {
  const { currentLongitude, previousLongitudes, nextLongitudes } = args;

  const hasBeenRetrograde = previousLongitudes.every((previousLongitude) => {
    const previousLongitudeNormalized = normalizeForComparison(
      previousLongitude,
      currentLongitude
    );
    return previousLongitudeNormalized > currentLongitude;
  });

  const willBeDirect = nextLongitudes.every((nextLongitude) => {
    const nextLongitudeNormalized = normalizeForComparison(
      nextLongitude,
      currentLongitude
    );
    return nextLongitudeNormalized >= currentLongitude;
  });

  const isDirect = hasBeenRetrograde && willBeDirect;

  return isDirect;
}
