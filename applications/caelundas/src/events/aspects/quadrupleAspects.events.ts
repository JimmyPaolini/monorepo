import fs from "fs";
import _ from "lodash";
import type { Moment } from "moment";
import type { EventTemplate } from "../../calendar.utilities";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import {
  Body,
  BodySymbol,
  QuadrupleAspect,
  QuadrupleAspectSymbol,
  symbolByBody,
  symbolByQuadrupleAspect,
  QUADRUPLE_ASPECT_BODIES,
} from "../../constants";
import { type Event, getCalendar } from "../../calendar.utilities";
import { isAspect } from "./aspects.utilities";
import { getAngle } from "../../math.utilities";
import { upsertEvents } from "../../database.utilities";
import { getOutputPath } from "../../output.utilities";

export type QuadrupleAspectPhase = "forming" | "exact" | "dissolving";

type QuadrupleAspectDescription = string;

type QuadrupleAspectSummary = string;

export interface QuadrupleAspectEventTemplate extends EventTemplate {
  description: QuadrupleAspectDescription;
  summary: QuadrupleAspectSummary;
}

export interface QuadrupleAspectEvent extends Event {
  description: QuadrupleAspectDescription;
  summary: QuadrupleAspectSummary;
}

// #region Grand Cross

function calculateGrandCrossTightness(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
}): number {
  const { longitude1, longitude2, longitude3, longitude4 } = args;

  const angle12 = getAngle(longitude1, longitude2);
  const angle13 = getAngle(longitude1, longitude3);
  const angle14 = getAngle(longitude1, longitude4);
  const angle23 = getAngle(longitude2, longitude3);
  const angle24 = getAngle(longitude2, longitude4);
  const angle34 = getAngle(longitude3, longitude4);

  // Grand Cross consists of:
  // - Two oppositions (180°): 1-3 and 2-4 (or 1-2 and 3-4, or 1-4 and 2-3)
  // - Four squares (90°): all other combinations

  // Find which configuration gives the smallest total deviation
  const configurations = [
    // Configuration 1: 1-3 and 2-4 are oppositions
    Math.abs(angle13 - 180) +
      Math.abs(angle24 - 180) +
      Math.abs(angle12 - 90) +
      Math.abs(angle14 - 90) +
      Math.abs(angle23 - 90) +
      Math.abs(angle34 - 90),
    // Configuration 2: 1-2 and 3-4 are oppositions
    Math.abs(angle12 - 180) +
      Math.abs(angle34 - 180) +
      Math.abs(angle13 - 90) +
      Math.abs(angle14 - 90) +
      Math.abs(angle23 - 90) +
      Math.abs(angle24 - 90),
    // Configuration 3: 1-4 and 2-3 are oppositions
    Math.abs(angle14 - 180) +
      Math.abs(angle23 - 180) +
      Math.abs(angle12 - 90) +
      Math.abs(angle13 - 90) +
      Math.abs(angle24 - 90) +
      Math.abs(angle34 - 90),
  ];

  return Math.min(...configurations);
}

function detectGrandCross(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
}): boolean {
  const { longitude1, longitude2, longitude3, longitude4 } = args;

  // Check Configuration 1: 1-3 and 2-4 are oppositions
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude4,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude4,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude2,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude4,
      aspect: "square",
    })
  ) {
    return true;
  }

  // Check Configuration 2: 1-2 and 3-4 are oppositions
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude4,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude4,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude4,
      aspect: "square",
    })
  ) {
    return true;
  }

  // Check Configuration 3: 1-4 and 2-3 are oppositions
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude4,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude4,
      longitudeBody2: longitude2,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude4,
      longitudeBody2: longitude3,
      aspect: "square",
    })
  ) {
    return true;
  }

  return false;
}

// #region Kite

function calculateKiteTightness(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
}): number {
  const { longitude1, longitude2, longitude3, longitude4 } = args;

  const angle12 = getAngle(longitude1, longitude2);
  const angle13 = getAngle(longitude1, longitude3);
  const angle14 = getAngle(longitude1, longitude4);
  const angle23 = getAngle(longitude2, longitude3);
  const angle24 = getAngle(longitude2, longitude4);
  const angle34 = getAngle(longitude3, longitude4);

  // Kite: 3 trines (Grand Trine base) + 1 opposition + 2 sextiles
  // Try each planet as the kite "point" (opposite one trine planet, sextile to others)
  const configurations = [
    // Config 1: 1-2-3 are Grand Trine, 4 is the point
    Math.abs(angle12 - 120) +
      Math.abs(angle13 - 120) +
      Math.abs(angle23 - 120) +
      Math.abs(angle14 - 180) +
      Math.abs(angle24 - 60) +
      Math.abs(angle34 - 60),
    // Config 2: 1-2-4 are Grand Trine, 3 is the point
    Math.abs(angle12 - 120) +
      Math.abs(angle14 - 120) +
      Math.abs(angle24 - 120) +
      Math.abs(angle13 - 180) +
      Math.abs(angle23 - 60) +
      Math.abs(angle34 - 60),
    // Config 3: 1-3-4 are Grand Trine, 2 is the point
    Math.abs(angle13 - 120) +
      Math.abs(angle14 - 120) +
      Math.abs(angle34 - 120) +
      Math.abs(angle12 - 180) +
      Math.abs(angle23 - 60) +
      Math.abs(angle24 - 60),
    // Config 4: 2-3-4 are Grand Trine, 1 is the point
    Math.abs(angle23 - 120) +
      Math.abs(angle24 - 120) +
      Math.abs(angle34 - 120) +
      Math.abs(angle12 - 180) +
      Math.abs(angle13 - 60) +
      Math.abs(angle14 - 60),
  ];

  return Math.min(...configurations);
}

