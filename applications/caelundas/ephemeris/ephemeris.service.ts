import _ from "npm:lodash";
import {
  commandIdByBody,
  QUANTITY_ANGULAR_DIAMETER,
  QUANTITY_APPARENT_AZIMUTH_ELEVATION,
  QUANTITY_ECLIPTIC_LONGITUDE_LATITUDE,
  QUANTITY_ILLUMINATED_FRACTION,
  QUANTITY_RANGE_RATE,
} from "./ephemeris.constants.ts";
import {
  getHorizonsBaseUrl,
  parseAzimuthElevationEphemeris,
  parseCoordinatesEphemeris,
  parseDiameterEphemeris,
  parseDistanceEphemeris,
  parseIlluminationEphemeris,
  parseOrbitEphemeris,
} from "./ephemeris.utilities.ts";
import {
  Body,
  Node,
  nodes,
  symbolByBody,
  type Asteroid,
  type Comet,
  type Planet,
} from "../symbols.constants.ts";
import {
  DiameterEphemeris,
  type AzimuthElevationEphemerisBody,
  type Coordinates,
  type DiameterEphemerisBody,
  type DistanceEphemerisBody,
  type IlluminationEphemerisBody,
  type OrbitEphemerisBody,
  type DistanceEphemeris,
  IlluminationEphemeris,
  AzimuthElevationEphemeris,
  CoordinateEphemeris,
  OrbitEphemeris,
} from "./ephemeris.types.ts";
import { normalizeDegrees } from "../math.utilities.ts";
import { print } from "../logs/logs.service.tsx";

// #region 💫 Orbit

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
}) {
  const { body, end, start } = args;

  // const timespan = `${moment
  //   .tz(start, "America/New_York")
  //   .toISOString(true)} to ${moment
  //   .tz(end, "America/New_York")
  //   .toISOString(true)}`;
  const message = `orbit ephemeris 🎯 for ${symbolByBody[body]}`;
  print(`🔭 Fetching ${message}`);

  const url = getOrbitEphemerisUrl({ body, end, start });
  // print(`🌐 Orbit url:`, url.toString());
  const text = await fetch(url.toString()).then((res) => res.text());
  // print(`🏁 Orbit response:`, text);
  const orbitEphemeris = parseOrbitEphemeris(text);

  print(`🔭 Fetched ${message}`);

  return orbitEphemeris;
}

export async function getNodeCoordinatesEphemeris(args: {
  end: Date;
  node: Node;
  start: Date;
}) {
  const { end, node, start } = args;

  const nodeOrbitEphemeris = await getOrbitEphemeris({
    body: "moon",
    start,
    end,
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
          };
        case "lunar apogee":
          return {
            longitude: normalizeDegrees(
              longitudeOfAscendingNode + argumentOfPerifocus + 180
            ),
          };
        default:
          throw new Error(`Unknown node: ${node}`);
      }
    }
  );

  return nodeEphemeris;
}

// #region 📐 Coordinates
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
}) {
  const { body, start, end } = args;

  // const timespan = `${moment
  //   .tz(start, "America/New_York")
  //   .toISOString(true)} to ${moment
  //   .tz(end, "America/New_York")
  //   .toISOString(true)}`;
  const message = `coordinate ephemeris 🎯 for ${symbolByBody[body]}`;
  print(`🔭 Fetching ${message}`);

  const url = getCoordinatesEphemerisUrl({ body, start, end });
  // print(`🌐 Ephemeris url:`, url.toString());
  const text = await fetch(url.toString()).then((res) => res.text());
  // print(`🏁 Ephemeris response:`, text);
  const ephemeris = parseCoordinatesEphemeris(text);

  print(`🔭 Fetched ${message}`);

  return ephemeris;
}

function isNode(body: string): body is Node {
  return nodes.includes(body as Node);
}

export async function getCoordinateEphemerisByBody(args: {
  bodies: Body[];
  start: Date;
  end: Date;
}) {
  const { bodies, start, end } = args;

  // const bodiesString = uniqueBodies
  //   .map((body: Body) => symbolByBody[body])
  //   .join(" ");
  // const timespan = `${moment
  //   .tz(start, "America/New_York")
  //   .toISOString(true)} to ${moment
  //   .tz(end, "America/New_York")
  //   .toISOString(true)}`;
  const message = `coordinate ephemerides 🎯`;
  print(`🔭 Fetching ${message}`);

  const coordinateEphemerisByBody = {} as Record<Body, CoordinateEphemeris>;

  for await (const body of bodies) {
    if (isNode(body)) {
      coordinateEphemerisByBody[body] = await getNodeCoordinatesEphemeris({
        end,
        node: body,
        start,
      });
    } else {
      coordinateEphemerisByBody[body] = await getCoordinatesEphemeris({
        body,
        end,
        start,
      });
    }
  }

  print(`🔭 Fetched ${message}`);

  return coordinateEphemerisByBody;
}

