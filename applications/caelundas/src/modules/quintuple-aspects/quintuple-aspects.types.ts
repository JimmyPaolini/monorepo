// 🏷️ Types
import type { AspectBodies } from "@caelundas/src/modules/aspects/aspects.service";
import type {
  AspectPhase,
  Body,
  QuintupleAspect,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Moment } from "moment-timezone";

/**
 *
 */
export interface BuildQuintupleEventParameters {
  aspectSymbol: string;
  bodies: Body[];
  bodiesSorted: string[];
  phase: AspectPhase;
  quintupleAspect: QuintupleAspect;
  symbols: string[];
  timestamp: Moment;
}

/**
 *
 */
export interface ComposePentagramsArguments {
  currentAspectBodies: AspectBodies[];
  minute: Moment;
  previousAspectBodies: AspectBodies[];
}

/**
 *
 */
export interface GetQuintupleAspectEventArguments {
  body1: Body;
  body2: Body;
  body3: Body;
  body4: Body;
  body5: Body;
  phase: AspectPhase;
  quintupleAspect: QuintupleAspect;
  timestamp: Moment;
}