function detectKite(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
}): boolean {
  const { longitude1, longitude2, longitude3, longitude4 } = args;

  // Config 1: 1-2-3 are Grand Trine, 4 is the point
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude4,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude4,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude4,
      aspect: "sextile",
    })
  ) {
    return true;
  }

  // Config 2: 1-2-4 are Grand Trine, 3 is the point
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude4,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude4,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude4,
      longitudeBody2: longitude3,
      aspect: "sextile",
    })
  ) {
    return true;
  }

  // Config 3: 1-3-4 are Grand Trine, 2 is the point
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude4,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude4,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude2,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude4,
      longitudeBody2: longitude2,
      aspect: "sextile",
    })
  ) {
    return true;
  }

  // Config 4: 2-3-4 are Grand Trine, 1 is the point
  if (
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude4,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude4,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude1,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude1,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude4,
      longitudeBody2: longitude1,
      aspect: "sextile",
    })
  ) {
    return true;
  }

  return false;
}

// #region Mystic Rectangle

function calculateMysticRectangleTightness(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
}): number {
  const { longitude1, longitude2, longitude3, longitude4 } = args;

  const angle12 = getAngle(longitude1, longitude2);
  const angle13 = getAngle(longitude1, longitude3);
  const angle14 = getAngle(longitude1, longitude4);
  const angle23 = getAngle(longitude2, longitude3);
  const angle24 = getAngle(longitude2, longitude4);
  const angle34 = getAngle(longitude3, longitude4);

  // Mystic Rectangle: 2 oppositions + 4 sextiles
  const configurations = [
    // Configuration 1: 1-3 and 2-4 are oppositions
    Math.abs(angle13 - 180) +
      Math.abs(angle24 - 180) +
      Math.abs(angle12 - 60) +
      Math.abs(angle23 - 60) +
      Math.abs(angle34 - 60) +
      Math.abs(angle14 - 60),
    // Configuration 2: 1-2 and 3-4 are oppositions
    Math.abs(angle12 - 180) +
      Math.abs(angle34 - 180) +
      Math.abs(angle13 - 60) +
      Math.abs(angle23 - 60) +
      Math.abs(angle24 - 60) +
      Math.abs(angle14 - 60),
    // Configuration 3: 1-4 and 2-3 are oppositions
    Math.abs(angle14 - 180) +
      Math.abs(angle23 - 180) +
      Math.abs(angle12 - 60) +
      Math.abs(angle13 - 60) +
      Math.abs(angle24 - 60) +
      Math.abs(angle34 - 60),
  ];

  return Math.min(...configurations);
}

function detectMysticRectangle(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
}): boolean {
  const { longitude1, longitude2, longitude3, longitude4 } = args;

  // Configuration 1: 1-3 and 2-4 are oppositions
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude4,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude4,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude4,
      longitudeBody2: longitude1,
      aspect: "sextile",
    })
  ) {
    return true;
  }

  // Configuration 2: 1-2 and 3-4 are oppositions
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude4,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude2,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude4,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude4,
      longitudeBody2: longitude1,
      aspect: "sextile",
    })
  ) {
    return true;
  }

  // Configuration 3: 1-4 and 2-3 are oppositions
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude4,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude4,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude4,
      longitudeBody2: longitude3,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude1,
      aspect: "sextile",
    })
  ) {
    return true;
  }

  return false;
}

// #region Cradle

function calculateCradleTightness(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
}): number {
  const { longitude1, longitude2, longitude3, longitude4 } = args;

  const angle12 = getAngle(longitude1, longitude2);
  const angle13 = getAngle(longitude1, longitude3);
  const angle14 = getAngle(longitude1, longitude4);
  const angle23 = getAngle(longitude2, longitude3);
  const angle24 = getAngle(longitude2, longitude4);
  const angle34 = getAngle(longitude3, longitude4);

  // Cradle: 2 sextiles (parallel) + 2 trines connecting the ends
  const configurations = [
    // Configuration 1: 1-2 and 3-4 are sextiles, 1-3 and 2-4 are trines
    Math.abs(angle12 - 60) +
      Math.abs(angle34 - 60) +
      Math.abs(angle13 - 120) +
      Math.abs(angle24 - 120),
    // Configuration 2: 1-3 and 2-4 are sextiles, 1-2 and 3-4 are trines
    Math.abs(angle13 - 60) +
      Math.abs(angle24 - 60) +
      Math.abs(angle12 - 120) +
      Math.abs(angle34 - 120),
    // Configuration 3: 1-4 and 2-3 are sextiles, 1-2 and 3-4 are trines
    Math.abs(angle14 - 60) +
      Math.abs(angle23 - 60) +
      Math.abs(angle12 - 120) +
      Math.abs(angle34 - 120),
  ];

  return Math.min(...configurations);
}

function detectCradle(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
}): boolean {
  const { longitude1, longitude2, longitude3, longitude4 } = args;

  // Configuration 1: 1-2 and 3-4 are sextiles, 1-3 and 2-4 are trines
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude4,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude4,
      aspect: "trine",
    })
  ) {
    return true;
  }

  // Configuration 2: 1-3 and 2-4 are sextiles, 1-2 and 3-4 are trines
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude4,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude4,
      aspect: "trine",
    })
  ) {
    return true;
  }

  // Configuration 3: 1-4 and 2-3 are sextiles, 1-2 and 3-4 are trines
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude4,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude4,
      aspect: "trine",
    })
  ) {
    return true;
  }

  return false;
}

// #endregion Cradle

// #region Boomerang

