import _ from "lodash";
import type { Moment } from "moment";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type { Body, AspectPhase } from "../../types";
import type { SextupleAspectEvent } from "./sextupleAspects.events";
import {
  type AspectEdge,
  parseAspectEvents,
  groupAspectsByType,
  haveAspect,
  determineMultiBodyPhase,
} from "./aspects.composition";
import { symbolBySextupleAspect, symbolByBody } from "../../constants";
import type { Event } from "../../calendar.utilities";

/**
 * Compose Hexagram (Star of David) patterns from stored 2-body aspects
 * Hexagram = 6 bodies forming two interlocking Grand Trines
 */
function composeHexagrams(
  edges: AspectEdge[],
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>,
  currentMinute: Moment
): SextupleAspectEvent[] {
  const events: SextupleAspectEvent[] = [];
  const aspectsByType = groupAspectsByType(edges);
  const trines = aspectsByType.get("trine") || [];
  const sextiles = aspectsByType.get("sextile") || [];

  if (trines.length < 6 || sextiles.length < 6) return events;

  // Collect all unique bodies involved in trines
  const bodiesSet = new Set<Body>();
  for (const edge of trines) {
    bodiesSet.add(edge.body1);
    bodiesSet.add(edge.body2);
  }
  const bodies = Array.from(bodiesSet);

  if (bodies.length < 6) return events;

  // Try all combinations of 6 bodies
  const combinations = getCombinations(bodies, 6);

  for (const combo of combinations) {
    // In a hexagram (Star of David):
    // - Bodies 0, 2, 4 form a grand trine
    // - Bodies 1, 3, 5 form another grand trine
    // - Adjacent bodies are sextile: 0-1, 1-2, 2-3, 3-4, 4-5, 5-0

    const hasFirstTrine =
      haveAspect(combo[0], combo[2], "trine", edges) &&
      haveAspect(combo[0], combo[4], "trine", edges) &&
      haveAspect(combo[2], combo[4], "trine", edges);

    if (!hasFirstTrine) continue;

    const hasSecondTrine =
      haveAspect(combo[1], combo[3], "trine", edges) &&
      haveAspect(combo[1], combo[5], "trine", edges) &&
      haveAspect(combo[3], combo[5], "trine", edges);

    if (!hasSecondTrine) continue;

    const hasSextiles =
      haveAspect(combo[0], combo[1], "sextile", edges) &&
      haveAspect(combo[1], combo[2], "sextile", edges) &&
      haveAspect(combo[2], combo[3], "sextile", edges) &&
      haveAspect(combo[3], combo[4], "sextile", edges) &&
      haveAspect(combo[4], combo[5], "sextile", edges) &&
      haveAspect(combo[5], combo[0], "sextile", edges);

    if (hasSextiles) {
      // Found a Hexagram!
      const calculateTightness = (longitudes: number[]) => {
        // Deviation from ideal hexagram (60° increments)
        let totalDeviation = 0;
        for (let i = 0; i < 6; i++) {
          const nextI = (i + 1) % 6;
          const angle = Math.abs(longitudes[i] - longitudes[nextI]);
          const normalized = angle > 180 ? 360 - angle : angle;
          totalDeviation += Math.abs(normalized - 60);
        }
        return totalDeviation;
      };

      const relatedEdges = [...trines, ...sextiles].filter((edge) =>
        combo.includes(edge.body1 as Body)
      );

      const phaseInfo = determineMultiBodyPhase(
        relatedEdges,
        coordinateEphemerisByBody,
        currentMinute,
        calculateTightness,
        combo,
        // Check if Hexagram pattern exists at given longitudes
        (longitudes) => {
          const orb = 8;
          // Check two grand trines (0,2,4 and 1,3,5)
          const trine1 = [
            [0, 2],
            [0, 4],
            [2, 4],
          ];
          const trine2 = [
            [1, 3],
            [1, 5],
            [3, 5],
          ];
          // Check sextiles between adjacent bodies
          const sextiles = [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 4],
            [4, 5],
            [5, 0],
          ];

          for (const [i, j] of trine1) {
            const angle = Math.abs(longitudes[i] - longitudes[j]);
            const normalized = angle > 180 ? 360 - angle : angle;
            if (Math.abs(normalized - 120) >= orb) return false;
          }

          for (const [i, j] of trine2) {
            const angle = Math.abs(longitudes[i] - longitudes[j]);
            const normalized = angle > 180 ? 360 - angle : angle;
            if (Math.abs(normalized - 120) >= orb) return false;
          }

          for (const [i, j] of sextiles) {
            const angle = Math.abs(longitudes[i] - longitudes[j]);
            const normalized = angle > 180 ? 360 - angle : angle;
            if (Math.abs(normalized - 60) >= orb) return false;
          }

          return true;
        }
      );

      if (phaseInfo) {
        events.push(
          createSextupleAspectEvent({
            timestamp: currentMinute.toDate(),
            body1: combo[0],
            body2: combo[1],
            body3: combo[2],
            body4: combo[3],
            body5: combo[4],
            body6: combo[5],
            sextupleAspect: "hexagram",
            phase: phaseInfo.phase,
          })
        );
      }
    }
  }

  return events;
}

