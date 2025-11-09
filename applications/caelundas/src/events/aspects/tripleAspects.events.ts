import fs from "fs";
import _ from "lodash";
import type { Moment } from "moment";
import type { EventTemplate } from "../../calendar.utilities";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import {
  Body,
  BodySymbol,
  TripleAspect,
  TripleAspectSymbol,
  symbolByBody,
  symbolByTripleAspect,
  TRIPLE_ASPECT_BODIES,
} from "../../constants";
import { type Event, getCalendar } from "../../calendar.utilities";
import { isAspect } from "./aspects.utilities";
import { getAngle } from "../../math.utilities";
import { upsertEvents } from "../../database.utilities";
import { getOutputPath } from "../../output.utilities";

export type TripleAspectPhase = "forming" | "exact" | "dissolving";

type TripleAspectDescription = string;

type TripleAspectSummary =
  `${TripleAspectSymbol} ${BodySymbol}-${BodySymbol}-${BodySymbol} ${string}`;

export interface TripleAspectEventTemplate extends EventTemplate {
  description: TripleAspectDescription;
  summary: TripleAspectSummary;
}

export interface TripleAspectEvent extends Event {
  description: TripleAspectDescription;
  summary: TripleAspectSummary;
}

// #region T-Square

function calculateTSquareTightness(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
}): number {
  const { longitude1, longitude2, longitude3 } = args;

  const angle12 = getAngle(longitude1, longitude2);
  const angle13 = getAngle(longitude1, longitude3);
  const angle23 = getAngle(longitude2, longitude3);

  // Find which configuration gives the smallest total deviation
  const deviations = [
    Math.abs(angle12 - 180) + Math.abs(angle13 - 90) + Math.abs(angle23 - 90),
    Math.abs(angle13 - 180) + Math.abs(angle12 - 90) + Math.abs(angle23 - 90),
    Math.abs(angle23 - 180) + Math.abs(angle12 - 90) + Math.abs(angle13 - 90),
  ];
  return Math.min(...deviations);
}

function detectTSquare(args: {
  body1: Body;
  body2: Body;
  body3: Body;
  longitude1: number;
  longitude2: number;
  longitude3: number;
}): { isTSquare: boolean; focalBody?: Body } {
  const { body1, body2, body3, longitude1, longitude2, longitude3 } = args;

  // Check if body1 and body2 are in opposition, both square to body3
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "square",
    })
  ) {
    return { isTSquare: true, focalBody: body3 };
  }

  // Check if body1 and body3 are in opposition, both square to body2
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude2,
      aspect: "square",
    })
  ) {
    return { isTSquare: true, focalBody: body2 };
  }

  // Check if body2 and body3 are in opposition, both square to body1
  if (
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "opposite",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude1,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude1,
      aspect: "square",
    })
  ) {
    return { isTSquare: true, focalBody: body1 };
  }

  return { isTSquare: false };
}

// #region Grand Trine

function calculateGrandTrineTightness(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
}): number {
  const { longitude1, longitude2, longitude3 } = args;

  const angle12 = getAngle(longitude1, longitude2);
  const angle13 = getAngle(longitude1, longitude3);
  const angle23 = getAngle(longitude2, longitude3);

  return (
    Math.abs(angle12 - 120) + Math.abs(angle13 - 120) + Math.abs(angle23 - 120)
  );
}

function detectGrandTrine(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
}): boolean {
  const { longitude1, longitude2, longitude3 } = args;

  return (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "trine",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "trine",
    })
  );
}

// #region Yod

function calculateYodTightness(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
}): number {
  const { longitude1, longitude2, longitude3 } = args;

  const angle12 = getAngle(longitude1, longitude2);
  const angle13 = getAngle(longitude1, longitude3);
  const angle23 = getAngle(longitude2, longitude3);

  // Find which configuration gives the smallest total deviation
  const deviations = [
    Math.abs(angle12 - 60) + Math.abs(angle13 - 150) + Math.abs(angle23 - 150),
    Math.abs(angle13 - 60) + Math.abs(angle12 - 150) + Math.abs(angle23 - 150),
    Math.abs(angle23 - 60) + Math.abs(angle12 - 150) + Math.abs(angle13 - 150),
  ];
  return Math.min(...deviations);
}

