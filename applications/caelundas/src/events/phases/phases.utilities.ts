import { getAngle, isMaximum } from "../../math.utilities";
import { degreesByTwilight } from "../twilights/twilights.utilities";

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

function getBrightness(args: {
  distance: number;
  illumination: number;
}): number {
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
}): {
  currentBrightness: number;
  nextBrightnesses: number[];
  previousBrightnesses: number[];
} {
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
    if (illumination === undefined) {
      throw new Error(`Missing illumination at index ${index}`);
    }
    const brightness = getBrightness({ distance, illumination });
    return brightness;
  });

  if (nextDistances.length !== nextIlluminations.length) {
    const message = `nextDistances and nextIlluminations arrays must have the same length`;
    throw new Error(message);
  }

  const nextBrightnesses = nextDistances.map((distance, index) => {
    const illumination = nextIlluminations[index];
    if (illumination === undefined) {
      throw new Error(`Missing illumination at index ${index}`);
    }
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

/**
 * Tests if current minute represents maximum brightness for a planet.
 *
 * Brightness is calculated as illumination divided by distance squared
 * (inverse square law). A maximum occurs when current brightness exceeds
 * all previous values and is greater than or equal to all future values
 * in the margin window.
 *
 * @param args - Brightness calculation parameters
 * @param args.currentDistance - Planet's distance from Earth at current time
 * @param args.currentIllumination - Planet's illumination percentage (0-100)
 * @param args.nextDistances - Distance values for following minutes
 * @param args.nextIlluminations - Illumination values for following minutes
 * @param args.previousDistances - Distance values for preceding minutes
 * @param args.previousIlluminations - Illumination values for preceding minutes
 * @returns True if current minute is a local brightness maximum
 * @remarks Uses MARGIN_MINUTES before/after for accurate extrema detection
 * @see {@link MARGIN_MINUTES} for margin window size
 */
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

/**
 * Tests if current minute represents western (morning) maximum brightness.
 *
 * Combines position check (planet west of Sun) with brightness maximum.
 * Western position means planet rises before the Sun (morning star).
 *
 * @param args - Combined position and brightness parameters
 * @returns True if planet is at maximum morning star brightness
 * @see {@link isBrightest} for brightness calculation
 */
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

/**
 * Tests if current minute represents eastern (evening) maximum brightness.
 *
 * Combines position check (planet east of Sun) with brightness maximum.
 * Eastern position means planet sets after the Sun (evening star).
 *
 * @param args - Combined position and brightness parameters
 * @returns True if planet is at maximum evening star brightness
 * @see {@link isBrightest} for brightness calculation
 */
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

/**
 * Tests if current minute represents maximum eastern elongation.
 *
 * Eastern elongation is the greatest angular distance a planet reaches
 * east of the Sun (evening star position). This is the optimal time for
 * evening observations before the planet begins moving back toward the Sun.
 *
 * For Venus: max ~47°, For Mercury: max ~28°
 *
 * @param args - Elongation calculation parameters
 * @param args.currentLongitudeSun - Sun's ecliptic longitude in degrees
 * @param args.currentLongitudePlanet - Planet's ecliptic longitude in degrees
 * @param args.nextLongitudeSun - Sun's longitude at next minute
 * @param args.nextLongitudePlanet - Planet's longitude at next minute
 * @param args.previousLongitudeSun - Sun's longitude at previous minute
 * @param args.previousLongitudePlanet - Planet's longitude at previous minute
 * @returns True if current minute is maximum eastern elongation
 * @see {@link isMaximum} for extrema detection
 */
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

/**
 * Tests if current minute represents maximum western elongation.
 *
 * Western elongation is the greatest angular distance a planet reaches
 * west of the Sun (morning star position). This is the optimal time for
 * morning observations before the planet begins moving back toward the Sun.
 *
 * For Venus: max ~47°, For Mercury: max ~28°
 *
 * @param args - Elongation calculation parameters
 * @param args.currentLongitudeSun - Sun's ecliptic longitude in degrees
 * @param args.currentLongitudePlanet - Planet's ecliptic longitude in degrees
 * @param args.nextLongitudeSun - Sun's longitude at next minute
 * @param args.nextLongitudePlanet - Planet's longitude at next minute
 * @param args.previousLongitudeSun - Sun's longitude at previous minute
 * @param args.previousLongitudePlanet - Planet's longitude at previous minute
 * @returns True if current minute is maximum western elongation
 * @see {@link isMaximum} for extrema detection
 */
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

const RISE_SET_THRESHOLD = degreesByTwilight.civil;

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

/**
 * Tests if current minute represents morning rise (heliacal rising).
 *
 * Morning rise occurs when a planet emerges from the Sun's glare and
 * becomes visible before sunrise. Detected when angular separation crosses
 * the civil twilight threshold (~6°) while planet is west of Sun.
 *
 * @param args - Rise detection parameters
 * @param args.currentLongitudePlanet - Planet's longitude at current minute
 * @param args.currentLongitudeSun - Sun's longitude at current minute
 * @param args.previousLongitudePlanet - Planet's longitude at previous minute
 * @param args.previousLongitudeSun - Sun's longitude at previous minute
 * @returns True if planet just became visible as morning star
 * @see {@link degreesByTwilight} for visibility threshold
 */
export function isMorningRise(args: {
  currentLongitudePlanet: number;
  currentLongitudeSun: number;
  previousLongitudePlanet: number;
  previousLongitudeSun: number;
}): boolean {
  const isMorningRise = isMorning(args) && isRise(args);
  return isMorningRise;
}

/**
 * Tests if current minute represents morning set (heliacal setting).
 *
 * Morning set occurs when a planet disappears into the Sun's glare,
 * no longer visible before sunrise. Detected when angular separation
 * crosses below the civil twilight threshold while planet is west of Sun.
 *
 * @param args - Set detection parameters
 * @param args.currentLongitudePlanet - Planet's longitude at current minute
 * @param args.currentLongitudeSun - Sun's longitude at current minute
 * @param args.previousLongitudePlanet - Planet's longitude at previous minute
 * @param args.previousLongitudeSun - Sun's longitude at previous minute
 * @returns True if planet just became invisible as morning star
 * @see {@link degreesByTwilight} for visibility threshold
 */
export function isMorningSet(args: {
  currentLongitudePlanet: number;
  currentLongitudeSun: number;
  previousLongitudePlanet: number;
  previousLongitudeSun: number;
}): boolean {
  const isMorningSet = isMorning(args) && isSet(args);
  return isMorningSet;
}

/**
 * Tests if current minute represents evening rise (heliacal rising).
 *
 * Evening rise occurs when a planet emerges from the Sun's glare and
 * becomes visible after sunset. Detected when angular separation crosses
 * the civil twilight threshold while planet is east of Sun.
 *
 * @param args - Rise detection parameters
 * @param args.currentLongitudePlanet - Planet's longitude at current minute
 * @param args.currentLongitudeSun - Sun's longitude at current minute
 * @param args.previousLongitudePlanet - Planet's longitude at previous minute
 * @param args.previousLongitudeSun - Sun's longitude at previous minute
 * @returns True if planet just became visible as evening star
 * @see {@link degreesByTwilight} for visibility threshold
 */
export function isEveningRise(args: {
  currentLongitudePlanet: number;
  currentLongitudeSun: number;
  previousLongitudePlanet: number;
  previousLongitudeSun: number;
}): boolean {
  const isEveningRise = isEvening(args) && isRise(args);
  return isEveningRise;
}

/**
 * Tests if current minute represents evening set (heliacal setting).
 *
 * Evening set occurs when a planet disappears into the Sun's glare,
 * no longer visible after sunset. Detected when angular separation
 * crosses below the civil twilight threshold while planet is east of Sun.
 *
 * @param args - Set detection parameters
 * @param args.currentLongitudePlanet - Planet's longitude at current minute
 * @param args.currentLongitudeSun - Sun's longitude at current minute
 * @param args.previousLongitudePlanet - Planet's longitude at previous minute
 * @param args.previousLongitudeSun - Sun's longitude at previous minute
 * @returns True if planet just became invisible as evening star
 * @see {@link degreesByTwilight} for visibility threshold
 */
export function isEveningSet(args: {
  currentLongitudePlanet: number;
  currentLongitudeSun: number;
  previousLongitudePlanet: number;
  previousLongitudeSun: number;
}): boolean {
  const isEveningSet = isEvening(args) && isSet(args);
  return isEveningSet;
}
