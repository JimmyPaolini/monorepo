// 🏷️ Types
import type {
  AspectPhase,
  Body,
  MinorAspect,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { CoordinateEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

/**
 *
 */
export interface AssembleMinorAspectEventArguments {
  body1: Body;
  body2: Body;
  minorAspect: MinorAspect;
  phase: AspectPhase;
  timestamp: Moment;
}

/**
 *
 */
export interface DetectBodyPairAspectArguments {
  body1: Body;
  body2: Body;
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  minute: Moment;
  nextMinute: Moment;
  previousMinute: Moment;
}

/**
 *
 */
export interface ExtractAspectComponentsResult {
  aspect: MinorAspect;
  aspectCapitalized: string;
  body1: Body;
  body1Capitalized: string;
  body2: Body;
  body2Capitalized: string;
}
