import {
  majorAspects,
  minorAspects,
  specialtyAspects,
  type Aspect,
  type MajorAspect,
  type MinorAspect,
  type SpecialtyAspect,
} from "../../symbols.constants.ts";
import { getAngle } from "../../math.utilities.ts";

const angleByMajorAspect: Record<MajorAspect, number> = {
  conjunct: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  opposite: 180,
};

const angleByMinorAspect: Record<MinorAspect, number> = {
  semisextile: 30,
  semisquare: 45,
  sesquiquadrate: 135,
  quincunx: 150,
};

const angleBySpecialtyAspect: Record<SpecialtyAspect, number> = {
  undecile: 32.72727272727273,
  decile: 36,
  novile: 40,
  septile: 51.42857142857143,
  quintile: 72,
  tredecile: 108,
  biquintile: 144,
};

const angleByAspect: Record<Aspect, number> = {
  ...angleByMajorAspect,
  ...angleByMinorAspect,
  ...angleBySpecialtyAspect,
};

const orbByMajorAspect: Record<MajorAspect, number> = {
  conjunct: 8,
  opposite: 8,
  trine: 6,
  square: 6,
  sextile: 4,
};

const orbByMinorAspect: Record<MinorAspect, number> = {
  semisextile: 2,
  quincunx: 3,
  semisquare: 2,
  sesquiquadrate: 2,
};

const orbBySpecialtyAspect: Record<SpecialtyAspect, number> = {
  quintile: 2,
  biquintile: 2,
  septile: 1,
  novile: 1,
  undecile: 1,
  decile: 1,
  tredecile: 1,
};

const orbByAspect: Record<Aspect, number> = {
  ...orbByMajorAspect,
  ...orbByMinorAspect,
  ...orbBySpecialtyAspect,
};

export const isAspect = (args: {
  longitudeBody1: number;
  longitudeBody2: number;
  aspect: Aspect;
}) => {
  const { aspect, longitudeBody1, longitudeBody2 } = args;
  const angle = getAngle(longitudeBody1, longitudeBody2);
  const difference = angle - angleByAspect[aspect];
  const isAspect = difference < orbByAspect[aspect];
  return isAspect;
};

export const getMajorAspect = (args: {
  longitudeBody1: number;
  longitudeBody2: number;
}) => {
  const { longitudeBody1, longitudeBody2 } = args;
  for (const aspect of majorAspects) {
    if (isAspect({ longitudeBody1, longitudeBody2, aspect })) return aspect;
  }
  return null;
};

export const getMinorAspect = (args: {
  longitudeBody1: number;
  longitudeBody2: number;
}) => {
  const { longitudeBody1, longitudeBody2 } = args;
  for (const aspect of minorAspects) {
    if (isAspect({ longitudeBody1, longitudeBody2, aspect })) return aspect;
  }
  return null;
};

export const getSpecialtyAspect = (args: {
  longitudeBody1: number;
  longitudeBody2: number;
}) => {
  const { longitudeBody1, longitudeBody2 } = args;
  for (const aspect of specialtyAspects) {
    if (isAspect({ longitudeBody1, longitudeBody2, aspect })) return aspect;
  }
  return null;
};

const getIsAspect = (aspects: Aspect[]) => {
  const isAspect = (args: {
    currentLongitudeBody1: number;
    currentLongitudeBody2: number;
    nextLongitudeBody1: number;
    nextLongitudeBody2: number;
    previousLongitudeBody1: number;
    previousLongitudeBody2: number;
  }) => {
    const {
      currentLongitudeBody1,
      currentLongitudeBody2,
      nextLongitudeBody1,
      nextLongitudeBody2,
      previousLongitudeBody1,
      previousLongitudeBody2,
    } = args;

    const previousAngle = getAngle(
      previousLongitudeBody1,
      previousLongitudeBody2
    );
    const currentAngle = getAngle(currentLongitudeBody1, currentLongitudeBody2);
    const nextAngle = getAngle(nextLongitudeBody1, nextLongitudeBody2);

    const isAspect = aspects.some((aspect) => {
      const aspectAngle = angleByAspect[aspect];

      const orb = orbByAspect[aspect];
      const isOrb = Math.abs(currentAngle - aspectAngle) <= orb;
      if (!isOrb) return false;

      const previousDifference = previousAngle - aspectAngle;
      const currentDifference = currentAngle - aspectAngle;
      const nextDifference = nextAngle - aspectAngle;

      const isCrossing =
        (previousDifference >= 0 && currentDifference <= 0) ||
        (previousDifference <= 0 && currentDifference >= 0);

      if (aspect === "conjunct") {
        const isBouncing =
          (previousDifference > currentDifference &&
            nextDifference > currentDifference) ||
          (previousDifference < currentDifference &&
            nextDifference < currentDifference);
        return isBouncing;
      }

      return isCrossing;
    });
    return isAspect;
  };

  return isAspect;
};

export const isMajorAspect = getIsAspect([...majorAspects]);
export const isMinorAspect = getIsAspect([...minorAspects]);
export const isSpecialtyAspect = getIsAspect([...specialtyAspects]);
