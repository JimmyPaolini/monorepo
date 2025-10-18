import _ from "npm:lodash";
import moment from "npm:moment-timezone";
import type { Moment } from "npm:moment";
import {
  type EventTemplate,
  type Event,
  getCalendar,
} from "../../calendar.utilities.ts";
import {
  symbolByMartianPhase,
  symbolByMercurianPhase,
  symbolByVenusianPhase,
  type Body,
  type MartianPhase,
  type MartianPhaseSymbol,
  type MercurianPhase,
  type MercurianPhaseSymbol,
  type VenusianPhase,
  type VenusianPhaseSymbol,
} from "../../symbols.constants.ts";
import type {
  CoordinateEphemeris,
  CoordinateEphemerisBody,
  DistanceEphemeris,
  DistanceEphemerisBody,
  IlluminationEphemeris,
  IlluminationEphemerisBody,
} from "../../ephemeris/ephemeris.types.ts";
import {
  isEasternBrightest,
  isEasternElongation,
  isEveningRise,
  isEveningSet,
  isMorningRise,
  isMorningSet,
  isWesternBrightest,
  isWesternElongation,
} from "./phases.utilities.ts";
import { upsertEvents } from "../../database.utilities.ts";
import { MARGIN_MINUTES } from "../../main.ts";
import { incrementEventsCount, print } from "../../logs/logs.service.tsx";

export function getPlanetaryPhaseEvents(args: {
  currentMinute: Moment;
  planetaryPhaseBodies: Extract<Body, "mercury" | "venus" | "mars">[];
  coordinateEphemerisByBody: Record<
    CoordinateEphemerisBody,
    CoordinateEphemeris
  >;
  distanceEphemerisByBody: Record<DistanceEphemerisBody, DistanceEphemeris>;
  illuminationEphemerisByBody: Record<
    IlluminationEphemerisBody,
    IlluminationEphemeris
  >;
}) {
  const {
    currentMinute,
    planetaryPhaseBodies,
    coordinateEphemerisByBody,
    distanceEphemerisByBody,
    illuminationEphemerisByBody,
  } = args;

  const planetaryPhaseEvents: PlanetaryPhaseEvent[] = [];

  if (planetaryPhaseBodies.includes("venus")) {
    planetaryPhaseEvents.push(
      ...getVenusianPhaseEvents({
        currentMinute,
        venusCoordinateEphemeris: coordinateEphemerisByBody["venus"],
        venusDistanceEphemeris: distanceEphemerisByBody["venus"],
        venusIlluminationEphemeris: illuminationEphemerisByBody["venus"],
        sunCoordinateEphemeris: coordinateEphemerisByBody["sun"],
      })
    );
  }

  if (planetaryPhaseBodies.includes("mercury")) {
    planetaryPhaseEvents.push(
      ...getMercurianPhaseEvents({
        currentMinute,
        mercuryCoordinateEphemeris: coordinateEphemerisByBody["mercury"],
        mercuryDistanceEphemeris: distanceEphemerisByBody["mercury"],
        mercuryIlluminationEphemeris: illuminationEphemerisByBody["mercury"],
        sunCoordinateEphemeris: coordinateEphemerisByBody["sun"],
      })
    );
  }

  if (planetaryPhaseBodies.includes("mars")) {
    planetaryPhaseEvents.push(
      ...getMartianPhaseEvents({
        currentMinute,
        marsCoordinateEphemeris: coordinateEphemerisByBody["mars"],
        marsDistanceEphemeris: distanceEphemerisByBody["mars"],
        marsIlluminationEphemeris: illuminationEphemerisByBody["mars"],
        sunCoordinateEphemeris: coordinateEphemerisByBody["sun"],
      })
    );
  }

  return planetaryPhaseEvents;
}

// #region ♀️ Venus

type VenusianPhaseDescription = `Venus ${Capitalize<VenusianPhase>}`;
type VenusianPhaseSummary =
  `♀️${VenusianPhaseSymbol} ${VenusianPhaseDescription}`;

export interface VenusianPhaseEventTemplate extends EventTemplate {
  description: VenusianPhaseDescription;
  summary: VenusianPhaseSummary;
}

export interface VenusianPhaseEvent extends Event {
  description: VenusianPhaseDescription;
  summary: VenusianPhaseSummary;
}

