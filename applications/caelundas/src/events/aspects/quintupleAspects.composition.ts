import _ from "lodash";
import type { Moment } from "moment";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type { Body, AspectPhase } from "../../types";
import type { QuintupleAspectEvent } from "./quintupleAspects.events";
import {
  type AspectEdge,
  parseAspectEvents,
  groupAspectsByType,
  haveAspect,
  determineMultiBodyPhase,
} from "./aspects.composition";
import { symbolByQuintupleAspect, symbolByBody } from "../../constants";
import type { Event } from "../../calendar.utilities";

/**
 * Compose Pentagram patterns from stored 2-body aspects
 * Pentagram = 5 bodies forming a 5-pointed star with 5 quintiles
 */
function composePentagrams(
  edges: AspectEdge[],
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>,
  currentMinute: Moment
): QuintupleAspectEvent[] {
  const events: QuintupleAspectEvent[] = [];
  const aspectsByType = groupAspectsByType(edges);
  const quintiles = aspectsByType.get("quintile") || [];

  if (quintiles.length < 5) return events;

  // Collect all unique bodies involved in quintiles
  const bodiesSet = new Set<Body>();
  for (const edge of quintiles) {
    bodiesSet.add(edge.body1);
    bodiesSet.add(edge.body2);
  }
  const bodies = Array.from(bodiesSet);

  if (bodies.length < 5) return events;

  // Try all combinations of 5 bodies
  const combinations = getCombinations(bodies, 5);

  for (const combo of combinations) {
    // In a pentagram, we need exactly 5 quintiles connecting:
    // body[0]-body[2], body[1]-body[3], body[2]-body[4], body[3]-body[0], body[4]-body[1]
    const hasAllQuintiles =
      haveAspect(combo[0], combo[2], "quintile", edges) &&
      haveAspect(combo[1], combo[3], "quintile", edges) &&
      haveAspect(combo[2], combo[4], "quintile", edges) &&
      haveAspect(combo[3], combo[0], "quintile", edges) &&
      haveAspect(combo[4], combo[1], "quintile", edges);

    if (hasAllQuintiles) {
      // Found a Pentagram
      const calculateTightness = (longitudes: number[]) => {
        // Deviation from ideal pentagram (72° increments)
        let totalDeviation = 0;
        for (let i = 0; i < 5; i++) {
          const nextI = (i + 2) % 5; // Skip one position for quintile
          const angle = Math.abs(longitudes[i] - longitudes[nextI]);
          const normalized = angle > 180 ? 360 - angle : angle;
          totalDeviation += Math.abs(normalized - 144); // Quintile is 144°
        }
        return totalDeviation;
      };

      const relatedEdges = quintiles.filter((edge) =>
        combo.includes(edge.body1 as Body)
      );

      const phaseInfo = determineMultiBodyPhase(
        relatedEdges,
        coordinateEphemerisByBody,
        currentMinute,
        calculateTightness,
        combo,
        // Check if Pentagram pattern exists at given longitudes
        (longitudes) => {
          const orb = 8;
          // Check all quintile connections in star pattern
          const checks = [
            [0, 2],
            [1, 3],
            [2, 4],
            [3, 0],
            [4, 1],
          ];
          for (const [i, j] of checks) {
            const angle = Math.abs(longitudes[i] - longitudes[j]);
            const normalized = angle > 180 ? 360 - angle : angle;
            if (Math.abs(normalized - 144) >= orb) return false;
          }
          return true;
        }
      );

      if (phaseInfo) {
        events.push(
          createQuintupleAspectEvent({
            timestamp: currentMinute.toDate(),
            body1: combo[0],
            body2: combo[1],
            body3: combo[2],
            body4: combo[3],
            body5: combo[4],
            quintupleAspect: "pentagram",
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
 * Create a quintuple aspect event
 */
function createQuintupleAspectEvent(params: {
  timestamp: Date;
  body1: Body;
  body2: Body;
  body3: Body;
  body4: Body;
  body5: Body;
  quintupleAspect: "pentagram";
  phase: AspectPhase;
}): QuintupleAspectEvent {
  const {
    timestamp,
    body1,
    body2,
    body3,
    body4,
    body5,
    quintupleAspect,
    phase,
  } = params;

  const body1Capitalized = _.startCase(body1);
  const body2Capitalized = _.startCase(body2);
  const body3Capitalized = _.startCase(body3);
  const body4Capitalized = _.startCase(body4);
  const body5Capitalized = _.startCase(body5);

  const body1Symbol = symbolByBody[body1];
  const body2Symbol = symbolByBody[body2];
  const body3Symbol = symbolByBody[body3];
  const body4Symbol = symbolByBody[body4];
  const body5Symbol = symbolByBody[body5];
  const quintupleAspectSymbol = symbolByQuintupleAspect[quintupleAspect];

  const bodiesSorted = [
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
    body4Capitalized,
    body5Capitalized,
  ].sort();

  const description = `${bodiesSorted.join(", ")} ${quintupleAspect} ${phase}`;

  let phaseEmoji = "";
  if (phase === "forming") phaseEmoji = "➡️ ";
  else if (phase === "exact") phaseEmoji = "🎯 ";
  else if (phase === "dissolving") phaseEmoji = "⬅️ ";

  const summary = `${phaseEmoji}${quintupleAspectSymbol} ${body1Symbol}-${body2Symbol}-${body3Symbol}-${body4Symbol}-${body5Symbol} ${description}`;

  const categories = [
    "Astronomy",
    "Astrology",
    "Compound Aspect",
    "Quintuple Aspect",
    _.startCase(quintupleAspect),
    _.startCase(phase),
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
    body4Capitalized,
    body5Capitalized,
  ];

  return {
    start: timestamp,
    end: timestamp,
    description: description as any,
    summary: summary as any,
    categories,
  } as QuintupleAspectEvent;
}

/**
 * Main entry point: compose all quintuple aspect events from stored 2-body aspects
 */
export function composeQuintupleAspectEvents(
  aspectEvents: Event[],
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>,
  currentMinute: Moment
): QuintupleAspectEvent[] {
  const edges = parseAspectEvents(aspectEvents);
  const events: QuintupleAspectEvent[] = [];

  events.push(
    ...composePentagrams(edges, coordinateEphemerisByBody, currentMinute)
  );

  return events;
}