function detectYod(args: {
  body1: Body;
  body2: Body;
  body3: Body;
  longitude1: number;
  longitude2: number;
  longitude3: number;
}): { isYod: boolean; apexBody?: Body } {
  const { body1, body2, body3, longitude1, longitude2, longitude3 } = args;

  // Check if body1 and body2 are sextile, both quincunx to body3
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "quincunx",
    })
  ) {
    return { isYod: true, apexBody: body3 };
  }

  // Check if body1 and body3 are sextile, both quincunx to body2
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude2,
      aspect: "quincunx",
    })
  ) {
    return { isYod: true, apexBody: body2 };
  }

  // Check if body2 and body3 are sextile, both quincunx to body1
  if (
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "sextile",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude1,
      aspect: "quincunx",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude1,
      aspect: "quincunx",
    })
  ) {
    return { isYod: true, apexBody: body1 };
  }

  return { isYod: false };
}

// #endregion Yod

// #region Thor's Hammer

function calculateThorsHammerTightness(args: {
  longitude1: number;
  longitude2: number;
  longitude3: number;
}): number {
  const { longitude1, longitude2, longitude3 } = args;

  // Thor's Hammer: 2 planets square to each other, both sesquisquare (135°) to a 3rd focal planet
  const angle12 = getAngle(longitude1, longitude2);
  const angle13 = getAngle(longitude1, longitude3);
  const angle23 = getAngle(longitude2, longitude3);

  // Find which configuration gives the smallest total deviation
  // Configuration 1: body1 and body2 square, both sesquisquare to body3
  const dev1 =
    Math.abs(angle12 - 90) + Math.abs(angle13 - 135) + Math.abs(angle23 - 135);

  // Configuration 2: body1 and body3 square, both sesquisquare to body2
  const dev2 =
    Math.abs(angle13 - 90) + Math.abs(angle12 - 135) + Math.abs(angle23 - 135);

  // Configuration 3: body2 and body3 square, both sesquisquare to body1
  const dev3 =
    Math.abs(angle23 - 90) + Math.abs(angle12 - 135) + Math.abs(angle13 - 135);

  return Math.min(dev1, dev2, dev3);
}

function detectThorsHammer(args: {
  body1: Body;
  body2: Body;
  body3: Body;
  longitude1: number;
  longitude2: number;
  longitude3: number;
}): { isThorsHammer: boolean; focalBody?: Body } {
  const { body1, body2, body3, longitude1, longitude2, longitude3 } = args;

  // Check if body1 and body2 are square, both sesquisquare to body3 (focal)
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "sesquiquadrate",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "sesquiquadrate",
    })
  ) {
    return { isThorsHammer: true, focalBody: body3 };
  }

  // Check if body1 and body3 are square, both sesquisquare to body2 (focal)
  if (
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude3,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude1,
      longitudeBody2: longitude2,
      aspect: "sesquiquadrate",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude2,
      aspect: "sesquiquadrate",
    })
  ) {
    return { isThorsHammer: true, focalBody: body2 };
  }

  // Check if body2 and body3 are square, both sesquisquare to body1 (focal)
  if (
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude3,
      aspect: "square",
    }) &&
    isAspect({
      longitudeBody1: longitude2,
      longitudeBody2: longitude1,
      aspect: "sesquiquadrate",
    }) &&
    isAspect({
      longitudeBody1: longitude3,
      longitudeBody2: longitude1,
      aspect: "sesquiquadrate",
    })
  ) {
    return { isThorsHammer: true, focalBody: body1 };
  }

  return { isThorsHammer: false };
}

// #endregion Thor's Hammer

// #region Triple Aspects

function calculatePatternTightness(args: {
  pattern: TripleAspect;
  longitude1: number;
  longitude2: number;
  longitude3: number;
}): number {
  const { pattern, longitude1, longitude2, longitude3 } = args;

  if (pattern === "t-square") {
    return calculateTSquareTightness({ longitude1, longitude2, longitude3 });
  } else if (pattern === "grand trine") {
    return calculateGrandTrineTightness({ longitude1, longitude2, longitude3 });
  } else if (pattern === "yod") {
    return calculateYodTightness({ longitude1, longitude2, longitude3 });
  } else if (pattern === "thor's hammer") {
    return calculateThorsHammerTightness({
      longitude1,
      longitude2,
      longitude3,
    });
  }

  return 0;
}