export function getVenusianPhaseEvent(args: {
  timestamp: Date;
  phase: VenusianPhase;
}) {
  const { timestamp, phase } = args;

  const phaseCapitalized = _.startCase(phase) as Capitalize<VenusianPhase>;
  const phaseSymbol = symbolByVenusianPhase[phase] as VenusianPhaseSymbol;

  const description: VenusianPhaseDescription = `Venus ${phaseCapitalized}`;
  const summary: VenusianPhaseSummary = `♀️${phaseSymbol} ${description}`;

  const dateString = moment.tz(timestamp, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const venusianPhaseEvent: VenusianPhaseEvent = {
    start: timestamp,
    description,
    summary,
  };
  return venusianPhaseEvent;
}

export function getVenusianPhaseEvents(args: {
  currentMinute: Moment;
  venusCoordinateEphemeris: CoordinateEphemeris;
  venusDistanceEphemeris: DistanceEphemeris;
  venusIlluminationEphemeris: IlluminationEphemeris;
  sunCoordinateEphemeris: CoordinateEphemeris;
}) {
  const {
    currentMinute,
    sunCoordinateEphemeris,
    venusCoordinateEphemeris,
    venusDistanceEphemeris,
    venusIlluminationEphemeris,
  } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const { longitude: currentLongitudePlanet } =
    venusCoordinateEphemeris[currentMinute.toISOString()];
  const { longitude: currentLongitudeSun } =
    sunCoordinateEphemeris[currentMinute.toISOString()];
  const { illumination: currentIllumination } =
    venusIlluminationEphemeris[currentMinute.toISOString()];
  const { distance: currentDistance } =
    venusDistanceEphemeris[currentMinute.toISOString()];

  const { longitude: previousLongitudePlanet } =
    venusCoordinateEphemeris[previousMinute.toISOString()];
  const { longitude: previousLongitudeSun } =
    sunCoordinateEphemeris[previousMinute.toISOString()];
  const previousDistances = new Array(MARGIN_MINUTES)
    .fill(null)
    .map((_, marginIndex) => {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - marginIndex, "minutes");
      const { distance: previousDistance } =
        venusDistanceEphemeris[minute.toISOString()];
      return previousDistance;
    });
  const previousIlluminations = new Array(MARGIN_MINUTES)
    .fill(null)
    .map((_, marginIndex) => {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - marginIndex, "minutes");
      const { illumination: previousIllumination } =
        venusIlluminationEphemeris[minute.toISOString()];
      return previousIllumination;
    });

  const { longitude: nextLongitudePlanet } =
    venusCoordinateEphemeris[nextMinute.toISOString()];
  const { longitude: nextLongitudeSun } =
    sunCoordinateEphemeris[nextMinute.toISOString()];
  const nextDistances = new Array(MARGIN_MINUTES)
    .fill(null)
    .map((_, marginIndex) => {
      const minute = currentMinute.clone().add(marginIndex + 1, "minute");
      const { distance: nextDistance } =
        venusDistanceEphemeris[minute.toISOString()];
      return nextDistance;
    });
  const nextIlluminations = new Array(MARGIN_MINUTES)
    .fill(null)
    .map((_, marginIndex) => {
      const minute = currentMinute.clone().add(marginIndex + 1, "minute");
      const { illumination: nextIllumination } =
        venusIlluminationEphemeris[minute.toISOString()];
      return nextIllumination;
    });

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

  const venusianPhaseEvents: VenusianPhaseEvent[] = [];

  if (isMorningRise({ ...params })) {
    venusianPhaseEvents.push(
      getVenusianPhaseEvent({
        timestamp: currentMinute.toDate(),
        phase: "morning rise",
      })
    );
  }

  if (isWesternBrightest({ ...params })) {
    venusianPhaseEvents.push(
      getVenusianPhaseEvent({
        timestamp: currentMinute.toDate(),
        phase: "western brightest",
      })
    );
  }

  if (isWesternElongation({ ...params })) {
    venusianPhaseEvents.push(
      getVenusianPhaseEvent({
        timestamp: currentMinute.toDate(),
        phase: "western elongation",
      })
    );
  }

  if (isMorningSet({ ...params })) {
    venusianPhaseEvents.push(
      getVenusianPhaseEvent({
        timestamp: currentMinute.toDate(),
        phase: "morning set",
      })
    );
  }

  if (isEveningRise({ ...params })) {
    venusianPhaseEvents.push(
      getVenusianPhaseEvent({
        timestamp: currentMinute.toDate(),
        phase: "evening rise",
      })
    );
  }

  if (isEasternElongation({ ...params })) {
    venusianPhaseEvents.push(
      getVenusianPhaseEvent({
        timestamp: currentMinute.toDate(),
        phase: "eastern elongation",
      })
    );
  }

  if (isEasternBrightest({ ...params })) {
    venusianPhaseEvents.push(
      getVenusianPhaseEvent({
        timestamp: currentMinute.toDate(),
        phase: "eastern brightest",
      })
    );
  }

  if (isEveningSet({ ...params })) {
    venusianPhaseEvents.push(
      getVenusianPhaseEvent({
        timestamp: currentMinute.toDate(),
        phase: "evening set",
      })
    );
  }

  return venusianPhaseEvents;
}