function calculateBoomerangTightness(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
}): number {
  const { longitude1, longitude2, longitude3, longitude4 } = args;

  // Boomerang is a Yod with a 4th planet opposite the apex
  // Two planets sextile (60°), both quincunx (150°) to apex, 4th planet opposite (180°) apex
  const angle12 = getAngle(longitude1, longitude2);
  const angle13 = getAngle(longitude1, longitude3);
  const angle14 = getAngle(longitude1, longitude4);
  const angle23 = getAngle(longitude2, longitude3);
  const angle24 = getAngle(longitude2, longitude4);
  const angle34 = getAngle(longitude3, longitude4);

  // Try all possible configurations
  const deviations = [];

  // Config 1: body1 and body2 sextile, both quincunx to body3 (apex), body4 opposite body3
  deviations.push(
    Math.abs(angle12 - 60) +
      Math.abs(angle13 - 150) +
      Math.abs(angle23 - 150) +
      Math.abs(angle34 - 180)
  );

  // Config 2: body1 and body2 sextile, both quincunx to body4 (apex), body3 opposite body4
  deviations.push(
    Math.abs(angle12 - 60) +
      Math.abs(angle14 - 150) +
      Math.abs(angle24 - 150) +
      Math.abs(angle34 - 180)
  );

  // Config 3: body1 and body3 sextile, both quincunx to body2 (apex), body4 opposite body2
  deviations.push(
    Math.abs(angle13 - 60) +
      Math.abs(angle12 - 150) +
      Math.abs(angle23 - 150) +
      Math.abs(angle24 - 180)
  );

  // Config 4: body1 and body3 sextile, both quincunx to body4 (apex), body2 opposite body4
  deviations.push(
    Math.abs(angle13 - 60) +
      Math.abs(angle14 - 150) +
      Math.abs(angle34 - 150) +
      Math.abs(angle24 - 180)
  );

  // Config 5: body1 and body4 sextile, both quincunx to body2 (apex), body3 opposite body2
  deviations.push(
    Math.abs(angle14 - 60) +
      Math.abs(angle12 - 150) +
      Math.abs(angle24 - 150) +
      Math.abs(angle23 - 180)
  );

  // Config 6: body1 and body4 sextile, both quincunx to body3 (apex), body2 opposite body3
  deviations.push(
    Math.abs(angle14 - 60) +
      Math.abs(angle13 - 150) +
      Math.abs(angle34 - 150) +
      Math.abs(angle23 - 180)
  );

  // Config 7: body2 and body3 sextile, both quincunx to body1 (apex), body4 opposite body1
  deviations.push(
    Math.abs(angle23 - 60) +
      Math.abs(angle12 - 150) +
      Math.abs(angle13 - 150) +
      Math.abs(angle14 - 180)
  );

  // Config 8: body2 and body3 sextile, both quincunx to body4 (apex), body1 opposite body4
  deviations.push(
    Math.abs(angle23 - 60) +
      Math.abs(angle24 - 150) +
      Math.abs(angle34 - 150) +
      Math.abs(angle14 - 180)
  );

  // Config 9: body2 and body4 sextile, both quincunx to body1 (apex), body3 opposite body1
  deviations.push(
    Math.abs(angle24 - 60) +
      Math.abs(angle12 - 150) +
      Math.abs(angle14 - 150) +
      Math.abs(angle13 - 180)
  );

  // Config 10: body2 and body4 sextile, both quincunx to body3 (apex), body1 opposite body3
  deviations.push(
    Math.abs(angle24 - 60) +
      Math.abs(angle23 - 150) +
      Math.abs(angle34 - 150) +
      Math.abs(angle13 - 180)
  );

  // Config 11: body3 and body4 sextile, both quincunx to body1 (apex), body2 opposite body1
  deviations.push(
    Math.abs(angle34 - 60) +
      Math.abs(angle13 - 150) +
      Math.abs(angle14 - 150) +
      Math.abs(angle12 - 180)
  );

  // Config 12: body3 and body4 sextile, both quincunx to body2 (apex), body1 opposite body2
  deviations.push(
    Math.abs(angle34 - 60) +
      Math.abs(angle23 - 150) +
      Math.abs(angle24 - 150) +
      Math.abs(angle12 - 180)
  );

  return Math.min(...deviations);
}

function detectBoomerang(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
}): boolean {
  const { longitude1, longitude2, longitude3, longitude4 } = args;

  // Boomerang: A Yod with a 4th planet opposite the apex
  // Check all possible Yod configurations with an opposition to the apex

  // Config 1: body1-body2 sextile, both quincunx to body3 (apex), body4 opposite body3
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude4,
      aspect: "opposite",
    })
  ) {
    return true;
  }

  // Config 2: body1-body2 sextile, both quincunx to body4 (apex), body3 opposite body4
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude4,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude4,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude4,
      aspect: "opposite",
    })
  ) {
    return true;
  }

  // Config 3: body1-body3 sextile, both quincunx to body2 (apex), body4 opposite body2
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude2,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude4,
      aspect: "opposite",
    })
  ) {
    return true;
  }

  // Config 4: body1-body3 sextile, both quincunx to body4 (apex), body2 opposite body4
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude4,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude4,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude4,
      aspect: "opposite",
    })
  ) {
    return true;
  }

  // Config 5: body1-body4 sextile, both quincunx to body2 (apex), body3 opposite body2
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude4,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude4,
      longitudeBody2: longitude2,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "opposite",
    })
  ) {
    return true;
  }

  // Config 6: body1-body4 sextile, both quincunx to body3 (apex), body2 opposite body3
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude4,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude4,
      longitudeBody2: longitude3,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "opposite",
    })
  ) {
    return true;
  }

  // Config 7: body2-body3 sextile, both quincunx to body1 (apex), body4 opposite body1
  if (
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude1,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude1,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude4,
      aspect: "opposite",
    })
  ) {
    return true;
  }

  // Config 8: body2-body3 sextile, both quincunx to body4 (apex), body1 opposite body4
  if (
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude4,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude4,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude4,
      aspect: "opposite",
    })
  ) {
    return true;
  }

  // Config 9: body2-body4 sextile, both quincunx to body1 (apex), body3 opposite body1
  if (
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude4,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude1,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude4,
      longitudeBody2: longitude1,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "opposite",
    })
  ) {
    return true;
  }

  // Config 10: body2-body4 sextile, both quincunx to body3 (apex), body1 opposite body3
  if (
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude4,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude4,
      longitudeBody2: longitude3,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "opposite",
    })
  ) {
    return true;
  }

  // Config 11: body3-body4 sextile, both quincunx to body1 (apex), body2 opposite body1
  if (
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude4,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude1,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude4,
      longitudeBody2: longitude1,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "opposite",
    })
  ) {
    return true;
  }

  // Config 12: body3-body4 sextile, both quincunx to body2 (apex), body1 opposite body2
  if (
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude4,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude2,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude4,
      longitudeBody2: longitude2,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "opposite",
    })
  ) {
    return true;
  }

  return false;
}