export function getTripleAspectEvents(args: {
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  currentMinute: Moment;
}) {
  const { coordinateEphemerisByBody, currentMinute } = args;
  const tripleAspectBodies = TRIPLE_ASPECT_BODIES;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const tripleAspectEvents: TripleAspectEvent[] = [];

  // Check all combinations of 3 bodies
  for (let i = 0; i < tripleAspectBodies.length; i++) {
    for (let j = i + 1; j < tripleAspectBodies.length; j++) {
      for (let k = j + 1; k < tripleAspectBodies.length; k++) {
        const body1 = tripleAspectBodies[i];
        const body2 = tripleAspectBodies[j];
        const body3 = tripleAspectBodies[k];

        const ephemerisBody1 = coordinateEphemerisByBody[body1];
        const ephemerisBody2 = coordinateEphemerisByBody[body2];
        const ephemerisBody3 = coordinateEphemerisByBody[body3];

        const { longitude: currentLongitude1 } =
          ephemerisBody1[currentMinute.toISOString()];
        const { longitude: currentLongitude2 } =
          ephemerisBody2[currentMinute.toISOString()];
        const { longitude: currentLongitude3 } =
          ephemerisBody3[currentMinute.toISOString()];

        const { longitude: previousLongitude1 } =
          ephemerisBody1[previousMinute.toISOString()];
        const { longitude: previousLongitude2 } =
          ephemerisBody2[previousMinute.toISOString()];
        const { longitude: previousLongitude3 } =
          ephemerisBody3[previousMinute.toISOString()];

        const { longitude: nextLongitude1 } =
          ephemerisBody1[nextMinute.toISOString()];
        const { longitude: nextLongitude2 } =
          ephemerisBody2[nextMinute.toISOString()];
        const { longitude: nextLongitude3 } =
          ephemerisBody3[nextMinute.toISOString()];

        // Check for T-Square
        const currentTSquare = detectTSquare({
          body1,
          body2,
          body3,
          longitude1: currentLongitude1,
          longitude2: currentLongitude2,
          longitude3: currentLongitude3,
        });

        if (currentTSquare.isTSquare && currentTSquare.focalBody) {
          const previousTSquare = detectTSquare({
            body1,
            body2,
            body3,
            longitude1: previousLongitude1,
            longitude2: previousLongitude2,
            longitude3: previousLongitude3,
          });

          const nextTSquare = detectTSquare({
            body1,
            body2,
            body3,
            longitude1: nextLongitude1,
            longitude2: nextLongitude2,
            longitude3: nextLongitude3,
          });

          const phase = getTripleAspectPhase({
            pattern: "t-square",
            previousLongitude1,
            previousLongitude2,
            previousLongitude3,
            currentLongitude1,
            currentLongitude2,
            currentLongitude3,
            nextLongitude1,
            nextLongitude2,
            nextLongitude3,
            previousExists: previousTSquare.isTSquare,
            currentExists: currentTSquare.isTSquare,
            nextExists: nextTSquare.isTSquare,
          });

          if (phase) {
            tripleAspectEvents.push(
              getTripleAspectEvent({
                timestamp: currentMinute.toDate(),
                body1,
                body2,
                body3,
                tripleAspect: "t-square",
                focalOrApexBody: currentTSquare.focalBody,
                phase,
              })
            );
          }
        }

        // Check for Grand Trine
        const currentGrandTrine = detectGrandTrine({
          longitude1: currentLongitude1,
          longitude2: currentLongitude2,
          longitude3: currentLongitude3,
        });

        if (currentGrandTrine) {
          const previousGrandTrine = detectGrandTrine({
            longitude1: previousLongitude1,
            longitude2: previousLongitude2,
            longitude3: previousLongitude3,
          });

          const nextGrandTrine = detectGrandTrine({
            longitude1: nextLongitude1,
            longitude2: nextLongitude2,
            longitude3: nextLongitude3,
          });

          const phase = getTripleAspectPhase({
            pattern: "grand trine",
            previousLongitude1,
            previousLongitude2,
            previousLongitude3,
            currentLongitude1,
            currentLongitude2,
            currentLongitude3,
            nextLongitude1,
            nextLongitude2,
            nextLongitude3,
            previousExists: previousGrandTrine,
            currentExists: currentGrandTrine,
            nextExists: nextGrandTrine,
          });

          if (phase) {
            tripleAspectEvents.push(
              getTripleAspectEvent({
                timestamp: currentMinute.toDate(),
                body1,
                body2,
                body3,
                tripleAspect: "grand trine",
                phase,
              })
            );
          }
        }

        // Check for Yod
        const currentYod = detectYod({
          body1,
          body2,
          body3,
          longitude1: currentLongitude1,
          longitude2: currentLongitude2,
          longitude3: currentLongitude3,
        });

        if (currentYod.isYod && currentYod.apexBody) {
          const previousYod = detectYod({
            body1,
            body2,
            body3,
            longitude1: previousLongitude1,
            longitude2: previousLongitude2,
            longitude3: previousLongitude3,
          });

          const nextYod = detectYod({
            body1,
            body2,
            body3,
            longitude1: nextLongitude1,
            longitude2: nextLongitude2,
            longitude3: nextLongitude3,
          });

          const phase = getTripleAspectPhase({
            pattern: "yod",
            previousLongitude1,
            previousLongitude2,
            previousLongitude3,
            currentLongitude1,
            currentLongitude2,
            currentLongitude3,
            nextLongitude1,
            nextLongitude2,
            nextLongitude3,
            previousExists: previousYod.isYod,
            currentExists: currentYod.isYod,
            nextExists: nextYod.isYod,
          });

          if (phase) {
            tripleAspectEvents.push(
              getTripleAspectEvent({
                timestamp: currentMinute.toDate(),
                body1,
                body2,
                body3,
                tripleAspect: "yod",
                focalOrApexBody: currentYod.apexBody,
                phase,
              })
            );
          }
        }

        // Check for Thor's Hammer
        const currentThorsHammer = detectThorsHammer({
          body1,
          body2,
          body3,
          longitude1: currentLongitude1,
          longitude2: currentLongitude2,
          longitude3: currentLongitude3,
        });

        if (currentThorsHammer.isThorsHammer && currentThorsHammer.focalBody) {
          const previousThorsHammer = detectThorsHammer({
            body1,
            body2,
            body3,
            longitude1: previousLongitude1,
            longitude2: previousLongitude2,
            longitude3: previousLongitude3,
          });

          const nextThorsHammer = detectThorsHammer({
            body1,
            body2,
            body3,
            longitude1: nextLongitude1,
            longitude2: nextLongitude2,
            longitude3: nextLongitude3,
          });

          const phase = getTripleAspectPhase({
            pattern: "thor's hammer",
            previousLongitude1,
            previousLongitude2,
            previousLongitude3,
            currentLongitude1,
            currentLongitude2,
            currentLongitude3,
            nextLongitude1,
            nextLongitude2,
            nextLongitude3,
            previousExists: previousThorsHammer.isThorsHammer,
            currentExists: currentThorsHammer.isThorsHammer,
            nextExists: nextThorsHammer.isThorsHammer,
          });

          if (phase) {
            tripleAspectEvents.push(
              getTripleAspectEvent({
                timestamp: currentMinute.toDate(),
                body1,
                body2,
                body3,
                tripleAspect: "thor's hammer",
                focalOrApexBody: currentThorsHammer.focalBody,
                phase,
              })
            );
          }
        }
      }
    }
  }

  return tripleAspectEvents;
}

