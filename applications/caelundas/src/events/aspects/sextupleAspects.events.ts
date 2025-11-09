import _ from "lodash";
import type { Moment } from "moment";
import type { Body, AspectPhase, SextupleAspect } from "../../types";
import {
  type AspectEdge,
  parseAspectEvents,
  groupAspectsByType,
  haveAspect,
  determineMultiBodyPhase,
} from "./aspects.composition";
import {
  symbolBySextupleAspect,
  symbolByBody,
  sextupleAspectBodies,
} from "../../constants";
import type { Event } from "../../calendar.utilities";
import { getCombinations } from "../../math.utilities";

// #region Types

export interface SextupleAspectEvent extends Event {
  description: any;
  summary: any;
}

/**
 * Compose Hexagram (Star of David) patterns from stored 2-body aspects
 * Hexagram = 6 bodies forming two interlocking Grand Trines
 */
function composeHexagrams(
  allEdges: AspectEdge[],
  currentMinute: Moment
): SextupleAspectEvent[] {
  const events: SextupleAspectEvent[] = [];

  // Filter to current minute for pattern detection
  const currentTimestamp = currentMinute.toDate().getTime();
  const edges = allEdges.filter(
    (edge) =>
      edge.event.start.getTime() <= currentTimestamp &&
      edge.event.end.getTime() >= currentTimestamp
  );

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
      const relatedEdges = [...trines, ...sextiles].filter((edge) =>
        combo.includes(edge.body1 as Body)
      );

      const phase = determineMultiBodyPhase(
        allEdges,
        currentMinute,
        combo,
        // Check if Hexagram pattern exists in given edges
        (edgesAtTime) => {
          // Check two grand trines (0,2,4 and 1,3,5)
          const hasTrine1 =
            haveAspect(combo[0], combo[2], "trine", edgesAtTime) &&
            haveAspect(combo[0], combo[4], "trine", edgesAtTime) &&
            haveAspect(combo[2], combo[4], "trine", edgesAtTime);

          const hasTrine2 =
            haveAspect(combo[1], combo[3], "trine", edgesAtTime) &&
            haveAspect(combo[1], combo[5], "trine", edgesAtTime) &&
            haveAspect(combo[3], combo[5], "trine", edgesAtTime);

          // Check sextiles between adjacent bodies
          const hasSextiles =
            haveAspect(combo[0], combo[1], "sextile", edgesAtTime) &&
            haveAspect(combo[1], combo[2], "sextile", edgesAtTime) &&
            haveAspect(combo[2], combo[3], "sextile", edgesAtTime) &&
            haveAspect(combo[3], combo[4], "sextile", edgesAtTime) &&
            haveAspect(combo[4], combo[5], "sextile", edgesAtTime) &&
            haveAspect(combo[5], combo[0], "sextile", edgesAtTime);

          return hasTrine1 && hasTrine2 && hasSextiles;
        }
      );

      if (phase) {
        events.push(
          getSextupleAspectEvent({
            timestamp: currentMinute.toDate(),
            body1: combo[0],
            body2: combo[1],
            body3: combo[2],
            body4: combo[3],
            body5: combo[4],
            body6: combo[5],
            sextupleAspect: "hexagram",
            phase,
          })
        );
      }
    }
  }

  return events;
}

/**
 * Create a sextuple aspect event
 */
function getSextupleAspectEvent(params: {
  timestamp: Date;
  body1: Body;
  body2: Body;
  body3: Body;
  body4: Body;
  body5: Body;
  body6: Body;
  sextupleAspect: SextupleAspect;
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
export function getSextupleAspectEvents(
  aspectEvents: Event[],
  currentMinute: Moment
): SextupleAspectEvent[] {
  const edges = parseAspectEvents(aspectEvents);
  const events: SextupleAspectEvent[] = [];

  events.push(...composeHexagrams(edges, currentMinute));

  return events;
}

// #region Duration Events

export function getSextupleAspectDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to sextuple aspect events only
  const sextupleAspectEvents = events.filter((event) =>
    event.categories.includes("Sextuple Aspect")
  ) as SextupleAspectEvent[];

  // Group by body sextet and aspect type using categories
  const groupedEvents = _.groupBy(sextupleAspectEvents, (event) => {
    const planets = event.categories
      .filter((category) =>
        sextupleAspectBodies.map(_.startCase).includes(category)
      )
      .sort();

    const aspect = event.categories.find((category) =>
      ["Hexagram", "Grand Sextile"].includes(category)
    );

    return `${planets.join("-")}_${aspect}`;
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
            summary: currentEvent.summary.replace(/^[➡️🎯⬅️]\s/, ""),
            description: currentEvent.description.replace(
              / (forming|exact|dissolving)$/,
              ""
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
