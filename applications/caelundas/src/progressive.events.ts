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
import { addEvents } from "./events.store";

import type { Event } from "./calendar.utilities";

/**
 *
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

  addEvents(progressiveEvents);
  return progressiveEvents;
}
