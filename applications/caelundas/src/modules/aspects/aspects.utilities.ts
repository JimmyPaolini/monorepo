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
 *   function (forming / perfective / dissolving) for a given set of aspects.
 */
@Injectable()
export class AspectsUtilities {
  // 🏗 Dependency Injection

  constructor(private readonly mathService: MathService) {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  /** Computes previous, current, and next separation angles for a two-body longitude window. */
  private computeAngles(args: {
    currentLongitudeBody1: number;
    currentLongitudeBody2: number;
    nextLongitudeBody1: number;
    nextLongitudeBody2: number;
    previousLongitudeBody1: number;
    previousLongitudeBody2: number;
  }): { currentAngle: number; nextAngle: number; previousAngle: number } {
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
    return { currentAngle, nextAngle, previousAngle };
  }

  /** Resolves whether the aspect is entering, exacting, or leaving orb at the current minute. */
  private getAspectPhase(args: {
    aspect: Aspect;
    currentAngle: number;
    nextAngle: number;
    previousAngle: number;
  }): AspectPhase | null {
    const { aspect, currentAngle, nextAngle, previousAngle } = args;
    const aspectAngle = angleByAspect[aspect];
    const orb = orbByAspect[aspect];
    const previousInOrb = Math.abs(previousAngle - aspectAngle) <= orb;
    const currentInOrb = Math.abs(currentAngle - aspectAngle) <= orb;
    const nextInOrb = Math.abs(nextAngle - aspectAngle) <= orb;
    if (currentInOrb) {
      const previousDiff = previousAngle - aspectAngle;
      const currentDiff = currentAngle - aspectAngle;
      const nextDiff = nextAngle - aspectAngle;
      if (
        this.isPerfective({
          aspect,
          currentDifference: currentDiff,
          nextDifference: nextDiff,
          previousDifference: previousDiff,
        })
      ) {
        return "perfective";
      }
    }
    if (!previousInOrb && currentInOrb) return "forming";
    if (currentInOrb && !nextInOrb) return "dissolving";
    return null;
  }

  /** Checks whether the aspect is exact at the current minute based on angular trend. */
  private isPerfective(args: {
    aspect: Aspect;
    currentDifference: number;
    nextDifference: number;
    previousDifference: number;
  }): boolean {
    const { aspect, currentDifference, nextDifference, previousDifference } =
      args;
    if (aspect === "conjunct") {
      return this.isPerfectiveConjunct(
        previousDifference,
        currentDifference,
        nextDifference,
      );
    }

    return this.isPerfectiveNonConjunct(previousDifference, currentDifference);
  }

  /** Uses local-angle minima to detect exact conjunctions where wrap-around can occur. */
  private isPerfectiveConjunct(
    previousDifference: number,
    currentDifference: number,
    nextDifference: number,
  ): boolean {
    return (
      (previousDifference > currentDifference &&
        nextDifference > currentDifference) ||
      (previousDifference < currentDifference &&
        nextDifference < currentDifference)
    );
  }

  /** Detects non-conjunction perfection by checking zero-crossing of aspect-angle difference. */
  private isPerfectiveNonConjunct(
    previousDifference: number,
    currentDifference: number,
  ): boolean {
    return (
      (previousDifference >= 0 && currentDifference <= 0) ||
      (previousDifference <= 0 && currentDifference >= 0)
    );
  }

  // 🌎 Public Methods

  /**
   * Returns a phase-detection function bound to a specific set of aspects.
   *
   * The returned function checks three consecutive minute positions (previous,
   * current, next) to classify a moment as "forming", "perfective", or
   * "dissolving". Conjunction uses a local-minimum bounce test; all other
   * aspects use a sign-crossing test.
   *
   * @returns Phase-detection function for the given aspect set.
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
      const { currentAngle, nextAngle, previousAngle } =
        this.computeAngles(args);
      for (const aspect of aspectsToDetect) {
        const phase = this.getAspectPhase({
          aspect,
          currentAngle,
          nextAngle,
          previousAngle,
        });
        if (phase !== null) return phase;
      }
      return null;
    };
  }

  /**
   * Returns `true` when the angular separation between two bodies falls within
   * the configured orb for the given aspect.
   */
  isAspect(args: {
    aspect: Aspect;
    longitudeBody1: number;
    longitudeBody2: number;
  }): boolean {
    const { aspect, longitudeBody1, longitudeBody2 } = args;
    const angle = this.mathService.getAngle(longitudeBody1, longitudeBody2);
    const difference = Math.abs(angle - angleByAspect[aspect]);
    return difference <= orbByAspect[aspect];
  }
}
