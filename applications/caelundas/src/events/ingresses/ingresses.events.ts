import fs from "node:fs";

import _ from "lodash";

import { type Event, getCalendar } from "../../calendar.utilities";
import { signs } from "../../constants";
import { getCoordinateFromEphemeris } from "../../ephemeris/ephemeris.service";
import { getOutputPath } from "../../output.utilities";
import { symbolByBody, symbolByDecan, symbolBySign } from "../../symbols";
import {
  decanIngressBodies,
  peakIngressBodies,
  signIngressBodies,
} from "../../types";
import {
  getDecan,
  getSign,
  isDecanIngress,
  isPeakIngress,
  isSignIngress,
} from "../ingresses/ingresses.utilities";

import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type {
  Body,
  BodySymbol,
  Decan,
  DecanSymbol,
  Sign,
  SignSymbol,
} from "../../types";
import type { Moment } from "moment";

const categories = ["Astronomy", "Astrology", "Ingress"];

// #region 🪧 Signs

/**
 * Detects zodiacal sign ingress events for celestial bodies.
 *
 * A sign ingress occurs when a body crosses from one zodiac sign into the next
 * (every 30° of ecliptic longitude). Monitors all configured bodies and generates
 * events when they cross sign boundaries.
 *
 * @param args - Configuration object
 * @param coordinateEphemerisByBody - Position data for all tracked bodies
 * @param currentMinute - The specific minute to analyze
 * @returns Array of detected sign ingress events (0-N events per minute)
 * @see {@link isSignIngress} for crossing detection
 * @see {@link getSign} for sign determination
 * @see {@link signIngressBodies} for list of tracked bodies
 */
