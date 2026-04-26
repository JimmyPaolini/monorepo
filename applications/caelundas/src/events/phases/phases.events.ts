import fs from "node:fs";

import _ from "lodash";

import {
  type Event,
  getCalendar,
  MARGIN_MINUTES,
} from "../../calendar.utilities";
import {
  getCoordinateFromEphemeris,
  getDistanceFromEphemeris,
  getIlluminationFromEphemeris,
} from "../../ephemeris/ephemeris.service";
import { getOutputPath } from "../../output.utilities";
import { pairProgressiveEvents } from "../../progressive.utilities";
import {
  symbolByMartianPhase,
  symbolByMercurianPhase,
  symbolByVenusianPhase,
} from "../../symbols";
import { planetaryPhaseBodies } from "../../types";

import {
  isEasternBrightest,
  isEasternElongation,
  isEveningRise,
  isEveningSet,
  isMorningRise,
  isMorningSet,
  isWesternBrightest,
  isWesternElongation,
} from "./phases.utilities";

import type {
  CoordinateEphemeris,
  CoordinateEphemerisBody,
  DistanceEphemeris,
  DistanceEphemerisBody,
  IlluminationEphemeris,
  IlluminationEphemerisBody,
} from "../../ephemeris/ephemeris.types";
import type {
  Body,
  MartianPhase,
  MercurianPhase,
  VenusianPhase,
  VenusianPhaseSymbol,
} from "../../types";
import type moment from "moment-timezone";

const categories = ["Astronomy", "Astrology", "Planetary Phase"];

function formatTimeZoneIso(date: moment.Moment, timezone: string): string {
  return date.clone().tz(timezone).toISOString(true);
}

/**
 * Detects planetary phase events for Venus, Mercury, and Mars.
 *
 * Planetary phases track the visibility and brightness cycles of inner planets
 * as they orbit the Sun from Earth's perspective:
 * - Morning/Evening visibility (rise/set relative to Sun)
 * - Maximum elongation (greatest angular separation from Sun)
 * - Maximum brightness (optimal viewing conditions)
 *
 * These events are significant both astronomically (for observation planning)
 * and astrologically (for timing and interpretation).
 *
 * @param args - Detection parameters
 * @param currentMinute - The minute to check for phase events
 * @param coordinateEphemerisByBody - Ephemeris data for all coordinate bodies
 * @param distanceEphemerisByBody - Distance data for inner planets
 * @param illuminationEphemerisByBody - Illumination data for phase calculations
 * @returns Array of all detected planetary phase events at this minute
 * @see {@link getVenusianPhaseEvents} for Venus-specific phases
 * @see {@link getMercurianPhaseEvents} for Mercury-specific phases
 * @see {@link getMartianPhaseEvents} for Mars-specific phases
 */
export function getPlanetaryPhaseEvents(args: {
  currentMinute: moment.Moment;
  coordinateEphemerisByBody: Record<
    CoordinateEphemerisBody,
    CoordinateEphemeris
  >;
  distanceEphemerisByBody: Record<DistanceEphemerisBody, DistanceEphemeris>;
  illuminationEphemerisByBody: Record<
    IlluminationEphemerisBody,
    IlluminationEphemeris
  >;
}): Event[] {
  const {
    currentMinute,
    coordinateEphemerisByBody,
    distanceEphemerisByBody,
    illuminationEphemerisByBody,
  } = args;

  const planetaryPhaseEvents: Event[] = [];

  if (planetaryPhaseBodies.includes("venus")) {
    planetaryPhaseEvents.push(
      ...getVenusianPhaseEvents({
        currentMinute,
        venusCoordinateEphemeris: coordinateEphemerisByBody.venus,
        venusDistanceEphemeris: distanceEphemerisByBody.venus,
        venusIlluminationEphemeris: illuminationEphemerisByBody.venus,
        sunCoordinateEphemeris: coordinateEphemerisByBody.sun,
      }),
    );
  }

  if (planetaryPhaseBodies.includes("mercury")) {
    planetaryPhaseEvents.push(
      ...getMercurianPhaseEvents({
        currentMinute,
        mercuryCoordinateEphemeris: coordinateEphemerisByBody.mercury,
        mercuryDistanceEphemeris: distanceEphemerisByBody.mercury,
        mercuryIlluminationEphemeris: illuminationEphemerisByBody.mercury,
        sunCoordinateEphemeris: coordinateEphemerisByBody.sun,
      }),
    );
  }

  if (planetaryPhaseBodies.includes("mars")) {
    planetaryPhaseEvents.push(
      ...getMartianPhaseEvents({
        currentMinute,
        marsCoordinateEphemeris: coordinateEphemerisByBody.mars,
        marsDistanceEphemeris: distanceEphemerisByBody.mars,
        marsIlluminationEphemeris: illuminationEphemerisByBody.mars,
        sunCoordinateEphemeris: coordinateEphemerisByBody.sun,
      }),
    );
  }

  return planetaryPhaseEvents;
}

