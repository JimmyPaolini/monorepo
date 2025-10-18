import moment from "npm:moment-timezone";
import _ from "npm:lodash";
import type {
  Coordinates,
  DiameterEphemeris,
  DistanceEphemeris,
  CoordinateEphemeris,
  IlluminationEphemeris,
  Latitude,
  Longitude,
  OrbitEphemeris,
  AzimuthElevationEphemeris,
} from "./ephemeris.types.ts";
import { dateRegex, decimalRegex, horizonsUrl } from "./ephemeris.constants.ts";
import { arcsecondsPerDegree } from "../math.utilities.ts";

// #region getHorizonsBaseUrl
export function getHorizonsBaseUrl(args: {
  start: Date;
  end: Date;
  coordinates?: Coordinates;
}) {
  const { start, end, coordinates } = args;

  const url = new URL(horizonsUrl);

  url.searchParams.append("format", "text");
  url.searchParams.append("MAKE_EPHEM", "YES");
  url.searchParams.append("OBJ_DATA", "NO");

  url.searchParams.append("START_TIME", start.toISOString());
  url.searchParams.append("STOP_TIME", end.toISOString());
  url.searchParams.append("STEP_SIZE", `1m`);

  if (coordinates) {
    const [longitude, latitude] = coordinates;
    const siteCoords = `'${longitude},${latitude},0'`;
    url.searchParams.append("SITE_COORD", siteCoords);
  }

  return url;
}

// #region parseCoordinatesEphemeris
export function parseCoordinatesEphemeris(text: string) {
  const ephemerisTable = text.split("$$SOE")[1].split("$$EOE")[0].trim();

  const ephemeris: CoordinateEphemeris = ephemerisTable
    .split("\n ")
    .reduce((ephemeris, ephemerisLine) => {
      const [dateString, longitudeString, latitudeString] =
        ephemerisLine.split(/\s{2,}/);

      const date = moment.utc(dateString, "YYYY-MMM-DD HH:mm").toDate();
      const latitude: Latitude = Number(latitudeString);
      const longitude: Longitude = Number(longitudeString);

      return { ...ephemeris, [date.toISOString()]: { latitude, longitude } };
    }, {} as CoordinateEphemeris);

  return ephemeris;
}

// #region parseAzimuthElevationEphemeris
export function parseAzimuthElevationEphemeris(text: string) {
  const ephemerisTable = text.split("$$SOE")[1].split("$$EOE")[0].trim();

  const ephemeris: AzimuthElevationEphemeris = ephemerisTable
    .split("\n ")
    .reduce((ephemeris, ephemerisLine) => {
      const regexString = `${dateRegex.source}.+?${decimalRegex.source}\\s+?${decimalRegex.source}`;
      const azimuthElevationRegex = new RegExp(regexString);

      const match = ephemerisLine.match(azimuthElevationRegex);

      if (!match) return ephemeris;

      const [, dateString, azimuthString, elevationString] = match;

      const date = moment.utc(dateString, "YYYY-MMM-DD HH:mm").toDate();
      const elevation = Number(elevationString);
      const azimuth = Number(azimuthString);

      return { ...ephemeris, [date.toISOString()]: { elevation, azimuth } };
    }, {} as AzimuthElevationEphemeris);

  return ephemeris;
}