// #endregion Boomerang

// #region Butterfly

function calculateButterflyTightness(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
}): number {
  const { longitude1, longitude2, longitude3, longitude4 } = args;

  // Butterfly: 2 trines, 2 sextiles, and 2 squares
  // The pattern looks like: two pairs of planets, one pair in trine, the other in sextile,
  // with squares connecting them diagonally

  const angle12 = getAngle(longitude1, longitude2);
  const angle13 = getAngle(longitude1, longitude3);
  const angle14 = getAngle(longitude1, longitude4);
  const angle23 = getAngle(longitude2, longitude3);
  const angle24 = getAngle(longitude2, longitude4);
  const angle34 = getAngle(longitude3, longitude4);

  // Try all possible butterfly configurations
  const deviations = [];

  // Config 1: 1-2 trine, 3-4 trine, 1-3 square, 2-4 square, 1-4 sextile, 2-3 sextile
  deviations.push(
    Math.abs(angle12 - 120) +
      Math.abs(angle34 - 120) +
      Math.abs(angle13 - 90) +
      Math.abs(angle24 - 90) +
      Math.abs(angle14 - 60) +
      Math.abs(angle23 - 60)
  );

  // Config 2: 1-3 trine, 2-4 trine, 1-2 square, 3-4 square, 1-4 sextile, 2-3 sextile
  deviations.push(
    Math.abs(angle13 - 120) +
      Math.abs(angle24 - 120) +
      Math.abs(angle12 - 90) +
      Math.abs(angle34 - 90) +
      Math.abs(angle14 - 60) +
      Math.abs(angle23 - 60)
  );

  // Config 3: 1-4 trine, 2-3 trine, 1-2 square, 3-4 square, 1-3 sextile, 2-4 sextile
  deviations.push(
    Math.abs(angle14 - 120) +
      Math.abs(angle23 - 120) +
      Math.abs(angle12 - 90) +
      Math.abs(angle34 - 90) +
      Math.abs(angle13 - 60) +
      Math.abs(angle24 - 60)
  );

  return Math.min(...deviations);
}

function detectButterfly(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
}): boolean {
  const { longitude1, longitude2, longitude3, longitude4 } = args;

  // Butterfly: 2 trines, 2 sextiles, and 2 squares
  // Check all possible configurations

  // Config 1: 1-2 trine, 3-4 trine, 1-3 square, 2-4 square, 1-4 sextile, 2-3 sextile
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude4,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude4,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude4,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "sextile",
    })
  ) {
    return true;
  }

  // Config 2: 1-3 trine, 2-4 trine, 1-2 square, 3-4 square, 1-4 sextile, 2-3 sextile
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude4,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude4,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude4,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "sextile",
    })
  ) {
    return true;
  }

  // Config 3: 1-4 trine, 2-3 trine, 1-2 square, 3-4 square, 1-3 sextile, 2-4 sextile
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude4,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude4,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude4,
      aspect: "sextile",
    })
  ) {
    return true;
  }

  return false;
}

// #endregion Butterfly

// #region Hourglass

function calculateHourglassTightness(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
}): number {
  const { longitude1, longitude2, longitude3, longitude4 } = args;

  // Hourglass: Multiple oppositions with planets remote enough to create distinct oppositions
  // but close enough not to fall into sextile territory
  // Essentially: 1-3 opposition, 2-4 opposition
  // No sextiles between adjacent planets (1-2, 2-3, 3-4, 4-1)

  const angle13 = getAngle(longitude1, longitude3);
  const angle24 = getAngle(longitude2, longitude4);

  // The two main oppositions
  const deviation = Math.abs(angle13 - 180) + Math.abs(angle24 - 180);

  return deviation;
}

function detectHourglass(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
}): boolean {
  const { longitude1, longitude2, longitude3, longitude4 } = args;

  // Hourglass: 2 distinct oppositions
  // Check for two pairs of planets in opposition

  // Config 1: 1-3 opposition, 2-4 opposition
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude4,
      aspect: "opposite",
    })
  ) {
    // Make sure planets are not in sextile (which would make it another pattern)
    const hasSextile =
      isAspect({
        longitudeBody1: longitude1,
        longitudeBody2: longitude2,
        aspect: "sextile",
      }) ||
      isAspect({
        longitudeBody1: longitude2,
        longitudeBody2: longitude3,
        aspect: "sextile",
      }) ||
      isAspect({
        longitudeBody1: longitude3,
        longitudeBody2: longitude4,
        aspect: "sextile",
      }) ||
      isAspect({
        longitudeBody1: longitude4,
        longitudeBody2: longitude1,
        aspect: "sextile",
      });

    if (!hasSextile) {
      return true;
    }
  }

  // Config 2: 1-2 opposition, 3-4 opposition
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude4,
      aspect: "opposite",
    })
  ) {
    const hasSextile =
      isAspect({
        longitudeBody1: longitude1,
        longitudeBody2: longitude3,
        aspect: "sextile",
      }) ||
      isAspect({
        longitudeBody1: longitude2,
        longitudeBody2: longitude4,
        aspect: "sextile",
      }) ||
      isAspect({
        longitudeBody1: longitude2,
        longitudeBody2: longitude3,
        aspect: "sextile",
      }) ||
      isAspect({
        longitudeBody1: longitude4,
        longitudeBody2: longitude1,
        aspect: "sextile",
      });

    if (!hasSextile) {
      return true;
    }
  }

  // Config 3: 1-4 opposition, 2-3 opposition
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude4,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "opposite",
    })
  ) {
    const hasSextile =
      isAspect({
        longitudeBody1: longitude1,
        longitudeBody2: longitude2,
        aspect: "sextile",
      }) ||
      isAspect({
        longitudeBody1: longitude2,
        longitudeBody2: longitude4,
        aspect: "sextile",
      }) ||
      isAspect({
        longitudeBody1: longitude3,
        longitudeBody2: longitude4,
        aspect: "sextile",
      }) ||
      isAspect({
        longitudeBody1: longitude3,
        longitudeBody2: longitude1,
        aspect: "sextile",
      });

    if (!hasSextile) {
      return true;
    }
  }

  return false;
}

