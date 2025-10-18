import { arcminutesPerDegree } from "../../math.utilities.ts";

const sunRadiusArcminutes = 16;
export const sunRadiusDegrees = sunRadiusArcminutes / arcminutesPerDegree;

export const twilights = ["civil", "nautical", "astronomical"] as const;
export type Twilight = (typeof twilights)[number];
export const degreesByTwilight: Record<Twilight, number> = {
  civil: 6,
  nautical: 12,
  astronomical: 18,
};

export function isDawn(args: {
  currentElevation: number;
  previousElevation: number;
  twilight: Twilight;
}) {
  const { currentElevation, previousElevation, twilight } = args;
  const degrees = degreesByTwilight[twilight];
  return currentElevation > -degrees && previousElevation < -degrees;
}

export function isAstronomicalDawn(args: {
  currentElevation: number;
  previousElevation: number;
}) {
  const { currentElevation, previousElevation } = args;
  return isDawn({
    currentElevation,
    previousElevation,
    twilight: "astronomical",
  });
}

export function isNauticalDawn(args: {
  currentElevation: number;
  previousElevation: number;
}) {
  const { currentElevation, previousElevation } = args;
  return isDawn({
    currentElevation,
    previousElevation,
    twilight: "nautical",
  });
}

export function isCivilDawn(args: {
  currentElevation: number;
  previousElevation: number;
}) {
  const { currentElevation, previousElevation } = args;
  return isDawn({
    currentElevation,
    previousElevation,
    twilight: "civil",
  });
}

export function isDusk(args: {
  currentElevation: number;
  previousElevation: number;
  twilight: Twilight;
}) {
  const { currentElevation, previousElevation, twilight } = args;
  const degrees = degreesByTwilight[twilight];
  return currentElevation < -degrees && previousElevation > -degrees;
}

export function isCivilDusk(args: {
  currentElevation: number;
  previousElevation: number;
}) {
  const { currentElevation, previousElevation } = args;
  return isDusk({
    currentElevation,
    previousElevation,
    twilight: "civil",
  });
}

export function isNauticalDusk(args: {
  currentElevation: number;
  previousElevation: number;
}) {
  const { currentElevation, previousElevation } = args;
  return isDusk({
    currentElevation,
    previousElevation,
    twilight: "nautical",
  });
}

export function isAstronomicalDusk(args: {
  currentElevation: number;
  previousElevation: number;
}) {
  const { currentElevation, previousElevation } = args;
  return isDusk({
    currentElevation,
    previousElevation,
    twilight: "astronomical",
  });
}