// #region ♀️ Venus

/**
 * Creates a calendar event for a specific Venusian phase.
 *
 * Venus exhibits an 8-phase cycle as it orbits the Sun:
 * - Morning Rise: Venus becomes visible before sunrise
 * - Western Brightest: Maximum brilliance as morning star
 * - Western Elongation: Greatest angular distance west of Sun
 * - Morning Set: Venus sets with the Sun (superior conjunction approaching)
 * - Evening Rise: Venus becomes visible after sunset
 * - Eastern Elongation: Greatest angular distance east of Sun
 * - Eastern Brightest: Maximum brilliance as evening star
 * - Evening Set: Venus disappears into Sun's glare (inferior conjunction)
 *
 * @param args - Event parameters
 * @param timestamp - Exact moment of the phase
 * @param phase - Specific Venusian phase type
 * @returns Formatted calendar event with Venus symbol and phase indicator
 * @see {@link symbolByVenusianPhase} for phase symbols
 */
export function buildVenusianPhaseEvent(args: {
  timestamp: moment.Moment;
  phase: VenusianPhase;
}): Event {
  const { timestamp, phase } = args;

  const phaseCapitalized = _.startCase(phase) as Capitalize<VenusianPhase>;
  const phaseSymbol = symbolByVenusianPhase[phase] as VenusianPhaseSymbol;

  const description = `Venus ${phaseCapitalized}`;
  const summary = `♀️${phaseSymbol} ${description}`;

  const dateString = formatTimeZoneIso(timestamp, "America/New_York");
  console.log(`${summary} at ${dateString}`);

  const venusianPhaseEvent: Event = {
    start: timestamp,
    end: timestamp,
    categories: [...categories, "Venusian", phaseCapitalized],
    description,
    summary,
  };
  return venusianPhaseEvent;
}

/**
 * Detects all Venusian phase events at the current minute.
 *
 * Evaluates Venus's position relative to the Sun, along with distance
 * and illumination data, to identify phase transitions. Uses a margin
 * of minutes before and after for accurate extrema detection (brightest,
 * elongation).
 *
 * @param args - Detection parameters
 * @param currentMinute - The minute to check
 * @param venusCoordinateEphemeris - Venus position data
 * @param venusDistanceEphemeris - Venus distance from Earth
 * @param venusIlluminationEphemeris - Venus illumination percentage
 * @param sunCoordinateEphemeris - Sun position for relative calculations
 * @returns Array of detected Venusian phase events
 * @see {@link isMorningRise} for morning rise detection
 * @see {@link isWesternElongation} for western elongation detection
 */