export function getSignIngressEvents(args: {
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  currentMinute: Moment;
}): Event[] {
  const { coordinateEphemerisByBody, currentMinute } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");

  const signIngressEvents: Event[] = [];

  for (const body of signIngressBodies) {
    const coordinateEphemeris = coordinateEphemerisByBody[body];

    const currentLongitude = getCoordinateFromEphemeris(
      coordinateEphemeris,
      currentMinute.toISOString(),
      "longitude",
    );
    const previousLongitude = getCoordinateFromEphemeris(
      coordinateEphemeris,
      previousMinute.toISOString(),
      "longitude",
    );

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

/**
 * Creates a zodiac sign ingress calendar event.
 *
 * @param args - Configuration object
 * @param date - Precise UTC time of ingress
 * @param longitude - Ecliptic longitude in degrees (0-360)
 * @param body - Celestial body entering new sign
 * @returns Calendar event for sign ingress with body and sign symbols
 * @see {@link getSign} to derive sign from longitude
 */
export function getSignIngressEvent(args: {
  date: Date;
  longitude: number;
  body: Body;
}): Event {
  const { date, longitude, body } = args;
  const sign = getSign(longitude);
  const bodyCapitalized = _.startCase(body);
  const signCapitalized = _.startCase(sign);
  const bodySymbol = symbolByBody[body];
  const signSymbol = symbolBySign[sign];

  const description = `${bodyCapitalized} ingress ${signCapitalized}`;
  const summary = `${bodySymbol} → ${signSymbol} ${description}`;

  console.log(`${summary} at ${date.toISOString()}`);

  const signIngressEvent: Event = {
    start: date,
    end: date,
    categories: [...categories, bodyCapitalized, signCapitalized],
    description,
    summary,
  };

  return signIngressEvent;
}

/**
 *
 */
export function writeSignIngressEvents(args: {
  end: Date;
  signIngressBodies: Body[];
  signIngressEvents: Event[];
  start: Date;
}): void {
  const { signIngressEvents, signIngressBodies, start, end } = args;
  if (_.isEmpty(signIngressEvents)) {
    return;
  }

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${signIngressEvents.length} sign ingress events from ${timespan}`;
  console.log(`🪧 Writing ${message}`);

  const signIngressBodiesString = signIngressBodies.join(",");
  const signIngressesCalendar = getCalendar({
    events: signIngressEvents,
    name: "Sign Ingresses 🪧",
  });
  fs.writeFileSync(
    getOutputPath(`ingresses_${signIngressBodiesString}_${timespan}.ics`),
    new TextEncoder().encode(signIngressesCalendar),
  );

  console.log(`🪧 Wrote ${message}`);
}

// #region 🔟 Decans

/**
 * Detects decan ingress events for celestial bodies.
 *
 * A decan ingress occurs when a body crosses into a new decan (10° subdivision
 * within a sign). Each sign has three decans. Excludes sign boundary crossings
 * (which are sign ingresses, not decan ingresses).
 *
 * @param args - Configuration object
 * @param coordinateEphemerisByBody - Position data for all tracked bodies
 * @param currentMinute - The specific minute to analyze
 * @returns Array of detected decan ingress events
 * @see {@link isDecanIngress} for crossing detection
 * @see {@link getDecan} for decan number (1-3) determination
 */
export function getDecanIngressEvents(args: {
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  currentMinute: Moment;
}): Event[] {
  const { coordinateEphemerisByBody, currentMinute } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");

  const decanIngressEvents: Event[] = [];

  for (const body of decanIngressBodies) {
    const coordinateEphemeris = coordinateEphemerisByBody[body];

    const currentLongitude = getCoordinateFromEphemeris(
      coordinateEphemeris,
      currentMinute.toISOString(),
      "longitude",
    );
    const previousLongitude = getCoordinateFromEphemeris(
      coordinateEphemeris,
      previousMinute.toISOString(),
      "longitude",
    );

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

/**
 *
 */
export function getDecanIngressEvent(args: {
  date: Date;
  longitude: number;
  body: Body;
}): Event {
  const { date, longitude, body } = args;
  const sign = getSign(longitude);
  const decan = String(getDecan(longitude)) as Decan;
  const bodyCapitalized = _.startCase(body) as Capitalize<Body>;
  const signCapitalized = _.startCase(sign) as Capitalize<Sign>;

  const bodySymbol = symbolByBody[body] as BodySymbol;
  const signSymbol = symbolBySign[sign] as SignSymbol;
  const decanSymbol = symbolByDecan[decan] as DecanSymbol;

  const description = `${bodyCapitalized} ingress decan ${decan} ${signCapitalized}`;
  const summary = `${bodySymbol} → ${signSymbol}${decanSymbol} ${description}`;

  console.log(`${summary} at ${date.toISOString()}`);

  const decanIngressEvent: Event = {
    start: date,
    end: date,
    categories: [...categories, "Decan", bodyCapitalized, signCapitalized],
    description,
    summary,
  };

  return decanIngressEvent;
}

/**
 *
 */
export function writeDecanIngressEvents(args: {
  end: Date;
  decanIngressBodies: Body[];
  decanIngressEvents: Event[];
  start: Date;
}): void {
  const { decanIngressEvents, decanIngressBodies, start, end } = args;
  if (_.isEmpty(decanIngressEvents)) {
    return;
  }

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${decanIngressEvents.length} decan ingress events from ${timespan}`;
  console.log(`🔟 Writing ${message}`);

  const decanIngressBodiesString = decanIngressBodies.join(",");
  const decanIngressesCalendar = getCalendar({
    events: decanIngressEvents,
    name: "Decan Ingresses 🔟",
  });
  fs.writeFileSync(
    getOutputPath(`ingresses_${decanIngressBodiesString}_${timespan}.ics`),
    new TextEncoder().encode(decanIngressesCalendar),
  );

  console.log(`🔟 Wrote ${message}`);
}

// #region ⛰️ Peaks

/**
 *
 */
export function getPeakIngressEvents(args: {
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  currentMinute: Moment;
}): Event[] {
  const { coordinateEphemerisByBody, currentMinute } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");

  const peakIngressEvents: Event[] = [];

  for (const body of peakIngressBodies) {
    const coordinateEphemeris = coordinateEphemerisByBody[body];

    const currentLongitude = getCoordinateFromEphemeris(
      coordinateEphemeris,
      currentMinute.toISOString(),
      "longitude",
    );
    const previousLongitude = getCoordinateFromEphemeris(
      coordinateEphemeris,
      previousMinute.toISOString(),
      "longitude",
    );

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

/**
 *
 */
export function getPeakIngressEvent(args: {
  date: Date;
  longitude: number;
  body: Body;
}): Event {
  const { date, longitude, body } = args;
  const sign = getSign(longitude);
  const bodyCapitalized = _.startCase(body) as Capitalize<Body>;
  const signCapitalized = _.startCase(sign) as Capitalize<Sign>;
  const bodySymbol = symbolByBody[body] as BodySymbol;
  const signSymbol = symbolBySign[sign] as SignSymbol;

  const description = `${bodyCapitalized} peak ingress ${signCapitalized}`;
  const summary = `${bodySymbol} → ${signSymbol}⛰️ ${description}`;

  console.log(`${summary} at ${date.toISOString()}`);

  const peakIngressEvent: Event = {
    start: date,
    end: date,
    categories: [...categories, "Peak", bodyCapitalized, signCapitalized],
    description,
    summary,
  };

  return peakIngressEvent;
}

/**
 *
 */
export function writePeakIngressEvents(args: {
  end: Date;
  peakIngressBodies: Body[];
  peakIngressEvents: Event[];
  start: Date;
}): void {
  const { peakIngressEvents, peakIngressBodies, start, end } = args;
  if (_.isEmpty(peakIngressEvents)) {
    return;
  }

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${peakIngressEvents.length} peak ingress events from ${timespan}`;
  console.log(`⛰️ Writing ${message}`);

  const peakIngressBodiesString = peakIngressBodies.join(",");
  const peakIngressesCalendar = getCalendar({
    events: peakIngressEvents,
    name: "Peak Ingresses ⛰️",
  });
  fs.writeFileSync(
    getOutputPath(`peak-ingresses_${peakIngressBodiesString}_${timespan}.ics`),
    new TextEncoder().encode(peakIngressesCalendar),
  );

  console.log(`⛰️ Wrote ${message}`);
}

// #region 🕑 Duration Events

/**
 *
 */
export function getSignIngressDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to sign ingress events only (exclude decan and peak)
  const signIngressEvents = events.filter(
    (event) =>
      event.categories.includes("Ingress") &&
      !event.categories.includes("Decan") &&
      !event.categories.includes("Peak"),
  );

  // Group by body
  const groupedByBody = _.groupBy(signIngressEvents, (event) => {
    const bodyCapitalized = event.categories.find((category) =>
      signIngressBodies
        .map((signIngressBody) => _.startCase(signIngressBody))
        .includes(category),
    );
    return bodyCapitalized || "";
  });

  // Process each body
  for (const [bodyCapitalized, bodyIngresses] of Object.entries(
    groupedByBody,
  )) {
    if (!bodyCapitalized) {
      continue;
    }

    // Sort by time
    const sortedIngresses = _.sortBy(bodyIngresses, (event) =>
      event.start.getTime(),
    );

    // Pair consecutive ingresses to create duration events
    for (let i = 0; i < sortedIngresses.length - 1; i++) {
      const entering = sortedIngresses[i];
      const exiting = sortedIngresses[i + 1];
      if (!entering || !exiting) {
        continue;
      }

      durationEvents.push(
        getSignIngressDurationEvent(entering, exiting, bodyCapitalized),
      );
    }
  }

  return durationEvents;
}

function getSignIngressDurationEvent(
  entering: Event,
  exiting: Event,
  bodyCapitalized: string,
): Event {
  // Extract the sign the body is entering
  const signCapitalized = entering.categories.find((category) =>
    signs.map((sign) => _.startCase(sign)).includes(category),
  );

  if (!signCapitalized) {
    throw new Error(
      `Could not extract sign from categories: ${categories.join(", ")}`,
    );
  }

  const body = bodyCapitalized.toLowerCase() as Body;
  const sign = signCapitalized.toLowerCase() as Sign;

  const bodySymbol = symbolByBody[body] as BodySymbol;
  const signSymbol = symbolBySign[sign] as SignSymbol;

  return {
    start: entering.start,
    end: exiting.start,
    summary: `${bodySymbol} ${signSymbol} ${bodyCapitalized} in ${signCapitalized}`,
    description: `${bodyCapitalized} in ${signCapitalized}`,
    categories: [
      "Astronomy",
      "Astrology",
      "Ingress",
      bodyCapitalized,
      signCapitalized,
    ],
  };
}