// #region ☿ Mercury

type MercurianPhaseDescription = `Mercury ${Capitalize<MercurianPhase>}`;
type MercurianPhaseSummary =
  `☿${MercurianPhaseSymbol} ${MercurianPhaseDescription}`;

export interface MercurianPhaseEventTemplate extends EventTemplate {
  description: MercurianPhaseDescription;
  summary: MercurianPhaseSummary;
}

export interface MercurianPhaseEvent extends Event {
  description: MercurianPhaseDescription;
  summary: MercurianPhaseSummary;
}

export function getMercurianPhaseEvent(args: {
  timestamp: Date;
  phase: MercurianPhase;
}) {
  const { timestamp, phase } = args;

  const phaseCapitalized = _.startCase(phase) as Capitalize<MercurianPhase>;
  const phaseSymbol = symbolByMercurianPhase[phase] as MercurianPhaseSymbol;

  const description: MercurianPhaseDescription = `Mercury ${phaseCapitalized}`;
  const summary: MercurianPhaseSummary = `☿${phaseSymbol} ${description}`;

  const dateString = moment.tz(timestamp, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const mercurianPhaseEvent: MercurianPhaseEvent = {
    start: timestamp,
    description,
    summary,
  };
  return mercurianPhaseEvent;
}

export function getMercurianPhaseEvents(args: {
  currentMinute: Moment;
  mercuryCoordinateEphemeris: CoordinateEphemeris;
  mercuryDistanceEphemeris: DistanceEphemeris;
  mercuryIlluminationEphemeris: IlluminationEphemeris;
  sunCoordinateEphemeris: CoordinateEphemeris;
}) {
  const {
    currentMinute,
    sunCoordinateEphemeris,
    mercuryCoordinateEphemeris,
    mercuryDistanceEphemeris,
    mercuryIlluminationEphemeris,
  } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const { longitude: currentLongitudePlanet } =
    mercuryCoordinateEphemeris[currentMinute.toISOString()];
  const { longitude: currentLongitudeSun } =
    sunCoordinateEphemeris[currentMinute.toISOString()];
  const { illumination: currentIllumination } =
    mercuryIlluminationEphemeris[currentMinute.toISOString()];
  const { distance: currentDistance } =
    mercuryDistanceEphemeris[currentMinute.toISOString()];

  const { longitude: previousLongitudePlanet } =
    mercuryCoordinateEphemeris[previousMinute.toISOString()];
  const { longitude: previousLongitudeSun } =
    sunCoordinateEphemeris[previousMinute.toISOString()];
  const previousDistances = new Array(MARGIN_MINUTES)
    .fill(null)
    .map((_, marginIndex) => {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - marginIndex, "minutes");
      const { distance: previousDistance } =
        mercuryDistanceEphemeris[minute.toISOString()];
      return previousDistance;
    });
  const previousIlluminations = new Array(MARGIN_MINUTES)
    .fill(null)
    .map((_, marginIndex) => {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - marginIndex, "minutes");
      const { illumination: previousIllumination } =
        mercuryIlluminationEphemeris[minute.toISOString()];
      return previousIllumination;
    });

  const { longitude: nextLongitudePlanet } =
    mercuryCoordinateEphemeris[nextMinute.toISOString()];
  const { longitude: nextLongitudeSun } =
    sunCoordinateEphemeris[nextMinute.toISOString()];
  const nextDistances = new Array(MARGIN_MINUTES)
    .fill(null)
    .map((_, marginIndex) => {
      const minute = currentMinute.clone().add(marginIndex + 1, "minute");
      const { distance: nextDistance } =
        mercuryDistanceEphemeris[minute.toISOString()];
      return nextDistance;
    });
  const nextIlluminations = new Array(MARGIN_MINUTES)
    .fill(null)
    .map((_, marginIndex) => {
      const minute = currentMinute.clone().add(marginIndex + 1, "minute");
      const { illumination: nextIllumination } =
        mercuryIlluminationEphemeris[minute.toISOString()];
      return nextIllumination;
    });

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

  const mercurianPhaseEvents: MercurianPhaseEvent[] = [];

  if (isMorningRise({ ...params })) {
    mercurianPhaseEvents.push(
      getMercurianPhaseEvent({
        timestamp: currentMinute.toDate(),
        phase: "morning rise",
      })
    );
  }

  if (isWesternBrightest({ ...params })) {
    mercurianPhaseEvents.push(
      getMercurianPhaseEvent({
        timestamp: currentMinute.toDate(),
        phase: "western brightest",
      })
    );
  }

  if (isWesternElongation({ ...params })) {
    mercurianPhaseEvents.push(
      getMercurianPhaseEvent({
        timestamp: currentMinute.toDate(),
        phase: "western elongation",
      })
    );
  }

  if (isMorningSet({ ...params })) {
    mercurianPhaseEvents.push(
      getMercurianPhaseEvent({
        timestamp: currentMinute.toDate(),
        phase: "morning set",
      })
    );
  }

  if (isEveningRise({ ...params })) {
    mercurianPhaseEvents.push(
      getMercurianPhaseEvent({
        timestamp: currentMinute.toDate(),
        phase: "evening rise",
      })
    );
  }

  if (isEasternElongation({ ...params })) {
    mercurianPhaseEvents.push(
      getMercurianPhaseEvent({
        timestamp: currentMinute.toDate(),
        phase: "eastern elongation",
      })
    );
  }

  if (isEasternBrightest({ ...params })) {
    mercurianPhaseEvents.push(
      getMercurianPhaseEvent({
        timestamp: currentMinute.toDate(),
        phase: "eastern brightest",
      })
    );
  }

  if (isEveningSet({ ...params })) {
    mercurianPhaseEvents.push(
      getMercurianPhaseEvent({
        timestamp: currentMinute.toDate(),
        phase: "evening set",
      })
    );
  }

  return mercurianPhaseEvents;
}