export function getVenusianPhaseEvents(args: {
  currentMinute: moment.Moment;
  venusCoordinateEphemeris: CoordinateEphemeris;
  venusDistanceEphemeris: DistanceEphemeris;
  venusIlluminationEphemeris: IlluminationEphemeris;
  sunCoordinateEphemeris: CoordinateEphemeris;
}): Event[] {
  const {
    currentMinute,
    sunCoordinateEphemeris,
    venusCoordinateEphemeris,
    venusDistanceEphemeris,
    venusIlluminationEphemeris,
  } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const currentLongitudePlanet = getCoordinateFromEphemeris(
    venusCoordinateEphemeris,
    currentMinute.toISOString(),
    "longitude",
  );
  const currentLongitudeSun = getCoordinateFromEphemeris(
    sunCoordinateEphemeris,
    currentMinute.toISOString(),
    "longitude",
  );
  const currentIllumination = getIlluminationFromEphemeris(
    venusIlluminationEphemeris,
    currentMinute.toISOString(),
    "currentIllumination",
  );
  const currentDistance = getDistanceFromEphemeris(
    venusDistanceEphemeris,
    currentMinute.toISOString(),
    "currentDistance",
  );

  const previousLongitudePlanet = getCoordinateFromEphemeris(
    venusCoordinateEphemeris,
    previousMinute.toISOString(),
    "longitude",
  );
  const previousLongitudeSun = getCoordinateFromEphemeris(
    sunCoordinateEphemeris,
    previousMinute.toISOString(),
    "longitude",
  );

  const previousDistances = Array.from(
    { length: MARGIN_MINUTES },
    (_, marginIndex) => {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - marginIndex, "minutes");
      return getDistanceFromEphemeris(
        venusDistanceEphemeris,
        minute.toISOString(),
        "previousDistance",
      );
    },
  );
  const previousIlluminations = Array.from(
    { length: MARGIN_MINUTES },
    (_, marginIndex) => {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - marginIndex, "minutes");
      return getIlluminationFromEphemeris(
        venusIlluminationEphemeris,
        minute.toISOString(),
        "previousIllumination",
      );
    },
  );

  const nextLongitudePlanet = getCoordinateFromEphemeris(
    venusCoordinateEphemeris,
    nextMinute.toISOString(),
    "longitude",
  );
  const nextLongitudeSun = getCoordinateFromEphemeris(
    sunCoordinateEphemeris,
    nextMinute.toISOString(),
    "longitude",
  );
  const nextDistances = Array.from(
    { length: MARGIN_MINUTES },
    (_, marginIndex) => {
      const minute = currentMinute.clone().add(marginIndex + 1, "minute");
      return getDistanceFromEphemeris(
        venusDistanceEphemeris,
        minute.toISOString(),
        "nextDistance",
      );
    },
  );
  const nextIlluminations = Array.from(
    { length: MARGIN_MINUTES },
    (_, marginIndex) => {
      const minute = currentMinute.clone().add(marginIndex + 1, "minute");
      return getIlluminationFromEphemeris(
        venusIlluminationEphemeris,
        minute.toISOString(),
        "nextIllumination",
      );
    },
  );

  const params = {
    currentLongitudePlanet,
    currentLongitudeSun,
    currentDistance,
    currentIllumination,
    nextLongitudePlanet,
    nextLongitudeSun,
    nextDistances,
    nextIlluminations,
    previousLongitudePlanet,
    previousLongitudeSun,
    previousDistances,
    previousIlluminations,
  };

  const venusianPhaseEvents: Event[] = [];

  if (isMorningRise({ ...params })) {
    venusianPhaseEvents.push(
      buildVenusianPhaseEvent({
        timestamp: currentMinute,
        phase: "morning rise",
      }),
    );
  }

  if (isWesternBrightest({ ...params })) {
    venusianPhaseEvents.push(
      buildVenusianPhaseEvent({
        timestamp: currentMinute,
        phase: "western brightest",
      }),
    );
  }

  if (isWesternElongation({ ...params })) {
    venusianPhaseEvents.push(
      buildVenusianPhaseEvent({
        timestamp: currentMinute,
        phase: "western elongation",
      }),
    );
  }

  if (isMorningSet({ ...params })) {
    venusianPhaseEvents.push(
      buildVenusianPhaseEvent({
        timestamp: currentMinute,
        phase: "morning set",
      }),
    );
  }

  if (isEveningRise({ ...params })) {
    venusianPhaseEvents.push(
      buildVenusianPhaseEvent({
        timestamp: currentMinute,
        phase: "evening rise",
      }),
    );
  }

  if (isEasternElongation({ ...params })) {
    venusianPhaseEvents.push(
      buildVenusianPhaseEvent({
        timestamp: currentMinute,
        phase: "eastern elongation",
      }),
    );
  }

  if (isEasternBrightest({ ...params })) {
    venusianPhaseEvents.push(
      buildVenusianPhaseEvent({
        timestamp: currentMinute,
        phase: "eastern brightest",
      }),
    );
  }

  if (isEveningSet({ ...params })) {
    venusianPhaseEvents.push(
      buildVenusianPhaseEvent({
        timestamp: currentMinute,
        phase: "evening set",
      }),
    );
  }

  return venusianPhaseEvents;
}

// #region ☿ Mercury

/**
 * Creates a calendar event for a specific Mercurian phase.
 *
 * Mercury exhibits an 8-phase cycle similar to Venus but with shorter duration
 * due to its faster orbit (88 days vs 225 days):
 * - Morning Rise: Mercury becomes visible before sunrise
 * - Western Brightest: Maximum brilliance as morning star
 * - Western Elongation: Greatest angular distance west of Sun (max 28°)
 * - Morning Set: Mercury sets with the Sun
 * - Evening Rise: Mercury becomes visible after sunset
 * - Eastern Elongation: Greatest angular distance east of Sun (max 28°)
 * - Eastern Brightest: Maximum brilliance as evening star
 * - Evening Set: Mercury disappears into Sun's glare
 *
 * @param args - Event parameters
 * @param timestamp - Exact moment of the phase
 * @param phase - Specific Mercurian phase type
 * @returns Formatted calendar event with Mercury symbol and phase indicator
 * @see {@link symbolByMercurianPhase} for phase symbols
 */
