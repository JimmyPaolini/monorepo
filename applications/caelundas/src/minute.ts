
import { generateMinutes } from "./date.utilities";
import {
  getAnnualSolarCycleEvents,
  getSolarApsisEvents,
} from "./events/annualSolarCycle/annualSolarCycle.events";
import {
  getAspectBodies,
  updateAspectBodiesStoreByPerfectiveEvents,
} from "./events/aspects/aspects.store";
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
import type { getEphemerides } from "./ephemeris/ephemeris.aggregates";
import type { AspectBodies } from "./events/aspects/aspects.store";
import type { Moment } from "moment-timezone";

type Ephemerides = ReturnType<typeof getEphemerides>;

/**
 * Processes all perfective astronomical events for each minute in a date range.
 *
 * @param args - Minute loop parameters: pre-fetched ephemerides, minute range [start, end],
 *   and previousAspectBodies carried in from a preceding range
 * @returns All detected events and the final active-aspect state for chaining into the next range
 */
export function detectPerfectiveEventsByMinute(args: {
  ephemerides: Ephemerides;
  end: Moment;
  previousAspectBodies: AspectBodies[];
  start: Moment;
}): { events: Event[]; finalAspectBodies: AspectBodies[] } {
  const { ephemerides, end, start } = args;
  let { previousAspectBodies } = args;

  const {
    azimuthElevationEphemerisByBody,
    coordinateEphemerisByBody,
    diameterEphemerisByBody,
    distanceEphemerisByBody,
    illuminationEphemerisByBody,
  } = ephemerides;

  const allEvents: Event[] = [];

  for (const minute of generateMinutes(start, end)) {
    const minuteSimpleAspectEvents: Event[] = [
      ...getMajorAspectEvents({
        coordinateEphemerisByBody,
        currentMinute: minute,
      }),
      ...getMinorAspectEvents({
        coordinateEphemerisByBody,
        currentMinute: minute,
      }),
      ...getSpecialtyAspectEvents({
        coordinateEphemerisByBody,
        currentMinute: minute,
      }),
    ];

    updateAspectBodiesStoreByPerfectiveEvents(minuteSimpleAspectEvents);
    const currentAspectBodies = getAspectBodies();

    const minuteEvents: Event[] = [
      ...minuteSimpleAspectEvents,
      ...getTripleAspectEvents(
        currentAspectBodies,
        previousAspectBodies,
        minute,
      ),
      ...getQuadrupleAspectEvents(
        currentAspectBodies,
        previousAspectBodies,
        minute,
      ),
      ...getQuintupleAspectEvents(
        currentAspectBodies,
        previousAspectBodies,
        minute,
      ),
      ...getSextupleAspectEvents(
        currentAspectBodies,
        previousAspectBodies,
        minute,
      ),
      ...getStelliumEvents(
        currentAspectBodies,
        previousAspectBodies,
        minute,
      ),
      ...getRetrogradeEvents({
        coordinateEphemerisByBody,
        currentMinute: minute,
      }),
      ...getEclipseEvents({
        currentMinute: minute,
        moonAzimuthElevationEphemeris: azimuthElevationEphemerisByBody.moon,
        moonCoordinateEphemeris: coordinateEphemerisByBody.moon,
        moonDiameterEphemeris: diameterEphemerisByBody.moon,
        sunAzimuthElevationEphemeris: azimuthElevationEphemerisByBody.sun,
        sunCoordinateEphemeris: coordinateEphemerisByBody.sun,
        sunDiameterEphemeris: diameterEphemerisByBody.sun,
      }),
      ...getSignIngressEvents({
        coordinateEphemerisByBody,
        currentMinute: minute,
      }),
      ...getDecanIngressEvents({
        coordinateEphemerisByBody,
        currentMinute: minute,
      }),
      ...getPeakIngressEvents({
        coordinateEphemerisByBody,
        currentMinute: minute,
      }),
      ...getDailySolarCycleEvents({
        currentMinute: minute,
        sunAzimuthElevationEphemeris: azimuthElevationEphemerisByBody.sun,
      }),
      ...getDailyLunarCycleEvents({
        currentMinute: minute,
        moonAzimuthElevationEphemeris: azimuthElevationEphemerisByBody.moon,
      }),
      ...getMonthlyLunarCycleEvents({
        currentMinute: minute,
        moonIlluminationEphemeris: illuminationEphemerisByBody.moon,
      }),
      ...getAnnualSolarCycleEvents({
        currentMinute: minute,
        sunCoordinateEphemeris: coordinateEphemerisByBody.sun,
      }),
      ...getSolarApsisEvents({
        currentMinute: minute,
        sunDistanceEphemeris: distanceEphemerisByBody.sun,
      }),
      ...getTwilightEvents({
        currentMinute: minute,
        sunAzimuthElevationEphemeris: azimuthElevationEphemerisByBody.sun,
      }),
      ...getPlanetaryPhaseEvents({
        coordinateEphemerisByBody,
        currentMinute: minute,
        distanceEphemerisByBody,
        illuminationEphemerisByBody,
      }),
    ];

    previousAspectBodies = currentAspectBodies;
    allEvents.push(...minuteEvents);
  }

  return { events: allEvents, finalAspectBodies: previousAspectBodies };
}
