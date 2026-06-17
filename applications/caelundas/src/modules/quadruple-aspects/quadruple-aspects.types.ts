// 🏷️ Types
import type {
  AspectPhase,
  Body,
  QuadrupleAspect,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Moment } from "moment-timezone";

/**
 *
 */
export interface GetQuadrupleAspectEventArguments {
  body1: Body;
  body2: Body;
  body3: Body;
  body4: Body;
  focalOrApexBody?: Body;
  phase: AspectPhase;
  quadrupleAspect: QuadrupleAspect;
  timestamp: Moment;
}
