/**
 * Aspect detection utilities for identifying angular relationships between celestial bodies.
 *
 * This module provides functions to determine if two bodies form specific aspects (conjunction,
 * opposition, trine, etc.) based on their ecliptic longitudes. Aspects are detected within
 * orb tolerances defined in the constants module.
 */

import {
  angleByAspect,
  aspects,
  bodies,
  majorAspects,
  minorAspects,
  orbByAspect,
  specialtyAspects,
} from "../../constants";
import { getAngle } from "../../math.utilities";

import type { Event } from "../../calendar.utilities";
import type { Aspect, AspectPhase, Body } from "../../types";

/**
 * Determines if two celestial bodies form a specific aspect within orb tolerance.
 *
 * Calculates the angular separation between two bodies and checks if it falls within
 * the allowable orb for the specified aspect type. For example, a conjunction (0°)
 * with an 8° orb is considered valid if bodies are separated by 0°-8°.
 *
 * @param args - Aspect detection parameters
 * @param longitudeBody1 - Ecliptic longitude of first body in degrees (0-360)
 * @param longitudeBody2 - Ecliptic longitude of second body in degrees (0-360)
 * @param aspect - Aspect type to check (e.g., "conjunct", "trine", "square")
 * @returns True if bodies form the specified aspect within orb tolerance
 *
 * @remarks
 * - Uses orb values from {@link orbByAspect} constant (typically 8° for major aspects)
 * - Angle calculation accounts for wraparound at 0°/360° boundary
 * - Orb is measured as absolute difference from exact aspect angle
 *
 * @see {@link getAngle} for angular separation calculation
 * @see {@link getMajorAspect} for detecting any major aspect
 * @see {@link angleByAspect} for exact aspect angles
 * @see {@link orbByAspect} for orb tolerances
 *
 * @example
 * ```typescript
 * // Check if Sun at 45° and Moon at 135° form a square (90° aspect)
 * const hasSquare = isAspect({
 *   longitudeBody1: 45,
 *   longitudeBody2: 135,
 *   aspect: "square"
 * }); // Returns true (90° separation within 8° orb)
 * ```
 */
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

/**
 * Identifies which major aspect exists between two celestial bodies, if any.
 *
 * Iterates through all major aspects (conjunction, sextile, square, trine, opposition)
 * and returns the first matching aspect within orb tolerance. Major aspects are the
 * most significant angular relationships in astrological interpretation.
 *
 * @param args - Body longitude parameters
 * @param longitudeBody1 - Ecliptic longitude of first body in degrees (0-360)
 * @param longitudeBody2 - Ecliptic longitude of second body in degrees (0-360)
 * @returns The major aspect type if detected, or null if no major aspect exists
 *
 * @remarks
 * - Checks aspects in order: conjunct (0°), sextile (60°), square (90°), trine (120°), opposition (180°)
 * - Uses 8° orb tolerance for all major aspects
 * - Returns only the first matching aspect (should not overlap given orb sizes)
 *
 * @see {@link isAspect} for aspect detection logic
 * @see {@link getMinorAspect} for minor aspects
 * @see {@link getSpecialtyAspect} for specialty aspects
 * @see {@link majorAspects} for complete list of major aspects
 *
 * @example
 * ```typescript
 * // Detect major aspect between Venus at 120° and Mars at 240°
 * const aspect = getMajorAspect({
 *   longitudeBody1: 120,
 *   longitudeBody2: 240
 * }); // Returns "trine" (120° separation)
 * ```
 */
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

/**
 * Identifies which minor aspect exists between two celestial bodies, if any.
 *
 * Iterates through minor aspects (semi-sextile, semi-square, sesquiquadrate, quincunx)
 * and returns the first matching aspect within orb tolerance. Minor aspects provide
 * subtle angular relationships with smaller orb allowances than major aspects.
 *
 * @param args - Body longitude parameters
 * @param longitudeBody1 - Ecliptic longitude of first body in degrees (0-360)
 * @param longitudeBody2 - Ecliptic longitude of second body in degrees (0-360)
 * @returns The minor aspect type if detected, or null if no minor aspect exists
 *
 * @remarks
 * - Checks aspects: semi-sextile (30°), semi-square (45°), sesquiquadrate (135°), quincunx (150°)
 * - Typically uses 2-3° orb tolerance (smaller than major aspects)
 * - Minor aspects are considered less influential in traditional astrology
 *
 * @see {@link isAspect} for aspect detection logic
 * @see {@link getMajorAspect} for major aspects
 * @see {@link getSpecialtyAspect} for specialty aspects
 * @see {@link minorAspects} for complete list of minor aspects
 *
 * @example
 * ```typescript
 * // Detect minor aspect between Jupiter at 45° and Saturn at 90°
 * const aspect = getMinorAspect({
 *   longitudeBody1: 45,
 *   longitudeBody2: 90
 * }); // Returns "semi-square" (45° separation)
 * ```
 */
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