// #region ⏫ Azimuth Elevation

function getAzimuthElevationEphemerisUrl(args: {
  body: AzimuthElevationEphemerisBody;
  coordinates: Coordinates;
  end: Date;
  start: Date;
}) {
  const { body, coordinates, end, start } = args;

  const url = getHorizonsBaseUrl({ start, end, coordinates });

  url.searchParams.append("EPHEM_TYPE", "OBSERVER");
  // url.searchParams.append("COORD_TYPE", "GEODETIC");
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
}) {
  const { body, coordinates, end, start } = args;

  // const timespan = `${moment
  //   .tz(start, "America/New_York")
  //   .toISOString(true)} to ${moment
  //   .tz(end, "America/New_York")
  //   .toISOString(true)}`;
  const message = `azimuth elevation ephemeris ⏫ for ${symbolByBody[body]}`;
  print(`🔭 Fetching ${message}`);

  const url = getAzimuthElevationEphemerisUrl({
    start,
    end,
    coordinates,
    body,
  });
  // print(`🌐 Ephemeris url:`, url.toString());
  const text = await fetch(url.toString()).then((res) => res.text());
  // print(`🏁 Ephemeris response:`, text);
  const ephemeris = parseAzimuthElevationEphemeris(text);
  // print(`🐋 ~ ephemeris:`, ephemeris);

  print(`🔭 Fetched ${message}`);

  return ephemeris;
}

export async function getAzimuthElevationEphemerisByBody(args: {
  bodies: AzimuthElevationEphemerisBody[];
  start: Date;
  end: Date;
  coordinates: Coordinates;
}) {
  const { bodies, start, end, coordinates } = args;

  // const bodiesString = uniqueBodies
  //   .map((body: Body) => symbolByBody[body])
  //   .join(" ");
  // const timespan = `${moment
  //   .tz(start, "America/New_York")
  //   .toISOString(true)} to ${moment
  //   .tz(end, "America/New_York")
  //   .toISOString(true)}`;
  const message = `azimuth elevation ephemerides ⏫`;
  print(`🔭 Fetching ${message}`);

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
    });
  }

  print(`🔭 Fetched ${message}`);

  return azimuthElevationEphemerisByBody;
}

// #region 🌒 Illumination

function getIlluminationEphemerisUrl(args: {
  body: IlluminationEphemerisBody;
  start: Date;
  end: Date;
  coordinates: Coordinates;
}) {
  const { body, start, end, coordinates } = args;

  const url = getHorizonsBaseUrl({ start, end, coordinates });

  url.searchParams.append("EPHEM_TYPE", "OBSERVER");
  url.searchParams.append("QUANTITIES", QUANTITY_ILLUMINATED_FRACTION); // illuminated fraction
  url.searchParams.append("CENTER", "500@399"); // earth, specific location
  url.searchParams.append("COMMAND", commandIdByBody[body]);

  return url;
}

export async function getIlluminationEphemeris(args: {
  body: IlluminationEphemerisBody;
  coordinates: Coordinates;
  end: Date;
  start: Date;
}) {
  const { body, start, end, coordinates } = args;

  const message = `illumination ephemeris 🌕 for ${symbolByBody[body]}`;
  print(`🔭 Fetching ${message}`);

  const url = getIlluminationEphemerisUrl({
    body,
    start,
    end,
    coordinates,
  });
  // print(`🌐 Ephemeris url:`, url.toString());
  const text = await fetch(url.toString()).then((res) => res.text());
  // print(`🏁 Ephemeris response:`, text);
  const ephemeris = parseIlluminationEphemeris(text);
  // print(`🐋 ~ ephemeris:`, ephemeris);

  print(`🔭 Fetched ${message}`);

  return ephemeris;
}

