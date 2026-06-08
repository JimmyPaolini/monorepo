import {
  signs,
  symbolByBody,
  symbolByDecan,
  symbolBySign,
} from "@caelundas/src/modules/caelundas/caelundas.constants";
import {
  capitalize,
  decanIngressBodies,
  isBody,
  isDecan,
  isSign,
  objectEntries,
  peakIngressBodies,
  signIngressBodies,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import { LoggerService } from "../logger/logger.service";

import type {
  Body,
  Sign,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { CoordinateEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

// #region 🪧 Signs

// #region 🔟 Decans

// #region ⛰️ Peaks

// #region 🕑 Progressive Events

/**
 * Detects zodiacal ingress events for celestial bodies entering new signs, decans, or sign peaks.
 *
 * Monitors ecliptic longitudes of tracked bodies to identify sign ingresses (every 30°),
 * decan ingresses (every 10°), and peak ingresses (maximum longitude within a sign).
 */
@Injectable()
export class IngressesService {
  private static readonly categories = ["Astronomy", "Astrology", "Ingress"];

  /**
   * Maps each zodiac sign to its ecliptic longitude range.
   *
   * The ecliptic is divided into 12 equal 30° segments, starting with Aries at 0°.
   *
   * @remarks
   * Tropical zodiac (aligned with seasons, not constellations)
   */
  static readonly degreeRangeBySign: Record<
    Sign,
    { min: number; max: number }
  > = {
    aries: { min: 0, max: 30 },
    taurus: { min: 30, max: 60 },
    gemini: { min: 60, max: 90 },
    cancer: { min: 90, max: 120 },
    leo: { min: 120, max: 150 },
    virgo: { min: 150, max: 180 },
    libra: { min: 180, max: 210 },
    scorpio: { min: 210, max: 240 },
    sagittarius: { min: 240, max: 270 },
    capricorn: { min: 270, max: 300 },
    aquarius: { min: 300, max: 330 },
    pisces: { min: 330, max: 360 },
  };

  /**
   * Determines which zodiac sign corresponds to an ecliptic longitude.
   *
   * @param longitude - Ecliptic longitude in degrees (0-360)
   * @returns The zodiac sign name
   * @throws If longitude is outside valid range
   * @see {@link IngressesService.degreeRangeBySign} for sign boundaries
   */
  static getSign(longitude: number): Sign {
    const entry = objectEntries(IngressesService.degreeRangeBySign).find(
      ([, { min, max }]) => {
        return longitude >= min && longitude < max;
      },
    );
    if (!entry) {
      throw new Error(`🚫 Longitude ${longitude} not in any sign.`);
    }
    return entry[0];
  }

  // 🏗 Dependency Injection
  constructor(
    private readonly logger: LoggerService,
    private readonly ephemerisService: EphemerisService,
  ) {
    this.logger.setContext(IngressesService.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   * Detects zodiacal sign ingress events for celestial bodies.
   *
   * A sign ingress occurs when a body crosses from one zodiac sign into the next
   * (every 30° of ecliptic longitude). Monitors all configured bodies and generates
   * events when they cross sign boundaries.
   *
   * @param args - Configuration object
   * @param coordinateEphemerisByBody - Position data for all tracked bodies
   * @param minute - The specific minute to analyze
   * @returns Array of detected sign ingress events (0-N events per minute)
   * @see {@link isSignIngress} for crossing detection
   * @see {@link getSign} for sign determination
   * @see {@link signIngressBodies} for list of tracked bodies
   */
  getSignIngressEvents(args: {
    coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
    minute: Moment;
  }): Event[] {
    const { coordinateEphemerisByBody, minute } = args;

    const previousMinute = minute.clone().subtract(1, "minute");

    const signIngressEvents: Event[] = [];

    for (const body of signIngressBodies) {
      const coordinateEphemeris = coordinateEphemerisByBody[body];

      const currentLongitude = this.ephemerisService.getCoordinateFromEphemeris(
        coordinateEphemeris,
        minute.toISOString(),
        "longitude",
      );
      const previousLongitude =
        this.ephemerisService.getCoordinateFromEphemeris(
          coordinateEphemeris,
          previousMinute.toISOString(),
          "longitude",
        );

      if (Number.isNaN(currentLongitude) || Number.isNaN(previousLongitude)) {
        continue;
      }

      const date = minute;
      const longitude = currentLongitude;

      if (this.isSignIngress({ currentLongitude, previousLongitude })) {
        signIngressEvents.push(
          this.buildSignIngressEvent({ body, date, longitude }),
        );
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
  buildSignIngressEvent(args: {
    date: Moment;
    longitude: number;
    body: Body;
  }): Event {
    const { date, longitude, body } = args;
    const sign = IngressesService.getSign(longitude);
    const bodyCapitalized = _.startCase(body);
    const signCapitalized = _.startCase(sign);
    const bodySymbol = symbolByBody[body];
    const signSymbol = symbolBySign[sign];

    const description = `${bodyCapitalized} ingress ${signCapitalized}`;
    const summary = `${bodySymbol} → ${signSymbol} ${description}`;

    this.logger.log(`${summary} at ${date.toISOString()}`);

    const signIngressEvent: Event = {
      start: date,
      end: date,
      categories: [
        ...IngressesService.categories,
        bodyCapitalized,
        signCapitalized,
      ],
      description,
      summary,
    };

    return signIngressEvent;
  }

  /**
   * Detects decan ingress events for celestial bodies.
   *
   * A decan ingress occurs when a body crosses into a new decan (10° subdivision
   * within a sign). Each sign has three decans. Excludes sign boundary crossings
   * (which are sign ingresses, not decan ingresses).
   *
   * @param args - Configuration object
   * @param coordinateEphemerisByBody - Position data for all tracked bodies
   * @param minute - The specific minute to analyze
   * @returns Array of detected decan ingress events
   * @see {@link isDecanIngress} for crossing detection
   * @see {@link getDecan} for decan number (1-3) determination
   */
  getDecanIngressEvents(args: {
    coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
    minute: Moment;
  }): Event[] {
    const { coordinateEphemerisByBody, minute } = args;

    const previousMinute = minute.clone().subtract(1, "minute");

    const decanIngressEvents: Event[] = [];

    for (const body of decanIngressBodies) {
      const coordinateEphemeris = coordinateEphemerisByBody[body];

      const currentLongitude = this.ephemerisService.getCoordinateFromEphemeris(
        coordinateEphemeris,
        minute.toISOString(),
        "longitude",
      );
      const previousLongitude =
        this.ephemerisService.getCoordinateFromEphemeris(
          coordinateEphemeris,
          previousMinute.toISOString(),
          "longitude",
        );

      if (Number.isNaN(currentLongitude) || Number.isNaN(previousLongitude)) {
        continue;
      }

      const date = minute;
      const longitude = currentLongitude;

      if (
        !this.isSignIngress({ currentLongitude, previousLongitude }) &&
        this.isDecanIngress({ currentLongitude, previousLongitude })
      ) {
        decanIngressEvents.push(
          this.buildDecanIngressEvent({ body, date, longitude }),
        );
      }
    }

    return decanIngressEvents;
  }

  /**
   * Creates a decan ingress calendar event.
   *
   * A decan ingress occurs when a body crosses into one of the three 10° subdivisions
   * within a zodiac sign, each associated with a sub-ruler and decan symbol.
   *
   * @param args - Body, ecliptic longitude, and date of the ingress
   * @returns Calendar event for the decan ingress
   */
  buildDecanIngressEvent(args: {
    date: Moment;
    longitude: number;
    body: Body;
  }): Event {
    const { date, longitude, body } = args;
    const sign = IngressesService.getSign(longitude);
    const decanString = String(this.getDecan(longitude));
    if (!isDecan(decanString)) {
      throw new Error(`Invalid decan value: ${decanString}`);
    }
    const decan = decanString;
    const bodyCapitalized = capitalize(body);
    const signCapitalized = capitalize(sign);

    const bodySymbol = symbolByBody[body];
    const signSymbol = symbolBySign[sign];
    const decanSymbol = symbolByDecan[decan];

    const description = `${bodyCapitalized} ingress decan ${decan} ${signCapitalized}`;
    const summary = `${bodySymbol} → ${signSymbol}${decanSymbol} ${description}`;

    this.logger.log(`${summary} at ${date.toISOString()}`);

    const decanIngressEvent: Event = {
      start: date,
      end: date,
      categories: [
        ...IngressesService.categories,
        "Decan",
        bodyCapitalized,
        signCapitalized,
      ],
      description,
      summary,
    };

    return decanIngressEvent;
  }

  /**
   * Detects sign peak ingress events for celestial bodies at a specific minute.
   *
   * A peak ingress occurs when a body reaches the midpoint longitude (15°) of its
   * current zodiac sign, representing the peak expression of that sign's energy.
   *
   * @param args - Body position data and the current minute to analyze
   * @returns Array of detected peak ingress events
   */
  getPeakIngressEvents(args: {
    coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
    minute: Moment;
  }): Event[] {
    const { coordinateEphemerisByBody, minute } = args;

    const previousMinute = minute.clone().subtract(1, "minute");

    const peakIngressEvents: Event[] = [];

    for (const body of peakIngressBodies) {
      const coordinateEphemeris = coordinateEphemerisByBody[body];

      const currentLongitude = this.ephemerisService.getCoordinateFromEphemeris(
        coordinateEphemeris,
        minute.toISOString(),
        "longitude",
      );
      const previousLongitude =
        this.ephemerisService.getCoordinateFromEphemeris(
          coordinateEphemeris,
          previousMinute.toISOString(),
          "longitude",
        );

      if (Number.isNaN(currentLongitude) || Number.isNaN(previousLongitude)) {
        continue;
      }

      const date = minute;
      const longitude = currentLongitude;

      if (this.isPeakIngress({ currentLongitude, previousLongitude })) {
        peakIngressEvents.push(
          this.buildPeakIngressEvent({ body, date, longitude }),
        );
      }
    }

    return peakIngressEvents;
  }

  /**
   * Creates a sign peak ingress calendar event.
   *
   * Marks when a celestial body reaches the 15° midpoint of its current zodiac sign,
   * representing the peak expression of that sign's energy.
   *
   * @param args - Body, ecliptic longitude, and date of the peak
   * @returns Calendar event for the sign peak ingress
   */
  buildPeakIngressEvent(args: {
    date: Moment;
    longitude: number;
    body: Body;
  }): Event {
    const { date, longitude, body } = args;
    const sign = IngressesService.getSign(longitude);
    const bodyCapitalized = capitalize(body);
    const signCapitalized = capitalize(sign);
    const bodySymbol = symbolByBody[body];
    const signSymbol = symbolBySign[sign];

    const description = `${bodyCapitalized} peak ingress ${signCapitalized}`;
    const summary = `${bodySymbol} → ${signSymbol}⛰️ ${description}`;

    this.logger.log(`${summary} at ${date.toISOString()}`);

    const peakIngressEvent: Event = {
      start: date,
      end: date,
      categories: [
        ...IngressesService.categories,
        "Peak",
        bodyCapitalized,
        signCapitalized,
      ],
      description,
      summary,
    };

    return peakIngressEvent;
  }

  /**
   * Builds progressive event spans for zodiac sign ingress periods.
   *
   * Pairs consecutive sign ingress events for each body to produce duration-based
   * calendar entries representing the full transit through each zodiac sign.
   *
   * @param events - Flat array of perfective ingress events
   * @returns Progressive (span) calendar events for each sign transit
   */
  detectProgressive(events: Event[]): Event[] {
    const progressiveEvents: Event[] = [];

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
        event.start.valueOf(),
      );

      // Pair consecutive ingresses to create progressive events
      for (let i = 0; i < sortedIngresses.length - 1; i++) {
        const entering = sortedIngresses[i];
        const exiting = sortedIngresses[i + 1];
        if (!entering || !exiting) {
          continue;
        }

        progressiveEvents.push(
          this.getSignIngressDurationEvent(entering, exiting, bodyCapitalized),
        );
      }
    }

    return progressiveEvents;
  }

  /**
   * Detects all ingress events (sign, decan, peak) at a specific minute.
   *
   * @param args - Body position data and the current minute to analyze
   * @returns Array of all detected ingress events (sign, decan, and peak)
   */
  detect(args: {
    coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
    minute: Moment;
  }): Event[] {
    return [
      ...this.getSignIngressEvents(args),
      ...this.getDecanIngressEvents(args),
      ...this.getPeakIngressEvents(args),
    ];
  }

  private getSignIngressDurationEvent(
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
        `Could not extract sign from categories: ${entering.categories.join(", ")}`,
      );
    }

    const bodyLower = bodyCapitalized.toLowerCase();
    const signLower = signCapitalized.toLowerCase();
    if (!isBody(bodyLower) || !isSign(signLower)) {
      throw new Error(
        `Could not extract typed values from categories: ${entering.categories.join(", ")}`,
      );
    }
    const body = bodyLower;
    const sign = signLower;

    const bodySymbol = symbolByBody[body];
    const signSymbol = symbolBySign[sign];

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

  private isSignIngress(args: {
    previousLongitude: number;
    currentLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;
    return (
      IngressesService.getSign(currentLongitude) !==
      IngressesService.getSign(previousLongitude)
    );
  }

  private getDecan(longitude: number): number {
    const sign = IngressesService.getSign(longitude);
    const { min } = IngressesService.degreeRangeBySign[sign];
    return Math.floor((longitude - min) / 10) + 1;
  }

  private isDecanIngress(args: {
    previousLongitude: number;
    currentLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;
    return this.getDecan(currentLongitude) !== this.getDecan(previousLongitude);
  }

  private isPeakIngress(args: {
    previousLongitude: number;
    currentLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;

    const previousSign = IngressesService.getSign(previousLongitude);
    const { min: previousMin } =
      IngressesService.degreeRangeBySign[previousSign];
    const previousDifference = previousLongitude - previousMin;

    const currentSign = IngressesService.getSign(currentLongitude);
    const { min: currentMin } = IngressesService.degreeRangeBySign[currentSign];
    const currentDifference = currentLongitude - currentMin;

    return currentDifference >= 15 && previousDifference < 15;
  }
}
