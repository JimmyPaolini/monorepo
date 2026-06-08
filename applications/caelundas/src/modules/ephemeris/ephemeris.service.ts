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

// #region Utilities

// #region Coordinate Computation

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

  // 🌎 Public Methods

  private isNode(body: string): body is Node {
    return this.nodeSet.has(body);
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

  private computeNodeCoordinate(
    node: Node,
    julianDayEphemerisTime: number,
    julianDayUniversalTime: number,
  ): { longitude: number; latitude: number } {
    if (node === "lunar perigee") {
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
        longitude: this.mathService.normalizeDegrees(result.data.perihelion[0]),
        latitude: 0,
      };
    }

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

    return { longitude, latitude: 0 };
  }

  private computeBodyCoordinate(
    body: Exclude<Body, Node>,
    julianDayEphemerisTime: number,
  ): { longitude: number; latitude: number } {
    const swissEphemerisConstant = this.getSwissEphemerisConstantForBody(body);
    const result = calc(
      julianDayEphemerisTime,
      swissEphemerisConstant,
      SWISS_EPHEMERIS_FLAGS,
    );
    if (result.flag < 0) {
      throw new Error(`calc failed for ${body}: ${result.error}`);
    }
    return { longitude: result.data[0], latitude: result.data[1] };
  }

  // 🌎 Public Methods

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
    fieldName: "longitude" | "latitude",
  ): number {
    const data = ephemeris[timestamp];
    if (data?.[fieldName] === undefined) {
      throw new Error(`Missing ${fieldName} at ${timestamp}`);
    }
    return data[fieldName];
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
  ): { previous: number; current: number; next: number } {
    return {
      previous: this.getCoordinateFromEphemeris(
        ephemeris,
        previous.toISOString(),
        "longitude",
      ),
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
    };
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
    const { bodies, start, end } = args;

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
    const { bodies, coordinates, start, end } = args;
    const [observerLongitude, observerLatitude] = coordinates;

    const entries: [Body, AzimuthElevationEphemeris][] = [];

    for (const body of bodies) {
      const ephemeris: AzimuthElevationEphemeris = {};
      const swissEphemerisConstant =
        this.getSwissEphemerisConstantForBody(body);

      for (const date of this.generateMinutes(start, end)) {
        const { julianDayEphemerisTime, julianDayUniversalTime } =
          this.dateToJulianDays(date);
        const timestamp = date.toISOString();

        // Compute geocentric ecliptic coordinates for the body
        const coordResult = calc(
          julianDayEphemerisTime,
          swissEphemerisConstant,
          SWISS_EPHEMERIS_FLAGS,
        );
        if (coordResult.flag < 0) {
          throw new Error(`calc failed for ${body}: ${coordResult.error}`);
        }
        const [longitude, latitude, distance] = coordResult.data;

        // Convert ecliptic coordinates to horizontal (azimuth + altitude)
        // geopos: [observerLongitude, observerLatitude, elevation_m]; atpress/attemp: 0 = standard atmosphere
        const azaltResult = azalt(
          julianDayUniversalTime,
          ECLIPTIC_TO_HORIZONTAL_FLAG,
          [observerLongitude, observerLatitude, 0],
          0,
          0,
          [longitude, latitude, distance],
        );

        // azaltResult: [azimuth, true altitude, apparent altitude (refracted)]
        ephemeris[timestamp] = {
          azimuth: azaltResult[0],
          elevation: azaltResult[2], // apparent altitude accounts for atmospheric refraction
        };
      }

      entries.push([body, ephemeris]);
    }

    return typedFromEntries(entries);
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
  getIlluminationEphemerisByBody(args: {
    bodies: IlluminationEphemerisBody[];
    coordinates: Coordinates;
    end: Moment;
    start: Moment;
    timezone: string;
  }): Record<Body, IlluminationEphemeris> {
    const { bodies, start, end } = args;

    const entries: [Body, IlluminationEphemeris][] = [];

    for (const body of bodies) {
      const ephemeris: IlluminationEphemeris = {};
      const swissEphemerisConstant =
        this.getSwissEphemerisConstantForBody(body);

      for (const date of this.generateMinutes(start, end)) {
        const { julianDayUniversalTime } = this.dateToJulianDays(date);
        const timestamp = date.toISOString();

        if (body === "sun") {
          // Sun has no phase from Earth's perspective
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

        // data[1] = phase (illuminated fraction 0-1); convert to 0-100 percentage scale
        ephemeris[timestamp] = { illumination: result.data[1] * 100 };
      }

      entries.push([body, ephemeris]);
    }

    return typedFromEntries(entries);
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
    const { bodies, start, end } = args;

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
    const { bodies, start, end } = args;

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
    coordinateBodies: Body[];
    azimuthElevationBodies: AzimuthElevationEphemerisBody[];
    illuminationBodies: IlluminationEphemerisBody[];
    diameterBodies: DiameterEphemerisBody[];
    distanceBodies: DistanceEphemerisBody[];
    coordinates: Coordinates;
    end: Moment;
    start: Moment;
  }): {
    coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
    azimuthElevationEphemerisByBody: Record<Body, AzimuthElevationEphemeris>;
    illuminationEphemerisByBody: Record<Body, IlluminationEphemeris>;
    diameterEphemerisByBody: Record<Body, DiameterEphemeris>;
    distanceEphemerisByBody: Record<Body, DistanceEphemeris>;
  } {
    const {
      coordinateBodies,
      azimuthElevationBodies,
      illuminationBodies,
      diameterBodies,
      distanceBodies,
      coordinates,
      start,
      end,
    } = args;

    const [observerLongitude, observerLatitude] = coordinates;

    const azimuthElevationSet = new Set<string>(azimuthElevationBodies);
    const illuminationSet = new Set<string>(illuminationBodies);
    const diameterSet = new Set<string>(diameterBodies);
    const distanceSet = new Set<string>(distanceBodies);

    const coordinateEntries: [Body, CoordinateEphemeris][] = [];
    const azimuthEntries: [Body, AzimuthElevationEphemeris][] = [];
    const illuminationEntries: [Body, IlluminationEphemeris][] = [];
    const diameterEntries: [Body, DiameterEphemeris][] = [];
    const distanceEntries: [Body, DistanceEphemeris][] = [];

    for (const body of coordinateBodies) {
      const needsAzimuth = azimuthElevationSet.has(body);
      const needsIllumination = illuminationSet.has(body);
      const needsDiameter = diameterSet.has(body);
      const needsDistance = distanceSet.has(body);

      const coordinateEphemeris: CoordinateEphemeris = {};
      const azimuthElevationEphemeris: AzimuthElevationEphemeris = {};
      const illuminationEphemeris: IlluminationEphemeris = {};
      const diameterEphemeris: DiameterEphemeris = {};
      const distanceEphemeris: DistanceEphemeris = {};

      if (this.isNode(body)) {
        // Nodes only contribute coordinate data — no SE constant needed
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
        coordinateEntries.push([body, coordinateEphemeris]);
        continue;
      }

      // Non-node: SE constant is guaranteed non-null — hoist outside the minute loop
      const swissEphemerisConstant =
        this.getSwissEphemerisConstantForBody(body);

      for (const date of this.generateMinutes(start, end)) {
        const { julianDayEphemerisTime, julianDayUniversalTime } =
          this.dateToJulianDays(date);
        const timestamp = date.toISOString();

        // Single calc() per body per minute — result provides longitude, latitude, AND distance
        const result = calc(
          julianDayEphemerisTime,
          swissEphemerisConstant,
          SWISS_EPHEMERIS_FLAGS,
        );
        if (result.flag < 0) {
          throw new Error(`calc failed for ${body}: ${result.error}`);
        }
        const longitude = result.data[0];
        const latitude = result.data[1];
        const distance = result.data[2];

        coordinateEphemeris[timestamp] = { longitude, latitude };

        // Reuse calc() distance — no second calc() call needed
        if (needsDistance) {
          distanceEphemeris[timestamp] = { distance };
        }

        // Reuse calc() ecliptic coords for azalt() — no second calc() call needed
        if (needsAzimuth) {
          const azaltResult = azalt(
            julianDayUniversalTime,
            ECLIPTIC_TO_HORIZONTAL_FLAG,
            [observerLongitude, observerLatitude, 0],
            0,
            0,
            [longitude, latitude, distance],
          );
          azimuthElevationEphemeris[timestamp] = {
            azimuth: azaltResult[0],
            elevation: azaltResult[2],
          };
        }

        // Single pheno_ut() provides both illumination (data[1]) and diameter (data[3])
        if (needsIllumination || needsDiameter) {
          if (body === "sun") {
            // Sun illumination is constant; diameter still requires pheno_ut()
            if (needsIllumination) {
              illuminationEphemeris[timestamp] = { illumination: 100 };
            }
            if (needsDiameter) {
              const result = pheno_ut(
                julianDayUniversalTime,
                swissEphemerisConstant,
                SWISS_EPHEMERIS_FLAGS,
              );
              if (result.flag < 0) {
                throw new Error(`pheno_ut failed for ${body}: ${result.error}`);
              }
              diameterEphemeris[timestamp] = { diameter: result.data[3] };
            }
          } else {
            // Single pheno_ut() call — reused for both illumination and diameter if needed
            const result = pheno_ut(
              julianDayUniversalTime,
              swissEphemerisConstant,
              SWISS_EPHEMERIS_FLAGS,
            );
            if (result.flag < 0) {
              throw new Error(`pheno_ut failed for ${body}: ${result.error}`);
            }
            if (needsIllumination) {
              illuminationEphemeris[timestamp] = {
                illumination: result.data[1] * 100,
              };
            }
            if (needsDiameter) {
              diameterEphemeris[timestamp] = { diameter: result.data[3] };
            }
          }
        }
      }

      coordinateEntries.push([body, coordinateEphemeris]);
      if (needsAzimuth) azimuthEntries.push([body, azimuthElevationEphemeris]);
      if (needsIllumination)
        illuminationEntries.push([body, illuminationEphemeris]);
      if (needsDiameter) diameterEntries.push([body, diameterEphemeris]);
      if (needsDistance) distanceEntries.push([body, distanceEphemeris]);
    }

    return {
      coordinateEphemerisByBody: typedFromEntries(coordinateEntries),
      azimuthElevationEphemerisByBody: typedFromEntries(azimuthEntries),
      illuminationEphemerisByBody: typedFromEntries(illuminationEntries),
      diameterEphemerisByBody: typedFromEntries(diameterEntries),
      distanceEphemerisByBody: typedFromEntries(distanceEntries),
    };
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
      coordinateBodies: bodies,
      azimuthElevationBodies,
      illuminationBodies,
      diameterBodies,
      distanceBodies,
      coordinates,
      start,
      end,
    });
  }
}
