// #region 📏 Annual Solar Cycle

/**
 * Determines if the Sun is crossing the vernal equinox point.
 *
 * The vernal equinox occurs when the Sun's ecliptic longitude crosses 0° (or 360°),
 * transitioning from Pisces to Aries. This marks the beginning of astronomical spring.
 *
 * @param args - Configuration object
 * @param currentLongitude - Current solar longitude in degrees (0-360)
 * @param previousLongitude - Previous minute's solar longitude in degrees
 * @returns True if crossing the vernal equinox point
 *
 * @remarks
 * Uses wraparound detection: current \< 180 && previous \> 180 indicates
 * a crossing from ~360° to ~0° (Pisces to Aries boundary)
 */
export function isVernalEquinox(args: {
  currentLongitude: number;
  previousLongitude: number;
}): boolean {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude < 180 && previousLongitude > 180;
}

/**
 * Determines if the Sun is crossing the first hexadecan point (22.5°).
 * @param args - Configuration object
 * @param currentLongitude - Current solar longitude in degrees
 * @param previousLongitude - Previous minute's solar longitude in degrees
 * @returns True if crossing 22.5° longitude
 */
export function isFirstHexadecan(args: {
  currentLongitude: number;
  previousLongitude: number;
}): boolean {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 22.5 && previousLongitude < 22.5;
}

/**
 * Determines if the Sun is crossing the Beltane point (45°).
 * Celtic cross-quarter day between spring equinox and summer solstice.
 * @param args - Configuration object
 * @param currentLongitude - Current solar longitude in degrees
 * @param previousLongitude - Previous minute's solar longitude in degrees
 * @returns True if crossing 45° longitude
 */
export function isBeltane(args: {
  currentLongitude: number;
  previousLongitude: number;
}): boolean {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 45 && previousLongitude < 45;
}

/**
 * Determines if the Sun is crossing the third hexadecan point (67.5°).
 * @param args - Configuration object
 * @returns True if crossing 67.5° longitude
 */
export function isThirdHexadecan(args: {
  currentLongitude: number;
  previousLongitude: number;
}): boolean {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 67.5 && previousLongitude < 67.5;
}

/**
 * Determines if the Sun is crossing the summer solstice point (90°).
 * Marks the longest day in the Northern Hemisphere.
 * @param args - Configuration object
 * @returns True if crossing 90° longitude
 */
export function isSummerSolstice(args: {
  currentLongitude: number;
  previousLongitude: number;
}): boolean {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 90 && previousLongitude < 90;
}

/**
 * Determines if the Sun is crossing the fifth hexadecan point (112.5°).
 * @param args - Configuration object
 * @returns True if crossing 112.5° longitude
 */
export function isFifthHexadecan(args: {
  currentLongitude: number;
  previousLongitude: number;
}): boolean {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 112.5 && previousLongitude < 112.5;
}

/**
 * Determines if the Sun is crossing the Lammas point (135°).
 * Celtic cross-quarter day between summer solstice and autumn equinox.
 * @param args - Configuration object
 * @returns True if crossing 135° longitude
 */
export function isLammas(args: {
  currentLongitude: number;
  previousLongitude: number;
}): boolean {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 135 && previousLongitude < 135;
}

/**
 * Determines if the Sun is crossing the seventh hexadecan point (157.5°).
 * @param args - Configuration object
 * @returns True if crossing 157.5° longitude
 */
export function isSeventhHexadecan(args: {
  currentLongitude: number;
  previousLongitude: number;
}): boolean {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 157.5 && previousLongitude < 157.5;
}

/**
 * Determines if the Sun is crossing the autumnal equinox point (180°).
 * Marks equal day and night, beginning of astronomical autumn.
 * @param args - Configuration object
 * @returns True if crossing 180° longitude
 */
export function isAutumnalEquinox(args: {
  currentLongitude: number;
  previousLongitude: number;
}): boolean {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 180 && previousLongitude < 180;
}

/**
 * Determines if the Sun is crossing the ninth hexadecan point (202.5°).
 * @param args - Configuration object
 * @returns True if crossing 202.5° longitude
 */
export function isNinthHexadecan(args: {
  currentLongitude: number;
  previousLongitude: number;
}): boolean {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 202.5 && previousLongitude < 202.5;
}

/**
 * Determines if the Sun is crossing the Samhain point (225°).
 * Celtic cross-quarter day between autumn equinox and winter solstice.
 * @param args - Configuration object
 * @returns True if crossing 225° longitude
 */
export function isSamhain(args: {
  currentLongitude: number;
  previousLongitude: number;
}): boolean {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 225 && previousLongitude < 225;
}

/**
 * Determines if the Sun is crossing the eleventh hexadecan point (247.5°).
 * @param args - Configuration object
 * @returns True if crossing 247.5° longitude
 */
export function isEleventhHexadecan(args: {
  currentLongitude: number;
  previousLongitude: number;
}): boolean {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 247.5 && previousLongitude < 247.5;
}

/**
 * Determines if the Sun is crossing the winter solstice point (270°).
 * Marks the shortest day in the Northern Hemisphere.
 * @param args - Configuration object
 * @returns True if crossing 270° longitude
 */
export function isWinterSolstice(args: {
  currentLongitude: number;
  previousLongitude: number;
}): boolean {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 270 && previousLongitude < 270;
}

/**
 * Determines if the Sun is crossing the thirteenth hexadecan point (292.5°).
 * @param args - Configuration object
 * @returns True if crossing 292.5° longitude
 */
export function isThirteenthHexadecan(args: {
  currentLongitude: number;
  previousLongitude: number;
}): boolean {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 292.5 && previousLongitude < 292.5;
}

/**
 * Determines if the Sun is crossing the Imbolc point (315°).
 * Celtic cross-quarter day between winter solstice and spring equinox.
 * @param args - Configuration object
 * @returns True if crossing 315° longitude
 */
export function isImbolc(args: {
  currentLongitude: number;
  previousLongitude: number;
}): boolean {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 315 && previousLongitude < 315;
}

/**
 * Determines if the Sun is crossing the fifteenth hexadecan point (337.5°).
 * @param args - Configuration object
 * @returns True if crossing 337.5° longitude
 */
export function isFifteenthHexadecan(args: {
  currentLongitude: number;
  previousLongitude: number;
}): boolean {
  const { currentLongitude, previousLongitude } = args;
  return currentLongitude >= 337.5 && previousLongitude < 337.5;
}