function getTripleAspectPhase(args: {
  pattern: TripleAspect;
  previousLongitude1: number;
  previousLongitude2: number;
  previousLongitude3: number;
  currentLongitude1: number;
  currentLongitude2: number;
  currentLongitude3: number;
  nextLongitude1: number;
  nextLongitude2: number;
  nextLongitude3: number;
  previousExists: boolean;
  currentExists: boolean;
  nextExists: boolean;
}): TripleAspectPhase | null {
  const {
    pattern,
    previousLongitude1,
    previousLongitude2,
    previousLongitude3,
    currentLongitude1,
    currentLongitude2,
    currentLongitude3,
    nextLongitude1,
    nextLongitude2,
    nextLongitude3,
    previousExists,
    currentExists,
    nextExists,
  } = args;

  if (!currentExists) return null;

  const previousTightness = previousExists
    ? calculatePatternTightness({
        pattern,
        longitude1: previousLongitude1,
        longitude2: previousLongitude2,
        longitude3: previousLongitude3,
      })
    : Infinity;

  const currentTightness = calculatePatternTightness({
    pattern,
    longitude1: currentLongitude1,
    longitude2: currentLongitude2,
    longitude3: currentLongitude3,
  });

  const nextTightness = nextExists
    ? calculatePatternTightness({
        pattern,
        longitude1: nextLongitude1,
        longitude2: nextLongitude2,
        longitude3: nextLongitude3,
      })
    : Infinity;

  if (
    currentTightness < previousTightness &&
    currentTightness < nextTightness
  ) {
    return "exact";
  }

  if (!previousExists && currentExists) {
    return "forming";
  }

  if (currentExists && !nextExists) {
    return "dissolving";
  }

  return null;
}