// #endregion Hourglass

// #region Quadruple Aspects

function calculatePatternTightness(args: {
  pattern: QuadrupleAspect;
  longitude1: number;
  longitude2: number;
  longitude3: number;
  longitude4: number;
}): number {
  const { pattern, longitude1, longitude2, longitude3, longitude4 } = args;

  if (pattern === "grand cross") {
    return calculateGrandCrossTightness({
      longitude1,
      longitude2,
      longitude3,
      longitude4,
    });
  } else if (pattern === "kite") {
    return calculateKiteTightness({
      longitude1,
      longitude2,
      longitude3,
      longitude4,
    });
  } else if (pattern === "mystic rectangle") {
    return calculateMysticRectangleTightness({
      longitude1,
      longitude2,
      longitude3,
      longitude4,
    });
  } else if (pattern === "cradle") {
    return calculateCradleTightness({
      longitude1,
      longitude2,
      longitude3,
      longitude4,
    });
  } else if (pattern === "boomerang") {
    return calculateBoomerangTightness({
      longitude1,
      longitude2,
      longitude3,
      longitude4,
    });
  } else if (pattern === "butterfly") {
    return calculateButterflyTightness({
      longitude1,
      longitude2,
      longitude3,
      longitude4,
    });
  } else if (pattern === "hourglass") {
    return calculateHourglassTightness({
      longitude1,
      longitude2,
      longitude3,
      longitude4,
    });
  }

  return 0;
}

