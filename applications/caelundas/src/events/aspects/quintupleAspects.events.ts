import _ from "lodash";
import type { Moment } from "moment";
import type { Body, AspectPhase, QuintupleAspect } from "../../types";
import { quintupleAspectBodies } from "../../types";
import {
  type AspectEdge,
  parseAspectEvents,
  groupAspectsByType,
  haveAspect,
  determineMultiBodyPhase,
} from "./aspects.composition";
import { symbolByQuintupleAspect, symbolByBody } from "../../symbols";
import type { Event } from "../../calendar.utilities";
import { getCombinations } from "../../math.utilities";

/**
 * Compose Pentagram patterns from stored 2-body aspects
 * Pentagram = 5 bodies forming a 5-pointed star with 5 quintiles
 */
function composePentagrams(
  allEdges: AspectEdge[],
  currentMinute: Moment
): Event[] {
  const events: Event[] = [];

  // Filter to current minute for pattern detection
  const currentTimestamp = currentMinute.toDate().getTime();
  const edges = allEdges.filter(
    (edge) =>
      edge.event.start.getTime() <= currentTimestamp &&
      edge.event.end.getTime() >= currentTimestamp
  );

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
      const relatedEdges = quintiles.filter((edge) =>
        combo.includes(edge.body1 as Body)
      );

      const phase = determineMultiBodyPhase(
        allEdges,
        currentMinute,
        combo,
        // Check if Pentagram pattern exists in given edges
        (edgesAtTime) => {
          // Check all quintile connections in star pattern
          return (
            haveAspect(combo[0], combo[2], "quintile", edgesAtTime) &&
            haveAspect(combo[1], combo[3], "quintile", edgesAtTime) &&
            haveAspect(combo[2], combo[4], "quintile", edgesAtTime) &&
            haveAspect(combo[3], combo[0], "quintile", edgesAtTime) &&
            haveAspect(combo[4], combo[1], "quintile", edgesAtTime)
          );
        }
      );

      if (phase) {
        events.push(
          getQuintupleAspectEvent({
            timestamp: currentMinute.toDate(),
            body1: combo[0],
            body2: combo[1],
            body3: combo[2],
            body4: combo[3],
            body5: combo[4],
            quintupleAspect: "pentagram",
            phase,
          })
        );
      }
    }
  }

  return events;
}

/**
 * Create a quintuple aspect event
 */
function getQuintupleAspectEvent(params: {
  timestamp: Date;
  body1: Body;
  body2: Body;
  body3: Body;
  body4: Body;
  body5: Body;
  quintupleAspect: QuintupleAspect;
  phase: AspectPhase;
}): Event {
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
  } as Event;
}

/**
 * Main entry point: compose all quintuple aspect events from stored 2-body aspects
 */
export function getQuintupleAspectEvents(
  aspectEvents: Event[],
  currentMinute: Moment
): Event[] {
  const edges = parseAspectEvents(aspectEvents);
  const events: Event[] = [];

  events.push(...composePentagrams(edges, currentMinute));

  return events;
}

// #region Duration Events

export function getQuintupleAspectDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to quintuple aspect events only
  const quintupleAspectEvents = events.filter((event) =>
    event.categories.includes("Quintuple Aspect")
  ) as Event[];

  // Group by body quintet and aspect type using categories
  const groupedEvents = _.groupBy(quintupleAspectEvents, (event) => {
    const planets = event.categories
      .filter((category) =>
        quintupleAspectBodies.map(_.startCase).includes(category)
      )
      .sort();

    const aspect = event.categories.find((category) =>
      ["Pentagram"].includes(category)
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
