import { getSolarApsisProgressiveEvents } from "./events/annualSolarCycle/annualSolarCycle.events";
import { getMajorAspectProgressiveEvents } from "./events/aspects/major/majorAspects.events";
import { getMinorAspectProgressiveEvents } from "./events/aspects/minor/minorAspects.events";
import { getQuadrupleAspectProgressiveEvents } from "./events/aspects/quadruple/quadrupleAspects.events";
import { getQuintupleAspectProgressiveEvents } from "./events/aspects/quintuple/quintupleAspects.events";
import { getSextupleAspectProgressiveEvents } from "./events/aspects/sextuple/sextupleAspects.events";
import { getSpecialtyAspectProgressiveEvents } from "./events/aspects/specialty/specialtyAspects.events";
import { getStelliumProgressiveEvents } from "./events/aspects/stellium/stellium.events";
import { getTripleAspectProgressiveEvents } from "./events/aspects/triple/tripleAspects.events";
import { getEclipseProgressiveEvents } from "./events/eclipses/eclipses.events";
import { getSignIngressProgressiveEvents } from "./events/ingresses/ingresses.events";
import { getMonthlyLunarCycleProgressiveEvents } from "./events/monthlyLunarCycle/monthlyLunarCycle.events";
import { getPlanetaryPhaseProgressiveEvents } from "./events/phases/phases.events";
import { getRetrogradeProgressiveEvents } from "./events/retrogrades/retrogrades.events";
import { getTwilightProgressiveEvents } from "./events/twilights/twilights.events";

import type { Event } from "./calendar.utilities";

/**
 * Derives duration-based progressive events from the perfective event log.
 *
 * Progressive events represent the full window of an astronomical phenomenon
 * (e.g. "Mercury conjunct Venus" spanning the forming → dissolving arc) as
 * opposed to perfective events which mark discrete moment-level transitions
 * (forming, perfective peak, dissolving). Each generator pairs perfective
 * bookends into a single timed event with a start and end.
 *
 * @param perfectiveEvents - All minute-level events detected by {@link detectPerfectiveEvents}
 * @returns Progressive (windowed) events, also persisted to the event store
 */
export function detectProgressiveEvents(perfectiveEvents: Event[]): Event[] {
  const progressiveEvents: Event[] = [
    ...getMajorAspectProgressiveEvents(perfectiveEvents),
    ...getMinorAspectProgressiveEvents(perfectiveEvents),
    ...getSpecialtyAspectProgressiveEvents(perfectiveEvents),
    ...getTripleAspectProgressiveEvents(perfectiveEvents),
    ...getQuadrupleAspectProgressiveEvents(perfectiveEvents),
    ...getQuintupleAspectProgressiveEvents(perfectiveEvents),
    ...getSextupleAspectProgressiveEvents(perfectiveEvents),
    ...getStelliumProgressiveEvents(perfectiveEvents),
    ...getRetrogradeProgressiveEvents(perfectiveEvents),
    ...getEclipseProgressiveEvents(perfectiveEvents),
    ...getSignIngressProgressiveEvents(perfectiveEvents),
    ...getMonthlyLunarCycleProgressiveEvents(perfectiveEvents),
    ...getTwilightProgressiveEvents(perfectiveEvents),
    ...getPlanetaryPhaseProgressiveEvents(perfectiveEvents),
    ...getSolarApsisProgressiveEvents(perfectiveEvents),
  ];
  return progressiveEvents;
}
