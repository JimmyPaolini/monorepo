import { getAngle, isMaximum } from "../../math.utilities.ts";
import { degreesByTwilight } from "../twilights/twilights.utilities.ts";

function isWestern(args: {
  currentLongitudePlanet: number;
  currentLongitudeSun: number;
}): boolean {
  const { currentLongitudePlanet, currentLongitudeSun } = args;
  const isWestern = currentLongitudePlanet < currentLongitudeSun;
  return isWestern;
}

function isMorning(args: Parameters<typeof isWestern>[0]): boolean {
  return isWestern(args);
}

function isEastern(args: {
  currentLongitudePlanet: number;
  currentLongitudeSun: number;
}): boolean {
  const { currentLongitudePlanet, currentLongitudeSun } = args;
  const isEastern = currentLongitudePlanet > currentLongitudeSun;
  return isEastern;
}

function isEvening(args: Parameters<typeof isEastern>[0]): boolean {
  return isEastern(args);
}

// #region 🔆 Brightness

function getBrightness(args: { distance: number; illumination: number }) {
  const { distance, illumination } = args;
  return illumination / distance ** 2;
}

function getBrightnesses(args: {
  currentDistance: number;
  currentIllumination: number;
  nextDistances: number[];
  nextIlluminations: number[];
  previousDistances: number[];
  previousIlluminations: number[];
}) {
  const {
    currentDistance,
    currentIllumination,
    nextDistances,
    nextIlluminations,
    previousDistances,
    previousIlluminations,
  } = args;

  const currentBrightness = getBrightness({
    illumination: currentIllumination,
    distance: currentDistance,
  });

  if (previousDistances.length !== previousIlluminations.length) {
    const message = `previousDistances and previousIlluminations arrays must have the same length`;
    throw new Error(message);
  }

  const previousBrightnesses = previousDistances.map((distance, index) => {
    const illumination = previousIlluminations[index];
    const brightness = getBrightness({ distance, illumination });
    return brightness;
  });

  if (nextDistances.length !== nextIlluminations.length) {
    const message = `nextDistances and nextIlluminations arrays must have the same length`;
    throw new Error(message);
  }

  const nextBrightnesses = nextDistances.map((distance, index) => {
    const illumination = nextIlluminations[index];
    const brightness = getBrightness({ distance, illumination });
    return brightness;
  });

  const brightnesses = {
    currentBrightness,
    nextBrightnesses,
    previousBrightnesses,
  };
  return brightnesses;
}

export function isBrightest(args: {
  currentDistance: number;
  currentIllumination: number;
  nextDistances: number[];
  nextIlluminations: number[];
  previousDistances: number[];
  previousIlluminations: number[];
}): boolean {
  const { currentBrightness, nextBrightnesses, previousBrightnesses } =
    getBrightnesses(args);

  const isBrightest =
    currentBrightness > Math.max(...previousBrightnesses) &&
    currentBrightness >= Math.max(...nextBrightnesses);

  return isBrightest;
}

export function isWesternBrightest(args: {
  currentDistance: number;
  currentIllumination: number;
  nextDistances: number[];
  nextIlluminations: number[];
  previousDistances: number[];
  previousIlluminations: number[];
  currentLongitudePlanet: number;
  currentLongitudeSun: number;
}): boolean {
  const isWesternBrightest = isWestern(args) && isBrightest(args);
  return isWesternBrightest;
}

export function isEasternBrightest(args: {
  currentDistance: number;
  currentIllumination: number;
  nextDistances: number[];
  nextIlluminations: number[];
  previousDistances: number[];
  previousIlluminations: number[];
  currentLongitudePlanet: number;
  currentLongitudeSun: number;
}): boolean {
  const isEasternBrightest = isEastern(args) && isBrightest(args);
  return isEasternBrightest;
}

// #region 📏 Elongation

