import _ from "npm:lodash";
import type { Moment } from "npm:moment";
import type {
  Body,
  Sign,
  BodySymbol,
  SignSymbol,
} from "../../symbols.constants.ts";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types.ts";
import {
  type Event,
  type EventTemplate,
  getCalendar,
} from "../../calendar.utilities.ts";
import {
  getDecan,
  getSign,
  isDecanIngress,
  isSignIngress,
  isPeakIngress,
} from "../ingresses/ingresses.utilities.ts";
import {
  symbolByBody,
  symbolByDecan,
  symbolBySign,
} from "../../symbols.constants.ts";
import { upsertEvents } from "../../database.utilities.ts";
import { incrementEventsCount, print } from "../../logs/logs.service.tsx";

// #region 🪧 Signs

export type SignIngressDescription =
  `${Capitalize<Body>} ingress ${Capitalize<Sign>}`;
export type SignIngressSummary =
  `${BodySymbol} → ${SignSymbol} ${SignIngressDescription}`;

export interface SignIngressEventTemplate extends EventTemplate {
  description: SignIngressDescription;
  summary: SignIngressSummary;
}

export interface SignIngressEvent extends Event {
  description: SignIngressDescription;
  summary: SignIngressSummary;
}

export function getSignIngressEvents(args: {
  signIngressBodies: Body[];
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  currentMinute: Moment;
}) {
  const { signIngressBodies, coordinateEphemerisByBody, currentMinute } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");

  const signIngressEvents: SignIngressEvent[] = [];

  for (const body of signIngressBodies) {
    const coordinateEphemeris = coordinateEphemerisByBody[body];

    const { longitude: currentLongitude } =
      coordinateEphemeris[currentMinute.toISOString()];
    const { longitude: previousLongitude } =
      coordinateEphemeris[previousMinute.toISOString()];

    if (Number.isNaN(currentLongitude) || Number.isNaN(previousLongitude)) {
      continue;
    }

    const date = currentMinute.toDate();
    const longitude = currentLongitude;

    if (isSignIngress({ currentLongitude, previousLongitude })) {
      signIngressEvents.push(getSignIngressEvent({ body, date, longitude }));
    }
  }

  return signIngressEvents;
}

export function getSignIngressEvent(args: {
  date: Date;
  longitude: number;
  body: Body;
}) {
  const { date, longitude, body } = args;
  const sign = getSign(longitude);
  const bodyCapitalized = _.startCase(body) as Capitalize<Body>;
  const signCapitalized = _.startCase(sign) as Capitalize<Sign>;
  const bodySymbol = symbolByBody[body] as BodySymbol;
  const signSymbol = symbolBySign[sign] as SignSymbol;

  const description: SignIngressDescription = `${bodyCapitalized} ingress ${signCapitalized}`;
  const summary: SignIngressSummary = `${bodySymbol} → ${signSymbol} ${description}`;

  print(`${summary} at ${date.toISOString()}`);
  incrementEventsCount();

  const signIngressEvent: SignIngressEvent = {
    start: date,
    description,
    summary,
  };

  return signIngressEvent;
}

export function writeSignIngressEvents(args: {
  end: Date;
  signIngressBodies: Body[];
  signIngressEvents: SignIngressEvent[];
  start: Date;
}) {
  const { signIngressEvents, signIngressBodies, start, end } = args;
  if (_.isEmpty(signIngressEvents)) return;

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${signIngressEvents.length} sign ingress events from ${timespan}`;
  print(`🪧 Writing ${message}`);

  upsertEvents(signIngressEvents);

  const signIngressBodiesString = signIngressBodies.join(",");
  const signIngressesCalendar = getCalendar(
    signIngressEvents,
    "Sign Ingresses 🪧"
  );
  Deno.writeFileSync(
    `./calendars/ingresses_${signIngressBodiesString}_${timespan}.ics`,
    new TextEncoder().encode(signIngressesCalendar)
  );

  print(`🪧 Wrote ${message}`);
}

// #region 🔟 Decans

export type DecanIngressDescription =
  `${Capitalize<Body>} ingress decan ${number} ${Capitalize<Sign>}`;
export type DecanIngressSummary =
  `${BodySymbol} → ${SignSymbol}${number} ${DecanIngressDescription}`;

export interface DecanIngressEventTemplate extends EventTemplate {
  description: DecanIngressDescription;
  summary: DecanIngressSummary;
}
export interface DecanIngressEvent extends Event {
  description: DecanIngressDescription;
  summary: DecanIngressSummary;
}

export function getDecanIngressEvents(args: {
  decanIngressBodies: Body[];
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  currentMinute: Moment;
}) {
  const { decanIngressBodies, coordinateEphemerisByBody, currentMinute } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");

  const decanIngressEvents: DecanIngressEvent[] = [];

  for (const body of decanIngressBodies) {
    const coordinateEphemeris = coordinateEphemerisByBody[body];

    const { longitude: currentLongitude } =
      coordinateEphemeris[currentMinute.toISOString()];
    const { longitude: previousLongitude } =
      coordinateEphemeris[previousMinute.toISOString()];

    if (Number.isNaN(currentLongitude) || Number.isNaN(previousLongitude)) {
      continue;
    }

    const date = currentMinute.toDate();
    const longitude = currentLongitude;

    if (
      !isSignIngress({ currentLongitude, previousLongitude }) &&
      isDecanIngress({ currentLongitude, previousLongitude })
    ) {
      decanIngressEvents.push(getDecanIngressEvent({ body, date, longitude }));
    }
  }

  return decanIngressEvents;
}

export function getDecanIngressEvent(args: {
  date: Date;
  longitude: number;
  body: Body;
}) {
  const { date, longitude, body } = args;
  const sign = getSign(longitude);
  const decan = String(getDecan(longitude));
  const bodyCapitalized = _.startCase(body) as Capitalize<Body>;
  const signCapitalized = _.startCase(sign) as Capitalize<Sign>;

  const bodySymbol = symbolByBody[body] as BodySymbol;
  const signSymbol = symbolBySign[sign] as SignSymbol;
  const decanSymbol = symbolByDecan[decan] as DecanSymbol;

  const description: DecanIngressDescription = `${bodyCapitalized} ingress decan ${decan} ${signCapitalized}`;
  const summary: DecanIngressSummary = `${bodySymbol} → ${signSymbol}${decanSymbol} ${description}`;

  print(`${summary} at ${date.toISOString()}`);
  incrementEventsCount();

  const decanIngressEvent: DecanIngressEvent = {
    start: date,
    description,
    summary,
  };

  return decanIngressEvent;
}

export function writeDecanIngressEvents(args: {
  end: Date;
  decanIngressBodies: Body[];
  decanIngressEvents: DecanIngressEvent[];
  start: Date;
}) {
  const { decanIngressEvents, decanIngressBodies, start, end } = args;
  if (_.isEmpty(decanIngressEvents)) return;

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${decanIngressEvents.length} decan ingress events from ${timespan}`;
  print(`🔟 Writing ${message}`);

  upsertEvents(decanIngressEvents);

  const decanIngressBodiesString = decanIngressBodies.join(",");
  const decanIngressesCalendar = getCalendar(
    decanIngressEvents,
    "Decan Ingresses 🔟"
  );
  Deno.writeFileSync(
    `./calendars/ingresses_${decanIngressBodiesString}_${timespan}.ics`,
    new TextEncoder().encode(decanIngressesCalendar)
  );

  print(`🔟 Wrote ${message}`);
}

