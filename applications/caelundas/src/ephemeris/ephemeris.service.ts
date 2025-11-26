import _ from "lodash";
import moment from "moment-timezone";
import {
  commandIdByBody,
  dateRegex,
  decimalRegex,
  horizonsUrl,
  QUANTITY_ANGULAR_DIAMETER,
  QUANTITY_APPARENT_AZIMUTH_ELEVATION,
  QUANTITY_ECLIPTIC_LONGITUDE_LATITUDE,
  QUANTITY_ILLUMINATED_FRACTION,
  QUANTITY_RANGE_RATE,
} from "./ephemeris.constants";
import type { Asteroid, Body, Comet, Node, Planet } from "../types";
import { nodes } from "../constants";
import { symbolByBody } from "../symbols";
import type {
  DiameterEphemeris,
  AzimuthElevationEphemerisBody,
  Coordinates,
  DiameterEphemerisBody,
  DistanceEphemerisBody,
  IlluminationEphemerisBody,
  OrbitEphemerisBody,
  DistanceEphemeris,
  IlluminationEphemeris,
  AzimuthElevationEphemeris,
  CoordinateEphemeris,
  OrbitEphemeris,
  Latitude,
  Longitude,
} from "./ephemeris.types";
import { arcsecondsPerDegree, normalizeDegrees } from "../math.utilities";
import { fetchWithRetry } from "../fetch.utilities";
import {
  type EphemerisRecord,
  upsertEphemerisValues,
  getEphemerisRecords,
} from "../database.utilities";

// #region Utilities

function getExpectedRecordCount(start: Date, end: Date): number {
  // Ephemeris data is fetched at 1-minute intervals
  const diffInMs = end.getTime() - start.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  // Add 1 to include both start and end timestamps
  return diffInMinutes + 1;
}

