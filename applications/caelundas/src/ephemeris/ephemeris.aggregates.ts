import _ from "lodash";
import { type Body, bodies } from "../constants";
import type {
  Coordinates,
  CoordinateEphemerisBody,
  DiameterEphemerisBody,
  IlluminationEphemerisBody,
  DistanceEphemerisBody,
  AzimuthElevationEphemerisBody,
} from "../ephemeris/ephemeris.types";
import {
  getAzimuthElevationEphemerisByBody,
  getCoordinateEphemerisByBody,
  getDiameterEphemerisByBody,
  getDistanceEphemerisByBody,
  getIlluminationEphemerisByBody,
} from "../ephemeris/ephemeris.service";

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

  return {
    azimuthElevationEphemerisByBody,
    coordinateEphemerisByBody,
    diameterEphemerisByBody,
    distanceEphemerisByBody,
    illuminationEphemerisByBody,
  };
}
