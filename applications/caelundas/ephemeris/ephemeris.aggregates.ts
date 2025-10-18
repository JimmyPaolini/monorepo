import _ from "npm:lodash";
import { type Body } from "../symbols.constants.ts";
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
} from "../ephemeris/ephemeris.types.ts";
import {
  getAzimuthElevationEphemerisByBody,
  getCoordinateEphemerisByBody,
  getDiameterEphemerisByBody,
  getDistanceEphemerisByBody,
  getIlluminationEphemerisByBody,
} from "../ephemeris/ephemeris.service.ts";
import {
  type EventTypeChoice,
  type PlanetaryPhaseBodyChoice,
} from "../choices/choices.types.ts";

// #region shouldGetEphemeris
export function shouldGetEphemeris(args: {
  eventTypes: EventTypeChoice[];
  signIngressBodies: Body[];
  decanIngressBodies: Body[];
  majorAspectBodies: Body[];
  minorAspectBodies: Body[];
  peakIngressBodies: Body[];
  planetaryPhaseBodies: PlanetaryPhaseBodyChoice[];
  retrogradeBodies: Body[];
  specialtyAspectBodies: Body[];
}) {
  const {
    eventTypes,
    signIngressBodies,
    decanIngressBodies,
    majorAspectBodies,
    minorAspectBodies,
    peakIngressBodies,
    planetaryPhaseBodies,
    retrogradeBodies,
    specialtyAspectBodies,
  } = args;

  const bodies = [
    ...signIngressBodies,
    ...decanIngressBodies,
    ...peakIngressBodies,
    ...majorAspectBodies,
    ...minorAspectBodies,
    ...retrogradeBodies,
    ...specialtyAspectBodies,
  ];
  if (eventTypes.includes("annualSolarCycle")) {
    bodies.push("sun");
  }
  if (eventTypes.includes("monthlyLunarCycle")) {
    bodies.push("sun", "moon", "north lunar node", "lunar apogee");
  }
  if (planetaryPhaseBodies.includes("venus")) {
    bodies.push("venus", "sun");
  }
  if (planetaryPhaseBodies.includes("mercury")) {
    bodies.push("mercury", "sun");
  }
  if (planetaryPhaseBodies.includes("mars")) {
    bodies.push("mars", "sun");
  }

  const coordinateEphemerisBodies: CoordinateEphemerisBody[] = _.uniq(bodies);

  const diameterEphemerisBodies: DiameterEphemerisBody[] = [];
  if (eventTypes.includes("monthlyLunarCycle")) {
    diameterEphemerisBodies.push("moon");
    diameterEphemerisBodies.push("sun");
  }

  const illuminationEphemerisBodies: IlluminationEphemerisBody[] = [];
  if (eventTypes.includes("monthlyLunarCycle")) {
    illuminationEphemerisBodies.push("moon");
  }
  if (planetaryPhaseBodies.includes("venus")) {
    illuminationEphemerisBodies.push("venus");
  }
  if (planetaryPhaseBodies.includes("mercury")) {
    illuminationEphemerisBodies.push("mercury");
  }
  if (planetaryPhaseBodies.includes("mars")) {
    illuminationEphemerisBodies.push("mars");
  }

  const distanceEphemerisBodies: DistanceEphemerisBody[] = [];
  if (eventTypes.includes("annualSolarCycle")) {
    distanceEphemerisBodies.push("sun");
  }
  if (planetaryPhaseBodies.includes("venus")) {
    distanceEphemerisBodies.push("venus");
  }
  if (planetaryPhaseBodies.includes("mercury")) {
    distanceEphemerisBodies.push("mercury");
  }
  if (planetaryPhaseBodies.includes("mars")) {
    distanceEphemerisBodies.push("mars");
  }

  const azimuthElevationEphemerisBodies: AzimuthElevationEphemerisBody[] = [];
  if (eventTypes.includes("dailyLunarCycle")) {
    azimuthElevationEphemerisBodies.push("moon");
  }
  if (
    eventTypes.some((eventType) =>
      ["dailySolarCycle", "twilights"].includes(eventType)
    )
  ) {
    azimuthElevationEphemerisBodies.push("sun");
  }

  return {
    azimuthElevationEphemerisBodies,
    coordinateEphemerisBodies,
    diameterEphemerisBodies,
    distanceEphemerisBodies,
    illuminationEphemerisBodies,
  };
}

// #region getEphemerides
export async function getEphemerides(args: {
  coordinateEphemerisBodies: CoordinateEphemerisBody[];
  coordinates: Coordinates;
  end: Date;
  azimuthElevationEphemerisBodies: AzimuthElevationEphemerisBody[];
  diameterEphemerisBodies: DiameterEphemerisBody[];
  distanceEphemerisBodies: DistanceEphemerisBody[];
  illuminationEphemerisBodies: IlluminationEphemerisBody[];
  start: Date;
}) {
  const {
    coordinateEphemerisBodies,
    coordinates,
    end,
    azimuthElevationEphemerisBodies,
    diameterEphemerisBodies,
    distanceEphemerisBodies,
    illuminationEphemerisBodies,
    start,
  } = args;

  const coordinateEphemerisByBody = coordinateEphemerisBodies.length
    ? await getCoordinateEphemerisByBody({
        bodies: coordinateEphemerisBodies,
        start,
        end,
      })
    : ({} as Record<Body, CoordinateEphemeris>);

  const azimuthElevationEphemerisByBody = azimuthElevationEphemerisBodies.length
    ? await getAzimuthElevationEphemerisByBody({
        bodies: azimuthElevationEphemerisBodies,
        start,
        end,
        coordinates,
      })
    : ({} as Record<Body, AzimuthElevationEphemeris>);

  const illuminationEphemerisByBody = illuminationEphemerisBodies.length
    ? await getIlluminationEphemerisByBody({
        bodies: illuminationEphemerisBodies,
        start,
        end,
        coordinates,
      })
    : ({} as Record<Body, IlluminationEphemeris>);

  const diameterEphemerisByBody = diameterEphemerisBodies.length
    ? await getDiameterEphemerisByBody({
        bodies: diameterEphemerisBodies,
        start,
        end,
      })
    : ({} as Record<Body, DiameterEphemeris>);

  const distanceEphemerisByBody = distanceEphemerisBodies.length
    ? await getDistanceEphemerisByBody({
        bodies: distanceEphemerisBodies,
        start,
        end,
      })
    : ({} as Record<Body, DistanceEphemeris>);

  return {
    azimuthElevationEphemerisByBody,
    coordinateEphemerisByBody,
    diameterEphemerisByBody,
    distanceEphemerisByBody,
    illuminationEphemerisByBody,
  };
}