/**
 * Identifies which specialty aspect exists between two celestial bodies, if any.
 *
 * Iterates through specialty aspects (quintile, biquintile, septile, novile) and returns
 * the first matching aspect within orb tolerance. Specialty aspects are based on harmonic
 * divisions of the zodiac circle (5th, 7th, and 9th harmonics).
 *
 * @param args - Body longitude parameters
 * @param longitudeBody1 - Ecliptic longitude of first body in degrees (0-360)
 * @param longitudeBody2 - Ecliptic longitude of second body in degrees (0-360)
 * @returns The specialty aspect type if detected, or null if no specialty aspect exists
 *
 * @remarks
 * - Checks aspects: quintile (72°), biquintile (144°), septile (51.43°), novile (40°)
 * - Uses very tight orbs (typically 1-2°) due to subtle harmonic nature
 * - Quintile/biquintile relate to 5th harmonic (360° ÷ 5)
 * - Septile relates to 7th harmonic (360° ÷ 7)
 * - Novile relates to 9th harmonic (360° ÷ 9)
 *
 * @see {@link isAspect} for aspect detection logic
 * @see {@link getMajorAspect} for major aspects
 * @see {@link getMinorAspect} for minor aspects
 * @see {@link specialtyAspects} for complete list of specialty aspects
 *
 * @example
 * ```typescript
 * // Detect specialty aspect between Mercury at 72° and Venus at 0°
 * const aspect = getSpecialtyAspect({
 *   longitudeBody1: 72,
 *   longitudeBody2: 0
 * }); // Returns "quintile" (72° separation)
 * ```
 */
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