export function buildMercurianPhaseEvent(args: {
  timestamp: moment.Moment;
  phase: MercurianPhase;
}): Event {
  const { timestamp, phase } = args;

  const phaseCapitalized = _.startCase(phase) as Capitalize<MercurianPhase>;
  const phaseSymbol = symbolByMercurianPhase[phase];

  const description = `Mercury ${phaseCapitalized}`;
  const summary = `☿${phaseSymbol} ${description}`;

  const dateString = formatTimeZoneIso(timestamp, "America/New_York");
  console.log(`${summary} at ${dateString}`);

  const mercurianPhaseEvent: Event = {
    start: timestamp,
    end: timestamp,
    categories: [...categories, "Mercurian", phaseCapitalized],
    description,
    summary,
  };
  return mercurianPhaseEvent;
}

/**
 * Detects all Mercurian phase events at the current minute.
 *
 * Evaluates Mercury's position relative to the Sun, along with distance
 * and illumination data, to identify phase transitions. Mercury changes
 * phases more frequently than Venus due to its shorter orbital period.
 *
 * @param args - Detection parameters
 * @param currentMinute - The minute to check
 * @param mercuryCoordinateEphemeris - Mercury position data
 * @param mercuryDistanceEphemeris - Mercury distance from Earth
 * @param mercuryIlluminationEphemeris - Mercury illumination percentage
 * @param sunCoordinateEphemeris - Sun position for relative calculations
 * @returns Array of detected Mercurian phase events
 * @see {@link isMorningRise} for morning rise detection
 * @see {@link isEasternElongation} for eastern elongation detection
 */
export function getMercurianPhaseEvents(args: {
  currentMinute: moment.Moment;
  mercuryCoordinateEphemeris: CoordinateEphemeris;
  mercuryDistanceEphemeris: DistanceEphemeris;
  mercuryIlluminationEphemeris: IlluminationEphemeris;
  sunCoordinateEphemeris: CoordinateEphemeris;
}): Event[] {
  const {
    currentMinute,
    sunCoordinateEphemeris,
    mercuryCoordinateEphemeris,
    mercuryDistanceEphemeris,
    mercuryIlluminationEphemeris,
  } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const currentLongitudePlanet = getCoordinateFromEphemeris(
    mercuryCoordinateEphemeris,
    currentMinute.toISOString(),
    "longitude",
  );
  const currentLongitudeSun = getCoordinateFromEphemeris(
    sunCoordinateEphemeris,
    currentMinute.toISOString(),
    "longitude",
  );
  const currentIllumination = getIlluminationFromEphemeris(
    mercuryIlluminationEphemeris,
    currentMinute.toISOString(),
    "currentIllumination",
  );
  const currentDistance = getDistanceFromEphemeris(
    mercuryDistanceEphemeris,
    currentMinute.toISOString(),
    "currentDistance",
  );

  const previousLongitudePlanet = getCoordinateFromEphemeris(
    mercuryCoordinateEphemeris,
    previousMinute.toISOString(),
    "longitude",
  );
  const previousLongitudeSun = getCoordinateFromEphemeris(
    sunCoordinateEphemeris,
    previousMinute.toISOString(),
    "longitude",
  );
  const previousDistances = Array.from(
    { length: MARGIN_MINUTES },
    (_, marginIndex) => {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - marginIndex, "minutes");
      return getDistanceFromEphemeris(
        mercuryDistanceEphemeris,
        minute.toISOString(),
        "previousDistance",
      );
    },
  );
  const previousIlluminations = Array.from(
    { length: MARGIN_MINUTES },
    (_, marginIndex) => {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - marginIndex, "minutes");
      return getIlluminationFromEphemeris(
        mercuryIlluminationEphemeris,
        minute.toISOString(),
        "previousIllumination",
      );
    },
  );

  const nextLongitudePlanet = getCoordinateFromEphemeris(
    mercuryCoordinateEphemeris,
    nextMinute.toISOString(),
    "longitude",
  );
  const nextLongitudeSun = getCoordinateFromEphemeris(
    sunCoordinateEphemeris,
    nextMinute.toISOString(),
    "longitude",
  );
  const nextDistances = Array.from(
    { length: MARGIN_MINUTES },
    (_, marginIndex) => {
      const minute = currentMinute.clone().add(marginIndex + 1, "minute");
      return getDistanceFromEphemeris(
        mercuryDistanceEphemeris,
        minute.toISOString(),
        "nextDistance",
      );
    },
  );
  const nextIlluminations = Array.from(
    { length: MARGIN_MINUTES },
    (_, marginIndex) => {
      const minute = currentMinute.clone().add(marginIndex + 1, "minute");
      return getIlluminationFromEphemeris(
        mercuryIlluminationEphemeris,
        minute.toISOString(),
        "nextIllumination",
      );
    },
  );

  const params = {
    currentLongitudePlanet,
    currentLongitudeSun,
    currentDistance,
    currentIllumination,
    nextLongitudePlanet,
    nextLongitudeSun,
    nextDistances,
    nextIlluminations,
    previousLongitudePlanet,
    previousLongitudeSun,
    previousDistances,
    previousIlluminations,
  };

  const mercurianPhaseEvents: Event[] = [];

  if (isMorningRise({ ...params })) {
    mercurianPhaseEvents.push(
      buildMercurianPhaseEvent({
        timestamp: currentMinute,
        phase: "morning rise",
      }),
    );
  }

  if (isWesternBrightest({ ...params })) {
    mercurianPhaseEvents.push(
      buildMercurianPhaseEvent({
        timestamp: currentMinute,
        phase: "western brightest",
      }),
    );
  }

  if (isWesternElongation({ ...params })) {
    mercurianPhaseEvents.push(
      buildMercurianPhaseEvent({
        timestamp: currentMinute,
        phase: "western elongation",
      }),
    );
  }

  if (isMorningSet({ ...params })) {
    mercurianPhaseEvents.push(
      buildMercurianPhaseEvent({
        timestamp: currentMinute,
        phase: "morning set",
      }),
    );
  }

  if (isEveningRise({ ...params })) {
    mercurianPhaseEvents.push(
      buildMercurianPhaseEvent({
        timestamp: currentMinute,
        phase: "evening rise",
      }),
    );
  }

  if (isEasternElongation({ ...params })) {
    mercurianPhaseEvents.push(
      buildMercurianPhaseEvent({
        timestamp: currentMinute,
        phase: "eastern elongation",
      }),
    );
  }

  if (isEasternBrightest({ ...params })) {
    mercurianPhaseEvents.push(
      buildMercurianPhaseEvent({
        timestamp: currentMinute,
        phase: "eastern brightest",
      }),
    );
  }

  if (isEveningSet({ ...params })) {
    mercurianPhaseEvents.push(
      buildMercurianPhaseEvent({
        timestamp: currentMinute,
        phase: "evening set",
      }),
    );
  }

  return mercurianPhaseEvents;
}

