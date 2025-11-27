import { arcminutesPerDegree } from "../../math.utilities";

const sunRadiusArcminutes = 16;
export const sunRadiusDegrees = sunRadiusArcminutes / arcminutesPerDegree;

export function isRise(args: {
  currentElevation: number;
  previousElevation: number;
}): boolean {
  const { currentElevation, previousElevation } = args;
  return (
    currentElevation > -sunRadiusDegrees &&
    previousElevation < -sunRadiusDegrees
  );
}

export function isSet(args: {
  previousElevation: number;
  currentElevation: number;
}): boolean {
  const { previousElevation, currentElevation } = args;
  return (
    currentElevation < -sunRadiusDegrees &&
    previousElevation > -sunRadiusDegrees
  );
}
