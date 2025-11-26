import fs from "fs";
import _ from "lodash";
import moment from "moment-timezone";
import type { Moment } from "moment";
import {
  type EventTemplate,
  type Event,
  getCalendar,
} from "../../calendar.utilities";
import { pairDurationEvents } from "../../duration.utilities";
import type {
  Body,
  MartianPhase,
  MartianPhaseSymbol,
  MercurianPhase,
  MercurianPhaseSymbol,
  VenusianPhase,
  VenusianPhaseSymbol,
} from "../../types";
import { planetaryPhaseBodies } from "../../types";
import {
  symbolByMartianPhase,
  symbolByMercurianPhase,
  symbolByVenusianPhase,
} from "../../symbols";
import type {
  CoordinateEphemeris,
  CoordinateEphemerisBody,
  DistanceEphemeris,
  DistanceEphemerisBody,
  IlluminationEphemeris,
  IlluminationEphemerisBody,
} from "../../ephemeris/ephemeris.types";
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
import { upsertEvents } from "../../database.utilities";
import { MARGIN_MINUTES } from "../../calendar.utilities";
import { getOutputPath } from "../../output.utilities";

const categories = ["Astronomy", "Astrology", "Planetary Phase"];

export function getPlanetaryPhaseEvents(args: {
  currentMinute: Moment;
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
    coordinateEphemerisByBody,
    distanceEphemerisByBody,
    illuminationEphemerisByBody,
  } = args;

  const planetaryPhaseEvents: Event[] = [];

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

export function getVenusianPhaseEvent(args: {
  timestamp: Date;
  phase: VenusianPhase;
}) {
  const { timestamp, phase } = args;

  const phaseCapitalized = _.startCase(phase) as Capitalize<VenusianPhase>;
  const phaseSymbol = symbolByVenusianPhase[phase] as VenusianPhaseSymbol;

  const description = `Venus ${phaseCapitalized}`;
  const summary = `♀️${phaseSymbol} ${description}`;

  const dateString = moment.tz(timestamp, "America/New_York").toISOString(true);
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

  const venusianPhaseEvents: Event[] = [];

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

export function getMercurianPhaseEvent(args: {
  timestamp: Date;
  phase: MercurianPhase;
}) {
  const { timestamp, phase } = args;

  const phaseCapitalized = _.startCase(phase) as Capitalize<MercurianPhase>;
  const phaseSymbol = symbolByMercurianPhase[phase] as MercurianPhaseSymbol;

  const description = `Mercury ${phaseCapitalized}`;
  const summary = `☿${phaseSymbol} ${description}`;

  const dateString = moment.tz(timestamp, "America/New_York").toISOString(true);
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

  const mercurianPhaseEvents: Event[] = [];

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

export function getMartianPhaseEvent(args: {
  timestamp: Date;
  phase: MartianPhase;
}) {
  const { timestamp, phase } = args;

  const phaseCapitalized = _.startCase(phase) as Capitalize<MartianPhase>;
  const phaseSymbol = symbolByMartianPhase[phase] as MartianPhaseSymbol;

  const description = `Mars ${phaseCapitalized}`;
  const summary = `♂️${phaseSymbol} ${description}`;

  const dateString = moment.tz(timestamp, "America/New_York").toISOString(true);
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

  const martianPhaseEvents: Event[] = [];

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

// #region Planetary Phase

export function writePlanetaryPhaseEvents(args: {
  end: Date;
  planetaryPhaseBodies: Extract<Body, "mercury" | "venus" | "mars">[];
  planetaryPhaseEvents: Event[];
  start: Date;
}) {
  const { planetaryPhaseEvents, planetaryPhaseBodies, start, end } = args;
  if (_.isEmpty(planetaryPhaseEvents)) return;

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${planetaryPhaseEvents.length} planetary phase events from ${timespan}`;
  console.log(`🌓 Writing ${message}`);

  upsertEvents(planetaryPhaseEvents);

  const planetaryPhasesBodiesString = planetaryPhaseBodies.join(",");
  const planetaryPhasesCalendar = getCalendar({
    events: planetaryPhaseEvents,
    name: "Planetary Phase 🌓",
  });
  fs.writeFileSync(
    getOutputPath(
      `planetary-phases_${planetaryPhasesBodiesString}_${timespan}.ics`
    ),
    new TextEncoder().encode(planetaryPhasesCalendar)
  );

  console.log(`🌓 Wrote ${message}`);
}

// #region 🕑 Duration Events

export function getPlanetaryPhaseDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to planetary phase events
  const planetaryPhaseEvents = events.filter((event) =>
    event.categories.includes("Planetary Phase")
  );

  // Process Venus phases
  const venusianPhaseEvents = planetaryPhaseEvents.filter((event) =>
    event.categories.includes("Venusian")
  );
  durationEvents.push(...getVenusianPhaseDurationEvents(venusianPhaseEvents));

  // Process Mercury phases
  const mercurianPhaseEvents = planetaryPhaseEvents.filter((event) =>
    event.categories.includes("Mercurian")
  );
  durationEvents.push(...getMercurianPhaseDurationEvents(mercurianPhaseEvents));

  // Process Mars phases
  const martianPhaseEvents = planetaryPhaseEvents.filter((event) =>
    event.categories.includes("Martian")
  );
  durationEvents.push(...getMartianPhaseDurationEvents(martianPhaseEvents));

  return durationEvents;
}

function getVenusianPhaseDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Morning visibility: Morning Rise → Morning Set
  const morningRiseEvents = events.filter((event) =>
    event.categories.includes("Morning Rise")
  );
  const morningSetEvents = events.filter((event) =>
    event.categories.includes("Morning Set")
  );
  const morningVisibilityPairs = pairDurationEvents(
    morningRiseEvents,
    morningSetEvents,
    "Venus Morning Visibility"
  );
  for (const [beginning, ending] of morningVisibilityPairs) {
    durationEvents.push(
      getVenusMorningVisibilityDurationEvent(beginning, ending)
    );
  }

  // Evening visibility: Evening Rise → Evening Set
  const eveningRiseEvents = events.filter((event) =>
    event.categories.includes("Evening Rise")
  );
  const eveningSetEvents = events.filter((event) =>
    event.categories.includes("Evening Set")
  );
  const eveningVisibilityPairs = pairDurationEvents(
    eveningRiseEvents,
    eveningSetEvents,
    "Venus Evening Visibility"
  );
  for (const [beginning, ending] of eveningVisibilityPairs) {
    durationEvents.push(
      getVenusEveningVisibilityDurationEvent(beginning, ending)
    );
  }

  return durationEvents;
}

function getMercurianPhaseDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Morning visibility: Morning Rise → Morning Set
  const morningRiseEvents = events.filter((event) =>
    event.categories.includes("Morning Rise")
  );
  const morningSetEvents = events.filter((event) =>
    event.categories.includes("Morning Set")
  );
  const morningVisibilityPairs = pairDurationEvents(
    morningRiseEvents,
    morningSetEvents,
    "Mercury Morning Visibility"
  );
  for (const [beginning, ending] of morningVisibilityPairs) {
    durationEvents.push(
      getMercuryMorningVisibilityDurationEvent(beginning, ending)
    );
  }

  // Evening visibility: Evening Rise → Evening Set
  const eveningRiseEvents = events.filter((event) =>
    event.categories.includes("Evening Rise")
  );
  const eveningSetEvents = events.filter((event) =>
    event.categories.includes("Evening Set")
  );
  const eveningVisibilityPairs = pairDurationEvents(
    eveningRiseEvents,
    eveningSetEvents,
    "Mercury Evening Visibility"
  );
  for (const [beginning, ending] of eveningVisibilityPairs) {
    durationEvents.push(
      getMercuryEveningVisibilityDurationEvent(beginning, ending)
    );
  }

  return durationEvents;
}

function getMartianPhaseDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Morning visibility: Morning Rise → Morning Set
  const morningRiseEvents = events.filter((event) =>
    event.categories.includes("Morning Rise")
  );
  const morningSetEvents = events.filter((event) =>
    event.categories.includes("Morning Set")
  );
  const morningVisibilityPairs = pairDurationEvents(
    morningRiseEvents,
    morningSetEvents,
    "Mars Morning Visibility"
  );
  for (const [beginning, ending] of morningVisibilityPairs) {
    durationEvents.push(
      getMarsMorningVisibilityDurationEvent(beginning, ending)
    );
  }

  // Evening visibility: Evening Rise → Evening Set
  const eveningRiseEvents = events.filter((event) =>
    event.categories.includes("Evening Rise")
  );
  const eveningSetEvents = events.filter((event) =>
    event.categories.includes("Evening Set")
  );
  const eveningVisibilityPairs = pairDurationEvents(
    eveningRiseEvents,
    eveningSetEvents,
    "Mars Evening Visibility"
  );
  for (const [beginning, ending] of eveningVisibilityPairs) {
    durationEvents.push(
      getMarsEveningVisibilityDurationEvent(beginning, ending)
    );
  }

  return durationEvents;
}

// Venus duration event creators
function getVenusMorningVisibilityDurationEvent(
  beginning: Event,
  ending: Event
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
  ending: Event
): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "♀️ 🌇 Venus Evening Star",
    description: "Venus Evening Star (Evening Visibility)",
    categories: [...categories, "Venusian", "Evening Visibility"],
  };
}

// Mercury duration event creators
function getMercuryMorningVisibilityDurationEvent(
  beginning: Event,
  ending: Event
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
  ending: Event
): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "☿ 🌇 Mercury Evening Star",
    description: "Mercury Evening Star (Evening Visibility)",
    categories: [...categories, "Mercurian", "Evening Visibility"],
  };
}

// Mars duration event creators
function getMarsMorningVisibilityDurationEvent(
  beginning: Event,
  ending: Event
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
  ending: Event
): Event {
  return {
    start: beginning.start,
    end: ending.start,
    summary: "♂️ 🌇 Mars Evening Star",
    description: "Mars Evening Star (Evening Visibility)",
    categories: [...categories, "Martian", "Evening Visibility"],
  };
}
