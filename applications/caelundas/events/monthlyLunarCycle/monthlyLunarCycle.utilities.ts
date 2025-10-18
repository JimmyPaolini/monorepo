import { LunarPhase } from "../../symbols.constants.ts";

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

export function isNewMoon(args: {
  currentIllumination: number;
  previousIlluminations: number[];
  nextIlluminations: number[];
}) {
  const { currentIllumination, previousIlluminations, nextIlluminations } =
    args;
  const isNewMoon =
    currentIllumination < Math.min(...previousIlluminations) &&
    currentIllumination <= Math.min(...nextIlluminations) &&
    currentIllumination < 50;

  return isNewMoon;
}

export function isFullMoon(args: {
  currentIllumination: number;
  previousIlluminations: number[];
  nextIlluminations: number[];
}) {
  const { currentIllumination, previousIlluminations, nextIlluminations } =
    args;

  const isFullMoon =
    currentIllumination > Math.max(...previousIlluminations) &&
    currentIllumination >= Math.max(...nextIlluminations) &&
    currentIllumination > 50;

  return isFullMoon;
}

export function isLunarPhase(args: {
  currentIllumination: number;
  previousIlluminations: number[];
  nextIlluminations: number[];
  lunarPhase: LunarPhase;
}) {
  const { lunarPhase, ...illuminations } = args;

  if (lunarPhase === "new") return isNewMoon({ ...illuminations });
  if (lunarPhase === "full") return isFullMoon({ ...illuminations });

  const { currentIllumination, previousIlluminations } = illuminations;
  const previousIllumination =
    previousIlluminations[previousIlluminations.length - 1];
  const illumination = illuminationByPhase[lunarPhase] * 100;

  const isWaxing = currentIllumination > previousIllumination;
  const isWaning = currentIllumination < previousIllumination;
  const isCrossingUp =
    currentIllumination >= illumination && previousIllumination < illumination;
  const isCrossingDown =
    currentIllumination <= illumination && previousIllumination > illumination;
  const isLunarPhase = isCrossingUp || isCrossingDown;

  const isWaxingLunarPhase = isLunarPhase && isWaxing;
  const isWaningLunarPhase = isLunarPhase && isWaning;

  switch (lunarPhase) {
    case "waxing crescent":
      return isWaxingLunarPhase;
    case "first quarter":
      return isWaxingLunarPhase;
    case "waxing gibbous":
      return isWaxingLunarPhase;
    case "waning gibbous":
      return isWaningLunarPhase;
    case "last quarter":
      return isWaningLunarPhase;
    case "waning crescent":
      return isWaningLunarPhase;
    default:
      return false;
  }
}
