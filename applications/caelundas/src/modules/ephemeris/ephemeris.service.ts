import {
  azimuthElevationBodies,
  bodies,
  diameterBodies,
  distanceBodies,
  illuminationBodies,
  nodes,
} from "@caelundas/src/modules/caelundas/caelundas.constants";
import { typedFromEntries } from "@caelundas/src/modules/caelundas/caelundas.types";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { Injectable } from "@nestjs/common";
import moment, { type Moment } from "moment-timezone";
import { azalt, calc, constants, nod_aps_ut, pheno_ut, utc_to_jd } from "sweph";

import {
  ECLIPTIC_TO_HORIZONTAL_FLAG,
  GREGORIAN_CALENDAR_FLAG,
  initializeSwissEphemeris,
  OSCULATING_ORBITAL_ELEMENTS_FLAG,
  SWISS_EPHEMERIS_FLAGS,
  swissEphemerisConstantByAsteroid,
  swissEphemerisConstantByNode,
  swissEphemerisConstantByPlanet,
} from "./ephemeris.constants";

import type {
  AzimuthElevationEphemeris,
  AzimuthElevationEphemerisBody,
  CoordinateEphemeris,
  Coordinates,
  DiameterEphemeris,
  DiameterEphemerisBody,
  DistanceEphemeris,
  DistanceEphemerisBody,
  IlluminationEphemeris,
  IlluminationEphemerisBody,
} from "./ephemeris.types";
import type {
  Body,
  Node,
} from "@caelundas/src/modules/caelundas/caelundas.types";

// Initialize Swiss Ephemeris on module load (idempotent — safe to call multiple times)
initializeSwissEphemeris();

interface EphemerisAccumulators {
  azimuthElevationEphemeris: AzimuthElevationEphemeris;
  coordinateEphemeris: CoordinateEphemeris;
  diameterEphemeris: DiameterEphemeris;
  distanceEphemeris: DistanceEphemeris;
  illuminationEphemeris: IlluminationEphemeris;
}

interface EphemerisEntries {
  azimuthEntries: [Body, AzimuthElevationEphemeris][];
  coordinateEntries: [Body, CoordinateEphemeris][];
  diameterEntries: [Body, DiameterEphemeris][];
  distanceEntries: [Body, DistanceEphemeris][];
  illuminationEntries: [Body, IlluminationEphemeris][];
}

interface EphemerisFeatureSets {
  azimuthElevationSet: Set<string>;
  diameterSet: Set<string>;
  distanceSet: Set<string>;
  illuminationSet: Set<string>;
}

/**
 * Swiss Ephemeris computation service for caelundas.
 *
 * @see {@link ./ephemeris.integration#} for initialization and SE body constants
 * @see {@link ./ephemeris.types#} for data structures
 */
@Injectable()
export class EphemerisService {
  // 🏗 Dependency Injection

  constructor(private readonly mathService: MathService) {}

  // 🔐 Private Fields

  private readonly nodeSet: ReadonlySet<string> = new Set<string>(nodes);

  // 🔑 Public Fields

  // 🔏 Private Methods

  private accumulateBodyEphemeris(args: {
    allEntries: EphemerisEntries;
    body: Body;
    end: Moment;
    featureSets: EphemerisFeatureSets;
    observerLatitude: number;
    observerLongitude: number;
    start: Moment;
  }): void {
    const { allEntries, body, end, featureSets, observerLatitude, observerLongitude, start } = args;
    if (this.isNode(body)) {
      allEntries.coordinateEntries.push([body, this.computeNodeBodyMinutes({ body, end, start })]);
      return;
    }
    const needsAzimuth = featureSets.azimuthElevationSet.has(body);
    const needsIllumination = featureSets.illuminationSet.has(body);
    const needsDiameter = featureSets.diameterSet.has(body);
    const needsDistance = featureSets.distanceSet.has(body);
    const swissEphemerisConstant = this.getSwissEphemerisConstantForBody(body);
    const result = this.computeNonNodeBodyMinutes({ body, end, needsAzimuth, needsDiameter, needsDistance, needsIllumination, observerLatitude, observerLongitude, start, swissEphemerisConstant });
    allEntries.coordinateEntries.push([body, result.coordinateEphemeris]);
    if (needsAzimuth) allEntries.azimuthEntries.push([body, result.azimuthElevationEphemeris]);
    if (needsIllumination) allEntries.illuminationEntries.push([body, result.illuminationEphemeris]);
    if (needsDiameter) allEntries.diameterEntries.push([body, result.diameterEphemeris]);
    if (needsDistance) allEntries.distanceEntries.push([body, result.distanceEphemeris]);
  }