// #region ♂️ Mars

type MartianPhaseDescription = `Mars ${Capitalize<MartianPhase>}`;
type MartianPhaseSummary = `♂️${MartianPhaseSymbol} ${MartianPhaseDescription}`;

export interface MartianPhaseEventTemplate extends EventTemplate {
  description: MartianPhaseDescription;
  summary: MartianPhaseSummary;
}

export interface MartianPhaseEvent extends Event {
  description: MartianPhaseDescription;
  summary: MartianPhaseSummary;
}

export function getMartianPhaseEvent(args: {
  timestamp: Date;
  phase: MartianPhase;
}) {
  const { timestamp, phase } = args;

  const phaseCapitalized = _.startCase(phase) as Capitalize<MartianPhase>;
  const phaseSymbol = symbolByMartianPhase[phase] as MartianPhaseSymbol;

  const description: MartianPhaseDescription = `Mars ${phaseCapitalized}`;
  const summary: MartianPhaseSummary = `♂️${phaseSymbol} ${description}`;

  const dateString = moment.tz(timestamp, "America/New_York").toISOString(true);
  print(`${summary} at ${dateString}`);
  incrementEventsCount();

  const martianPhaseEvent: MartianPhaseEvent = {
    start: timestamp,
    description,
    summary,
  };
  return martianPhaseEvent;
}

