import { arcminutesPerDegree } from "../../math.utilities";

/**
 * Sun's apparent angular radius in arcminutes.
 *
 * The Sun subtends approximately 16 arcminutes (about 0.27 degrees) of arc
 * as seen from Earth. This value is used to determine the precise moment of
 * sunrise/sunset (when the Sun's upper limb touches the horizon).
 *
 * @remarks Based on the Sun's mean angular diameter of ~32 arcminutes (radius = 16')
 */
const sunRadiusArcminutes = 16;

/**
 * Sun's apparent angular radius in degrees.
 *
 * Converted from arcminutes to degrees for elevation calculations.
 * Used as the threshold for detecting sunrise and sunset events.
 *
 * @see {@link sunRadiusArcminutes} for the source value
 * @remarks Value: ~0.2667 degrees
 */
export const sunRadiusDegrees = sunRadiusArcminutes / arcminutesPerDegree;

/**
 * Determines if a celestial body is rising above the horizon.
 *
 * A rise occurs when the body's elevation crosses above the threshold
 * (accounting for the body's apparent radius). For the Sun and Moon,
 * this marks the moment the upper limb appears above the horizon.
 *
 * @param args - Configuration object
 * @param currentElevation - Current elevation in degrees
 * @param previousElevation - Previous minute's elevation in degrees
 * @returns True if the body is currently rising
 * @see {@link sunRadiusDegrees} for the threshold value
 *
 * @example
 * ```typescript
 * isRise({ currentElevation: -0.2, previousElevation: -0.3 }); // true (sunrise)
 * isRise({ currentElevation: 5, previousElevation: 4 }); // false (already risen)
 * ```
 */
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

/**
 * Determines if a celestial body is setting below the horizon.
 *
 * A set occurs when the body's elevation crosses below the threshold
 * (accounting for the body's apparent radius). For the Sun and Moon,
 * this marks the moment the upper limb dips below the horizon.
 *
 * @param args - Configuration object
 * @param previousElevation - Previous minute's elevation in degrees
 * @param currentElevation - Current elevation in degrees
 * @returns True if the body is currently setting
 * @see {@link sunRadiusDegrees} for the threshold value
 *
 * @example
 * ```typescript
 * isSet({ previousElevation: -0.2, currentElevation: -0.3 }); // true (sunset)
 * isSet({ previousElevation: 4, currentElevation: 5 }); // false (rising, not setting)
 * ```
 */
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