  private buildEphemerisEntries(): EphemerisEntries {
    return {
      azimuthEntries: [],
      coordinateEntries: [],
      diameterEntries: [],
      distanceEntries: [],
      illuminationEntries: [],
    };
  }

  private buildEphemerisFeatureSets(
    azimuthElevationBodies: AzimuthElevationEphemerisBody[],
    diameterBodies: DiameterEphemerisBody[],
    distanceBodies: DistanceEphemerisBody[],
    illuminationBodies: IlluminationEphemerisBody[],
  ): EphemerisFeatureSets {
    return {
      azimuthElevationSet: new Set<string>(azimuthElevationBodies),
      diameterSet: new Set<string>(diameterBodies),
      distanceSet: new Set<string>(distanceBodies),
      illuminationSet: new Set<string>(illuminationBodies),
    };
  }

  private computeAzimuthElevationForBody(args: {
    body: AzimuthElevationEphemerisBody;
    end: Moment;
    observerLatitude: number;
    observerLongitude: number;
    start: Moment;
  }): AzimuthElevationEphemeris {
    const { body, end, observerLatitude, observerLongitude, start } = args;
    const ephemeris: AzimuthElevationEphemeris = {};
    for (const date of this.generateMinutes(start, end)) {
      const { julianDayEphemerisTime, julianDayUniversalTime } =
        this.dateToJulianDays(date);
      const { distance, latitude, longitude } = this.computeBodyCoordinates(
        body,
        julianDayEphemerisTime,
      );
      ephemeris[date.toISOString()] = this.computeAzimuthElevationForMinute({
        body,
        distance,
        julianDayUniversalTime,
        latitude,
        longitude,
        observerLatitude,
        observerLongitude,
      });
    }
    return ephemeris;
  }

  private computeAzimuthElevationForMinute(args: {
    body: Exclude<Body, Node>;
    distance: number;
    julianDayUniversalTime: number;
    latitude: number;
    longitude: number;
    observerLatitude: number;
    observerLongitude: number;
  }): { azimuth: number; elevation: number } {
    const {
      distance,
      julianDayUniversalTime,
      latitude,
      longitude,
      observerLatitude,
      observerLongitude,
    } = args;
    const azaltResult = azalt(
      julianDayUniversalTime,
      ECLIPTIC_TO_HORIZONTAL_FLAG,
      [observerLongitude, observerLatitude, 0],
      0,
      0,
      [longitude, latitude, distance],
    );
    return { azimuth: azaltResult[0], elevation: azaltResult[2] };
  }

  private computeBodyCoordinate(
    body: Exclude<Body, Node>,
    julianDayEphemerisTime: number,
  ): { latitude: number; longitude: number } {
    const coords = this.computeBodyCoordinates(body, julianDayEphemerisTime);
    return { latitude: coords.latitude, longitude: coords.longitude };
  }

  private computeBodyCoordinates(
    body: Exclude<Body, Node>,
    julianDayEphemerisTime: number,
  ): { distance: number; latitude: number; longitude: number } {
    const swissEphemerisConstant = this.getSwissEphemerisConstantForBody(body);
    const result = calc(
      julianDayEphemerisTime,
      swissEphemerisConstant,
      SWISS_EPHEMERIS_FLAGS,
    );
    if (result.flag < 0) {
      throw new Error(`calc failed for ${body}: ${result.error}`);
    }
    return {
      distance: result.data[2],
      latitude: result.data[1],
      longitude: result.data[0],
    };
  }