export function getQuadrupleAspectEvents(args: {
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  currentMinute: Moment;
}) {
  const { coordinateEphemerisByBody, currentMinute } = args;
  const quadrupleAspectBodies = QUADRUPLE_ASPECT_BODIES;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const quadrupleAspectEvents: QuadrupleAspectEvent[] = [];

  // Check all combinations of 4 bodies: C(10,4) = 210 combinations
  for (let i = 0; i < quadrupleAspectBodies.length; i++) {
    for (let j = i + 1; j < quadrupleAspectBodies.length; j++) {
      for (let k = j + 1; k < quadrupleAspectBodies.length; k++) {
        for (let l = k + 1; l < quadrupleAspectBodies.length; l++) {
          const body1 = quadrupleAspectBodies[i];
          const body2 = quadrupleAspectBodies[j];
          const body3 = quadrupleAspectBodies[k];
          const body4 = quadrupleAspectBodies[l];

          const ephemerisBody1 = coordinateEphemerisByBody[body1];
          const ephemerisBody2 = coordinateEphemerisByBody[body2];
          const ephemerisBody3 = coordinateEphemerisByBody[body3];
          const ephemerisBody4 = coordinateEphemerisByBody[body4];

          const { longitude: currentLongitude1 } =
            ephemerisBody1[currentMinute.toISOString()];
          const { longitude: currentLongitude2 } =
            ephemerisBody2[currentMinute.toISOString()];
          const { longitude: currentLongitude3 } =
            ephemerisBody3[currentMinute.toISOString()];
          const { longitude: currentLongitude4 } =
            ephemerisBody4[currentMinute.toISOString()];

          const { longitude: previousLongitude1 } =
            ephemerisBody1[previousMinute.toISOString()];
          const { longitude: previousLongitude2 } =
            ephemerisBody2[previousMinute.toISOString()];
          const { longitude: previousLongitude3 } =
            ephemerisBody3[previousMinute.toISOString()];
          const { longitude: previousLongitude4 } =
            ephemerisBody4[previousMinute.toISOString()];

          const { longitude: nextLongitude1 } =
            ephemerisBody1[nextMinute.toISOString()];
          const { longitude: nextLongitude2 } =
            ephemerisBody2[nextMinute.toISOString()];
          const { longitude: nextLongitude3 } =
            ephemerisBody3[nextMinute.toISOString()];
          const { longitude: nextLongitude4 } =
            ephemerisBody4[nextMinute.toISOString()];

          // Check for Grand Cross
          const currentGrandCross = detectGrandCross({
            longitude1: currentLongitude1,
            longitude2: currentLongitude2,
            longitude3: currentLongitude3,
            longitude4: currentLongitude4,
          });

          if (currentGrandCross) {
            const previousGrandCross = detectGrandCross({
              longitude1: previousLongitude1,
              longitude2: previousLongitude2,
              longitude3: previousLongitude3,
              longitude4: previousLongitude4,
            });

            const nextGrandCross = detectGrandCross({
              longitude1: nextLongitude1,
              longitude2: nextLongitude2,
              longitude3: nextLongitude3,
              longitude4: nextLongitude4,
            });

            const phase = getQuadrupleAspectPhase({
              pattern: "grand cross",
              previousLongitude1,
              previousLongitude2,
              previousLongitude3,
              previousLongitude4,
              currentLongitude1,
              currentLongitude2,
              currentLongitude3,
              currentLongitude4,
              nextLongitude1,
              nextLongitude2,
              nextLongitude3,
              nextLongitude4,
              previousExists: previousGrandCross,
              currentExists: currentGrandCross,
              nextExists: nextGrandCross,
            });

            if (phase) {
              quadrupleAspectEvents.push(
                getQuadrupleAspectEvent({
                  timestamp: currentMinute.toDate(),
                  body1,
                  body2,
                  body3,
                  body4,
                  quadrupleAspect: "grand cross",
                  phase,
                })
              );
            }
          }

          // Check for Kite
          const currentKite = detectKite({
            longitude1: currentLongitude1,
            longitude2: currentLongitude2,
            longitude3: currentLongitude3,
            longitude4: currentLongitude4,
          });

          if (currentKite) {
            const previousKite = detectKite({
              longitude1: previousLongitude1,
              longitude2: previousLongitude2,
              longitude3: previousLongitude3,
              longitude4: previousLongitude4,
            });

            const nextKite = detectKite({
              longitude1: nextLongitude1,
              longitude2: nextLongitude2,
              longitude3: nextLongitude3,
              longitude4: nextLongitude4,
            });

            const phase = getQuadrupleAspectPhase({
              pattern: "kite",
              previousLongitude1,
              previousLongitude2,
              previousLongitude3,
              previousLongitude4,
              currentLongitude1,
              currentLongitude2,
              currentLongitude3,
              currentLongitude4,
              nextLongitude1,
              nextLongitude2,
              nextLongitude3,
              nextLongitude4,
              previousExists: previousKite,
              currentExists: currentKite,
              nextExists: nextKite,
            });

            if (phase) {
              quadrupleAspectEvents.push(
                getQuadrupleAspectEvent({
                  timestamp: currentMinute.toDate(),
                  body1,
                  body2,
                  body3,
                  body4,
                  quadrupleAspect: "kite",
                  phase,
                })
              );
            }
          }

          // Check for Mystic Rectangle
          const currentMysticRectangle = detectMysticRectangle({
            longitude1: currentLongitude1,
            longitude2: currentLongitude2,
            longitude3: currentLongitude3,
            longitude4: currentLongitude4,
          });

          if (currentMysticRectangle) {
            const previousMysticRectangle = detectMysticRectangle({
              longitude1: previousLongitude1,
              longitude2: previousLongitude2,
              longitude3: previousLongitude3,
              longitude4: previousLongitude4,
            });

            const nextMysticRectangle = detectMysticRectangle({
              longitude1: nextLongitude1,
              longitude2: nextLongitude2,
              longitude3: nextLongitude3,
              longitude4: nextLongitude4,
            });

            const phase = getQuadrupleAspectPhase({
              pattern: "mystic rectangle",
              previousLongitude1,
              previousLongitude2,
              previousLongitude3,
              previousLongitude4,
              currentLongitude1,
              currentLongitude2,
              currentLongitude3,
              currentLongitude4,
              nextLongitude1,
              nextLongitude2,
              nextLongitude3,
              nextLongitude4,
              previousExists: previousMysticRectangle,
              currentExists: currentMysticRectangle,
              nextExists: nextMysticRectangle,
            });

            if (phase) {
              quadrupleAspectEvents.push(
                getQuadrupleAspectEvent({
                  timestamp: currentMinute.toDate(),
                  body1,
                  body2,
                  body3,
                  body4,
                  quadrupleAspect: "mystic rectangle",
                  phase,
                })
              );
            }
          }

          // Check for Cradle
          const currentCradle = detectCradle({
            longitude1: currentLongitude1,
            longitude2: currentLongitude2,
            longitude3: currentLongitude3,
            longitude4: currentLongitude4,
          });

          if (currentCradle) {
            const previousCradle = detectCradle({
              longitude1: previousLongitude1,
              longitude2: previousLongitude2,
              longitude3: previousLongitude3,
              longitude4: previousLongitude4,
            });

            const nextCradle = detectCradle({
              longitude1: nextLongitude1,
              longitude2: nextLongitude2,
              longitude3: nextLongitude3,
              longitude4: nextLongitude4,
            });

            const phase = getQuadrupleAspectPhase({
              pattern: "cradle",
              previousLongitude1,
              previousLongitude2,
              previousLongitude3,
              previousLongitude4,
              currentLongitude1,
              currentLongitude2,
              currentLongitude3,
              currentLongitude4,
              nextLongitude1,
              nextLongitude2,
              nextLongitude3,
              nextLongitude4,
              previousExists: previousCradle,
              currentExists: currentCradle,
              nextExists: nextCradle,
            });

            if (phase) {
              quadrupleAspectEvents.push(
                getQuadrupleAspectEvent({
                  timestamp: currentMinute.toDate(),
                  body1,
                  body2,
                  body3,
                  body4,
                  quadrupleAspect: "cradle",
                  phase,
                })
              );
            }
          }

          // Check for Boomerang
          const currentBoomerang = detectBoomerang({
            longitude1: currentLongitude1,
            longitude2: currentLongitude2,
            longitude3: currentLongitude3,
            longitude4: currentLongitude4,
          });

          if (currentBoomerang) {
            const previousBoomerang = detectBoomerang({
              longitude1: previousLongitude1,
              longitude2: previousLongitude2,
              longitude3: previousLongitude3,
              longitude4: previousLongitude4,
            });

            const nextBoomerang = detectBoomerang({
              longitude1: nextLongitude1,
              longitude2: nextLongitude2,
              longitude3: nextLongitude3,
              longitude4: nextLongitude4,
            });

            const phase = getQuadrupleAspectPhase({
              pattern: "boomerang",
              previousLongitude1,
              previousLongitude2,
              previousLongitude3,
              previousLongitude4,
              currentLongitude1,
              currentLongitude2,
              currentLongitude3,
              currentLongitude4,
              nextLongitude1,
              nextLongitude2,
              nextLongitude3,
              nextLongitude4,
              previousExists: previousBoomerang,
              currentExists: currentBoomerang,
              nextExists: nextBoomerang,
            });

            if (phase) {
              quadrupleAspectEvents.push(
                getQuadrupleAspectEvent({
                  timestamp: currentMinute.toDate(),
                  body1,
                  body2,
                  body3,
                  body4,
                  quadrupleAspect: "boomerang",
                  phase,
                })
              );
            }
          }

          // Check for Butterfly
          const currentButterfly = detectButterfly({
            longitude1: currentLongitude1,
            longitude2: currentLongitude2,
            longitude3: currentLongitude3,
            longitude4: currentLongitude4,
          });

          if (currentButterfly) {
            const previousButterfly = detectButterfly({
              longitude1: previousLongitude1,
              longitude2: previousLongitude2,
              longitude3: previousLongitude3,
              longitude4: previousLongitude4,
            });

            const nextButterfly = detectButterfly({
              longitude1: nextLongitude1,
              longitude2: nextLongitude2,
              longitude3: nextLongitude3,
              longitude4: nextLongitude4,
            });

            const phase = getQuadrupleAspectPhase({
              pattern: "butterfly",
              previousLongitude1,
              previousLongitude2,
              previousLongitude3,
              previousLongitude4,
              currentLongitude1,
              currentLongitude2,
              currentLongitude3,
              currentLongitude4,
              nextLongitude1,
              nextLongitude2,
              nextLongitude3,
              nextLongitude4,
              previousExists: previousButterfly,
              currentExists: currentButterfly,
              nextExists: nextButterfly,
            });

            if (phase) {
              quadrupleAspectEvents.push(
                getQuadrupleAspectEvent({
                  timestamp: currentMinute.toDate(),
                  body1,
                  body2,
                  body3,
                  body4,
                  quadrupleAspect: "butterfly",
                  phase,
                })
              );
            }
          }

          // Check for Hourglass
          const currentHourglass = detectHourglass({
            longitude1: currentLongitude1,
            longitude2: currentLongitude2,
            longitude3: currentLongitude3,
            longitude4: currentLongitude4,
          });

          if (currentHourglass) {
            const previousHourglass = detectHourglass({
              longitude1: previousLongitude1,
              longitude2: previousLongitude2,
              longitude3: previousLongitude3,
              longitude4: previousLongitude4,
            });

            const nextHourglass = detectHourglass({
              longitude1: nextLongitude1,
              longitude2: nextLongitude2,
              longitude3: nextLongitude3,
              longitude4: nextLongitude4,
            });

            const phase = getQuadrupleAspectPhase({
              pattern: "hourglass",
              previousLongitude1,
              previousLongitude2,
              previousLongitude3,
              previousLongitude4,
              currentLongitude1,
              currentLongitude2,
              currentLongitude3,
              currentLongitude4,
              nextLongitude1,
              nextLongitude2,
              nextLongitude3,
              nextLongitude4,
              previousExists: previousHourglass,
              currentExists: currentHourglass,
              nextExists: nextHourglass,
            });

            if (phase) {
              quadrupleAspectEvents.push(
                getQuadrupleAspectEvent({
                  timestamp: currentMinute.toDate(),
                  body1,
                  body2,
                  body3,
                  body4,
                  quadrupleAspect: "hourglass",
                  phase,
                })
              );
            }
          }
        }
      }
    }
  }

  return quadrupleAspectEvents;
}

