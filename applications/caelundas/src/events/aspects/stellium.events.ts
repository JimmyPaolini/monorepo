import _ from "lodash";
import type { Moment } from "moment";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type { Body, Stellium, StelliumSymbol, AspectPhase } from "../../types";
import {
  symbolByBody,
  symbolByStellium,
  stelliumBodies,
  orbByAspect,
} from "../../constants";
import { type Event } from "../../calendar.utilities";
import { getAngle, getCombinations } from "../../math.utilities";
import { couldBeStellium } from "./aspects.cache";

type StelliumDescription =
  `${Capitalize<Stellium>}: ${string} (max separation: ${string}°, ${AspectPhase})`;

type StelliumSummary =
  `${StelliumSymbol} ${Capitalize<Stellium>} (${AspectPhase})`;

export interface StelliumEvent extends Event {
  description: StelliumDescription;
  summary: StelliumSummary;
}

// #region Stellium Detection

/**
 * Calculate the tightness of a stellium (maximum separation between any two planets)
 */
function calculateStelliumTightness(args: { longitudes: number[] }): number {
  const { longitudes } = args;

  if (longitudes.length < 3) {
    return Infinity;
  }

  // Sort longitudes
  const sorted = [...longitudes].sort((a, b) => a - b);

  // Calculate maximum separation between any two consecutive planets
  let maxSeparation = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const separation = getAngle(sorted[i], sorted[i + 1]);
    maxSeparation = Math.max(maxSeparation, separation);
  }

  return maxSeparation;
}

/**
 * Detect if a group of planets forms a stellium
 */
function detectStellium(args: {
  bodies: Body[];
  longitudes: number[];
}): boolean {
  const { bodies, longitudes } = args;

  if (bodies.length < 3 || bodies.length !== longitudes.length) {
    return false;
  }

  const tightness = calculateStelliumTightness({ longitudes });

  return tightness <= orbByAspect["conjunct"];
}

/**
 * Get the stellium type name based on the number of planets
 */
function getStelliumType(planetCount: number): Stellium | null {
  switch (planetCount) {
    case 3:
      return "triple stellium";
    case 4:
      return "quadruple stellium";
    case 5:
      return "quintuple stellium";
    case 6:
      return "sextuple stellium";
    case 7:
      return "septuple stellium";
    case 8:
      return "octuple stellium";
    case 9:
      return "nonuple stellium";
    case 10:
      return "decuple stellium";
    case 11:
      return "undecuple stellium";
    case 12:
      return "duodecuple stellium";
    default:
      return null;
  }
}

// #endregion Stellium Detection

// #region Stellium Events

export function getStelliumEvents(args: {
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
  currentMinute: Moment;
}): StelliumEvent[] {
  const { coordinateEphemerisByBody, currentMinute } = args;

  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const events: StelliumEvent[] = [];

  // Check all possible combinations of 3 to 12 planets
  const maxStelliumSize = Math.min(12, stelliumBodies.length);
  for (let size = 3; size <= maxStelliumSize; size++) {
    const combinations = getCombinations(stelliumBodies, size);

    for (const bodies of combinations) {
      const currentLongitudes = bodies.map(
        (body) =>
          coordinateEphemerisByBody[body][currentMinute.toISOString()].longitude
      );

      // Quick pre-filter: skip if planets are too spread out to form a stellium
      if (!couldBeStellium(currentLongitudes, orbByAspect["conjunct"])) {
        continue;
      }

      const isStellium = detectStellium({
        bodies,
        longitudes: currentLongitudes,
      });

      if (!isStellium) {
        continue;
      }

      // Get previous and next longitudes for phase detection
      const previousLongitudes = bodies.map(
        (body) =>
          coordinateEphemerisByBody[body][previousMinute.toISOString()]
            .longitude
      );
      const nextLongitudes = bodies.map(
        (body) =>
          coordinateEphemerisByBody[body][nextMinute.toISOString()].longitude
      );

      const phase = getStelliumPhase({
        currentLongitudes,
        previousLongitudes,
        nextLongitudes,
      });

      if (!phase) {
        continue;
      }

      const stelliumType = getStelliumType(bodies.length);
      if (!stelliumType) {
        continue;
      }

      const tightness = calculateStelliumTightness({
        longitudes: currentLongitudes,
      });

      const bodiesString = bodies
        .map((body) => `${symbolByBody[body]} ${_.startCase(body)}`)
        .join(", ");

      const summary = `${symbolByStellium[stelliumType]} ${_.startCase(
        stelliumType
      )} (${phase})`;

      const description = `${_.startCase(
        stelliumType
      )}: ${bodiesString} (max separation: ${tightness.toFixed(2)}°, ${phase})`;

      const event: StelliumEvent = {
        summary: summary as StelliumSummary,
        description: description as StelliumDescription,
        start: currentMinute.toDate(),
        end: currentMinute.toDate(),
        categories: [
          "Stellium",
          _.startCase(stelliumType),
          _.startCase(phase),
          ...bodies.map(_.startCase),
        ],
      };

      events.push(event);
    }
  }

  return events;
}