  /**
   * Computes minute-by-minute illumination fraction for the requested bodies.
   *
   * @param args - Query parameters including bodies, date range, and observer coordinates
   * @returns Illumination ephemeris keyed by ISO timestamp for each body
   *
   * @remarks
   * Illumination is returned as a percentage (0-100). The Sun is always 100.
   * Uses pheno_ut() which returns a fraction (0-1); multiplied by 100 for storage.
   */
  private computeIlluminationForBody(args: {
    body: IlluminationEphemerisBody;
    end: Moment;
    start: Moment;
  }): IlluminationEphemeris {
    const { body, end, start } = args;
    const ephemeris: IlluminationEphemeris = {};
    const swissEphemerisConstant = this.getSwissEphemerisConstantForBody(body);
    for (const date of this.generateMinutes(start, end)) {
      const { julianDayUniversalTime } = this.dateToJulianDays(date);
      const timestamp = date.toISOString();
      if (body === "sun") {
        ephemeris[timestamp] = { illumination: 100 };
        continue;
      }
      const result = pheno_ut(
        julianDayUniversalTime,
        swissEphemerisConstant,
        SWISS_EPHEMERIS_FLAGS,
      );
      if (result.flag < 0) {
        throw new Error(`pheno_ut failed for ${body}: ${result.error}`);
      }
      ephemeris[timestamp] = { illumination: result.data[1] * 100 };
    }
    return ephemeris;
  }

  private computeLunarPerigeeCoordinate(julianDayUniversalTime: number): {
    latitude: number;
    longitude: number;
  } {
    const result = nod_aps_ut(
      julianDayUniversalTime,
      constants.SE_MOON,
      SWISS_EPHEMERIS_FLAGS,
      OSCULATING_ORBITAL_ELEMENTS_FLAG,
    );
    if (result.flag < 0) {
      throw new Error(`nod_aps_ut failed for lunar perigee: ${result.error}`);
    }
    return {
      latitude: 0,
      longitude: this.mathService.normalizeDegrees(result.data.perihelion[0]),
    };
  }

  private computeNodeBodyMinutes(args: {
    body: Node;
    end: Moment;
    start: Moment;
  }): CoordinateEphemeris {
    const { body, end, start } = args;
    const coordinateEphemeris: CoordinateEphemeris = {};
    for (const date of this.generateMinutes(start, end)) {
      const { julianDayEphemerisTime, julianDayUniversalTime } =
        this.dateToJulianDays(date);
      const coord = this.computeNodeCoordinate(
        body,
        julianDayEphemerisTime,
        julianDayUniversalTime,
      );
      coordinateEphemeris[date.toISOString()] = coord;
    }
    return coordinateEphemeris;
  }

  private computeNodeCoordinate(
    node: Node,
    julianDayEphemerisTime: number,
    julianDayUniversalTime: number,
  ): { latitude: number; longitude: number } {
    if (node === "lunar perigee") {
      return this.computeLunarPerigeeCoordinate(julianDayUniversalTime);
    }
    return this.computeRegularNodeCoordinate(node, julianDayEphemerisTime);
  }

  private computeNonNodeBodyMinutes(args: {
    body: Exclude<Body, Node>;
    end: Moment;
    needsAzimuth: boolean;
    needsDiameter: boolean;
    needsDistance: boolean;
    needsIllumination: boolean;
    observerLatitude: number;
    observerLongitude: number;
    start: Moment;
    swissEphemerisConstant: number;
  }): EphemerisAccumulators {
    const { body, end, needsAzimuth, needsDiameter, needsDistance, needsIllumination, observerLatitude, observerLongitude, start, swissEphemerisConstant } = args;
    const accumulators: EphemerisAccumulators = {
      azimuthElevationEphemeris: {},
      coordinateEphemeris: {},
      diameterEphemeris: {},
      distanceEphemeris: {},
      illuminationEphemeris: {},
    };
    for (const date of this.generateMinutes(start, end)) {
      this.processNonNodeBodyMinute({
        accumulators, body, date, needsAzimuth, needsDiameter,
        needsDistance, needsIllumination, observerLatitude, observerLongitude, swissEphemerisConstant,
      });
    }
    return accumulators;
  }