/**
 * Helper to get combinations of k items from array
 */
function getCombinations<T>(array: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > array.length) return [];

  const result: T[][] = [];
  for (let i = 0; i <= array.length - k; i++) {
    const head = array[i];
    const tailCombos = getCombinations(array.slice(i + 1), k - 1);
    for (const combo of tailCombos) {
      result.push([head, ...combo]);
    }
  }
  return result;
}

/**
 * Create a sextuple aspect event
 */
function createSextupleAspectEvent(params: {
  timestamp: Date;
  body1: Body;
  body2: Body;
  body3: Body;
  body4: Body;
  body5: Body;
  body6: Body;
  sextupleAspect: "hexagram";
  phase: AspectPhase;
}): SextupleAspectEvent {
  const {
    timestamp,
    body1,
    body2,
    body3,
    body4,
    body5,
    body6,
    sextupleAspect,
    phase,
  } = params;

  const body1Capitalized = _.startCase(body1);
  const body2Capitalized = _.startCase(body2);
  const body3Capitalized = _.startCase(body3);
  const body4Capitalized = _.startCase(body4);
  const body5Capitalized = _.startCase(body5);
  const body6Capitalized = _.startCase(body6);

  const body1Symbol = symbolByBody[body1];
  const body2Symbol = symbolByBody[body2];
  const body3Symbol = symbolByBody[body3];
  const body4Symbol = symbolByBody[body4];
  const body5Symbol = symbolByBody[body5];
  const body6Symbol = symbolByBody[body6];
  const sextupleAspectSymbol = symbolBySextupleAspect[sextupleAspect];

  const bodiesSorted = [
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
    body4Capitalized,
    body5Capitalized,
    body6Capitalized,
  ].sort();

  const description = `${bodiesSorted.join(", ")} ${sextupleAspect} ${phase}`;

  let phaseEmoji = "";
  if (phase === "forming") phaseEmoji = "➡️ ";
  else if (phase === "exact") phaseEmoji = "🎯 ";
  else if (phase === "dissolving") phaseEmoji = "⬅️ ";

  const summary = `${phaseEmoji}${sextupleAspectSymbol} ${body1Symbol}-${body2Symbol}-${body3Symbol}-${body4Symbol}-${body5Symbol}-${body6Symbol} ${description}`;

  const categories = [
    "Astronomy",
    "Astrology",
    "Compound Aspect",
    "Sextuple Aspect",
    _.startCase(sextupleAspect),
    _.startCase(phase),
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
    body4Capitalized,
    body5Capitalized,
    body6Capitalized,
  ];

  return {
    start: timestamp,
    end: timestamp,
    description: description as any,
    summary: summary as any,
    categories,
  };
}

/**
 * Main entry point: compose all sextuple aspect events from stored 2-body aspects
 */
export function composeSextupleAspectEvents(
  aspectEvents: Event[],
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>,
  currentMinute: Moment
): SextupleAspectEvent[] {
  const edges = parseAspectEvents(aspectEvents);
  const events: SextupleAspectEvent[] = [];

  events.push(
    ...composeHexagrams(edges, coordinateEphemerisByBody, currentMinute)
  );

  return events;
}
