// 🏷️ Types

import type {
  Aspect,
  Body,
} from "@caelundas/src/modules/caelundas/caelundas.types";

/**
 * Represents an active aspect between two celestial bodies at a specific moment.
 */
export interface AspectBodies {
  aspect: Aspect;
  bodies: [Body, Body];
}