  private computePhenoForBodyMinute(args: {
    body: Exclude<Body, Node>;
    diameterEphemeris: DiameterEphemeris;
    illuminationEphemeris: IlluminationEphemeris;
    julianDayUniversalTime: number;
    needsDiameter: boolean;
    needsIllumination: boolean;
    swissEphemerisConstant: number;
    timestamp: string;
  }): void {
    const { body, diameterEphemeris, illuminationEphemeris, julianDayUniversalTime, needsDiameter, needsIllumination, swissEphemerisConstant, timestamp } = args;
    const result = pheno_ut(julianDayUniversalTime, swissEphemerisConstant, SWISS_EPHEMERIS_FLAGS);
    if (result.flag < 0) {
      throw new Error(`pheno_ut failed for ${body}: ${result.error}`);
    }
    if (needsIllumination) illuminationEphemeris[timestamp] = { illumination: result.data[1] * 100 };
    if (needsDiameter) diameterEphemeris[timestamp] = { diameter: result.data[3] };
  }

  private computePhenoForMinute(args: {
    body: Exclude<Body, Node>;
    diameterEphemeris: DiameterEphemeris;
    illuminationEphemeris: IlluminationEphemeris;
    julianDayUniversalTime: number;
    needsDiameter: boolean;
    needsIllumination: boolean;
    swissEphemerisConstant: number;
    timestamp: string;
  }): void {
    if (args.body === "sun") {
      this.computePhenoForSunMinute(args);
    } else {
      this.computePhenoForBodyMinute(args);
    }
  }

  private computePhenoForSunMinute(args: {
    body: Exclude<Body, Node>;
    diameterEphemeris: DiameterEphemeris;
    illuminationEphemeris: IlluminationEphemeris;
    julianDayUniversalTime: number;
    needsDiameter: boolean;
    needsIllumination: boolean;
    swissEphemerisConstant: number;
    timestamp: string;
  }): void {
    const { body, diameterEphemeris, illuminationEphemeris, julianDayUniversalTime, needsDiameter, needsIllumination, swissEphemerisConstant, timestamp } = args;
    if (needsIllumination) illuminationEphemeris[timestamp] = { illumination: 100 };
    if (needsDiameter) {
      const result = pheno_ut(julianDayUniversalTime, swissEphemerisConstant, SWISS_EPHEMERIS_FLAGS);
      if (result.flag < 0) throw new Error(`pheno_ut failed for ${body}: ${result.error}`);
      diameterEphemeris[timestamp] = { diameter: result.data[3] };
    }
  }

  private computeRegularNodeCoordinate(
    node: Node,
    julianDayEphemerisTime: number,
  ): { latitude: number; longitude: number } {
    const swissEphemerisConstant = swissEphemerisConstantByNode[node];
    if (swissEphemerisConstant === null) {
      throw new Error(
        `No Swiss Ephemeris constant configured for node: ${node}`,
      );
    }
    const result = calc(
      julianDayEphemerisTime,
      swissEphemerisConstant,
      SWISS_EPHEMERIS_FLAGS,
    );
    if (result.flag < 0) {
      throw new Error(`calc failed for ${node}: ${result.error}`);
    }
    const longitude =
      node === "south lunar node"
        ? this.mathService.normalizeDegrees(result.data[0] + 180)
        : this.mathService.normalizeDegrees(result.data[0]);
    return { latitude: 0, longitude };
  }

  private dateToJulianDays(date: Moment): {
    julianDayEphemerisTime: number;
    julianDayUniversalTime: number;
  } {
    const result = utc_to_jd(
      date.utc().year(),
      date.utc().month() + 1,
      date.utc().date(),
      date.utc().hours(),
      date.utc().minutes(),
      date.utc().seconds(),
      GREGORIAN_CALENDAR_FLAG,
    );
    if (result.flag < 0) {
      throw new Error(
        `utc_to_jd failed for ${date.toISOString()}: ${result.error}`,
      );
    }
    return {
      julianDayEphemerisTime: result.data[0],
      julianDayUniversalTime: result.data[1],
    };
  }

