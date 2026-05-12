/**
 * Reference frame for eclipse visibility reporting.
 * - `geocentric`: Eclipse as seen from Earth's centre (always occurs when geometry aligns)
 * - `topocentric`: Eclipse as seen from the observer's ground location (requires bodies above horizon)
 */
export type EclipseFrame = "geocentric" | "topocentric";
