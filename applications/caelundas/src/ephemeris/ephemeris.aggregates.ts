import { bodies } from "../constants";
import {
  getAzimuthElevationEphemerisByBody,
  getCoordinateEphemerisByBody,
  getDiameterEphemerisByBody,
  getDistanceEphemerisByBody,
  getIlluminationEphemerisByBody,
} from "../ephemeris/ephemeris.service";

import type {
  AzimuthElevationEphemeris,
  AzimuthElevationEphemerisBody,
  CoordinateEphemeris,
  CoordinateEphemerisBody,
  Coordinates,
  DiameterEphemeris,
  DiameterEphemerisBody,
  DistanceEphemeris,
  DistanceEphemerisBody,
  IlluminationEphemeris,
  IlluminationEphemerisBody,
} from "../ephemeris/ephemeris.types";
import type { Body } from "../types";

// #region getEphemerides
export async function getEphemerides(args: {
  coordinates: Coordinates;
  end: Date;
  start: Date;
  timezone: string;
}): Promise<{
  azimuthElevationEphemerisByBody: Record<Body, AzimuthElevationEphemeris>;
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  diameterEphemerisByBody: Record<Body, DiameterEphemeris>;
  distanceEphemerisByBody: Record<Body, DistanceEphemeris>;
  illuminationEphemerisByBody: Record<Body, IlluminationEphemeris>;
}> {
  const { coordinates, end, start, timezone } = args;

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
    timezone,
  });

  const azimuthElevationEphemerisByBody =
    await getAzimuthElevationEphemerisByBody({
      bodies: azimuthElevationEphemerisBodies,
      start,
      end,
      coordinates,
      timezone,
    });

  const illuminationEphemerisByBody = await getIlluminationEphemerisByBody({
    bodies: illuminationEphemerisBodies,
    start,
    end,
    coordinates,
    timezone,
  });

  const diameterEphemerisByBody = await getDiameterEphemerisByBody({
    bodies: diameterEphemerisBodies,
    start,
    end,
    timezone,
  });

  const distanceEphemerisByBody = await getDistanceEphemerisByBody({
    bodies: distanceEphemerisBodies,
    start,
    end,
    timezone,
  });

  return {
    azimuthElevationEphemerisByBody,
    coordinateEphemerisByBody,
    diameterEphemerisByBody,
    distanceEphemerisByBody,
    illuminationEphemerisByBody,
  };
}