// #region ♂️ Mars

/**
 * Creates a calendar event for a specific Martian phase.
 *
 * Mars, being an outer planet, has a simpler phase cycle than Venus/Mercury:
 * - Morning Rise: Mars becomes visible before sunrise
 * - Morning Set: Mars sets with the Sun (approaching conjunction)
 * - Evening Rise: Mars becomes visible after sunset
 * - Evening Set: Mars disappears into Sun's glare (conjunction)
 *
 * Mars doesn't have elongation or brightness maxima like inner planets
 * because it can appear at any angular distance from the Sun (up to 180°
 * at opposition).
 *
 * @param args - Event parameters
 * @param timestamp - Exact moment of the phase
 * @param phase - Specific Martian phase type
 * @returns Formatted calendar event with Mars symbol and phase indicator
 * @see {@link symbolByMartianPhase} for phase symbols
 */
export function buildMartianPhaseEvent(args: {
  timestamp: moment.Moment;
  phase: MartianPhase;
}): Event {
  const { timestamp, phase } = args;

  const phaseCapitalized = _.startCase(phase) as Capitalize<MartianPhase>;
  const phaseSymbol = symbolByMartianPhase[phase];

  const description = `Mars ${phaseCapitalized}`;
  const summary = `♂️${phaseSymbol} ${description}`;

  const dateString = formatTimeZoneIso(timestamp, "America/New_York");
  console.log(`${summary} at ${dateString}`);

  const martianPhaseEvent: Event = {
    start: timestamp,
    end: timestamp,
    categories: [...categories, "Martian", phaseCapitalized],
    description,
    summary,
  };
  return martianPhaseEvent;
}

/**
 * Detects all Martian phase events at the current minute.
 *
 * Mars has a simpler visibility cycle than inner planets, tracking only
 * rise and set times relative to the Sun. No elongation or brightness
 * maxima are calculated since Mars can appear anywhere in the sky.
 *
 * @param args - Detection parameters
 * @param currentMinute - The minute to check
 * @param marsCoordinateEphemeris - Mars position data
 * @param marsDistanceEphemeris - Mars distance from Earth
 * @param marsIlluminationEphemeris - Mars illumination percentage
 * @param sunCoordinateEphemeris - Sun position for relative calculations
 * @returns Array of detected Martian phase events
 * @see {@link isMorningRise} for morning rise detection
 * @see {@link isEveningSet} for evening set detection
 */