export async function getIlluminationEphemerisByBody(args: {
  bodies: IlluminationEphemerisBody[];
  start: Date;
  end: Date;
  coordinates: Coordinates;
}) {
  const { bodies, start, end, coordinates } = args;

  // const bodiesString = uniqueBodies
  //   .map((body: Body) => symbolByBody[body])
  //   .join(" ");
  // const timespan = `${moment
  //   .tz(start, "America/New_York")
  //   .toISOString(true)} to ${moment
  //   .tz(end, "America/New_York")
  //   .toISOString(true)}`;
  const message = `illumination ephemerides 🌕`;
  print(`🔭 Fetching ${message}`);

  const illuminationEphemerisByBody = {} as Record<Body, IlluminationEphemeris>;
  for await (const body of bodies) {
    illuminationEphemerisByBody[body] = await getIlluminationEphemeris({
      body,
      end,
      start,
      coordinates,
    });
  }

  print(`🔭 Fetched ${message}`);

  return illuminationEphemerisByBody;
}

// #region 🛟 Diameter

function getDiameterEphemerisUrl(args: {
  start: Date;
  end: Date;
  body: DiameterEphemerisBody;
}) {
  const { start, end, body } = args;

  const url = getHorizonsBaseUrl({ start, end });

  url.searchParams.append("EPHEM_TYPE", "OBSERVER");
  url.searchParams.append("QUANTITIES", QUANTITY_ANGULAR_DIAMETER);
  url.searchParams.append("CENTER", "500@399"); // earth, specific location
  url.searchParams.append("COMMAND", commandIdByBody[body]); // moon

  return url;
}

export async function getDiameterEphemeris(args: {
  start: Date;
  end: Date;
  body: DiameterEphemerisBody;
}) {
  const { start, end, body } = args;

  const message = `diameter ephemeris 🛟 for ${symbolByBody[body]}`;
  print(`🔭 Fetching ${message}`);

  const url = getDiameterEphemerisUrl({ start, end, body });
  // print(`🌐 Ephemeris url:`, url.toString());
  const text = await fetch(url.toString()).then((res) => res.text());
  // print(`🏁 Ephemeris response:`, text);
  const ephemeris = parseDiameterEphemeris(text);
  // print(`🐋 ~ ephemeris:`, ephemeris);

  print(`🔭 Fetched ${message}`);

  return ephemeris;
}

export async function getDiameterEphemerisByBody(args: {
  bodies: DiameterEphemerisBody[];
  start: Date;
  end: Date;
}) {
  const { bodies, start, end } = args;

  // const bodiesString = uniqueBodies
  //   .map((body: Body) => symbolByBody[body])
  //   .join(" ");
  // const timespan = `${moment
  //   .tz(start, "America/New_York")
  //   .toISOString(true)} to ${moment
  //   .tz(end, "America/New_York")
  //   .toISOString(true)}`;
  const message = `diameter ephemerides 🛟`;
  print(`🔭 Fetching ${message}`);

  const diameterEphemerisByBody = {} as Record<Body, DiameterEphemeris>;
  for await (const body of bodies) {
    diameterEphemerisByBody[body] = await getDiameterEphemeris({
      body,
      end,
      start,
    });
  }

  print(`🔭 Fetched ${message}`);

  return diameterEphemerisByBody;
}

// #region 📏 Distance

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
}) {
  const { body, end, start } = args;

  // const timespan = `${moment
  //   .tz(start, "America/New_York")
  //   .toISOString(true)} to ${moment
  //   .tz(end, "America/New_York")
  //   .toISOString(true)}`;
  const message = `distance ephemeris 📏 for ${symbolByBody[body]}`;
  print(`🔭 Fetching ${message}`);

  const url = getDistanceEphemerisUrl({ body, end, start });
  // print(`🌐 Ephemeris url:`, url.toString());
  const text = await fetch(url.toString()).then((res) => res.text());
  // print(`🏁 Ephemeris response:`, text);
  const ephemeris = parseDistanceEphemeris(text);
  // print(`🐋 ~ ephemeris:`, ephemeris);

  print(`🔭 Fetched ${message}`);

  return ephemeris;
}

export async function getDistanceEphemerisByBody(args: {
  bodies: DistanceEphemerisBody[];
  start: Date;
  end: Date;
}) {
  const { bodies, start, end } = args;

  // const bodiesString = uniqueBodies
  //   .map((body: Body) => symbolByBody[body])
  //   .join(" ");
  // const timespan = `${moment
  //   .tz(start, "America/New_York")
  //   .toISOString(true)} to ${moment
  //   .tz(end, "America/New_York")
  //   .toISOString(true)}`;
  const message = `distance ephemerides 📏`;
  print(`🔭 Fetching ${message}`);

  const distanceEphemerisByBody = {} as Record<Body, DistanceEphemeris>;
  for await (const body of bodies) {
    distanceEphemerisByBody[body] = await getDistanceEphemeris({
      body,
      end,
      start,
    });
  }

  print(`🔭 Fetched ${message}`);

  return distanceEphemerisByBody;
}