  private entriesToEphemerides(allEntries: EphemerisEntries): {
    azimuthElevationEphemerisByBody: Record<Body, AzimuthElevationEphemeris>;
    coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
    diameterEphemerisByBody: Record<Body, DiameterEphemeris>;
    distanceEphemerisByBody: Record<Body, DistanceEphemeris>;
    illuminationEphemerisByBody: Record<Body, IlluminationEphemeris>;
  } {
    return {
      azimuthElevationEphemerisByBody: typedFromEntries(allEntries.azimuthEntries),
      coordinateEphemerisByBody: typedFromEntries(allEntries.coordinateEntries),
      diameterEphemerisByBody: typedFromEntries(allEntries.diameterEntries),
      distanceEphemerisByBody: typedFromEntries(allEntries.distanceEntries),
      illuminationEphemerisByBody: typedFromEntries(allEntries.illuminationEntries),
    };
  }

  private *generateMinutes(start: Moment, end: Moment): Generator<Moment> {
    const endMs = end.valueOf();
    let currentMs = start.valueOf();
    while (currentMs <= endMs) {
      yield moment.utc(currentMs);
      currentMs += 60_000;
    }
  }

  private getSwissEphemerisConstantForBody(body: Exclude<Body, Node>): number {
    const planetConst = (
      swissEphemerisConstantByPlanet as Partial<Record<string, number>>
    )[body];
    if (planetConst !== undefined) {
      return planetConst;
    }
    const asteroidConst = (
      swissEphemerisConstantByAsteroid as Partial<Record<string, number>>
    )[body];
    if (asteroidConst !== undefined) {
      return asteroidConst;
    }
    throw new Error(
      `No Swiss Ephemeris constant for body "${body}". Comets are not supported.`,
    );
  }

  private isNode(body: string): body is Node {
    return this.nodeSet.has(body);
  }

  private processNonNodeBodyMinute(args: {
    accumulators: EphemerisAccumulators;
    body: Exclude<Body, Node>;
    date: Moment;
    needsAzimuth: boolean;
    needsDiameter: boolean;
    needsDistance: boolean;
    needsIllumination: boolean;
    observerLatitude: number;
    observerLongitude: number;
    swissEphemerisConstant: number;
  }): void {
    const { accumulators, body, date, needsAzimuth, needsDiameter, needsDistance, needsIllumination, observerLatitude, observerLongitude, swissEphemerisConstant } = args;
    const { julianDayEphemerisTime, julianDayUniversalTime } = this.dateToJulianDays(date);
    const timestamp = date.toISOString();
    const { distance, latitude, longitude } = this.computeBodyCoordinates(body, julianDayEphemerisTime);
    accumulators.coordinateEphemeris[timestamp] = { latitude, longitude };
    if (needsDistance) accumulators.distanceEphemeris[timestamp] = { distance };
    if (needsAzimuth) {
      accumulators.azimuthElevationEphemeris[timestamp] = this.computeAzimuthElevationForMinute({
        body, distance, julianDayUniversalTime, latitude, longitude, observerLatitude, observerLongitude,
      });
    }
    if (needsIllumination || needsDiameter) {
      this.computePhenoForMinute({
        body, diameterEphemeris: accumulators.diameterEphemeris, illuminationEphemeris: accumulators.illuminationEphemeris,
        julianDayUniversalTime, needsDiameter, needsIllumination, swissEphemerisConstant, timestamp,
      });
    }
  }

  // 🌎 Public Methods

