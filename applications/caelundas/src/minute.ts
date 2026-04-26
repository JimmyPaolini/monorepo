import { generateMinutes } from "./date.utilities";
import {
  getAnnualSolarCycleEvents,
  getSolarApsisEvents,
} from "./events/annualSolarCycle/annualSolarCycle.events";
import {
  getActiveAspects,
  updateActiveAspectsStoreByPerfectiveEvents,
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
import type { ActiveAspect } from "./events/aspects/aspects.store";
import type moment from "moment-timezone";

type Ephemerides = ReturnType<typeof getEphemerides>;

/**
 * Processes all perfective astronomical events for each minute in a date range.
 *
 * @param args - Minute loop parameters: pre-fetched ephemerides, minute range [start, end],
 *   and previousAspectEdges carried in from a preceding range
 * @returns All detected events and the final active-aspect state for chaining into the next range
 */
export function detectPerfectiveEventsByMinute(args: {
  ephemerides: Ephemerides;
  end: moment.Moment;
  previousAspectEdges: ActiveAspect[];
  start: moment.Moment;
}): { events: Event[]; finalAspectEdges: ActiveAspect[] } {
  const { ephemerides, end, start } = args;
  let { previousAspectEdges } = args;

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

    updateActiveAspectsStoreByPerfectiveEvents(minuteSimpleAspectEvents);
    const currentAspectEdges = getActiveAspects();

    const minuteEvents: Event[] = [
      ...minuteSimpleAspectEvents,
      ...getTripleAspectEvents(
        currentAspectEdges,
        previousAspectEdges,
        minute,
      ),
      ...getQuadrupleAspectEvents(
        currentAspectEdges,
        previousAspectEdges,
        minute,
      ),
      ...getQuintupleAspectEvents(
        currentAspectEdges,
        previousAspectEdges,
        minute,
      ),
      ...getSextupleAspectEvents(
        currentAspectEdges,
        previousAspectEdges,
        minute,
      ),
      ...getStelliumEvents(
        currentAspectEdges,
        previousAspectEdges,
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

    previousAspectEdges = currentAspectEdges;
    allEvents.push(...minuteEvents);
  }

  return { events: allEvents, finalAspectEdges: previousAspectEdges };
}