function isElongation(args: {
  currentLongitudeSun: number;
  currentLongitudePlanet: number;
  nextLongitudeSun: number;
  nextLongitudePlanet: number;
  previousLongitudeSun: number;
  previousLongitudePlanet: number;
}): boolean {
  const {
    currentLongitudePlanet,
    currentLongitudeSun,
    nextLongitudePlanet,
    nextLongitudeSun,
    previousLongitudePlanet,
    previousLongitudeSun,
  } = args;

  const currentAngle = getAngle(currentLongitudePlanet, currentLongitudeSun);
  const nextAngle = getAngle(nextLongitudePlanet, nextLongitudeSun);
  const previousAngle = getAngle(previousLongitudePlanet, previousLongitudeSun);

  const isElongation = isMaximum({
    current: currentAngle,
    next: nextAngle,
    previous: previousAngle,
  });
  return isElongation;
}

export function isEasternElongation(args: {
  currentLongitudeSun: number;
  currentLongitudePlanet: number;
  nextLongitudeSun: number;
  nextLongitudePlanet: number;
  previousLongitudeSun: number;
  previousLongitudePlanet: number;
}): boolean {
  const isEasternElongation = isElongation(args) && isEastern(args);
  return isEasternElongation;
}

export function isWesternElongation(args: {
  currentLongitudeSun: number;
  currentLongitudePlanet: number;
  nextLongitudeSun: number;
  nextLongitudePlanet: number;
  previousLongitudeSun: number;
  previousLongitudePlanet: number;
}): boolean {
  const isWesternElongation = isElongation(args) && isWestern(args);
  return isWesternElongation;
}

// #region 🌅 Rise/Set

const RISE_SET_THRESHOLD = degreesByTwilight["civil"];

function isRise(args: {
  currentLongitudePlanet: number;
  currentLongitudeSun: number;
  previousLongitudePlanet: number;
  previousLongitudeSun: number;
}): boolean {
  const {
    currentLongitudePlanet,
    currentLongitudeSun,
    previousLongitudePlanet,
    previousLongitudeSun,
  } = args;

  const previousAngle = getAngle(previousLongitudePlanet, previousLongitudeSun);
  const currentAngle = getAngle(currentLongitudePlanet, currentLongitudeSun);

  const isRise =
    previousAngle < RISE_SET_THRESHOLD && currentAngle >= RISE_SET_THRESHOLD;
  return isRise;
}

function isSet(args: {
  currentLongitudePlanet: number;
  currentLongitudeSun: number;
  previousLongitudePlanet: number;
  previousLongitudeSun: number;
}): boolean {
  const {
    currentLongitudePlanet,
    currentLongitudeSun,
    previousLongitudePlanet,
    previousLongitudeSun,
  } = args;

  const previousAngle = getAngle(previousLongitudePlanet, previousLongitudeSun);
  const currentAngle = getAngle(currentLongitudePlanet, currentLongitudeSun);

  const isSet =
    previousAngle > RISE_SET_THRESHOLD && currentAngle <= RISE_SET_THRESHOLD;
  return isSet;
}

export function isMorningRise(args: {
  currentLongitudePlanet: number;
  currentLongitudeSun: number;
  previousLongitudePlanet: number;
  previousLongitudeSun: number;
}): boolean {
  const isMorningRise = isMorning(args) && isRise(args);
  return isMorningRise;
}

export function isMorningSet(args: {
  currentLongitudePlanet: number;
  currentLongitudeSun: number;
  previousLongitudePlanet: number;
  previousLongitudeSun: number;
}): boolean {
  const isMorningSet = isMorning(args) && isSet(args);
  return isMorningSet;
}

export function isEveningRise(args: {
  currentLongitudePlanet: number;
  currentLongitudeSun: number;
  previousLongitudePlanet: number;
  previousLongitudeSun: number;
}): boolean {
  const isEveningRise = isEvening(args) && isRise(args);
  return isEveningRise;
}

export function isEveningSet(args: {
  currentLongitudePlanet: number;
  currentLongitudeSun: number;
  previousLongitudePlanet: number;
  previousLongitudeSun: number;
}): boolean {
  const isEveningSet = isEvening(args) && isSet(args);
  return isEveningSet;
}