  /**
   * Computes all five ephemeris types for all bodies in a single pass, eliminating
   * redundant calc() calls that would occur when each type is computed independently.
   *
   * Savings vs. calling each get*EphemerisByBody function separately:
   * - Distance: extracted from the coordinate calc() result (data[2]) instead of a
   *   second calc() call — saves ~6,000 calc() calls/day for sun, mercury, venus, mars.
   * - Azimuth/elevation: reuses ecliptic coords from coordinate calc() result instead
   *   of a second calc() call before azalt() — saves ~3,000 calc() calls/day for sun, moon.
   * - Moon illumination + diameter: single pheno_ut() provides both data[1] (illumination
   *   fraction) and data[3] (apparent diameter) — saves ~1,500 pheno_ut() calls/day.
   * - Swiss Ephemeris constant lookup hoisted outside the minute loop per body.
   *
   * @param args - All bodies, date range, and observer coordinates
   * @returns All five ephemeris dictionaries keyed by body
   */
  computeAllEphemerides(args: {
    azimuthElevationBodies: AzimuthElevationEphemerisBody[];
    coordinateBodies: Body[];
    coordinates: Coordinates;
    diameterBodies: DiameterEphemerisBody[];
    distanceBodies: DistanceEphemerisBody[];
    end: Moment;
    illuminationBodies: IlluminationEphemerisBody[];
    start: Moment;
  }): {
    azimuthElevationEphemerisByBody: Record<Body, AzimuthElevationEphemeris>;
    coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
    diameterEphemerisByBody: Record<Body, DiameterEphemeris>;
    distanceEphemerisByBody: Record<Body, DistanceEphemeris>;
    illuminationEphemerisByBody: Record<Body, IlluminationEphemeris>;
  } {
    const { azimuthElevationBodies, coordinateBodies, coordinates, diameterBodies, distanceBodies, end, illuminationBodies, start } = args;
    const [observerLongitude, observerLatitude] = coordinates;
    const featureSets = this.buildEphemerisFeatureSets(azimuthElevationBodies, diameterBodies, distanceBodies, illuminationBodies);
    const allEntries = this.buildEphemerisEntries();
    for (const body of coordinateBodies) {
      this.accumulateBodyEphemeris({ allEntries, body, end, featureSets, observerLatitude, observerLongitude, start });
    }
    return this.entriesToEphemerides(allEntries);
  }

  /**
   * Computes minute-by-minute horizontal coordinates (azimuth, apparent elevation)
   * for the requested bodies at the observer's location.
   *
   * @param args - Query parameters including bodies, date range, and observer coordinates
   * @returns Azimuth/elevation ephemeris keyed by ISO timestamp for each body
   */
  getAzimuthElevationEphemerisByBody(args: {
    bodies: AzimuthElevationEphemerisBody[];
    coordinates: Coordinates;
    end: Moment;
    start: Moment;
    timezone: string;
  }): Record<Body, AzimuthElevationEphemeris> {
    const { bodies, coordinates, end, start } = args;
    const [observerLongitude, observerLatitude] = coordinates;
    const entries: [Body, AzimuthElevationEphemeris][] = [];
    for (const body of bodies) {
      entries.push([
        body,
        this.computeAzimuthElevationForBody({
          body,
          end,
          observerLatitude,
          observerLongitude,
          start,
        }),
      ]);
    }
    return typedFromEntries(entries);
  }

  /**
   * Safely extracts azimuth or elevation data from horizon coordinate ephemeris.
   *
   * @param ephemeris - Azimuth/elevation ephemeris indexed by ISO timestamp
   * @param timestamp - ISO 8601 timestamp string
   * @param fieldName - Field to extract ("azimuth" or "elevation")
   * @returns Coordinate value in degrees
   * @throws When timestamp or field is missing from ephemeris
   */
  getAzimuthElevationFromEphemeris(
    ephemeris: AzimuthElevationEphemeris,
    timestamp: string,
    fieldName: "azimuth" | "elevation",
  ): number {
    const data = ephemeris[timestamp];
    if (data?.[fieldName] === undefined) {
      throw new Error(`Missing ${fieldName} at ${timestamp}`);
    }
    return data[fieldName];
  }

  /**
   * Computes minute-by-minute ecliptic coordinates for all requested bodies.
   *
   * @param args - Query parameters including bodies and date range
   * @returns Coordinate ephemeris keyed by ISO timestamp for each body
   */
  getCoordinateEphemerisByBody(args: {
    bodies: Body[];
    end: Moment;
    start: Moment;
    timezone: string;
  }): Record<Body, CoordinateEphemeris> {
    const { bodies, end, start } = args;

    const entries: [Body, CoordinateEphemeris][] = [];

    for (const body of bodies) {
      const ephemeris: CoordinateEphemeris = {};

      for (const date of this.generateMinutes(start, end)) {
        const { julianDayEphemerisTime, julianDayUniversalTime } =
          this.dateToJulianDays(date);
        const timestamp = date.toISOString();
        const coord = this.isNode(body)
          ? this.computeNodeCoordinate(
              body,
              julianDayEphemerisTime,
              julianDayUniversalTime,
            )
          : this.computeBodyCoordinate(body, julianDayEphemerisTime);
        ephemeris[timestamp] = coord;
      }

      entries.push([body, ephemeris]);
    }

    return typedFromEntries(entries);
  }

