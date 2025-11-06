import _ from "lodash";
import { type Body, bodies } from "../constants";
import type {
  Coordinates,
  CoordinateEphemeris,
  AzimuthElevationEphemeris,
  CoordinateEphemerisBody,
  DiameterEphemerisBody,
  IlluminationEphemerisBody,
  DistanceEphemerisBody,
  AzimuthElevationEphemerisBody,
  IlluminationEphemeris,
  DiameterEphemeris,
  DistanceEphemeris,
} from "../ephemeris/ephemeris.types";
import {
  getAzimuthElevationEphemerisByBody,
  getCoordinateEphemerisByBody,
  getDiameterEphemerisByBody,
  getDistanceEphemerisByBody,
  getIlluminationEphemerisByBody,
} from "../ephemeris/ephemeris.service";
import {
  upsertEphemerisValues,
  type EphemerisRecord,
} from "../database.utilities";

// #region convertCoordinateEphemerisToRecords
// Convert coordinate ephemeris data to database records format
function convertCoordinateEphemerisToRecords(
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>
): EphemerisRecord[] {
  return _.flatMap(_.toPairs(coordinateEphemerisByBody), ([body, ephemeris]) =>
    _.map(_.toPairs(ephemeris), ([timestampIso, { latitude, longitude }]) => ({
      body: body as Body,
      timestamp: new Date(timestampIso),
      latitude,
      longitude,
    }))
  );
}

// #region convertAzimuthElevationEphemerisToRecords
function convertAzimuthElevationEphemerisToRecords(
  azimuthElevationEphemerisByBody: Record<Body, AzimuthElevationEphemeris>
): EphemerisRecord[] {
  return _.flatMap(
    _.toPairs(azimuthElevationEphemerisByBody),
    ([body, ephemeris]) =>
      _.map(_.toPairs(ephemeris), ([timestampIso, { azimuth, elevation }]) => ({
        body: body as Body,
        timestamp: new Date(timestampIso),
        azimuth,
        elevation,
      }))
  );
}

// #region convertIlluminationEphemerisToRecords
function convertIlluminationEphemerisToRecords(
  illuminationEphemerisByBody: Record<Body, IlluminationEphemeris>
): EphemerisRecord[] {
  return _.flatMap(
    _.toPairs(illuminationEphemerisByBody),
    ([body, ephemeris]) =>
      _.map(_.toPairs(ephemeris), ([timestampIso, { illumination }]) => ({
        body: body as Body,
        timestamp: new Date(timestampIso),
        illumination,
      }))
  );
}

// #region convertDiameterEphemerisToRecords
function convertDiameterEphemerisToRecords(
  diameterEphemerisByBody: Record<Body, DiameterEphemeris>
): EphemerisRecord[] {
  return _.flatMap(_.toPairs(diameterEphemerisByBody), ([body, ephemeris]) =>
    _.map(_.toPairs(ephemeris), ([timestampIso, { diameter }]) => ({
      body: body as Body,
      timestamp: new Date(timestampIso),
      diameter,
    }))
  );
}

// #region convertDistanceEphemerisToRecords
function convertDistanceEphemerisToRecords(
  distanceEphemerisByBody: Record<Body, DistanceEphemeris>
): EphemerisRecord[] {
  return _.flatMap(_.toPairs(distanceEphemerisByBody), ([body, ephemeris]) =>
    _.map(_.toPairs(ephemeris), ([timestampIso, { distance }]) => ({
      body: body as Body,
      timestamp: new Date(timestampIso),
      distance,
    }))
  );
}

// #region getEphemerides
export async function getEphemerides(args: {
  coordinates: Coordinates;
  end: Date;
  start: Date;
}) {
  const { coordinates, end, start } = args;

  // Fetch coordinate ephemeris for all bodies
  const coordinateEphemerisBodies: CoordinateEphemerisBody[] = bodies;

  // Fetch diameter ephemeris for sun and moon (needed for eclipses)
  const diameterEphemerisBodies: DiameterEphemerisBody[] = ["sun", "moon"];

  // Fetch illumination ephemeris for moon and inner planets (needed for phases)
  const illuminationEphemerisBodies: IlluminationEphemerisBody[] = [
    "moon",
    "mercury",
    "venus",
    "mars",
  ];

  // Fetch distance ephemeris for sun and inner planets (needed for apsides and phases)
  const distanceEphemerisBodies: DistanceEphemerisBody[] = [
    "sun",
    "mercury",
    "venus",
    "mars",
  ];

  // Fetch azimuth/elevation ephemeris for sun and moon (needed for daily cycles)
  const azimuthElevationEphemerisBodies: AzimuthElevationEphemerisBody[] = [
    "sun",
    "moon",
  ];

  const coordinateEphemerisByBody = await getCoordinateEphemerisByBody({
    bodies: coordinateEphemerisBodies,
    start,
    end,
  });

  const azimuthElevationEphemerisByBody =
    await getAzimuthElevationEphemerisByBody({
      bodies: azimuthElevationEphemerisBodies,
      start,
      end,
      coordinates,
    });

  const illuminationEphemerisByBody = await getIlluminationEphemerisByBody({
    bodies: illuminationEphemerisBodies,
    start,
    end,
    coordinates,
  });

  const diameterEphemerisByBody = await getDiameterEphemerisByBody({
    bodies: diameterEphemerisBodies,
    start,
    end,
  });

  const distanceEphemerisByBody = await getDistanceEphemerisByBody({
    bodies: distanceEphemerisBodies,
    start,
    end,
  });

  await upsertEphemerisValues([
    ...convertCoordinateEphemerisToRecords(coordinateEphemerisByBody),
    ...convertAzimuthElevationEphemerisToRecords(
      azimuthElevationEphemerisByBody
    ),
    ...convertIlluminationEphemerisToRecords(illuminationEphemerisByBody),
    ...convertDiameterEphemerisToRecords(diameterEphemerisByBody),
    ...convertDistanceEphemerisToRecords(distanceEphemerisByBody),
  ]);

  return {
    azimuthElevationEphemerisByBody,
    coordinateEphemerisByBody,
    diameterEphemerisByBody,
    distanceEphemerisByBody,
    illuminationEphemerisByBody,
  };
}
