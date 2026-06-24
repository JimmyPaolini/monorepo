import { bodies } from "@caelundas/src/modules/caelundas/caelundas.constants";
import moment, { type Moment } from "moment-timezone";

import type { Body } from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { CoordinateEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";

/**
 * One-minute time window used by aspect detection tests.
 */
export interface MinuteWindow {
  currentMinute: Moment;
  nextMinute: Moment;
  previousMinute: Moment;
}

/**
 * Create per-body previous/current/next minute ephemeris with optional per-body overrides.
 */
export function createAspectEphemerisForBodies({
  defaultLongitude = 100,
  minute,
  overrides = {},
}: {
  defaultLongitude?: number;
  minute: Moment;
  overrides?: Partial<
    Record<Body, { current: number; next: number; previous: number }>
  >;
}): Record<Body, CoordinateEphemeris> {
  const minuteWindow = {
    currentMinute: minute,
    nextMinute: minute.clone().add(1, "minute"),
    previousMinute: minute.clone().subtract(1, "minute"),
  };
  const coordinateEphemerisByBody: Partial<Record<Body, CoordinateEphemeris>> =
    {};

  for (const body of bodies) {
    const override = overrides[body];
    const current = override?.current ?? defaultLongitude;
    const next = override?.next ?? defaultLongitude;
    const previous = override?.previous ?? defaultLongitude;

    coordinateEphemerisByBody[body] = createCoordinateEphemerisFromLongitudes({
      [minuteWindow.currentMinute.toISOString()]: current,
      [minuteWindow.nextMinute.toISOString()]: next,
      [minuteWindow.previousMinute.toISOString()]: previous,
    });
  }

  if (!isCompleteCoordinateEphemerisByBody(coordinateEphemerisByBody)) {
    throw new Error("Expected ephemeris for every body");
  }

  return coordinateEphemerisByBody;
}

/**
 * Create per-body ephemeris with deterministic longitudes for a minute window.
 */
export function createBodyCoordinateEphemeris({
  bodies,
  getLongitude,
  minuteWindow,
}: {
  bodies: readonly string[];
  getLongitude: (body: string, index: number) => number;
  minuteWindow: MinuteWindow;
}): Record<string, CoordinateEphemeris> {
  const coordinateEphemerisByBody: Record<string, CoordinateEphemeris> = {};

  bodies.forEach((body, index) => {
    coordinateEphemerisByBody[body] = createConstantCoordinateEphemeris(
      minuteWindow,
      getLongitude(body, index),
    );
  });

  return coordinateEphemerisByBody;
}

/**
 * Create constant coordinates for previous/current/next minute snapshots.
 */
export function createConstantCoordinateEphemeris(
  minuteWindow: MinuteWindow,
  longitude: number,
): CoordinateEphemeris {
  return createCoordinateEphemerisFromLongitudes({
    [minuteWindow.currentMinute.toISOString()]: longitude,
    [minuteWindow.nextMinute.toISOString()]: longitude,
    [minuteWindow.previousMinute.toISOString()]: longitude,
  });
}

/**
 * Build ephemeris records from ISO timestamp to longitude mappings.
 */
export function createCoordinateEphemerisFromLongitudes(
  longitudesByTimestamp: Record<string, number>,
): CoordinateEphemeris {
  return Object.fromEntries(
    Object.entries(longitudesByTimestamp).map(([timestamp, longitude]) => [
      timestamp,
      { latitude: 0, longitude },
    ]),
  );
}

/**
 * Create a canonical previous/current/next minute window for tests.
 */
export function createMinuteWindow(
  timestamp = "2024-03-21T12:00:00.000Z",
): MinuteWindow {
  const currentMinute = moment.utc(timestamp);
  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  return {
    currentMinute,
    nextMinute,
    previousMinute,
  };
}

/**
 * Create a progressive aspect event fixture for detectProgressive unit tests.
 */
export function createProgressiveAspectEvent({
  aspect,
  aspectCategory,
  body1,
  body2,
  phase,
  timestamp,
}: {
  aspect: string;
  aspectCategory: "Minor Aspect" | "Specialty Aspect";
  body1: string;
  body2: string;
  phase: "Dissolving" | "Forming" | "Perfective";
  timestamp: Moment;
}): Event {
  return {
    categories: [
      "Astronomy",
      "Astrology",
      aspectCategory,
      body1,
      body2,
      aspect,
      phase,
    ],
    description: `${body1} ${phase.toLowerCase()} ${aspect.toLowerCase()} ${body2}`,
    end: timestamp,
    start: timestamp,
    summary: `${phase} ${body1} ${aspect} ${body2}`,
  };
}

/**
 * Determine whether every canonical body has an ephemeris entry.
 */
function isCompleteCoordinateEphemerisByBody(
  coordinateEphemerisByBody: Partial<Record<Body, CoordinateEphemeris>>,
): coordinateEphemerisByBody is Record<Body, CoordinateEphemeris> {
  return bodies.every((body) => coordinateEphemerisByBody[body] !== undefined);
}