  /**
   * Safely extracts coordinate data (longitude or latitude) from ephemeris at a timestamp.
   *
   * @param ephemeris - Coordinate ephemeris object indexed by ISO timestamp
   * @param timestamp - ISO 8601 timestamp string
   * @param fieldName - Field to extract ("longitude" or "latitude")
   * @returns Coordinate value in degrees
   * @throws When timestamp or field is missing from ephemeris
   */
  getCoordinateFromEphemeris(
    ephemeris: CoordinateEphemeris,
    timestamp: string,
    fieldName: "latitude" | "longitude",
  ): number {
    const data = ephemeris[timestamp];
    if (data?.[fieldName] === undefined) {
      throw new Error(`Missing ${fieldName} at ${timestamp}`);
    }
    return data[fieldName];
  }

  /**
   * Computes minute-by-minute apparent angular diameter for the requested bodies.
   *
   * @param args - Query parameters including bodies and date range
   * @returns Diameter ephemeris keyed by ISO timestamp for each body
   *
   * @remarks
   * pheno_ut() returns apparent diameter in degrees.
   */
  getDiameterEphemerisByBody(args: {
    bodies: DiameterEphemerisBody[];
    end: Moment;
    start: Moment;
    timezone: string;
  }): Record<Body, DiameterEphemeris> {
    const { bodies, end, start } = args;

    const entries: [Body, DiameterEphemeris][] = [];

    for (const body of bodies) {
      const ephemeris: DiameterEphemeris = {};
      const swissEphemerisConstant =
        this.getSwissEphemerisConstantForBody(body);

      for (const date of this.generateMinutes(start, end)) {
        const { julianDayUniversalTime } = this.dateToJulianDays(date);
        const timestamp = date.toISOString();

        const result = pheno_ut(
          julianDayUniversalTime,
          swissEphemerisConstant,
          SWISS_EPHEMERIS_FLAGS,
        );
        if (result.flag < 0) {
          throw new Error(`pheno_ut failed for ${body}: ${result.error}`);
        }

        // data[3] = apparent diameter of disc in degrees
        ephemeris[timestamp] = { diameter: result.data[3] };
      }

      entries.push([body, ephemeris]);
    }

    return typedFromEntries(entries);
  }

  /**
   * Safely extracts angular diameter from ephemeris.
   *
   * @param ephemeris - Diameter ephemeris indexed by ISO timestamp
   * @param timestamp - ISO 8601 timestamp string
   * @param fieldName - Field description (kept for API consistency)
   * @returns Angular diameter in degrees
   * @throws When timestamp or field is missing from ephemeris
   */
  getDiameterFromEphemeris(
    ephemeris: DiameterEphemeris,
    timestamp: string,
    fieldName: string,
  ): number {
    const data = ephemeris[timestamp];
    if (data?.diameter === undefined) {
      throw new Error(`Missing ${fieldName} at ${timestamp}`);
    }
    return data.diameter;
  }

  /**
   * Computes minute-by-minute geocentric distance for the requested bodies.
   *
   * @param args - Query parameters including bodies and date range
   * @returns Distance ephemeris keyed by ISO timestamp for each body
   */
  getDistanceEphemerisByBody(args: {
    bodies: DistanceEphemerisBody[];
    end: Moment;
    start: Moment;
    timezone: string;
  }): Record<Body, DistanceEphemeris> {
    const { bodies, end, start } = args;

    const entries: [Body, DistanceEphemeris][] = [];

    for (const body of bodies) {
      const ephemeris: DistanceEphemeris = {};
      const swissEphemerisConstant =
        this.getSwissEphemerisConstantForBody(body);

      for (const date of this.generateMinutes(start, end)) {
        const { julianDayEphemerisTime } = this.dateToJulianDays(date);
        const timestamp = date.toISOString();

        const result = calc(
          julianDayEphemerisTime,
          swissEphemerisConstant,
          SWISS_EPHEMERIS_FLAGS,
        );
        if (result.flag < 0) {
          throw new Error(`calc failed for ${body}: ${result.error}`);
        }

        // data[2] = distance in astronomical units
        ephemeris[timestamp] = { distance: result.data[2] };
      }

      entries.push([body, ephemeris]);
    }

    return typedFromEntries(entries);
  }

