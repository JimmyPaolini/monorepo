import type { Sign } from "../../symbols.constants.ts";

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

export function getSign(longitude: number): Sign {
  const entry = Object.entries(degreeRangeBySign).find(([, { min, max }]) => {
    return longitude >= min && longitude < max;
  });
  if (!entry) throw new Error(`🚫 Longitude ${longitude} not in any sign.`);
  return entry[0] as Sign;
}

export const isSignIngress = (args: {
  previousLongitude: number;
  currentLongitude: number;
}) => {
  const { currentLongitude, previousLongitude } = args;
  return getSign(currentLongitude) !== getSign(previousLongitude);
};

export function getDecan(longitude: number): number {
  const sign = getSign(longitude);
  const { min } = degreeRangeBySign[sign];
  return Math.floor((longitude - min) / 10) + 1;
}

export function isDecanIngress(args: {
  previousLongitude: number;
  currentLongitude: number;
}) {
  const { currentLongitude, previousLongitude } = args;
  return getDecan(currentLongitude) !== getDecan(previousLongitude);
}

export function isPeakIngress(args: {
  previousLongitude: number;
  currentLongitude: number;
}) {
  const { currentLongitude, previousLongitude } = args;

  const previousSign = getSign(previousLongitude);
  const { min: previousMin } = degreeRangeBySign[previousSign];
  const previousDifference = previousLongitude - previousMin;

  const currentSign = getSign(currentLongitude);
  const { min: currentMin } = degreeRangeBySign[currentSign];
  const currentDifference = currentLongitude - currentMin;

  return currentDifference >= 15 && previousDifference < 15;
}
