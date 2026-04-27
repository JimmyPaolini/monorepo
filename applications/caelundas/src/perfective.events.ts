import { MARGIN_MINUTES } from "./calendar.utilities";
import { generateDates, generateMinutes } from "./date.utilities";
import { getEphemerides } from "./ephemeris/ephemeris.aggregates";
import {
  getAnnualSolarCycleEvents,
  getSolarApsisEvents,
} from "./events/annualSolarCycle/annualSolarCycle.events";
import { computeAspectBodies } from "./events/aspects/aspects.utilities";
import { getMajorAspectEvents } from "./events/aspects/major/majorAspects.events";
import { getMinorAspectEvents } from "./events/aspects/minor/minorAspects.events";
import { getQuadrupleAspectEvents } from "./events/aspects/quadruple/quadrupleAspects.events";
import { getQuintupleAspectEvents } from "./events/aspects/quintuple/quintupleAspects.events";
import { getSextupleAspectEvents } from "./events/aspects/sextuple/sextupleAspects.events";
import { getSpecialtyAspectEvents } from "./events/aspects/specialty/specialtyAspects.events";
import { getStelliumEvents } from "./events/aspects/stellium/stellium.events";
import { getTripleAspectEvents } from "./events/aspects/triple/tripleAspects.events";
import { getDailyLunarCycleEvents } from "./events/dailyCycles/dailyLunarCycle.events";
import { getDailySolarCycleEvents } from "./events/dailyCycles/dailySolarCycle.events";
import { getEclipseEvents } from "./events/eclipses/eclipses.events";
import {
  getDecanIngressEvents,
  getPeakIngressEvents,
  getSignIngressEvents,
} from "./events/ingresses/ingresses.events";
import { getMonthlyLunarCycleEvents } from "./events/monthlyLunarCycle/monthlyLunarCycle.events";
import { getPlanetaryPhaseEvents } from "./events/phases/phases.events";
import { getRetrogradeEvents } from "./events/retrogrades/retrogrades.events";
import { getTwilightEvents } from "./events/twilights/twilights.events";

import type { Event } from "./calendar.utilities";
import type { getEphemerides as GetEphemerides } from "./ephemeris/ephemeris.aggregates";
import type { Coordinates } from "./ephemeris/ephemeris.types";
import type { AspectBodies } from "./events/aspects/aspects.utilities";
import type { Input } from "./input.schema";
import type { Moment } from "moment-timezone";

type Ephemerides = ReturnType<typeof GetEphemerides>;

/**
 * Detects all perfective astronomical events for the given range and stores them.
 *
 * Delegates to {@link detectPerfectiveEventsByDate} for the two-level date/minute
 * loop, then persists results via {@link addEvents}.
 */
export function detectPerfectiveEvents(args: Input): Event[] {
  return detectPerfectiveEventsByDate(args);
}

/**
 * Detects all perfective astronomical perfectiveEvents across a date range using a two-level loop.
 *
 * The outer loop iterates day by day in the observer's timezone, fetching ephemeris
 * data scoped to that day (with a margin on both ends). The inner minute loop processes
 * each minute within the day, carrying active-aspect state across day boundaries so
 * multi-day aspect windows are detected correctly.
 *
 * @returns All detected perfectiveEvents in chronological order
 */
function detectPerfectiveEventsByDate(args: Input): Event[] {
  const { end, latitude, longitude, start, timezone } = args;
  const coordinates: Coordinates = [longitude, latitude];

  let previousAspectBodies: AspectBodies[] = [];
  const perfectiveEvents: Event[] = [];

  for (const date of generateDates(start, end, timezone)) {
    const startOfDay = date.clone().startOf("day");
    const endOfDay = date.clone().endOf("day");

    const ephemerides = getEphemerides({
      coordinates,
      end: endOfDay.clone().add(MARGIN_MINUTES, "minutes"),
      start: startOfDay.clone().subtract(MARGIN_MINUTES, "minutes"),
      timezone,
    });

    const { events, aspectBodies } = detectPerfectiveEventsByMinute({
      ephemerides,
      end: endOfDay,
      previousAspectBodies,
      start: startOfDay,
    });

    previousAspectBodies = aspectBodies;
    perfectiveEvents.push(...events);
  }

  return perfectiveEvents;
}