// #region parseOrbitEphemeris
export function parseOrbitEphemeris(text: string) {
  const ephemerisTable = text.split("$$SOE")[1].split("$$EOE")[0].trim();

  const datePattern = /\d{4}-[A-Za-z]{3}-\d{2} \d{2}:\d{2}:\d{2}\.\d{4}/g;
  const pattern = new RegExp(
    `(${datePattern.source})` + "[\\s\\S]*?" + `(?=${datePattern.source}|$)`,
    "g"
  );

  const getPattern = (key: string) => {
    return new RegExp(`${key}.*?=.+?(\\d+\\.\\d+(E[+-]\\d{2})?)`, "g");
  };

  const orbitEphemeris: OrbitEphemeris = [
    ...ephemerisTable.matchAll(pattern),
  ].reduce((orbitEphemeris, match) => {
    const [fullMatch, dateString] = match;

    const date = moment
      .utc(dateString, "YYYY-MMM-DD HH:mm:ss.SSSS")
      .toISOString();

    const ecMatch = [...fullMatch.matchAll(getPattern("EC"))][0][1];
    const qrMatch = [...fullMatch.matchAll(getPattern("QR"))][0][1];
    const inMatch = [...fullMatch.matchAll(getPattern("IN"))][0][1];
    const omMatch = [...fullMatch.matchAll(getPattern("OM"))][0][1];
    const wMatch = [...fullMatch.matchAll(getPattern("W"))][0][1];
    const tpMatch = [...fullMatch.matchAll(getPattern("Tp"))][0][1];
    const nMatch = [...fullMatch.matchAll(getPattern("N"))][0][1];
    const maMatch = [...fullMatch.matchAll(getPattern("MA"))][0][1];
    const taMatch = [...fullMatch.matchAll(getPattern("TA"))][0][1];
    const aMatch = [...fullMatch.matchAll(getPattern("A"))][0][1];
    const adMatch = [...fullMatch.matchAll(getPattern("AD"))][0][1];
    const prMatch = [...fullMatch.matchAll(getPattern("PR"))][0][1];

    return {
      ...orbitEphemeris,
      [date]: {
        argumentOfPerifocus: parseFloat(wMatch),
        eccentricity: parseFloat(ecMatch),
        inclination: parseFloat(inMatch),
        timeOfPeriapsis: parseFloat(tpMatch),
        longitudeOfAscendingNode: parseFloat(omMatch),
        meanAnomaly: parseFloat(maMatch),
        periapsisDistance: parseFloat(qrMatch),
        meanMotion: parseFloat(nMatch),
        trueAnomaly: parseFloat(taMatch),
        semiMajorAxis: parseFloat(aMatch),
        apoapsisDistance: parseFloat(adMatch),
        siderealOrbitPeriod: parseFloat(prMatch),
      },
    };
  }, {} as OrbitEphemeris);

  return orbitEphemeris;
}

// #region parseIlluminationEphemeris
export function parseIlluminationEphemeris(text: string) {
  const ephemerisTable = text.split("$$SOE")[1].split("$$EOE")[0].trim();

  const ephemeris: IlluminationEphemeris = ephemerisTable
    .split("\n ")
    .reduce((ephemeris, ephemerisLine) => {
      const regexString = `${dateRegex.source}.+?${decimalRegex.source}`;
      const illuminatedFractionRegex = new RegExp(regexString);

      const match = ephemerisLine.match(illuminatedFractionRegex);

      if (!match) return ephemeris;

      const [, dateString, illuminationString] = match;

      const date = moment.utc(dateString, "YYYY-MMM-DD HH:mm").toDate();
      const illumination = Number(illuminationString);

      return { ...ephemeris, [date.toISOString()]: { illumination } };
    }, {} as IlluminationEphemeris);

  return ephemeris;
}

// #region parseDistanceEphemeris
export function parseDistanceEphemeris(text: string) {
  const ephemerisTable = text.split("$$SOE")[1].split("$$EOE")[0].trim();

  const ephemeris: DistanceEphemeris = ephemerisTable
    .split("\n ")
    .reduce((ephemeris, ephemerisLine) => {
      const regexString = `${dateRegex.source}.+?${decimalRegex.source}\\s+?${decimalRegex.source}`;
      const distanceRegex = new RegExp(regexString);

      const match = ephemerisLine.match(distanceRegex);

      if (!match) return ephemeris;

      const [, dateString, distanceString, rangeRateString] = match;

      const date = moment.utc(dateString, "YYYY-MMM-DD HH:mm").toDate();
      const range = Number(rangeRateString);
      const distance = Number(distanceString);

      return { ...ephemeris, [date.toISOString()]: { range, distance } };
    }, {} as DistanceEphemeris);

  return ephemeris;
}

// #region parseDiameterEphemeris
export function parseDiameterEphemeris(text: string) {
  const ephemerisTable = text.split("$$SOE")[1].split("$$EOE")[0].trim();

  const diameterEphemeris: DiameterEphemeris = ephemerisTable
    .split("\n ")
    .reduce((diameterEphemeris, ephemerisLine) => {
      const regexString = `${dateRegex.source}.+?${decimalRegex.source}`;
      const diameterRegex = new RegExp(regexString);

      const match = ephemerisLine.match(diameterRegex);

      if (!match) return diameterEphemeris;

      const [, dateString, diameterString] = match;

      const date = moment.utc(dateString, "YYYY-MMM-DD HH:mm").toDate();
      const diameterArcseconds = Number(diameterString);
      const diameter = diameterArcseconds / arcsecondsPerDegree;

      return { ...diameterEphemeris, [date.toISOString()]: { diameter } };
    }, {} as DiameterEphemeris);

  return diameterEphemeris;
}