function getQuadrupleAspectPhase(args: {
  pattern: QuadrupleAspect;
  previousLongitude1: number;
  previousLongitude2: number;
  previousLongitude3: number;
  previousLongitude4: number;
  currentLongitude1: number;
  currentLongitude2: number;
  currentLongitude3: number;
  currentLongitude4: number;
  nextLongitude1: number;
  nextLongitude2: number;
  nextLongitude3: number;
  nextLongitude4: number;
  previousExists: boolean;
  currentExists: boolean;
  nextExists: boolean;
}): QuadrupleAspectPhase | null {
  const {
    pattern,
    previousLongitude1,
    previousLongitude2,
    previousLongitude3,
    previousLongitude4,
    currentLongitude1,
    currentLongitude2,
    currentLongitude3,
    currentLongitude4,
    nextLongitude1,
    nextLongitude2,
    nextLongitude3,
    nextLongitude4,
    previousExists,
    currentExists,
    nextExists,
  } = args;

  if (!currentExists) return null;

  const previousTightness = previousExists
    ? calculatePatternTightness({
        pattern,
        longitude1: previousLongitude1,
        longitude2: previousLongitude2,
        longitude3: previousLongitude3,
        longitude4: previousLongitude4,
      })
    : Infinity;

  const currentTightness = calculatePatternTightness({
    pattern,
    longitude1: currentLongitude1,
    longitude2: currentLongitude2,
    longitude3: currentLongitude3,
    longitude4: currentLongitude4,
  });

  const nextTightness = nextExists
    ? calculatePatternTightness({
        pattern,
        longitude1: nextLongitude1,
        longitude2: nextLongitude2,
        longitude3: nextLongitude3,
        longitude4: nextLongitude4,
      })
    : Infinity;

  if (
    currentTightness < previousTightness &&
    currentTightness < nextTightness
  ) {
    return "exact";
  }

  if (!previousExists && currentExists) {
    return "forming";
  }

  if (currentExists && !nextExists) {
    return "dissolving";
  }

  return null;
}

// #region Events

function getQuadrupleAspectEvent(args: {
  timestamp: Date;
  body1: Body;
  body2: Body;
  body3: Body;
  body4: Body;
  quadrupleAspect: QuadrupleAspect;
  phase: QuadrupleAspectPhase;
}): QuadrupleAspectEvent {
  const { timestamp, body1, body2, body3, body4, quadrupleAspect, phase } =
    args;

  const body1Capitalized = _.startCase(body1) as Capitalize<Body>;
  const body2Capitalized = _.startCase(body2) as Capitalize<Body>;
  const body3Capitalized = _.startCase(body3) as Capitalize<Body>;
  const body4Capitalized = _.startCase(body4) as Capitalize<Body>;

  const body1Symbol = symbolByBody[body1] as BodySymbol;
  const body2Symbol = symbolByBody[body2] as BodySymbol;
  const body3Symbol = symbolByBody[body3] as BodySymbol;
  const body4Symbol = symbolByBody[body4] as BodySymbol;
  const quadrupleAspectSymbol = symbolByQuadrupleAspect[
    quadrupleAspect
  ] as QuadrupleAspectSymbol;

  // Sort bodies alphabetically for consistent event naming
  const bodiesSorted = [
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
    body4Capitalized,
  ].sort();

  const description =
    `${bodiesSorted[0]}, ${bodiesSorted[1]}, ${bodiesSorted[2]}, ${bodiesSorted[3]} ${quadrupleAspect} ${phase}` as QuadrupleAspectDescription;

  // Add phase emoji
  let phaseEmoji = "";
  if (phase === "forming") {
    phaseEmoji = "➡️ ";
  } else if (phase === "exact") {
    phaseEmoji = "🎯 ";
  } else if (phase === "dissolving") {
    phaseEmoji = "⬅️ ";
  }

  const summary = `${phaseEmoji}${quadrupleAspectSymbol} ${body1Symbol}-${body2Symbol}-${body3Symbol}-${body4Symbol} ${description}`;

  console.log(`${summary} at ${timestamp.toISOString()}`);

  const categories = [
    "Astronomy",
    "Astrology",
    "Quadruple Aspect",
    _.startCase(quadrupleAspect),
    _.startCase(phase),
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
    body4Capitalized,
  ];

  const quadrupleAspectEvent: QuadrupleAspectEvent = {
    start: timestamp,
    description,
    summary: summary as QuadrupleAspectSummary,
    categories,
  };

  return quadrupleAspectEvent;
}