/**
 * Determine the phase of a stellium (forming, exact, or dissolving)
 */
function getStelliumPhase(args: {
  currentLongitudes: number[];
  previousLongitudes: number[];
  nextLongitudes: number[];
}): AspectPhase | null {
  const { currentLongitudes, previousLongitudes, nextLongitudes } = args;

  const currentTightness = calculateStelliumTightness({
    longitudes: currentLongitudes,
  });
  const previousTightness = calculateStelliumTightness({
    longitudes: previousLongitudes,
  });
  const nextTightness = calculateStelliumTightness({
    longitudes: nextLongitudes,
  });

  // If tightness is decreasing from previous to current, it's forming (getting tighter)
  const isForming = currentTightness < previousTightness;
  // If tightness is increasing from current to next, it's dissolving (getting looser)
  const isDissolving = nextTightness > currentTightness;

  if (isForming && !isDissolving) {
    return "forming";
  } else if (!isForming && isDissolving) {
    return "dissolving";
  } else if (
    Math.abs(currentTightness - previousTightness) < 0.01 &&
    Math.abs(currentTightness - nextTightness) < 0.01
  ) {
    return "exact";
  }

  return null;
}

// #endregion Stellium Events

// #region Stellium Duration Events

export function getStelliumDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to stellium events only
  const stelliumEvents = events.filter((event) =>
    event.categories.includes("Stellium")
  ) as StelliumEvent[];

  // Group by bodies and stellium type using categories
  const groupedEvents = _.groupBy(stelliumEvents, (event) => {
    const planets = event.categories
      .filter((category) => stelliumBodies.map(_.startCase).includes(category))
      .sort();

    const stelliumType = event.categories.find(
      (category) => category.includes("Stellium") && category !== "Stellium"
    );

    return `${planets.join("-")}_${stelliumType}`;
  });

  // Process each group to find forming/dissolving pairs
  for (const group of Object.values(groupedEvents)) {
    const sortedEvents = _.sortBy(group, "start");

    for (let i = 0; i < sortedEvents.length; i++) {
      const currentEvent = sortedEvents[i];

      // Skip if not a forming event
      if (!currentEvent.categories.includes("Forming")) continue;

      // Look for the next dissolving event
      for (let j = i + 1; j < sortedEvents.length; j++) {
        const potentialDissolvingEvent = sortedEvents[j];

        if (potentialDissolvingEvent.categories.includes("Dissolving")) {
          // Create duration event
          durationEvents.push({
            start: currentEvent.start,
            end: potentialDissolvingEvent.start,
            summary: currentEvent.summary.replace(/\s*\(forming\)$/i, ""),
            description: currentEvent.description.replace(
              /,\s*(forming|exact|dissolving)\)$/i,
              ")"
            ),
            categories: currentEvent.categories.filter(
              (c) => c !== "Forming" && c !== "Exact" && c !== "Dissolving"
            ),
          });

          break; // Found the pair, move to next forming event
        }
      }
    }
  }

  return durationEvents;
}

// #endregion Stellium Duration Events