export function getMartianPhaseEvents(args: {
  currentMinute: moment.Moment;
  marsCoordinateEphemeris: CoordinateEphemeris;
  marsDistanceEphemeris: DistanceEphemeris;
  marsIlluminationEphemeris: IlluminationEphemeris;
  sunCoordinateEphemeris: CoordinateEphemeris;
}): Event[] {
  const {
    currentMinute,
    sunCoordinateEphemeris,
    marsCoordinateEphemeris,
    marsDistanceEphemeris,
    marsIlluminationEphemeris,
  } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const currentLongitudePlanet = getCoordinateFromEphemeris(
    marsCoordinateEphemeris,
    currentMinute.toISOString(),
    "longitude",
  );
  const currentLongitudeSun = getCoordinateFromEphemeris(
    sunCoordinateEphemeris,
    currentMinute.toISOString(),
    "longitude",
  );
  const currentIllumination = getIlluminationFromEphemeris(
    marsIlluminationEphemeris,
    currentMinute.toISOString(),
    "currentIllumination",
  );
  const currentDistance = getDistanceFromEphemeris(
    marsDistanceEphemeris,
    currentMinute.toISOString(),
    "currentDistance",
  );

  const previousLongitudePlanet = getCoordinateFromEphemeris(
    marsCoordinateEphemeris,
    previousMinute.toISOString(),
    "longitude",
  );
  const previousLongitudeSun = getCoordinateFromEphemeris(
    sunCoordinateEphemeris,
    previousMinute.toISOString(),
    "longitude",
  );
  const previousDistances = Array.from(
    { length: MARGIN_MINUTES },
    (_, marginIndex) => {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - marginIndex, "minutes");
      return getDistanceFromEphemeris(
        marsDistanceEphemeris,
        minute.toISOString(),
        "previousDistance",
      );
    },
  );
  const previousIlluminations = Array.from(
    { length: MARGIN_MINUTES },
    (_, marginIndex) => {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - marginIndex, "minutes");
      return getIlluminationFromEphemeris(
        marsIlluminationEphemeris,
        minute.toISOString(),
        "previousIllumination",
      );
    },
  );

  const nextLongitudePlanet = getCoordinateFromEphemeris(
    marsCoordinateEphemeris,
    nextMinute.toISOString(),
    "longitude",
  );
  const nextLongitudeSun = getCoordinateFromEphemeris(
    sunCoordinateEphemeris,
    nextMinute.toISOString(),
    "longitude",
  );
  const nextDistances = Array.from(
    { length: MARGIN_MINUTES },
    (_, marginIndex) => {
      const minute = currentMinute.clone().add(marginIndex + 1, "minute");
      return getDistanceFromEphemeris(
        marsDistanceEphemeris,
        minute.toISOString(),
        "nextDistance",
      );
    },
  );
  const nextIlluminations = Array.from(
    { length: MARGIN_MINUTES },
    (_, marginIndex) => {
      const minute = currentMinute.clone().add(marginIndex + 1, "minute");
      return getIlluminationFromEphemeris(
        marsIlluminationEphemeris,
        minute.toISOString(),
        "nextIllumination",
      );
    },
  );

  const params = {
    currentLongitudePlanet,
    currentLongitudeSun,
    currentDistance,
    currentIllumination,
    nextLongitudePlanet,
    nextLongitudeSun,
    nextDistances,
    nextIlluminations,
    previousLongitudePlanet,
    previousLongitudeSun,
    previousDistances,
    previousIlluminations,
  };

  const martianPhaseEvents: Event[] = [];

  if (isMorningRise({ ...params })) {
    martianPhaseEvents.push(
      buildMartianPhaseEvent({
        timestamp: currentMinute,
        phase: "morning rise",
      }),
    );
  }

  if (isMorningSet({ ...params })) {
    martianPhaseEvents.push(
      buildMartianPhaseEvent({
        timestamp: currentMinute,
        phase: "morning set",
      }),
    );
  }

  if (isEveningRise({ ...params })) {
    martianPhaseEvents.push(
      buildMartianPhaseEvent({
        timestamp: currentMinute,
        phase: "evening rise",
      }),
    );
  }

  if (isEveningSet({ ...params })) {
    martianPhaseEvents.push(
      buildMartianPhaseEvent({
        timestamp: currentMinute,
        phase: "evening set",
      }),
    );
  }

  return martianPhaseEvents;
}

// #region Planetary Phase