/**
 * Processes all perfective astronomical events for each minute in a date range.
 *
 * @param args - Minute loop parameters: pre-fetched ephemerides, minute range [start, end],
 *   and previousAspectBodies carried in from a preceding range
 * @returns All detected events and the final active-aspect state for chaining into the next range
 */
function detectPerfectiveEventsByMinute(args: {
  ephemerides: Ephemerides;
  end: Moment;
  previousAspectBodies: AspectBodies[];
  start: Moment;
}): { events: Event[]; aspectBodies: AspectBodies[] } {
  const { ephemerides, end, start } = args;
  let { previousAspectBodies } = args;

  const {
    azimuthElevationEphemerisByBody,
    coordinateEphemerisByBody,
    diameterEphemerisByBody,
    distanceEphemerisByBody,
    illuminationEphemerisByBody,
  } = ephemerides;

  const events: Event[] = [];

  for (const minute of generateMinutes(start, end)) {
    const simpleAspectEvents: Event[] = [
      ...getMajorAspectEvents({ coordinateEphemerisByBody, minute }),
      ...getMinorAspectEvents({ coordinateEphemerisByBody, minute }),
      ...getSpecialtyAspectEvents({ coordinateEphemerisByBody, minute }),
    ];

    const currentAspectBodies = computeAspectBodies(previousAspectBodies, simpleAspectEvents);

    const minuteEvents: Event[] = [
      ...simpleAspectEvents,
      ...getTripleAspectEvents({ currentAspectBodies, previousAspectBodies, minute }),
      ...getQuadrupleAspectEvents({ currentAspectBodies, previousAspectBodies, minute }),
      ...getQuintupleAspectEvents({ currentAspectBodies, previousAspectBodies, minute }),
      ...getSextupleAspectEvents({ currentAspectBodies, previousAspectBodies, minute }),
      ...getStelliumEvents({ currentAspectBodies, previousAspectBodies, minute }),
      ...getRetrogradeEvents({ coordinateEphemerisByBody, minute }),
      ...getEclipseEvents({
        minute,
        moonAzimuthElevationEphemeris: azimuthElevationEphemerisByBody.moon,
        moonCoordinateEphemeris: coordinateEphemerisByBody.moon,
        moonDiameterEphemeris: diameterEphemerisByBody.moon,
        sunAzimuthElevationEphemeris: azimuthElevationEphemerisByBody.sun,
        sunCoordinateEphemeris: coordinateEphemerisByBody.sun,
        sunDiameterEphemeris: diameterEphemerisByBody.sun,
      }),
      ...getSignIngressEvents({ coordinateEphemerisByBody, minute }),
      ...getDecanIngressEvents({ coordinateEphemerisByBody, minute }),
      ...getPeakIngressEvents({ coordinateEphemerisByBody, minute }),
      ...getDailySolarCycleEvents({
        minute,
        sunAzimuthElevationEphemeris: azimuthElevationEphemerisByBody.sun,
      }),
      ...getDailyLunarCycleEvents({
        minute,
        moonAzimuthElevationEphemeris: azimuthElevationEphemerisByBody.moon,
      }),
      ...getMonthlyLunarCycleEvents({
        minute,
        moonIlluminationEphemeris: illuminationEphemerisByBody.moon,
      }),
      ...getAnnualSolarCycleEvents({
        minute,
        sunCoordinateEphemeris: coordinateEphemerisByBody.sun,
      }),
      ...getSolarApsisEvents({
        minute,
        sunDistanceEphemeris: distanceEphemerisByBody.sun,
      }),
      ...getTwilightEvents({
        minute,
        sunAzimuthElevationEphemeris: azimuthElevationEphemerisByBody.sun,
      }),
      ...getPlanetaryPhaseEvents({
        coordinateEphemerisByBody,
        minute,
        distanceEphemerisByBody,
        illuminationEphemerisByBody,
      }),
    ];

    previousAspectBodies = currentAspectBodies;
    events.push(...minuteEvents);
  }

  return { events, aspectBodies: previousAspectBodies };
}