  /**
   * Safely extracts distance from Earth from ephemeris.
   *
   * @param ephemeris - Distance ephemeris indexed by ISO timestamp
   * @param timestamp - ISO 8601 timestamp string
   * @param fieldName - Field description (kept for API consistency)
   * @returns Distance in astronomical units
   * @throws When timestamp or field is missing from ephemeris
   */
  getDistanceFromEphemeris(
    ephemeris: DistanceEphemeris,
    timestamp: string,
    fieldName: string,
  ): number {
    const data = ephemeris[timestamp];
    if (data?.distance === undefined) {
      throw new Error(`Missing ${fieldName} at ${timestamp}`);
    }
    return data.distance;
  }

  /**
   * Aggregates all ephemeris data types for all relevant bodies across a date range.
   *
   * @param args - Observer location, date range, and timezone
   * @returns All five ephemeris dictionaries keyed by body
   */
  getEphemerides(args: {
    coordinates: Coordinates;
    end: Moment;
    start: Moment;
    timezone: string;
  }): {
    azimuthElevationEphemerisByBody: Record<Body, AzimuthElevationEphemeris>;
    coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
    diameterEphemerisByBody: Record<Body, DiameterEphemeris>;
    distanceEphemerisByBody: Record<Body, DistanceEphemeris>;
    illuminationEphemerisByBody: Record<Body, IlluminationEphemeris>;
  } {
    const { coordinates, end, start } = args;

    return this.computeAllEphemerides({
      azimuthElevationBodies,
      coordinateBodies: bodies,
      coordinates,
      diameterBodies,
      distanceBodies,
      end,
      illuminationBodies,
      start,
    });
  }

  /**
   *
   */
  getIlluminationEphemerisByBody(args: {
    bodies: IlluminationEphemerisBody[];
    coordinates: Coordinates;
    end: Moment;
    start: Moment;
    timezone: string;
  }): Record<Body, IlluminationEphemeris> {
    const { bodies, end, start } = args;
    const entries: [Body, IlluminationEphemeris][] = [];
    for (const body of bodies) {
      entries.push([
        body,
        this.computeIlluminationForBody({ body, end, start }),
      ]);
    }
    return typedFromEntries(entries);
  }

  /**
   * Safely extracts illumination fraction from ephemeris.
   *
   * @param ephemeris - Illumination ephemeris indexed by ISO timestamp
   * @param timestamp - ISO 8601 timestamp string
   * @param fieldName - Field description (kept for API consistency)
   * @returns Illumination percentage (0-100)
   * @throws When timestamp or field is missing from ephemeris
   */
  getIlluminationFromEphemeris(
    ephemeris: IlluminationEphemeris,
    timestamp: string,
    fieldName: string,
  ): number {
    const data = ephemeris[timestamp];
    if (data?.illumination === undefined) {
      throw new Error(`Missing ${fieldName} at ${timestamp}`);
    }
    return data.illumination;
  }

  /**
   * Extracts the ecliptic longitude for a body at the previous, current, and next minute.
   *
   * Convenience wrapper around {@link getCoordinateFromEphemeris} that fetches all three
   * minute-window positions in a single call, reducing the six individual calls required
   * by aspect phase detection into two.
   *
   * @param ephemeris - Coordinate ephemeris for one body, indexed by ISO timestamp
   * @param previous - One minute before the target
   * @param minute - Target minute
   * @param next - One minute after the target
   * @returns Object containing `previous`, `current`, and `next` longitude values in degrees
   * @throws When any of the three timestamps are missing from the ephemeris
   */
  getLongitudesWindow(
    ephemeris: CoordinateEphemeris,
    previous: Moment,
    minute: Moment,
    next: Moment,
  ): { current: number; next: number; previous: number } {
    return {
      current: this.getCoordinateFromEphemeris(
        ephemeris,
        minute.toISOString(),
        "longitude",
      ),
      next: this.getCoordinateFromEphemeris(
        ephemeris,
        next.toISOString(),
        "longitude",
      ),
      previous: this.getCoordinateFromEphemeris(
        ephemeris,
        previous.toISOString(),
        "longitude",
      ),
    };
  }
}