export function getMartianPhaseEvents(args: {
  currentMinute: Moment;
  marsCoordinateEphemeris: CoordinateEphemeris;
  marsDistanceEphemeris: DistanceEphemeris;
  marsIlluminationEphemeris: IlluminationEphemeris;
  sunCoordinateEphemeris: CoordinateEphemeris;
}) {
  const {
    currentMinute,
    sunCoordinateEphemeris,
    marsCoordinateEphemeris,
    marsDistanceEphemeris,
    marsIlluminationEphemeris,
  } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const { longitude: currentLongitudePlanet } =
    marsCoordinateEphemeris[currentMinute.toISOString()];
  const { longitude: currentLongitudeSun } =
    sunCoordinateEphemeris[currentMinute.toISOString()];
  const { illumination: currentIllumination } =
    marsIlluminationEphemeris[currentMinute.toISOString()];
  const { distance: currentDistance } =
    marsDistanceEphemeris[currentMinute.toISOString()];

  const { longitude: previousLongitudePlanet } =
    marsCoordinateEphemeris[previousMinute.toISOString()];
  const { longitude: previousLongitudeSun } =
    sunCoordinateEphemeris[previousMinute.toISOString()];
  const previousDistances = new Array(MARGIN_MINUTES)
    .fill(null)
    .map((_, marginIndex) => {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - marginIndex, "minutes");
      const { distance: previousDistance } =
        marsDistanceEphemeris[minute.toISOString()];
      return previousDistance;
    });
  const previousIlluminations = new Array(MARGIN_MINUTES)
    .fill(null)
    .map((_, marginIndex) => {
      const minute = currentMinute
        .clone()
        .subtract(MARGIN_MINUTES - marginIndex, "minutes");
      const { illumination: previousIllumination } =
        marsIlluminationEphemeris[minute.toISOString()];
      return previousIllumination;
    });

  const { longitude: nextLongitudePlanet } =
    marsCoordinateEphemeris[nextMinute.toISOString()];
  const { longitude: nextLongitudeSun } =
    sunCoordinateEphemeris[nextMinute.toISOString()];
  const nextDistances = new Array(MARGIN_MINUTES)
    .fill(null)
    .map((_, marginIndex) => {
      const minute = currentMinute.clone().add(marginIndex + 1, "minute");
      const { distance: nextDistance } =
        marsDistanceEphemeris[minute.toISOString()];
      return nextDistance;
    });
  const nextIlluminations = new Array(MARGIN_MINUTES)
    .fill(null)
    .map((_, marginIndex) => {
      const minute = currentMinute.clone().add(marginIndex + 1, "minute");
      const { illumination: nextIllumination } =
        marsIlluminationEphemeris[minute.toISOString()];
      return nextIllumination;
    });

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

  const martianPhaseEvents: MartianPhaseEvent[] = [];

  if (isMorningRise({ ...params })) {
    martianPhaseEvents.push(
      getMartianPhaseEvent({
        timestamp: currentMinute.toDate(),
        phase: "morning rise",
      })
    );
  }

  if (isMorningSet({ ...params })) {
    martianPhaseEvents.push(
      getMartianPhaseEvent({
        timestamp: currentMinute.toDate(),
        phase: "morning set",
      })
    );
  }

  if (isEveningRise({ ...params })) {
    martianPhaseEvents.push(
      getMartianPhaseEvent({
        timestamp: currentMinute.toDate(),
        phase: "evening rise",
      })
    );
  }

  if (isEveningSet({ ...params })) {
    martianPhaseEvents.push(
      getMartianPhaseEvent({
        timestamp: currentMinute.toDate(),
        phase: "evening set",
      })
    );
  }

  return martianPhaseEvents;
}

// #region Planetary Phases

export type PlanetaryPhaseEvent =
  | VenusianPhaseEvent
  | MercurianPhaseEvent
  | MartianPhaseEvent;

export function writePlanetaryPhaseEvents(args: {
  end: Date;
  planetaryPhaseBodies: Extract<Body, "mercury" | "venus" | "mars">[];
  planetaryPhaseEvents: PlanetaryPhaseEvent[];
  start: Date;
}) {
  const { planetaryPhaseEvents, planetaryPhaseBodies, start, end } = args;
  if (_.isEmpty(planetaryPhaseEvents)) return;

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${planetaryPhaseEvents.length} planetary phase events from ${timespan}`;
  print(`🌓 Writing ${message}`);

  upsertEvents(planetaryPhaseEvents);

  const planetaryPhaseBodiesString = planetaryPhaseBodies.join(",");
  const planetaryPhasesCalendar = getCalendar(
    planetaryPhaseEvents,
    "Planetary Phases 🌓"
  );
  Deno.writeFileSync(
    `./calendars/planetary_phases_${planetaryPhaseBodiesString}_${timespan}.ics`,
    new TextEncoder().encode(planetaryPhasesCalendar)
  );

  print(`🌓 Wrote ${message}`);
}
