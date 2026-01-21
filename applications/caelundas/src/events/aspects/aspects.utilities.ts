import {
  angleByAspect,
  majorAspects,
  minorAspects,
  orbByAspect,
  specialtyAspects,
} from "../../constants";
import { getAngle } from "../../math.utilities";

import type { Aspect, AspectPhase } from "../../types";

export const isAspect = (args: {
  longitudeBody1: number;
  longitudeBody2: number;
  aspect: Aspect;
}): boolean => {
  const { aspect, longitudeBody1, longitudeBody2 } = args;
  const angle = getAngle(longitudeBody1, longitudeBody2);
  const difference = Math.abs(angle - angleByAspect[aspect]);
  const isAspect = difference < orbByAspect[aspect];
  return isAspect;
};

export const getMajorAspect = (args: {
  longitudeBody1: number;
  longitudeBody2: number;
}): Aspect | null => {
  const { longitudeBody1, longitudeBody2 } = args;
  for (const aspect of majorAspects) {
    if (isAspect({ longitudeBody1, longitudeBody2, aspect })) {
      return aspect;
    }
  }
  return null;
};

export const getMinorAspect = (args: {
  longitudeBody1: number;
  longitudeBody2: number;
}): Aspect | null => {
  const { longitudeBody1, longitudeBody2 } = args;
  for (const aspect of minorAspects) {
    if (isAspect({ longitudeBody1, longitudeBody2, aspect })) {
      return aspect;
    }
  }
  return null;
};

export const getSpecialtyAspect = (args: {
  longitudeBody1: number;
  longitudeBody2: number;
}): Aspect | null => {
  const { longitudeBody1, longitudeBody2 } = args;
  for (const aspect of specialtyAspects) {
    if (isAspect({ longitudeBody1, longitudeBody2, aspect })) {
      return aspect;
    }
  }
  return null;
};

const getIsAspect = (
  aspects: Aspect[],
): ((args: {
  currentLongitudeBody1: number;
  currentLongitudeBody2: number;
  nextLongitudeBody1: number;
  nextLongitudeBody2: number;
  previousLongitudeBody1: number;
  previousLongitudeBody2: number;
}) => AspectPhase | null) => {
  const isAspect = (args: {
    currentLongitudeBody1: number;
    currentLongitudeBody2: number;
    nextLongitudeBody1: number;
    nextLongitudeBody2: number;
    previousLongitudeBody1: number;
    previousLongitudeBody2: number;
  }): AspectPhase | null => {
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
      previousLongitudeBody2,
    );
    const currentAngle = getAngle(currentLongitudeBody1, currentLongitudeBody2);
    const nextAngle = getAngle(nextLongitudeBody1, nextLongitudeBody2);

    for (const aspect of aspects) {
      const aspectAngle = angleByAspect[aspect];
      const orb = orbByAspect[aspect];

      const previousInOrb = Math.abs(previousAngle - aspectAngle) <= orb;
      const currentInOrb = Math.abs(currentAngle - aspectAngle) <= orb;
      const nextInOrb = Math.abs(nextAngle - aspectAngle) <= orb;

      // Check for exact aspect (crossing the exact angle)
      if (currentInOrb) {
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
          if (isBouncing) {
            return "exact";
          }
        } else {
          if (isCrossing) {
            return "exact";
          }
        }
      }

      // Check for entering orb (forming)
      if (!previousInOrb && currentInOrb) {
        return "forming";
      }

      // Check for exiting orb (dissolving)
      if (currentInOrb && !nextInOrb) {
        return "dissolving";
      }
    }

    return null;
  };

  return isAspect;
};

export const getMajorAspectPhase = getIsAspect([...majorAspects]);
export const getMinorAspectPhase = getIsAspect([...minorAspects]);
export const getSpecialtyAspectPhase = getIsAspect([...specialtyAspects]);