function getHorizonsBaseUrl(args: {
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

// #region 💫 Orbit

function parseOrbitEphemeris(text: string) {
  const ephemerisTable = text.split("$$SOE")[1].split("$$EOE")[0].trim();

  const datePattern = /\d{4}-[A-Za-z]{3}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{4})?/g;
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
      .utc(dateString, ["YYYY-MMM-DD HH:mm:ss.SSSS", "YYYY-MMM-DD HH:mm:ss"])
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

function getOrbitEphemerisUrl(args: {
  body: OrbitEphemerisBody;
  end: Date;
  start: Date;
}) {
  const { body, end, start } = args;

  const url = getHorizonsBaseUrl({ end, start });

  url.searchParams.append("EPHEM_TYPE", "ELEMENTS");
  url.searchParams.append("CENTER", "500@399");
  url.searchParams.append("COMMAND", commandIdByBody[body]);

  return url;
}

export async function getOrbitEphemeris(args: {
  body: OrbitEphemerisBody;
  end: Date;
  start: Date;
  timezone: string;
}) {
  const { body, end, start, timezone } = args;

  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `orbit ephemeris 💫 for ${symbolByBody[body]} from ${timespan}`;

  console.log(`🌐 Fetching ${message}`);

  const url = getOrbitEphemerisUrl({ body, end, start });
  const text = await fetchWithRetry(url.toString());
  const orbitEphemeris = parseOrbitEphemeris(text);

  console.log(`🌐 Fetched ${message}`);

  return orbitEphemeris;
}

export async function getNodeCoordinatesEphemeris(args: {
  end: Date;
  node: Node;
  start: Date;
  timezone: string;
}) {
  const { end, node, start, timezone } = args;

  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `coordinate ephemeris 🎯 for ${symbolByBody[node]} from ${timespan}`;

  // Check if data exists in database
  console.log(`🔍 Querying database for ${message}`);
  const existingRecords = await getEphemerisRecords({
    body: node,
    start,
    end,
    type: "coordinate",
  });

  const expectedCount = getExpectedRecordCount(start, end);
  const hasAllValues = existingRecords.every(
    (record) => record.latitude !== undefined && record.longitude !== undefined
  );
  if (existingRecords.length === expectedCount && hasAllValues) {
    console.log(`🛢️ Found complete database data for ${message}`);
    return convertRecordsToCoordinateEphemeris(existingRecords);
  } else if (existingRecords.length > 0) {
    console.log(
      `🛢️ Found incomplete database data (${existingRecords.length}/${expectedCount} records) for ${message}, fetching from API`
    );
  }

  console.log(`🌐 Fetching ${message}`);

  const nodeOrbitEphemeris = await getOrbitEphemeris({
    body: "moon",
    start,
    end,
    timezone,
  });

  const nodeEphemeris: CoordinateEphemeris = _.mapValues(
    nodeOrbitEphemeris,
    (nodeOrbitEphemerisValue: OrbitEphemeris[string]) => {
      const { longitudeOfAscendingNode, argumentOfPerifocus } =
        nodeOrbitEphemerisValue;

      switch (node) {
        case "north lunar node":
          return { longitude: longitudeOfAscendingNode, latitude: 0 };
        case "south lunar node":
          return {
            longitude: normalizeDegrees(longitudeOfAscendingNode + 180),
            latitude: 0,
          };
        case "lunar perigee":
          return {
            longitude: normalizeDegrees(
              longitudeOfAscendingNode + argumentOfPerifocus
            ),
            latitude: 0,
          };
        case "lunar apogee":
          return {
            longitude: normalizeDegrees(
              longitudeOfAscendingNode + argumentOfPerifocus + 180
            ),
            latitude: 0,
          };
        default:
          throw new Error(`Unknown node: ${node}`);
      }
    }
  );

  console.log(`🌐 Fetched ${message}`);

  console.log(`🛢️ Upserting ${message}`);
  await upsertEphemerisValues(
    convertCoordinateEphemerisToRecords(node, nodeEphemeris)
  );
  console.log(`🛢️ Upserted ${message}`);

  return nodeEphemeris;
}

// #region 📐 Coordinates

function parseCoordinatesEphemeris(text: string) {
  const ephemerisTable = text.split("$$SOE")[1].split("$$EOE")[0].trim();

  const ephemeris: CoordinateEphemeris = ephemerisTable
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .reduce((ephemeris, ephemerisLine) => {
      const parts = ephemerisLine.trim().split(/\s+/);

      // Format: "YYYY-MMM-DD HH:mm longitude latitude"
      const dateString = `${parts[0]} ${parts[1]}`;
      const longitudeString = parts[2];
      const latitudeString = parts[3];

      const date = moment.utc(dateString, "YYYY-MMM-DD HH:mm").toDate();
      const latitude: Latitude = Number(latitudeString);
      const longitude: Longitude = Number(longitudeString);

      return { ...ephemeris, [date.toISOString()]: { latitude, longitude } };
    }, {} as CoordinateEphemeris);

  return ephemeris;
}

function convertCoordinateEphemerisToRecords(
  body: Body,
  coordinateEphemeris: CoordinateEphemeris
): EphemerisRecord[] {
  return _.map(
    _.toPairs(coordinateEphemeris),
    ([timestampIso, { latitude, longitude }]) => ({
      body: body as Body,
      timestamp: new Date(timestampIso),
      latitude,
      longitude,
    })
  );
}

function convertRecordsToCoordinateEphemeris(
  records: EphemerisRecord[]
): CoordinateEphemeris {
  return records.reduce(
    (acc, record) => ({
      ...acc,
      [record.timestamp.toISOString()]: {
        latitude: record.latitude!,
        longitude: record.longitude!,
      },
    }),
    {} as CoordinateEphemeris
  );
}

function getCoordinatesEphemerisUrl(args: {
  body: Planet | Asteroid | Comet;
  start: Date;
  end: Date;
}) {
  const { body, start, end } = args;

  const url = getHorizonsBaseUrl({ start, end });

  url.searchParams.append("EPHEM_TYPE", "OBSERVER");
  url.searchParams.append("QUANTITIES", QUANTITY_ECLIPTIC_LONGITUDE_LATITUDE);
  url.searchParams.append("CENTER", "500@399"); // earth
  url.searchParams.append("COMMAND", commandIdByBody[body]);

  return url;
}

export async function getCoordinatesEphemeris(args: {
  body: Planet | Asteroid | Comet;
  start: Date;
  end: Date;
  timezone: string;
}) {
  const { body, start, end, timezone } = args;

  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `coordinate ephemeris 🎯 for ${symbolByBody[body]} from ${timespan}`;

  // Check if data exists in database
  console.log(`🔍 Querying database for ${message}`);
  const existingRecords = await getEphemerisRecords({
    body,
    start,
    end,
    type: "coordinate",
  });

  const expectedCount = getExpectedRecordCount(start, end);
  const hasAllValues = existingRecords.every(
    (record) => record.latitude !== undefined && record.longitude !== undefined
  );
  if (existingRecords.length === expectedCount && hasAllValues) {
    console.log(`🛢️ Found complete database data for ${message}`);
    return convertRecordsToCoordinateEphemeris(existingRecords);
  } else {
    console.log(
      `🛢️ Found incomplete database data (${existingRecords.length}/${expectedCount} records) for ${message}, fetching from API`
    );
  }

  console.log(`🌐 Fetching ${message}`);

  const url = getCoordinatesEphemerisUrl({ body, start, end });
  const text = await fetchWithRetry(url.toString());
  const ephemeris = parseCoordinatesEphemeris(text);

  console.log(`🌐 Fetched ${message}`);

  console.log(`🛢️ Upserting ${message}`);
  await upsertEphemerisValues(
    convertCoordinateEphemerisToRecords(body, ephemeris)
  );
  console.log(`🛢️ Upserted ${message}`);

  return ephemeris;
}

function isNode(body: string): body is Node {
  return nodes.includes(body as Node);
}

export async function getCoordinateEphemerisByBody(args: {
  bodies: Body[];
  start: Date;
  end: Date;
  timezone: string;
}) {
  const { bodies, start, end, timezone } = args;

  const bodiesString = bodies.map((body: Body) => symbolByBody[body]).join(" ");
  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `coordinate ephemerides 🎯 for ${bodiesString} from ${timespan}`;

  console.log(`🔭 Getting ${message}`);

  const coordinateEphemerisByBody = {} as Record<Body, CoordinateEphemeris>;

  for await (const body of bodies) {
    if (isNode(body)) {
      coordinateEphemerisByBody[body] = await getNodeCoordinatesEphemeris({
        end,
        node: body,
        start,
        timezone,
      });
    } else {
      coordinateEphemerisByBody[body] = await getCoordinatesEphemeris({
        body,
        end,
        start,
        timezone,
      });
    }
  }

  console.log(`🔭 Got ${message}`);

  return coordinateEphemerisByBody;
}

// #region ⏫ Azimuth Elevation

function parseAzimuthElevationEphemeris(text: string) {
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

function convertAzimuthElevationEphemerisToRecords(
  body: Body,
  azimuthElevationEphemeris: AzimuthElevationEphemeris
): EphemerisRecord[] {
  return _.map(
    _.toPairs(azimuthElevationEphemeris),
    ([timestampIso, { azimuth, elevation }]) => ({
      body: body as Body,
      timestamp: new Date(timestampIso),
      azimuth,
      elevation,
    })
  );
}

function convertRecordsToAzimuthElevationEphemeris(
  records: EphemerisRecord[]
): AzimuthElevationEphemeris {
  return records.reduce(
    (acc, record) => ({
      ...acc,
      [record.timestamp.toISOString()]: {
        azimuth: record.azimuth!,
        elevation: record.elevation!,
      },
    }),
    {} as AzimuthElevationEphemeris
  );
}

function getAzimuthElevationEphemerisUrl(args: {
  body: AzimuthElevationEphemerisBody;
  coordinates: Coordinates;
  end: Date;
  start: Date;
}) {
  const { body, coordinates, end, start } = args;

  const url = getHorizonsBaseUrl({ start, end, coordinates });

  url.searchParams.append("EPHEM_TYPE", "OBSERVER");
  url.searchParams.append("QUANTITIES", QUANTITY_APPARENT_AZIMUTH_ELEVATION);
  url.searchParams.append("CENTER", "coord@399"); // earth, specific location
  url.searchParams.append("COMMAND", commandIdByBody[body]);

  return url;
}

export async function getAzimuthElevationEphemeris(args: {
  body: AzimuthElevationEphemerisBody;
  coordinates: Coordinates;
  end: Date;
  start: Date;
  timezone: string;
}) {
  const { body, coordinates, end, start, timezone } = args;

  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `azimuth elevation ephemeris ⏫ for ${symbolByBody[body]} from ${timespan}`;

  // Check if data exists in database
  console.log(`🔍 Querying database for ${message}`);
  const existingRecords = await getEphemerisRecords({
    body,
    start,
    end,
    type: "azimuthElevation",
  });

  const expectedCount = getExpectedRecordCount(start, end);
  const hasAllValues = existingRecords.every(
    (record) => record.azimuth !== undefined && record.elevation !== undefined
  );
  if (existingRecords.length === expectedCount && hasAllValues) {
    console.log(`🛢️ Found complete database data for ${message}`);
    return convertRecordsToAzimuthElevationEphemeris(existingRecords);
  } else {
    console.log(
      `🛢️ Found incomplete database data (${existingRecords.length}/${expectedCount} records) for ${message}, fetching from API`
    );
  }

  console.log(`🌐 Fetching ${message}`);

  const url = getAzimuthElevationEphemerisUrl({
    start,
    end,
    coordinates,
    body,
  });
  const text = await fetchWithRetry(url.toString());
  const ephemeris = parseAzimuthElevationEphemeris(text);

  console.log(`🌐 Fetched ${message}`);

  console.log(`🛢️ Upserting ${message}`);
  await upsertEphemerisValues(
    convertAzimuthElevationEphemerisToRecords(body, ephemeris)
  );
  console.log(`🛢️ Upserted ${message}`);

  return ephemeris;
}

export async function getAzimuthElevationEphemerisByBody(args: {
  bodies: AzimuthElevationEphemerisBody[];
  start: Date;
  end: Date;
  coordinates: Coordinates;
  timezone: string;
}) {
  const { bodies, start, end, coordinates, timezone } = args;

  const bodiesString = bodies.map((body: Body) => symbolByBody[body]).join(" ");
  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `azimuth elevation ephemerides ⏫ for ${bodiesString} from ${timespan}`;

  console.log(`🔭 Getting ${message}`);

  const azimuthElevationEphemerisByBody = {} as Record<
    Body,
    AzimuthElevationEphemeris
  >;
  for await (const body of bodies) {
    azimuthElevationEphemerisByBody[body] = await getAzimuthElevationEphemeris({
      body,
      end,
      start,
      coordinates,
      timezone,
    });
  }

  console.log(`🔭 Got ${message}`);

  return azimuthElevationEphemerisByBody;
}

// #region 🌒 Illumination

function parseIlluminationEphemeris(text: string) {
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

function convertIlluminationEphemerisToRecords(
  body: Body,
  illuminationEphemeris: IlluminationEphemeris
): EphemerisRecord[] {
  return _.map(
    _.toPairs(illuminationEphemeris),
    ([timestampIso, { illumination }]) => ({
      body: body as Body,
      timestamp: new Date(timestampIso),
      illumination,
    })
  );
}

function convertRecordsToIlluminationEphemeris(
  records: EphemerisRecord[]
): IlluminationEphemeris {
  return records.reduce(
    (acc, record) => ({
      ...acc,
      [record.timestamp.toISOString()]: {
        illumination: record.illumination!,
      },
    }),
    {} as IlluminationEphemeris
  );
}

function getIlluminationEphemerisUrl(args: {
  body: IlluminationEphemerisBody;
  start: Date;
  end: Date;
  coordinates: Coordinates;
}) {
  const { body, start, end, coordinates } = args;

  const url = getHorizonsBaseUrl({ start, end, coordinates });

  url.searchParams.append("EPHEM_TYPE", "OBSERVER");
  url.searchParams.append("QUANTITIES", QUANTITY_ILLUMINATED_FRACTION);
  url.searchParams.append("CENTER", "500@399"); // earth, geocentric
  url.searchParams.append("COMMAND", commandIdByBody[body]);

  return url;
}

export async function getIlluminationEphemeris(args: {
  body: IlluminationEphemerisBody;
  coordinates: Coordinates;
  end: Date;
  start: Date;
  timezone: string;
}) {
  const { body, start, end, coordinates, timezone } = args;

  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `illumination ephemeris 🌕 for ${symbolByBody[body]} from ${timespan}`;

  // Check if data exists in database
  console.log(`🔍 Querying database for ${message}`);
  const existingRecords = await getEphemerisRecords({
    body,
    start,
    end,
    type: "illumination",
  });

  const expectedCount = getExpectedRecordCount(start, end);
  const hasAllValues = existingRecords.every(
    (record) => record.illumination !== undefined
  );
  if (existingRecords.length === expectedCount && hasAllValues) {
    console.log(`🛢️ Found complete database data for ${message}`);
    return convertRecordsToIlluminationEphemeris(existingRecords);
  } else {
    console.log(
      `🛢️ Found incomplete database data (${existingRecords.length}/${expectedCount} records) for ${message}, fetching from API`
    );
  }

  console.log(`🌐 Fetching ${message}`);

  const url = getIlluminationEphemerisUrl({
    body,
    start,
    end,
    coordinates,
  });
  const text = await fetchWithRetry(url.toString());
  const ephemeris = parseIlluminationEphemeris(text);

  console.log(`🌐 Fetched ${message}`);

  console.log(`🛢️ Upserting ${message}`);
  await upsertEphemerisValues(
    convertIlluminationEphemerisToRecords(body, ephemeris)
  );
  console.log(`🛢️ Upserted ${message}`);

  return ephemeris;
}

export async function getIlluminationEphemerisByBody(args: {
  bodies: IlluminationEphemerisBody[];
  start: Date;
  end: Date;
  coordinates: Coordinates;
  timezone: string;
}) {
  const { bodies, start, end, coordinates, timezone } = args;

  const bodiesString = bodies.map((body: Body) => symbolByBody[body]).join(" ");
  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `illumination ephemerides 🌕 for ${bodiesString} from ${timespan}`;
  console.log(`🔭 Getting ${message}`);

  const illuminationEphemerisByBody = {} as Record<Body, IlluminationEphemeris>;
  for await (const body of bodies) {
    illuminationEphemerisByBody[body] = await getIlluminationEphemeris({
      body,
      end,
      start,
      coordinates,
      timezone,
    });
  }

  console.log(`🔭 Got ${message}`);

  return illuminationEphemerisByBody;
}

// #region 🛟 Diameter

function parseDiameterEphemeris(text: string) {
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

function convertDiameterEphemerisToRecords(
  body: Body,
  diameterEphemeris: DiameterEphemeris
): EphemerisRecord[] {
  return _.map(
    _.toPairs(diameterEphemeris),
    ([timestampIso, { diameter }]) => ({
      body,
      timestamp: new Date(timestampIso),
      diameter,
    })
  );
}

function convertRecordsToDiameterEphemeris(
  records: EphemerisRecord[]
): DiameterEphemeris {
  return records.reduce(
    (acc, record) => ({
      ...acc,
      [record.timestamp.toISOString()]: {
        diameter: record.diameter!,
      },
    }),
    {} as DiameterEphemeris
  );
}

function getDiameterEphemerisUrl(args: {
  start: Date;
  end: Date;
  body: DiameterEphemerisBody;
}) {
  const { start, end, body } = args;

  const url = getHorizonsBaseUrl({ start, end });

  url.searchParams.append("EPHEM_TYPE", "OBSERVER");
  url.searchParams.append("QUANTITIES", QUANTITY_ANGULAR_DIAMETER);
  url.searchParams.append("CENTER", "500@399"); // earth, geocentric
  url.searchParams.append("COMMAND", commandIdByBody[body]);

  return url;
}

export async function getDiameterEphemeris(args: {
  start: Date;
  end: Date;
  body: DiameterEphemerisBody;
  timezone: string;
}) {
  const { start, end, body, timezone } = args;

  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `diameter ephemeris 🛟 for ${symbolByBody[body]} from ${timespan}`;

  // Check if data exists in database
  console.log(`🔍 Querying database for ${message}`);
  const existingRecords = await getEphemerisRecords({
    body,
    start,
    end,
    type: "diameter",
  });

  const expectedCount = getExpectedRecordCount(start, end);
  const hasAllValues = existingRecords.every(
    (record) => record.diameter !== undefined
  );
  if (existingRecords.length === expectedCount && hasAllValues) {
    console.log(`🛢️ Found complete database data for ${message}`);
    return convertRecordsToDiameterEphemeris(existingRecords);
  } else {
    console.log(
      `🛢️ Found incomplete database data (${existingRecords.length}/${expectedCount} records) for ${message}, fetching from API`
    );
  }

  console.log(`🌐 Fetching ${message}`);

  const url = getDiameterEphemerisUrl({ start, end, body });
  const text = await fetchWithRetry(url.toString());
  const ephemeris = parseDiameterEphemeris(text);

  console.log(`🌐 Fetched ${message}`);

  console.log(`🛢️ Upserting ${message}`);
  await upsertEphemerisValues(
    convertDiameterEphemerisToRecords(body, ephemeris)
  );
  console.log(`🛢️ Upserted ${message}`);

  return ephemeris;
}

export async function getDiameterEphemerisByBody(args: {
  bodies: DiameterEphemerisBody[];
  start: Date;
  end: Date;
  timezone: string;
}) {
  const { bodies, start, end, timezone } = args;

  const bodiesString = bodies.map((body: Body) => symbolByBody[body]).join(" ");
  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `diameter ephemerides 🛟 for ${bodiesString} from ${timespan}`;
  console.log(`🔭 Getting ${message}`);

  const diameterEphemerisByBody = {} as Record<Body, DiameterEphemeris>;
  for await (const body of bodies) {
    diameterEphemerisByBody[body] = await getDiameterEphemeris({
      body,
      end,
      start,
      timezone,
    });
  }

  console.log(`🔭 Got ${message}`);

  return diameterEphemerisByBody;
}

// #region 📏 Distance

function parseDistanceEphemeris(text: string) {
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

function convertDistanceEphemerisToRecords(
  body: Body,
  distanceEphemeris: DistanceEphemeris
): EphemerisRecord[] {
  return _.map(
    _.toPairs(distanceEphemeris),
    ([timestampIso, { distance }]) => ({
      body: body as Body,
      timestamp: new Date(timestampIso),
      distance,
    })
  );
}

function convertRecordsToDistanceEphemeris(
  records: EphemerisRecord[]
): DistanceEphemeris {
  return records.reduce(
    (acc, record) => ({
      ...acc,
      [record.timestamp.toISOString()]: {
        distance: record.distance!,
        range: 0, // Note: range is not stored in database, using 0 as placeholder
      },
    }),
    {} as DistanceEphemeris
  );
}

function getDistanceEphemerisUrl(args: {
  body: DistanceEphemerisBody;
  end: Date;
  start: Date;
}) {
  const { body, end, start } = args;

  const url = getHorizonsBaseUrl({ start, end });

  url.searchParams.append("EPHEM_TYPE", "OBSERVER");
  url.searchParams.append("QUANTITIES", QUANTITY_RANGE_RATE);
  url.searchParams.append("CENTER", "500@399"); // earth, geocentric
  url.searchParams.append("COMMAND", commandIdByBody[body]);

  return url;
}

export async function getDistanceEphemeris(args: {
  body: DistanceEphemerisBody;
  end: Date;
  start: Date;
  timezone: string;
}) {
  const { body, end, start, timezone } = args;

  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `distance ephemeris 📏 for ${symbolByBody[body]} from ${timespan}`;

  // Check if data exists in database
  console.log(`🔍 Querying database for ${message}`);
  const existingRecords = await getEphemerisRecords({
    body,
    start,
    end,
    type: "distance",
  });

  const expectedCount = getExpectedRecordCount(start, end);
  const hasAllValues = existingRecords.every(
    (record) => record.distance !== undefined
  );
  if (existingRecords.length === expectedCount && hasAllValues) {
    console.log(`🛢️ Found complete database data for ${message}`);
    return convertRecordsToDistanceEphemeris(existingRecords);
  } else {
    console.log(
      `🛢️ Found incomplete database data (${existingRecords.length}/${expectedCount} records) for ${message}, fetching from API`
    );
  }

  console.log(`🌐 Fetching ${message}`);

  const url = getDistanceEphemerisUrl({ body, end, start });
  const text = await fetchWithRetry(url.toString());
  const ephemeris = parseDistanceEphemeris(text);

  console.log(`🌐 Fetched ${message}`);

  console.log(`🛢️ Upserting ${message}`);
  await upsertEphemerisValues(
    convertDistanceEphemerisToRecords(body, ephemeris)
  );
  console.log(`🛢️ Upserted ${message}`);

  return ephemeris;
}

export async function getDistanceEphemerisByBody(args: {
  bodies: DistanceEphemerisBody[];
  start: Date;
  end: Date;
  timezone: string;
}) {
  const { bodies, start, end, timezone } = args;

  const bodiesString = bodies.map((body: Body) => symbolByBody[body]).join(" ");
  const timespan = `${moment.tz(start, timezone).toISOString(true)} to ${moment
    .tz(end, timezone)
    .toISOString(true)}`;
  const message = `distance ephemerides 📏 for ${bodiesString} from ${timespan}`;

  console.log(`🔭 Getting ${message}`);

  const distanceEphemerisByBody = {} as Record<Body, DistanceEphemeris>;
  for await (const body of bodies) {
    distanceEphemerisByBody[body] = await getDistanceEphemeris({
      body,
      end,
      start,
      timezone,
    });
  }

  console.log(`🔭 Got ${message}`);

  return distanceEphemerisByBody;
}