export function writeQuadrupleAspectEvents(args: {
  end: Date;
  quadrupleAspectBodies: Body[];
  quadrupleAspectEvents: QuadrupleAspectEvent[];
  start: Date;
}) {
  const { end, quadrupleAspectEvents, quadrupleAspectBodies, start } = args;
  if (_.isEmpty(quadrupleAspectEvents)) return;

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${quadrupleAspectEvents.length} quadruple aspect events from ${timespan}`;
  console.log(`✖ Writing ${message}`);

  upsertEvents(quadrupleAspectEvents);

  const quadrupleAspectBodiesString = quadrupleAspectBodies.join(",");
  const quadrupleAspectsCalendar = getCalendar({
    events: quadrupleAspectEvents,
    name: "Quadruple Aspect ✖",
  });
  fs.writeFileSync(
    getOutputPath(
      `quadruple-aspects_${quadrupleAspectBodiesString}_${timespan}.ics`
    ),
    new TextEncoder().encode(quadrupleAspectsCalendar)
  );

  console.log(`✖ Wrote ${message}`);
}

// #region Duration Events

export function getQuadrupleAspectDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to quadruple aspect events only
  const quadrupleAspectEvents = events.filter((event) =>
    event.categories.includes("Quadruple Aspect")
  ) as QuadrupleAspectEvent[];

  // Group by body quartet and aspect type using categories
  const groupedEvents = _.groupBy(quadrupleAspectEvents, (event) => {
    const planets = event.categories
      .filter((category) =>
        QUADRUPLE_ASPECT_BODIES.map(_.startCase).includes(category)
      )
      .sort();

    const aspect = event.categories.find((category) =>
      ["Grand Cross", "Kite", "Mystic Rectangle", "Cradle"].includes(category)
    );

    if (planets.length === 4 && aspect) {
      return `${planets[0]}-${planets[1]}-${planets[2]}-${planets[3]}-${aspect}`;
    }
    return "";
  });

  // Process each group
  for (const [key, groupEvents] of Object.entries(groupedEvents)) {
    if (!key) continue;

    const formingEvents = groupEvents.filter((event) =>
      event.categories.includes("Forming")
    );
    const dissolvingEvents = groupEvents.filter((event) =>
      event.categories.includes("Dissolving")
    );

    // Sort events by start time
    formingEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
    dissolvingEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Pair forming and dissolving events
    const minLength = Math.min(formingEvents.length, dissolvingEvents.length);

    for (let i = 0; i < minLength; i++) {
      const forming = formingEvents[i];
      const dissolving = dissolvingEvents[i];

      // Only create duration if dissolving comes after forming
      if (dissolving.start.getTime() > forming.start.getTime()) {
        durationEvents.push(
          getQuadrupleAspectDurationEvent(forming, dissolving)
        );
      }
    }
  }

  return durationEvents;
}

function getQuadrupleAspectDurationEvent(
  beginning: QuadrupleAspectEvent,
  ending: QuadrupleAspectEvent
): Event {
  const categories = beginning.categories || [];

  const bodiesCapitalized = categories
    .filter((category) =>
      QUADRUPLE_ASPECT_BODIES.map(_.startCase).includes(category)
    )
    .sort();

  const aspectCapitalized = categories.find((category) =>
    ["Grand Cross", "Kite", "Mystic Rectangle", "Cradle"].includes(category)
  );

  if (bodiesCapitalized.length !== 4 || !aspectCapitalized) {
    throw new Error(
      `Could not extract quadruple aspect info from categories: ${categories.join(
        ", "
      )}`
    );
  }

  const body1Capitalized = bodiesCapitalized[0];
  const body2Capitalized = bodiesCapitalized[1];
  const body3Capitalized = bodiesCapitalized[2];
  const body4Capitalized = bodiesCapitalized[3];

  // Convert aspect name back to the key format
  const aspectMap: Record<string, QuadrupleAspect> = {
    "Grand Cross": "grand cross",
    Kite: "kite",
    "Mystic Rectangle": "mystic rectangle",
    Cradle: "cradle",
  };
  const aspect = aspectMap[aspectCapitalized];

  const body1 = body1Capitalized.toLowerCase() as Body;
  const body2 = body2Capitalized.toLowerCase() as Body;
  const body3 = body3Capitalized.toLowerCase() as Body;
  const body4 = body4Capitalized.toLowerCase() as Body;

  const body1Symbol = symbolByBody[body1] as BodySymbol;
  const body2Symbol = symbolByBody[body2] as BodySymbol;
  const body3Symbol = symbolByBody[body3] as BodySymbol;
  const body4Symbol = symbolByBody[body4] as BodySymbol;
  const aspectSymbol = symbolByQuadrupleAspect[aspect] as QuadrupleAspectSymbol;

  return {
    start: beginning.start,
    end: ending.start,
    summary: `${aspectSymbol} ${body1Symbol}-${body2Symbol}-${body3Symbol}-${body4Symbol} ${body1Capitalized}, ${body2Capitalized}, ${body3Capitalized}, ${body4Capitalized} ${aspect}`,
    description:
      `${body1Capitalized}, ${body2Capitalized}, ${body3Capitalized}, ${body4Capitalized} ${aspect}` as QuadrupleAspectDescription,
    categories: [
      "Astronomy",
      "Astrology",
      "Quadruple Aspect",
      aspectCapitalized,
      body1Capitalized,
      body2Capitalized,
      body3Capitalized,
      body4Capitalized,
    ],
  };
}