// #region ⛰️ Peaks

export type PeakIngressDescription =
  `${Capitalize<Body>} peak ingress ${Capitalize<Sign>}`;
export type PeakIngressSummary =
  `${BodySymbol} → ${SignSymbol}⛰️ ${PeakIngressDescription}`;

export interface PeakIngressEventTemplate extends EventTemplate {
  description: PeakIngressDescription;
  summary: PeakIngressSummary;
}
export interface PeakIngressEvent extends Event {
  description: PeakIngressDescription;
  summary: PeakIngressSummary;
}
export function getPeakIngressEvents(args: {
  peakIngressBodies: Body[];
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  currentMinute: Moment;
}) {
  const { peakIngressBodies, coordinateEphemerisByBody, currentMinute } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");

  const peakIngressEvents: PeakIngressEvent[] = [];

  for (const body of peakIngressBodies) {
    const coordinateEphemeris = coordinateEphemerisByBody[body];

    const { longitude: currentLongitude } =
      coordinateEphemeris[currentMinute.toISOString()];
    const { longitude: previousLongitude } =
      coordinateEphemeris[previousMinute.toISOString()];

    if (Number.isNaN(currentLongitude) || Number.isNaN(previousLongitude)) {
      continue;
    }

    const date = currentMinute.toDate();
    const longitude = currentLongitude;

    if (isPeakIngress({ currentLongitude, previousLongitude })) {
      peakIngressEvents.push(getPeakIngressEvent({ body, date, longitude }));
    }
  }

  return peakIngressEvents;
}

export function getPeakIngressEvent(args: {
  date: Date;
  longitude: number;
  body: Body;
}) {
  const { date, longitude, body } = args;
  const sign = getSign(longitude);
  const bodyCapitalized = _.startCase(body) as Capitalize<Body>;
  const signCapitalized = _.startCase(sign) as Capitalize<Sign>;
  const bodySymbol = symbolByBody[body] as BodySymbol;
  const signSymbol = symbolBySign[sign] as SignSymbol;

  const description: PeakIngressDescription = `${bodyCapitalized} peak ingress ${signCapitalized}`;
  const summary: PeakIngressSummary = `${bodySymbol} → ${signSymbol}⛰️ ${description}`;

  print(`${summary} at ${date.toISOString()}`);
  incrementEventsCount();

  const peakIngressEvent: PeakIngressEvent = {
    start: date,
    description,
    summary,
  };

  return peakIngressEvent;
}

export function writePeakIngressEvents(args: {
  end: Date;
  peakIngressBodies: Body[];
  peakIngressEvents: PeakIngressEvent[];
  start: Date;
}) {
  const { peakIngressEvents, peakIngressBodies, start, end } = args;
  if (_.isEmpty(peakIngressEvents)) return;

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${peakIngressEvents.length} peak ingress events from ${timespan}`;
  print(`⛰️ Writing ${message}`);

  upsertEvents(peakIngressEvents);

  const peakIngressBodiesString = peakIngressBodies.join(",");
  const peakIngressesCalendar = getCalendar(
    peakIngressEvents,
    "Peak Ingresses ⛰️"
  );
  Deno.writeFileSync(
    `./calendars/ingresses_${peakIngressBodiesString}_${timespan}.ics`,
    new TextEncoder().encode(peakIngressesCalendar)
  );

  print(`⛰️ Wrote ${message}`);
}