/**
 * Creates an aspect phase detector function for a specific set of aspects.
 *
 * This factory function returns a specialized detector that identifies when aspects
 * are forming (entering orb), perfective (crossing precise angle), or dissolving (exiting orb).
 * Uses three consecutive time points to determine phase transitions.
 *
 * @param aspects - Array of aspect types to detect (e.g., majorAspects, minorAspects)
 * @returns Function that detects aspect phases given three consecutive body positions
 *
 * @remarks
 * - **Forming phase**: Aspect enters orb (previous out, current in)
 * - **Perfective phase**: Aspect crosses exact angle within orb
 * - **Dissolving phase**: Aspect exits orb (current in, next out)
 * - Special handling for conjunctions: detects "bouncing" (local minimum separation)
 * - For other aspects: detects zero-crossing of signed angle difference
 *
 * @see {@link getMajorAspectPhase} for major aspect detection
 * @see {@link getMinorAspectPhase} for minor aspect detection
 * @see {@link getSpecialtyAspectPhase} for specialty aspect detection
 * @see {@link getAngle} for angular separation calculation
 *
 * @example
 * ```typescript
 * const detectMajorAspect = getIsAspect(majorAspects);
 *
 * const phase = detectMajorAspect({
 *   previousLongitudeBody1: 88,
 *   currentLongitudeBody1: 89,
 *   nextLongitudeBody1: 90,
 *   previousLongitudeBody2: 178,
 *   currentLongitudeBody2: 179,
 *   nextLongitudeBody2: 180
 * }); // Returns "perfective" (crossing square aspect at 90°)
 * ```
 */
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

      // Check for perfective aspect (crossing the exact angle)
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
            return "perfective";
          }
        } else {
          if (isCrossing) {
            return "perfective";
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

/**
 * Detects major aspect phase transitions between two celestial bodies.
 *
 * Analyzes three consecutive time points to identify when major aspects (conjunction,
 * sextile, square, trine, opposition) are forming, exact, or dissolving. Used for
 * real-time aspect monitoring in the ephemeris pipeline.
 *
 * @param args - Three consecutive body positions
 * @param previousLongitudeBody1 - First body longitude at t-1 (degrees)
 * @param currentLongitudeBody1 - First body longitude at t (degrees)
 * @param nextLongitudeBody1 - First body longitude at t+1 (degrees)
 * @param previousLongitudeBody2 - Second body longitude at t-1 (degrees)
 * @param currentLongitudeBody2 - Second body longitude at t (degrees)
 * @param nextLongitudeBody2 - Second body longitude at t+1 (degrees)
 * @returns "forming", "perfective", "dissolving", or null if no phase transition
 *
 * @remarks
 * - Checks all major aspects in each call (order: conjunct, sextile, square, trine, opposition)
 * - Returns first detected phase transition (aspects should not overlap)
 * - Perfective phase indicates precise aspect angle crossing within orb
 * - Typically called once per minute in the main event loop
 *
 * @see {@link getIsAspect} for phase detection algorithm
 * @see {@link getMajorAspectEvents} for event generation using this detector
 *
 * @example
 * ```typescript
 * const phase = getMajorAspectPhase({
 *   previousLongitudeBody1: 88, currentLongitudeBody1: 89, nextLongitudeBody1: 90,
 *   previousLongitudeBody2: 178, currentLongitudeBody2: 179, nextLongitudeBody2: 180
 * }); // Returns "perfective" (square aspect forming at 90°)
 * ```
 */
export const getMajorAspectPhase = getIsAspect([...majorAspects]);

/**
 * Detects minor aspect phase transitions between two celestial bodies.
 *
 * Analyzes three consecutive time points to identify when minor aspects (semi-sextile,
 * semi-square, sesquiquadrate, quincunx) are forming, exact, or dissolving. Uses tighter
 * orbs than major aspects.
 *
 * @param args - Three consecutive body positions
 * @param previousLongitudeBody1 - First body longitude at t-1 (degrees)
 * @param currentLongitudeBody1 - First body longitude at t (degrees)
 * @param nextLongitudeBody1 - First body longitude at t+1 (degrees)
 * @param previousLongitudeBody2 - Second body longitude at t-1 (degrees)
 * @param currentLongitudeBody2 - Second body longitude at t (degrees)
 * @param nextLongitudeBody2 - Second body longitude at t+1 (degrees)
 * @returns "forming", "perfective", "dissolving", or null if no phase transition
 *
 * @see {@link getIsAspect} for phase detection algorithm
 * @see {@link getMinorAspectEvents} for event generation using this detector
 */
export const getMinorAspectPhase = getIsAspect([...minorAspects]);

/**
 * Detects specialty aspect phase transitions between two celestial bodies.
 *
 * Analyzes three consecutive time points to identify when specialty aspects (quintile,
 * biquintile, septile, novile) are forming, exact, or dissolving. Uses very tight orbs
 * due to harmonic precision requirements.
 *
 * @param args - Three consecutive body positions
 * @param previousLongitudeBody1 - First body longitude at t-1 (degrees)
 * @param currentLongitudeBody1 - First body longitude at t (degrees)
 * @param nextLongitudeBody1 - First body longitude at t+1 (degrees)
 * @param previousLongitudeBody2 - Second body longitude at t-1 (degrees)
 * @param currentLongitudeBody2 - Second body longitude at t (degrees)
 * @param nextLongitudeBody2 - Second body longitude at t+1 (degrees)
 * @returns "forming", "perfective", "dissolving", or null if no phase transition
 *
 * @see {@link getIsAspect} for phase detection algorithm
 * @see {@link getSpecialtyAspectEvents} for event generation using this detector
 */
export const getSpecialtyAspectPhase = getIsAspect([...specialtyAspects]);

/**
 * Represents an active aspect between two celestial bodies at a specific moment.
 */
export interface AspectBodies {
  aspect: Aspect;
  bodies: [Body, Body];
}

function makeKey(body1: Body, body2: Body, aspect: Aspect): string {
  const [sortedBody1, sortedBody2] = [body1, body2].toSorted();
  return `${sortedBody1}\u001F${sortedBody2}\u001F${aspect}`;
}

/**
 * Computes the set of active aspects after applying a batch of perfective events
 * to a previous aspect state.
 *
 * Parses each event's categories to determine whether it marks the forming or
 * dissolving of a two-body aspect, then adds or removes the corresponding
 * entry. Events for patterns other than simple aspects are ignored.
 *
 * @param previousAspectBodies - The active aspects before this event batch
 * @param events - Perfective events emitted during the current processing window
 * @returns The updated set of active aspects after applying all events
 */
export function computeAspectBodies(
  previousAspectBodies: AspectBodies[],
  events: Event[],
): AspectBodies[] {
  const map = new Map<string, AspectBodies>(
    previousAspectBodies.map((ab) => [makeKey(ab.bodies[0], ab.bodies[1], ab.aspect), ab]),
  );

  const lowercaseBodies = bodies.map((body) => body.toLowerCase());

  for (const event of events) {
    const normalizedCategories = event.categories.map((category) =>
      category.toLowerCase().trim(),
    );

    if (!normalizedCategories.includes("simple aspect")) {
      continue;
    }

    const isForming = normalizedCategories.includes("forming");
    const isDissolving = normalizedCategories.includes("dissolving");

    if (!isForming && !isDissolving) {
      continue;
    }

    const eventBodies: Body[] = [];
    for (const category of normalizedCategories) {
      const bodyIndex = lowercaseBodies.indexOf(category);
      if (bodyIndex !== -1) {
        const body = bodies[bodyIndex];
        if (body) {
          eventBodies.push(body);
        }
      }
    }

    if (eventBodies.length !== 2) {
      continue;
    }

    const aspect = normalizedCategories.find((category) =>
      aspects.includes(category as Aspect),
    ) as Aspect | undefined;

    if (!aspect) {
      continue;
    }

    const [body1, body2] = eventBodies as [Body, Body];
    const key = makeKey(body1, body2, aspect);

    if (isDissolving) {
      map.delete(key);
      continue;
    }

    if (!map.has(key)) {
      map.set(key, { aspect, bodies: [body1, body2] });
    }
  }

  return [...map.values()];
}
