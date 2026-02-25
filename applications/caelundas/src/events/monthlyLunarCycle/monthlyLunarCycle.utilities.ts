import type { LunarPhase } from "../../types";

/**
 * Maps each lunar phase to its approximate illumination percentage.
 *
 * @remarks
 * Values are idealized; actual illumination varies slightly due to
 * libration and observing conditions.
 */
export const illuminationByPhase: Record<LunarPhase, number> = {
  new: 0,
  "waxing crescent": 0.25,
  "first quarter": 0.5,
  "waxing gibbous": 0.75,
  full: 1,
  "waning gibbous": 0.75,
  "last quarter": 0.5,
  "waning crescent": 0.25,
};

/**
 * Determines if a new moon is occurring.
 *
 * New moon is the phase when the Moon is between Earth and Sun (conjunction).
 * Illumination is at its minimum (\<50% and decreasing to lowest point).
 *
 * @param args - Configuration object
 * @param currentIllumination - Current illumination percentage (0-100)
 * @param previousIlluminations - Array of previous illumination values
 * @param nextIlluminations - Array of future illumination values
 * @returns True if new moon is occurring
 * @see {@link isLunarPhase} for other phase detection
 */
export function isNewMoon(args: {
  currentIllumination: number;
  previousIlluminations: number[];
  nextIlluminations: number[];
}): boolean {
  const { currentIllumination, previousIlluminations, nextIlluminations } =
    args;
  const isNewMoon =
    currentIllumination < Math.min(...previousIlluminations) &&
    currentIllumination <= Math.min(...nextIlluminations) &&
    currentIllumination < 50;

  return isNewMoon;
}

/**
 * Determines if a full moon is occurring.
 *
 * Full moon is the phase when the Moon is opposite the Sun (opposition).
 * Illumination is at its maximum (\>50% and increasing to highest point).
 *
 * @param args - Configuration object
 * @returns True if full moon is occurring
 */
export function isFullMoon(args: {
  currentIllumination: number;
  previousIlluminations: number[];
  nextIlluminations: number[];
}): boolean {
  const { currentIllumination, previousIlluminations, nextIlluminations } =
    args;

  const isFullMoon =
    currentIllumination > Math.max(...previousIlluminations) &&
    currentIllumination >= Math.max(...nextIlluminations) &&
    currentIllumination > 50;

  return isFullMoon;
}

/**
 * Determines if any intermediate lunar phase is occurring.
 *
 * Detects quarter moons and crescent/gibbous phases by checking when
 * illumination crosses specific thresholds (25%, 50%, 75%). Distinguishes
 * waxing (increasing) from waning (decreasing) phases.
 *
 * @param args - Configuration object
 * @param currentIllumination - Current illumination percentage
 * @param previousIlluminations - Previous illumination values
 * @param nextIlluminations - Future illumination values
 * @param lunarPhase - Specific phase to detect
 * @returns True if the specified lunar phase is occurring
 * @see {@link illuminationByPhase} for threshold values
 * @see {@link isNewMoon} for new moon detection
 * @see {@link isFullMoon} for full moon detection
 */
export function isLunarPhase(args: {
  currentIllumination: number;
  previousIlluminations: number[];
  nextIlluminations: number[];
  lunarPhase: LunarPhase;
}): boolean {
  const { lunarPhase, ...illuminations } = args;

  if (lunarPhase === "new") {
    return isNewMoon({ ...illuminations });
  }
  if (lunarPhase === "full") {
    return isFullMoon({ ...illuminations });
  }

  const { currentIllumination, previousIlluminations } = illuminations;
  const previousIllumination = previousIlluminations[0];
  if (!previousIllumination) {
    return false;
  }

  const illumination = illuminationByPhase[lunarPhase] * 100;

  const isWaxing = currentIllumination > previousIllumination;
  const isWaning = currentIllumination < previousIllumination;
  // Only trigger when crossing the threshold, not when remaining at/beyond it
  const isCrossingUp =
    currentIllumination > illumination && previousIllumination <= illumination;
  const isCrossingDown =
    currentIllumination < illumination && previousIllumination >= illumination;
  const isLunarPhase = isCrossingUp || isCrossingDown;

  const isWaxingLunarPhase = isLunarPhase && isWaxing;
  const isWaningLunarPhase = isLunarPhase && isWaning;

  switch (lunarPhase) {
    case "waxing crescent": {
      return isWaxingLunarPhase;
    }
    case "first quarter": {
      return isWaxingLunarPhase;
    }
    case "waxing gibbous": {
      return isWaxingLunarPhase;
    }
    case "waning gibbous": {
      return isWaningLunarPhase;
    }
    case "last quarter": {
      return isWaningLunarPhase;
    }
    case "waning crescent": {
      return isWaningLunarPhase;
    }
    default: {
      return false;
    }
  }
}
