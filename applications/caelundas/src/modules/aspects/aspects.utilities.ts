import {
  angleByAspect,
  orbByAspect,
} from "@caelundas/src/modules/caelundas/caelundas.constants";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { Injectable } from "@nestjs/common";

import type {
  Aspect,
  AspectPhase,
} from "@caelundas/src/modules/caelundas/caelundas.types";

/**
 * NestJS provider exposing core aspect detection utilities.
 *
 * Two entry points are provided:
 * - {@link AspectsUtilities#isAspect}: point-in-time orb check
 * - {@link AspectsUtilities#getIsAspect}: factory that returns a phase-classification
 *   function (forming / perfective / dissolving) for a given set of aspects
 */
@Injectable()
export class AspectsUtilities {
  constructor(private readonly mathService: MathService) {}

  /**
   * Returns `true` when the angular separation between two bodies falls within
   * the configured orb for the given aspect.
   *
   * @param args - `longitudeBody1`, `longitudeBody2` (ecliptic degrees), and `aspect` type to test
   */
  isAspect(args: {
    longitudeBody1: number;
    longitudeBody2: number;
    aspect: Aspect;
  }): boolean {
    const { aspect, longitudeBody1, longitudeBody2 } = args;
    const angle = this.mathService.getAngle(longitudeBody1, longitudeBody2);
    const difference = Math.abs(angle - angleByAspect[aspect]);
    return difference <= orbByAspect[aspect];
  }

  /**
   * Returns a phase-detection function bound to a specific set of aspects.
   *
   * The returned function checks three consecutive minute positions (previous,
   * current, next) to classify a moment as "forming", "perfective", or
   * "dissolving". Conjunction uses a local-minimum bounce test; all other
   * aspects use a sign-crossing test.
   *
   * @param aspectsToDetect - Aspects to test for
   * @returns Phase-detection function for the given aspect set
   */
  getIsAspect(
    aspectsToDetect: Aspect[],
  ): (args: {
    currentLongitudeBody1: number;
    currentLongitudeBody2: number;
    nextLongitudeBody1: number;
    nextLongitudeBody2: number;
    previousLongitudeBody1: number;
    previousLongitudeBody2: number;
  }) => AspectPhase | null {
    return (args) => {
      const {
        currentLongitudeBody1,
        currentLongitudeBody2,
        nextLongitudeBody1,
        nextLongitudeBody2,
        previousLongitudeBody1,
        previousLongitudeBody2,
      } = args;

      const previousAngle = this.mathService.getAngle(
        previousLongitudeBody1,
        previousLongitudeBody2,
      );
      const currentAngle = this.mathService.getAngle(
        currentLongitudeBody1,
        currentLongitudeBody2,
      );
      const nextAngle = this.mathService.getAngle(
        nextLongitudeBody1,
        nextLongitudeBody2,
      );

      for (const aspect of aspectsToDetect) {
        const aspectAngle = angleByAspect[aspect];
        const orb = orbByAspect[aspect];

        const previousInOrb = Math.abs(previousAngle - aspectAngle) <= orb;
        const currentInOrb = Math.abs(currentAngle - aspectAngle) <= orb;
        const nextInOrb = Math.abs(nextAngle - aspectAngle) <= orb;

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

        if (!previousInOrb && currentInOrb) {
          return "forming";
        }

        if (currentInOrb && !nextInOrb) {
          return "dissolving";
        }
      }

      return null;
    };
  }
}
