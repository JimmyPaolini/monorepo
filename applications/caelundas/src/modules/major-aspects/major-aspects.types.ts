// 🏷️ Types
import type {
  Body,
  MajorAspect,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { CoordinateEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

/**
 * Three-minute longitude context for evaluating one body pair's major-aspect phase.
 */
export interface DetectAspectForBodyPairArguments {
  body1: Body;
  body2: Body;
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  minute: Moment;
  nextMinute: Moment;
  previousMinute: Moment;
}

/**
 * Parsed body/aspect components recovered from a major-aspect event category list.
 */
export interface ExtractAspectPartsFromCategoriesResult {
  aspect: MajorAspect;
  aspectCapitalized: string;
  body1: Body;
  body1Capitalized: string;
  body2: Body;
  body2Capitalized: string;
}
