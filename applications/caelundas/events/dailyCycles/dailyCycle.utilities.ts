import { arcminutesPerDegree } from "../../math.utilities.ts";

const sunRadiusArcminutes = 16;
export const sunRadiusDegrees = sunRadiusArcminutes / arcminutesPerDegree;

export function isRise(args: {
  currentElevation: number;
  previousElevation: number;
}) {
  const { currentElevation, previousElevation } = args;
  return (
    currentElevation > -sunRadiusDegrees &&
    previousElevation < -sunRadiusDegrees
  );
}

export function isSet(args: {
  previousElevation: number;
  currentElevation: number;
}) {
  const { previousElevation, currentElevation } = args;
  return (
    currentElevation < -sunRadiusDegrees &&
    previousElevation > -sunRadiusDegrees
  );
}
