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
  Decan,
  Sign,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { CoordinateEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

/**
 * Detects zodiacal ingress events for celestial bodies entering new signs, decans, or sign peaks.
 *
 * Monitors ecliptic longitudes of tracked bodies to identify sign ingresses (every 30°),
 * decan ingresses (every 10°), and peak ingresses (maximum longitude within a sign).
 */
@Injectable()
export class IngressesService {
  // 🏗 Dependency Injection

  constructor(
    private readonly logger: LoggerService,
    private readonly ephemerisService: EphemerisService,
  ) {
    this.logger.setContext(IngressesService.name);
  }

  // 🔐 Private Fields

  private static readonly categories = ["Astronomy", "Astrology", "Ingress"];

  // 🔑 Public Fields

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
    { maximum: number; minimum: number }
  > = {
    aquarius: { maximum: 330, minimum: 300 },
    aries: { maximum: 30, minimum: 0 },
    cancer: { maximum: 120, minimum: 90 },
    capricorn: { maximum: 300, minimum: 270 },
    gemini: { maximum: 90, minimum: 60 },
    leo: { maximum: 150, minimum: 120 },
    libra: { maximum: 210, minimum: 180 },
    pisces: { maximum: 360, minimum: 330 },
    sagittarius: { maximum: 270, minimum: 240 },
    scorpio: { maximum: 240, minimum: 210 },
    taurus: { maximum: 60, minimum: 30 },
    virgo: { maximum: 180, minimum: 150 },
  };

  // 🔏 Private Methods

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
      ([, { maximum, minimum }]) => {
        return longitude >= minimum && longitude < maximum;
      },
    );
    if (!entry) {
      throw new Error(`🚫 Longitude ${longitude} not in any sign.`);
    }
    return entry[0];
  }

  private buildDecanIngressEventObject(args: {
    body: Body;
    date: Moment;
    longitude: number;
  }): Event {
    const { body, date, longitude } = args;
    const sign = IngressesService.getSign(longitude);
    const decan = this.resolveDecan(longitude);
    const bodyCapitalized = capitalize(body);
    const signCapitalized = capitalize(sign);
    const description = `${bodyCapitalized} ingress decan ${decan} ${signCapitalized}`;
    const summary = `${symbolByBody[body]} → ${symbolBySign[sign]}${symbolByDecan[decan]} ${description}`;
    return {
      categories: [
        ...IngressesService.categories,
        "Decan",
        bodyCapitalized,
        signCapitalized,
      ],
      description,
      end: date,
      start: date,
      summary,
    };
  }

  private buildProgressiveSpansForBody(
    bodyCapitalized: string,
    events: Event[],
  ): Event[] {
    const progressiveSpans: Event[] = [];
    const sortedIngresses = _.sortBy(events, (event) => event.start.valueOf());
    for (let index = 0; index < sortedIngresses.length - 1; index++) {
      const entering = sortedIngresses[index];
      const exiting = sortedIngresses[index + 1];
      if (!entering || !exiting) {
        continue;
      }
      progressiveSpans.push(
        this.getSignIngressDurationEvent(entering, exiting, bodyCapitalized),
      );
    }
    return progressiveSpans;
  }

  private extractSignAndBodyFromCategories(
    categories: string[],
    bodyCapitalized: string,
  ): {
    body: Body;
    bodyCapitalized: string;
    sign: Sign;
    signCapitalized: string;
  } {
    const signCapitalized = categories.find((category) =>
      signs.map((sign) => _.startCase(sign)).includes(category),
    );
    if (!signCapitalized) {
      throw new Error(
        `Could not extract sign from categories: ${categories.join(", ")}`,
      );
    }
    const bodyLower = bodyCapitalized.toLowerCase();
    const signLower = signCapitalized.toLowerCase();
    if (!isBody(bodyLower) || !isSign(signLower)) {
      throw new Error(
        `Could not extract typed values from categories: ${categories.join(", ")}`,
      );
    }
    return {
      body: bodyLower,
      bodyCapitalized,
      sign: signLower,
      signCapitalized,
    };
  }

  private filterSignIngressEvents(events: Event[]): Event[] {
    return events.filter(
      (event) =>
        event.categories.includes("Ingress") &&
        !event.categories.includes("Decan") &&
        !event.categories.includes("Peak"),
    );
  }

  private getDecan(longitude: number): number {
    const sign = IngressesService.getSign(longitude);
    const { minimum: minimum } = IngressesService.degreeRangeBySign[sign];
    return Math.floor((longitude - minimum) / 10) + 1;
  }

  private getLongitudes(args: {
    coordinateEphemeris: CoordinateEphemeris;
    minute: Moment;
    previousMinute: Moment;
  }): { currentLongitude: number; previousLongitude: number } {
    const { coordinateEphemeris, minute, previousMinute } = args;
    const currentLongitude = this.ephemerisService.getCoordinateFromEphemeris(
      coordinateEphemeris,
      minute.toISOString(),
      "longitude",
    );
    const previousLongitude = this.ephemerisService.getCoordinateFromEphemeris(
      coordinateEphemeris,
      previousMinute.toISOString(),
      "longitude",
    );
    return { currentLongitude, previousLongitude };
  }

  private getSignIngressDurationEvent(
    entering: Event,
    exiting: Event,
    bodyCapitalized: string,
  ): Event {
    const { body, sign, signCapitalized } =
      this.extractSignAndBodyFromCategories(
        entering.categories,
        bodyCapitalized,
      );
    const bodySymbol = symbolByBody[body];
    const signSymbol = symbolBySign[sign];
    return {
      categories: [
        "Astronomy",
        "Astrology",
        "Ingress",
        bodyCapitalized,
        signCapitalized,
      ],
      description: `${bodyCapitalized} in ${signCapitalized}`,
      end: exiting.start,
      start: entering.start,
      summary: `${bodySymbol} ${signSymbol} ${bodyCapitalized} in ${signCapitalized}`,
    };
  }

  private groupSignIngressEventsByBody(
    events: Event[],
  ): Record<string, Event[]> {
    return _.groupBy(events, (event) => {
      const bodyCapitalized = event.categories.find((category) =>
        signIngressBodies
          .map((signIngressBody) => _.startCase(signIngressBody))
          .includes(category),
      );
      return bodyCapitalized || "";
    });
  }

  private isDecanIngress(args: {
    currentLongitude: number;
    previousLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;
    return this.getDecan(currentLongitude) !== this.getDecan(previousLongitude);
  }

  private isPeakIngress(args: {
    currentLongitude: number;
    previousLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;

    const previousSign = IngressesService.getSign(previousLongitude);
    const { minimum: previousMinimum } =
      IngressesService.degreeRangeBySign[previousSign];
    const previousDifference = previousLongitude - previousMinimum;

    const currentSign = IngressesService.getSign(currentLongitude);
    const { minimum: currentMinimum } =
      IngressesService.degreeRangeBySign[currentSign];
    const currentDifference = currentLongitude - currentMinimum;

    return currentDifference >= 15 && previousDifference < 15;
  }

  // 🌎 Public Methods

  private isSignIngress(args: {
    currentLongitude: number;
    previousLongitude: number;
  }): boolean {
    const { currentLongitude, previousLongitude } = args;
    return (
      IngressesService.getSign(currentLongitude) !==
      IngressesService.getSign(previousLongitude)
    );
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
  private resolveDecan(longitude: number): Decan {
    const decanString = String(this.getDecan(longitude));
    if (!isDecan(decanString)) {
      throw new Error(`Invalid decan value: ${decanString}`);
    }
    return decanString;
  }

  /**
   *
   */
  buildDecanIngressEvent(args: {
    body: Body;
    date: Moment;
    longitude: number;
  }): Event {
    const event = this.buildDecanIngressEventObject(args);
    this.logger.log(`${event.summary} at ${args.date.toISOString()}`);
    return event;
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
    body: Body;
    date: Moment;
    longitude: number;
  }): Event {
    const { body, date, longitude } = args;
    const sign = IngressesService.getSign(longitude);
    const bodyCapitalized = capitalize(body);
    const signCapitalized = capitalize(sign);
    const bodySymbol = symbolByBody[body];
    const signSymbol = symbolBySign[sign];

    const description = `${bodyCapitalized} peak ingress ${signCapitalized}`;
    const summary = `${bodySymbol} → ${signSymbol}⛰️ ${description}`;

    this.logger.log(`${summary} at ${date.toISOString()}`);

    const peakIngressEvent: Event = {
      categories: [
        ...IngressesService.categories,
        "Peak",
        bodyCapitalized,
        signCapitalized,
      ],
      description,
      end: date,
      start: date,
      summary,
    };

    return peakIngressEvent;
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
    body: Body;
    date: Moment;
    longitude: number;
  }): Event {
    const { body, date, longitude } = args;
    const sign = IngressesService.getSign(longitude);
    const bodyCapitalized = _.startCase(body);
    const signCapitalized = _.startCase(sign);
    const bodySymbol = symbolByBody[body];
    const signSymbol = symbolBySign[sign];

    const description = `${bodyCapitalized} ingress ${signCapitalized}`;
    const summary = `${bodySymbol} → ${signSymbol} ${description}`;

    this.logger.log(`${summary} at ${date.toISOString()}`);

    const signIngressEvent: Event = {
      categories: [
        ...IngressesService.categories,
        bodyCapitalized,
        signCapitalized,
      ],
      description,
      end: date,
      start: date,
      summary,
    };

    return signIngressEvent;
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

    const signIngressEvents = this.filterSignIngressEvents(events);
    const groupedByBody = this.groupSignIngressEventsByBody(signIngressEvents);

    for (const [bodyCapitalized, bodyIngresses] of Object.entries(
      groupedByBody,
    )) {
      if (!bodyCapitalized) {
        continue;
      }

      progressiveEvents.push(
        ...this.buildProgressiveSpansForBody(bodyCapitalized, bodyIngresses),
      );
    }

    return progressiveEvents;
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

      const { currentLongitude, previousLongitude } = this.getLongitudes({
        coordinateEphemeris,
        minute,
        previousMinute,
      });

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

      const { currentLongitude, previousLongitude } = this.getLongitudes({
        coordinateEphemeris,
        minute,
        previousMinute,
      });

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

      const { currentLongitude, previousLongitude } = this.getLongitudes({
        coordinateEphemeris,
        minute,
        previousMinute,
      });

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
}
