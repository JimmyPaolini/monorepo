// 🏷️ Types
import type { AspectBodies } from "@caelundas/src/modules/aspects/aspects.service";
import type {
  AspectPhase,
  Body,
  SextupleAspect,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Moment } from "moment-timezone";

/**
 *
 */
export interface BuildSextupleEventParameters {
  aspectSymbol: string;
  bodies: Body[];
  bodiesSorted: string[];
  phase: AspectPhase;
  sextupleAspect: SextupleAspect;
  symbols: string[];
  timestamp: Moment;
}

/**
 *
 */
export interface ComposeHexagramsArguments {
  currentAspectBodies: AspectBodies[];
  minute: Moment;
  previousAspectBodies: AspectBodies[];
}

/**
 *
 */
export interface GetSextupleAspectEventArguments {
  body1: Body;
  body2: Body;
  body3: Body;
  body4: Body;
  body5: Body;
  body6: Body;
  phase: AspectPhase;
  sextupleAspect: SextupleAspect;
  timestamp: Moment;
}