// #region Events

function getTripleAspectEvent(args: {
  timestamp: Date;
  body1: Body;
  body2: Body;
  body3: Body;
  tripleAspect: TripleAspect;
  focalOrApexBody?: Body;
  phase: TripleAspectPhase;
}): TripleAspectEvent {
  const {
    timestamp,
    body1,
    body2,
    body3,
    tripleAspect,
    focalOrApexBody,
    phase,
  } = args;

  const body1Capitalized = _.startCase(body1) as Capitalize<Body>;
  const body2Capitalized = _.startCase(body2) as Capitalize<Body>;
  const body3Capitalized = _.startCase(body3) as Capitalize<Body>;

  const body1Symbol = symbolByBody[body1] as BodySymbol;
  const body2Symbol = symbolByBody[body2] as BodySymbol;
  const body3Symbol = symbolByBody[body3] as BodySymbol;
  const tripleAspectSymbol = symbolByTripleAspect[
    tripleAspect
  ] as TripleAspectSymbol;

  // Sort bodies alphabetically for consistent event naming
  const bodiesSorted = [
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
  ].sort();

  const description =
    `${bodiesSorted[0]}, ${bodiesSorted[1]}, ${bodiesSorted[2]} ${tripleAspect} ${phase}` as TripleAspectDescription;

  let extraInfo = "";
  if (focalOrApexBody) {
    const focalCapitalized = _.startCase(focalOrApexBody) as Capitalize<Body>;
    if (tripleAspect === "t-square") {
      extraInfo = ` (focal: ${focalCapitalized})`;
    } else if (tripleAspect === "yod") {
      extraInfo = ` (apex: ${focalCapitalized})`;
    }
  }

  // Add phase emoji
  let phaseEmoji = "";
  if (phase === "forming") {
    phaseEmoji = "➡️ ";
  } else if (phase === "exact") {
    phaseEmoji = "🎯 ";
  } else if (phase === "dissolving") {
    phaseEmoji = "⬅️ ";
  }

  const summary = `${phaseEmoji}${tripleAspectSymbol} ${body1Symbol}-${body2Symbol}-${body3Symbol} ${description}${extraInfo}`;

  console.log(`${summary} at ${timestamp.toISOString()}`);

  const categories = [
    "Astronomy",
    "Astrology",
    "Triple Aspect",
    _.startCase(tripleAspect),
    _.startCase(phase),
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
  ];

  if (focalOrApexBody) {
    categories.push(`Focal: ${_.startCase(focalOrApexBody)}`);
  }

  const tripleAspectEvent: TripleAspectEvent = {
    start: timestamp,
    description,
    summary: summary as TripleAspectSummary,
    categories,
  };

  return tripleAspectEvent;
}