/**
 * Writes planetary phase events to an iCalendar file.
 *
 * Generates a .ics file in the output directory containing all planetary
 * phase events for the specified time range and body configuration.
 *
 * @param args - Output parameters
 * @param end - Range end date
 * @param planetaryPhaseBodies - Planets included (venus, mercury, mars)
 * @param planetaryPhaseEvents - Events to write to calendar file
 * @param start - Range start date
 * @see {@link getCalendar} for iCal generation
 * @see {@link getOutputPath} for file path resolution
 */
export function writePlanetaryPhaseEvents(args: {
  end: moment.Moment;
  planetaryPhaseBodies: Extract<Body, "mercury" | "venus" | "mars">[];
  planetaryPhaseEvents: Event[];
  start: moment.Moment;
}): void {
  const { planetaryPhaseEvents, planetaryPhaseBodies, start, end } = args;
  if (_.isEmpty(planetaryPhaseEvents)) {
    return;
  }

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${planetaryPhaseEvents.length} planetary phase events from ${timespan}`;
  console.log(`🌓 Writing ${message}`);

  const planetaryPhasesBodiesString = planetaryPhaseBodies.join(",");
  const planetaryPhasesCalendar = getCalendar({
    events: planetaryPhaseEvents,
    name: "Planetary Phase 🌓",
  });
  fs.writeFileSync(
    getOutputPath(
      `planetary-phases_${planetaryPhasesBodiesString}_${timespan}.ics`,
    ),
    new TextEncoder().encode(planetaryPhasesCalendar),
  );

  console.log(`🌓 Wrote ${message}`);
}

// #region 🕑 Progressive Events

/**
 * Converts instantaneous planetary phase events into progressive events.
 *
 * Creates visibility period events by pairing:
 * - Morning Rise → Morning Set (morning star period)
 * - Evening Rise → Evening Set (evening star period)
 *
 * Progressive events span the entire time a planet is visible as a morning
 * or evening star, useful for planning observations or understanding
 * astrological timing.
 *
 * @param events - All events to process (non-planetary-phase events filtered out)
 * @returns Array of visibility progressive events
 * @see {@link pairProgressiveEvents} for rise/set pairing logic
 */
export function getPlanetaryPhaseProgressiveEvents(events: Event[]): Event[] {
  const progressiveEvents: Event[] = [];

  // Filter to planetary phase events
  const planetaryPhaseEvents = events.filter((event) =>
    event.categories.includes("Planetary Phase"),
  );

  // Process Venus phases
  const venusianPhaseEvents = planetaryPhaseEvents.filter((event) =>
    event.categories.includes("Venusian"),
  );
  progressiveEvents.push(
    ...getVenusianPhaseProgressiveEvents(venusianPhaseEvents),
  );

  // Process Mercury phases
  const mercurianPhaseEvents = planetaryPhaseEvents.filter((event) =>
    event.categories.includes("Mercurian"),
  );
  progressiveEvents.push(
    ...getMercurianPhaseProgressiveEvents(mercurianPhaseEvents),
  );

  // Process Mars phases
  const martianPhaseEvents = planetaryPhaseEvents.filter((event) =>
    event.categories.includes("Martian"),
  );
  progressiveEvents.push(
    ...getMartianPhaseProgressiveEvents(martianPhaseEvents),
  );

  return progressiveEvents;
}

function getVenusianPhaseProgressiveEvents(events: Event[]): Event[] {
  const progressiveEvents: Event[] = [];

  // Morning visibility: Morning Rise → Morning Set
  const morningRiseEvents = events.filter((event) =>
    event.categories.includes("Morning Rise"),
  );
  const morningSetEvents = events.filter((event) =>
    event.categories.includes("Morning Set"),
  );
  const morningVisibilityPairs = pairProgressiveEvents(
    morningRiseEvents,
    morningSetEvents,
    "Venus Morning Visibility",
  );
  for (const [beginning, ending] of morningVisibilityPairs) {
    progressiveEvents.push(
      getVenusMorningVisibilityDurationEvent(beginning, ending),
    );
  }

  // Evening visibility: Evening Rise → Evening Set
  const eveningRiseEvents = events.filter((event) =>
    event.categories.includes("Evening Rise"),
  );
  const eveningSetEvents = events.filter((event) =>
    event.categories.includes("Evening Set"),
  );
  const eveningVisibilityPairs = pairProgressiveEvents(
    eveningRiseEvents,
    eveningSetEvents,
    "Venus Evening Visibility",
  );
  for (const [beginning, ending] of eveningVisibilityPairs) {
    progressiveEvents.push(
      getVenusEveningVisibilityDurationEvent(beginning, ending),
    );
  }

  return progressiveEvents;
}

function getMercurianPhaseProgressiveEvents(events: Event[]): Event[] {
  const progressiveEvents: Event[] = [];

  // Morning visibility: Morning Rise → Morning Set
  const morningRiseEvents = events.filter((event) =>
    event.categories.includes("Morning Rise"),
  );
  const morningSetEvents = events.filter((event) =>
    event.categories.includes("Morning Set"),
  );
  const morningVisibilityPairs = pairProgressiveEvents(
    morningRiseEvents,
    morningSetEvents,
    "Mercury Morning Visibility",
  );
  for (const [beginning, ending] of morningVisibilityPairs) {
    progressiveEvents.push(
      getMercuryMorningVisibilityDurationEvent(beginning, ending),
    );
  }

  // Evening visibility: Evening Rise → Evening Set
  const eveningRiseEvents = events.filter((event) =>
    event.categories.includes("Evening Rise"),
  );
  const eveningSetEvents = events.filter((event) =>
    event.categories.includes("Evening Set"),
  );
  const eveningVisibilityPairs = pairProgressiveEvents(
    eveningRiseEvents,
    eveningSetEvents,
    "Mercury Evening Visibility",
  );
  for (const [beginning, ending] of eveningVisibilityPairs) {
    progressiveEvents.push(
      getMercuryEveningVisibilityDurationEvent(beginning, ending),
    );
  }

  return progressiveEvents;
}

function getMartianPhaseProgressiveEvents(events: Event[]): Event[] {
  const progressiveEvents: Event[] = [];

  // Morning visibility: Morning Rise → Morning Set
  const morningRiseEvents = events.filter((event) =>
    event.categories.includes("Morning Rise"),
  );
  const morningSetEvents = events.filter((event) =>
    event.categories.includes("Morning Set"),
  );
  const morningVisibilityPairs = pairProgressiveEvents(
    morningRiseEvents,
    morningSetEvents,
    "Mars Morning Visibility",
  );
  for (const [beginning, ending] of morningVisibilityPairs) {
    progressiveEvents.push(
      getMarsMorningVisibilityDurationEvent(beginning, ending),
    );
  }

  // Evening visibility: Evening Rise → Evening Set
  const eveningRiseEvents = events.filter((event) =>
    event.categories.includes("Evening Rise"),
  );
  const eveningSetEvents = events.filter((event) =>
    event.categories.includes("Evening Set"),
  );
  const eveningVisibilityPairs = pairProgressiveEvents(
    eveningRiseEvents,
    eveningSetEvents,
    "Mars Evening Visibility",
  );
  for (const [beginning, ending] of eveningVisibilityPairs) {
    progressiveEvents.push(
      getMarsEveningVisibilityDurationEvent(beginning, ending),
    );
  }

  return progressiveEvents;
}

// Venus progressive event creators
function getVenusMorningVisibilityDurationEvent(
  beginning: Event,
  ending: Event,
): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "♀️ 🌄 Venus Morning Star",
    description: "Venus Morning Star (Morning Visibility)",
    categories: [...categories, "Venusian", "Morning Visibility"],
  };
}

function getVenusEveningVisibilityDurationEvent(
  beginning: Event,
  ending: Event,
): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "♀️ 🌇 Venus Evening Star",
    description: "Venus Evening Star (Evening Visibility)",
    categories: [...categories, "Venusian", "Evening Visibility"],
  };
}

// Mercury progressive event creators
function getMercuryMorningVisibilityDurationEvent(
  beginning: Event,
  ending: Event,
): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "☿ 🌄 Mercury Morning Star",
    description: "Mercury Morning Star (Morning Visibility)",
    categories: [...categories, "Mercurian", "Morning Visibility"],
  };
}

function getMercuryEveningVisibilityDurationEvent(
  beginning: Event,
  ending: Event,
): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "☿ 🌇 Mercury Evening Star",
    description: "Mercury Evening Star (Evening Visibility)",
    categories: [...categories, "Mercurian", "Evening Visibility"],
  };
}

// Mars progressive event creators
function getMarsMorningVisibilityDurationEvent(
  beginning: Event,
  ending: Event,
): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "♂️ 🌄 Mars Morning Star",
    description: "Mars Morning Star (Morning Visibility)",
    categories: [...categories, "Martian", "Morning Visibility"],
  };
}

function getMarsEveningVisibilityDurationEvent(
  beginning: Event,
  ending: Event,
): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "♂️ 🌇 Mars Evening Star",
    description: "Mars Evening Star (Evening Visibility)",
    categories: [...categories, "Martian", "Evening Visibility"],
  };
}
