// 🏷️ Types

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type {
  CoordinateEphemeris,
  DistanceEphemeris,
} from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

/** Arguments used to build a single annual solar cycle event. */
export interface BuildSolarCycleEventArguments {
  categories: readonly string[];
  date: Moment;
  description: string;
  summary: string;
}

/** Function shape used by seasonal event rules to build events. */
export type BuildSolarCycleEventFunction = (date: Moment) => Event;

/** Arguments required to detect all annual solar cycle events at a minute. */
export interface DetectAnnualSolarCycleArguments {
  minute: Moment;
  sunCoordinateEphemeris: CoordinateEphemeris;
  sunDistanceEphemeris: DistanceEphemeris;
}

/** Arguments required to detect annual solar cycle marker events. */
export interface DetectAnnualSolarCycleEventsArguments {
  minute: Moment;
  sunCoordinateEphemeris: CoordinateEphemeris;
}

/** Arguments required to detect solar apsis events. */
export interface DetectSolarApsisEventsArguments {
  minute: Moment;
  sunDistanceEphemeris: DistanceEphemeris;
}

/**
 * Represents the Sun's previous and current ecliptic longitudes around a minute boundary.
 */
export interface SolarCycleLongitudes {
  currentLongitude: number;
  previousLongitude: number;
}

/** Arguments required to group seasonal solar cycle events from longitude crossings. */
export interface SolarCycleSeasonalEventsArguments {
  date: Moment;
  longitudes: SolarCycleLongitudes;
}

/** Distances sampled for one-minute solar apsis extrema detection. */
export interface SolarDistanceSample {
  current: number;
  next: number;
  previous: number;
}