export function writeTripleAspectEvents(args: {
  end: Date;
  tripleAspectBodies: Body[];
  tripleAspectEvents: TripleAspectEvent[];
  start: Date;
}) {
  const { end, tripleAspectEvents, tripleAspectBodies, start } = args;
  if (_.isEmpty(tripleAspectEvents)) return;

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${tripleAspectEvents.length} triple aspect events from ${timespan}`;
  console.log(`🔺 Writing ${message}`);

  upsertEvents(tripleAspectEvents);

  const tripleAspectBodiesString = tripleAspectBodies.join(",");
  const tripleAspectsCalendar = getCalendar({
    events: tripleAspectEvents,
    name: "Triple Aspect 🔺",
  });
  fs.writeFileSync(
    getOutputPath(`triple-aspects_${tripleAspectBodiesString}_${timespan}.ics`),
    new TextEncoder().encode(tripleAspectsCalendar)
  );

  console.log(`🔺 Wrote ${message}`);
}

// #region Duration Events

export function getTripleAspectDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to triple aspect events only
  const tripleAspectEvents = events.filter((event) =>
    event.categories.includes("Triple Aspect")
  ) as TripleAspectEvent[];

  // Group by body triplet and aspect type using categories
  const groupedEvents = _.groupBy(tripleAspectEvents, (event) => {
    const planets = event.categories
      .filter((category) =>
        TRIPLE_ASPECT_BODIES.map(_.startCase).includes(category)
      )
      .sort();

    const aspect = event.categories.find((category) =>
      ["T Square", "Grand Trine", "Yod"].includes(category)
    );

    if (planets.length === 3 && aspect) {
      return `${planets[0]}-${planets[1]}-${planets[2]}-${aspect}`;
    }
    return "";
  });

  // Process each group
  for (const [key, groupEvents] of Object.entries(groupedEvents)) {
    if (!key) continue;

    const formingEvents = groupEvents.filter((event) =>
      event.categories.includes("Forming")
    );
    const dissolvingEvents = groupEvents.filter((event) =>
      event.categories.includes("Dissolving")
    );

    // Sort events by start time
    formingEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
    dissolvingEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Pair forming and dissolving events
    const minLength = Math.min(formingEvents.length, dissolvingEvents.length);

    for (let i = 0; i < minLength; i++) {
      const forming = formingEvents[i];
      const dissolving = dissolvingEvents[i];

      // Only create duration if dissolving comes after forming
      if (dissolving.start.getTime() > forming.start.getTime()) {
        durationEvents.push(getTripleAspectDurationEvent(forming, dissolving));
      }
    }
  }

  return durationEvents;
}

function getTripleAspectDurationEvent(
  beginning: TripleAspectEvent,
  ending: TripleAspectEvent
): Event {
  const categories = beginning.categories || [];

  const bodiesCapitalized = categories
    .filter((category) =>
      TRIPLE_ASPECT_BODIES.map(_.startCase).includes(category)
    )
    .sort();

  const aspectCapitalized = categories.find((category) =>
    ["T Square", "Grand Trine", "Yod"].includes(category)
  );

  if (bodiesCapitalized.length !== 3 || !aspectCapitalized) {
    throw new Error(
      `Could not extract triple aspect info from categories: ${categories.join(
        ", "
      )}`
    );
  }

  const body1Capitalized = bodiesCapitalized[0];
  const body2Capitalized = bodiesCapitalized[1];
  const body3Capitalized = bodiesCapitalized[2];

  // Convert aspect name back to the key format
  const aspectMap: Record<string, TripleAspect> = {
    "T Square": "t-square",
    "Grand Trine": "grand trine",
    Yod: "yod",
  };
  const aspect = aspectMap[aspectCapitalized];

  const body1 = body1Capitalized.toLowerCase() as Body;
  const body2 = body2Capitalized.toLowerCase() as Body;
  const body3 = body3Capitalized.toLowerCase() as Body;

  const body1Symbol = symbolByBody[body1] as BodySymbol;
  const body2Symbol = symbolByBody[body2] as BodySymbol;
  const body3Symbol = symbolByBody[body3] as BodySymbol;
  const aspectSymbol = symbolByTripleAspect[aspect] as TripleAspectSymbol;

  // Extract focal/apex info if present
  const focalCategory = categories.find((cat) => cat.startsWith("Focal: "));
  let extraInfo = "";
  if (focalCategory) {
    const focalBody = focalCategory.replace("Focal: ", "");
    if (aspect === "t-square") {
      extraInfo = ` (focal: ${focalBody})`;
    } else if (aspect === "yod") {
      extraInfo = ` (apex: ${focalBody})`;
    }
  }

  return {
    start: beginning.start,
    end: ending.start,
    summary: `${aspectSymbol} ${body1Symbol}-${body2Symbol}-${body3Symbol} ${body1Capitalized}, ${body2Capitalized}, ${body3Capitalized} ${aspect}${extraInfo}`,
    description:
      `${body1Capitalized}, ${body2Capitalized}, ${body3Capitalized} ${aspect}` as TripleAspectDescription,
    categories: [
      "Astronomy",
      "Astrology",
      "Triple Aspect",
      aspectCapitalized,
      body1Capitalized,
      body2Capitalized,
      body3Capitalized,
    ],
  };
}
