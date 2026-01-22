import { arcminutesPerDegree } from "../../math.utilities";

/**
 * Sun's apparent angular radius in arcminutes.
 * Used for precise horizon calculations.
 */
const sunRadiusArcminutes = 16;

/**
 * Sun's apparent angular radius in degrees (~0.27°).
 * @see {@link sunRadiusArcminutes}
 */
export const sunRadiusDegrees = sunRadiusArcminutes / arcminutesPerDegree;

/**
 * Available twilight types based on solar depression angle below horizon.
 */
export const twilights = ["civil", "nautical", "astronomical"] as const;

/**
 * Union type of twilight classifications.
 */
export type Twilight = (typeof twilights)[number];

/**
 * Solar depression angles (in degrees below horizon) for each twilight type.
 *
 * - Civil: 6° (sufficient light for outdoor activities)
 * - Nautical: 12° (horizon visible at sea for navigation)
 * - Astronomical: 18° (sky completely dark, faintest stars visible)
 *
 * @remarks
 * These standard definitions are used worldwide for navigation and astronomy.
 */
export const degreesByTwilight: Record<Twilight, number> = {
  civil: 6,
  nautical: 12,
  astronomical: 18,
};

/**
 * Determines if dawn is occurring for a specific twilight type.
 *
 * Dawn marks the transition from darker to lighter conditions as the Sun rises.
 * Each twilight type has a specific depression angle threshold.
 *
 * @param args - Configuration object
 * @param args.currentElevation - Current solar elevation in degrees
 * @param args.previousElevation - Previous minute's solar elevation in degrees
 * @param args.twilight - Type of twilight to detect
 * @returns True if crossing the dawn threshold for the specified twilight type
 * @see {@link degreesByTwilight} for threshold values
 */
export function isDawn(args: {
  currentElevation: number;
  previousElevation: number;
  twilight: Twilight;
}): boolean {
  const { currentElevation, previousElevation, twilight } = args;
  const degrees = degreesByTwilight[twilight];
  return currentElevation > -degrees && previousElevation < -degrees;
}

/**
 * Determines if astronomical dawn is occurring.
 *
 * Astronomical dawn begins when the Sun is 18° below the horizon.
 * This is when the faintest stars start to disappear as the sky begins to lighten.
 *
 * @param args - Configuration object
 * @param args.currentElevation - Current solar elevation in degrees
 * @param args.previousElevation - Previous minute's solar elevation in degrees
 * @returns True if crossing astronomical dawn threshold
 * @see {@link isDawn} for detection algorithm
 */
export function isAstronomicalDawn(args: {
  currentElevation: number;
  previousElevation: number;
}): boolean {
  const { currentElevation, previousElevation } = args;
  return isDawn({
    currentElevation,
    previousElevation,
    twilight: "astronomical",
  });
}

/**
 * Determines if nautical dawn is occurring.
 *
 * Nautical dawn begins when the Sun is 12° below the horizon.
 * The horizon becomes visible at sea, allowing marine navigation.
 *
 * @param args - Configuration object
 * @returns True if crossing nautical dawn threshold
 * @see {@link isDawn}
 */
export function isNauticalDawn(args: {
  currentElevation: number;
  previousElevation: number;
}): boolean {
  const { currentElevation, previousElevation } = args;
  return isDawn({
    currentElevation,
    previousElevation,
    twilight: "nautical",
  });
}

/**
 * Determines if civil dawn is occurring.
 *
 * Civil dawn begins when the Sun is 6° below the horizon.
 * Sufficient light for most outdoor activities without artificial lighting.
 *
 * @param args - Configuration object
 * @returns True if crossing civil dawn threshold
 * @see {@link isDawn}
 */
export function isCivilDawn(args: {
  currentElevation: number;
  previousElevation: number;
}): boolean {
  const { currentElevation, previousElevation } = args;
  return isDawn({
    currentElevation,
    previousElevation,
    twilight: "civil",
  });
}

/**
 * Determines if dusk is occurring for a specific twilight type.
 *
 * Dusk marks the transition from lighter to darker conditions as the Sun sets.
 *
 * @param args - Configuration object
 * @param args.currentElevation - Current solar elevation in degrees
 * @param args.previousElevation - Previous minute's solar elevation in degrees
 * @param args.twilight - Type of twilight to detect
 * @returns True if crossing the dusk threshold for the specified twilight type
 */
export function isDusk(args: {
  currentElevation: number;
  previousElevation: number;
  twilight: Twilight;
}): boolean {
  const { currentElevation, previousElevation, twilight } = args;
  const degrees = degreesByTwilight[twilight];
  return currentElevation < -degrees && previousElevation > -degrees;
}

/**
 * Determines if civil dusk is occurring (Sun crosses 6° below horizon).
 * @param args - Configuration object
 * @returns True if crossing civil dusk threshold
 */
export function isCivilDusk(args: {
  currentElevation: number;
  previousElevation: number;
}): boolean {
  const { currentElevation, previousElevation } = args;
  return isDusk({
    currentElevation,
    previousElevation,
    twilight: "civil",
  });
}

/**
 * Determines if nautical dusk is occurring (Sun crosses 12° below horizon).
 * @param args - Configuration object
 * @returns True if crossing nautical dusk threshold
 */
export function isNauticalDusk(args: {
  currentElevation: number;
  previousElevation: number;
}): boolean {
  const { currentElevation, previousElevation } = args;
  return isDusk({
    currentElevation,
    previousElevation,
    twilight: "nautical",
  });
}

/**
 * Determines if astronomical dusk is occurring (Sun crosses 18° below horizon).
 * Sky becomes completely dark for astronomical observations.
 * @param args - Configuration object
 * @returns True if crossing astronomical dusk threshold
 */
export function isAstronomicalDusk(args: {
  currentElevation: number;
  previousElevation: number;
}): boolean {
  const { currentElevation, previousElevation } = args;
  return isDusk({
    currentElevation,
    previousElevation,
    twilight: "astronomical",
  });
}
