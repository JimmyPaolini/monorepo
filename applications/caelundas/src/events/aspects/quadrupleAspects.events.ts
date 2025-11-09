import _ from "lodash";
import type { Moment } from "moment";
import type { Body, AspectPhase, QuadrupleAspect } from "../../types";
import {
  type AspectEdge,
  parseAspectEvents,
  groupAspectsByType,
  haveAspect,
  involvesBody,
  getOtherBody,
  determineMultiBodyPhase,
} from "./aspects.composition";
import {
  symbolByBody,
  symbolByQuadrupleAspect,
  quadrupleAspectBodies,
} from "../../constants";
import type { Event } from "../../calendar.utilities";

// #region Types

export interface QuadrupleAspectEvent extends Event {
  description: any;
  summary: any;
}

/**
 * Compose Grand Cross patterns from stored 2-body aspects
 * Grand Cross = 2 oppositions + 4 squares forming a cross
 */
function composeGrandCrosses(
  allEdges: AspectEdge[],
  currentMinute: Moment
): QuadrupleAspectEvent[] {
  const events: QuadrupleAspectEvent[] = [];

  // Filter to current minute for pattern detection
  const currentTimestamp = currentMinute.toDate().getTime();
  const edges = allEdges.filter(
    (edge) =>
      edge.event.start.getTime() <= currentTimestamp &&
      edge.event.end.getTime() >= currentTimestamp
  );

  const aspectsByType = groupAspectsByType(edges);

  const oppositions = aspectsByType.get("opposite") || [];
  const squares = aspectsByType.get("square") || [];

  // Need at least 2 oppositions and 4 squares
  if (oppositions.length < 2 || squares.length < 4) return events;

  // Try each pair of oppositions
  for (let i = 0; i < oppositions.length; i++) {
    const opp1 = oppositions[i];
    for (let j = i + 1; j < oppositions.length; j++) {
      const opp2 = oppositions[j];

      // Collect all 4 unique bodies from both oppositions
      const bodies = new Set<Body>([
        opp1.body1,
        opp1.body2,
        opp2.body1,
        opp2.body2,
      ]);
      if (bodies.size !== 4) continue;

      const bodyList = Array.from(bodies);

      // Verify all adjacent pairs (in cross configuration) are in square
      let hasAllSquares = true;
      for (const body of bodyList) {
        // Find which body is opposite to this one
        let oppositeBody: Body | null = null;
        if (opp1.body1 === body) oppositeBody = opp1.body2;
        else if (opp1.body2 === body) oppositeBody = opp1.body1;
        else if (opp2.body1 === body) oppositeBody = opp2.body2;
        else if (opp2.body2 === body) oppositeBody = opp2.body1;

        if (!oppositeBody) {
          hasAllSquares = false;
          break;
        }

        // This body should be square to the two bodies that are NOT opposite to it
        const adjacentBodies = bodyList.filter(
          (b) => b !== body && b !== oppositeBody
        );
        for (const adjBody of adjacentBodies) {
          if (!haveAspect(body, adjBody, "square", edges)) {
            hasAllSquares = false;
            break;
          }
        }
        if (!hasAllSquares) break;
      }

      if (hasAllSquares) {
        // Found a Grand Cross - calculate phase
        const phase = determineMultiBodyPhase(
          allEdges,
          currentMinute,
          bodyList,
          // Check if Grand Cross pattern exists in given edges
          (edgesAtTime) => {
            // Verify all required aspects exist
            const aspectsByType = groupAspectsByType(edgesAtTime);
            const oppositionsAtTime = aspectsByType.get("opposite") || [];
            const squaresAtTime = aspectsByType.get("square") || [];

            // Need the 2 specific oppositions
            const hasOpp1 = haveAspect(
              opp1.body1,
              opp1.body2,
              "opposite",
              oppositionsAtTime
            );
            const hasOpp2 = haveAspect(
              opp2.body1,
              opp2.body2,
              "opposite",
              oppositionsAtTime
            );
            if (!hasOpp1 || !hasOpp2) return false;

            // Verify all adjacent pairs are in square
            for (const body of bodyList) {
              let oppositeBody: Body | null = null;
              if (opp1.body1 === body) oppositeBody = opp1.body2;
              else if (opp1.body2 === body) oppositeBody = opp1.body1;
              else if (opp2.body1 === body) oppositeBody = opp2.body2;
              else if (opp2.body2 === body) oppositeBody = opp2.body1;

              if (!oppositeBody) return false;

              const adjacentBodies = bodyList.filter(
                (b) => b !== body && b !== oppositeBody
              );
              for (const adjBody of adjacentBodies) {
                if (!haveAspect(body, adjBody, "square", squaresAtTime)) {
                  return false;
                }
              }
            }

            return true;
          }
        );

        if (phase) {
          events.push(
            getQuadrupleAspectEvent({
              timestamp: currentMinute.toDate(),
              body1: bodyList[0],
              body2: bodyList[1],
              body3: bodyList[2],
              body4: bodyList[3],
              quadrupleAspect: "grand cross",
              phase,
            })
          );
        }
      }
    }
  }

  return events;
}

/**
 * Compose Kite patterns from stored 2-body aspects
 * Kite = Grand Trine + Opposition + 2 Sextiles
 */
function composeKites(
  allEdges: AspectEdge[],
  currentMinute: Moment
): QuadrupleAspectEvent[] {
  const events: QuadrupleAspectEvent[] = [];

  // Filter to current minute for pattern detection
  const currentTimestamp = currentMinute.toDate().getTime();
  const edges = allEdges.filter(
    (edge) =>
      edge.event.start.getTime() <= currentTimestamp &&
      edge.event.end.getTime() >= currentTimestamp
  );

  const aspectsByType = groupAspectsByType(edges);

  const trines = aspectsByType.get("trine") || [];
  const oppositions = aspectsByType.get("opposite") || [];
  const sextiles = aspectsByType.get("sextile") || [];

  if (trines.length < 3 || oppositions.length < 1 || sextiles.length < 2)
    return events;

  // First find all grand trines (3 bodies all in trine with each other)
  const grandTrines: Set<Body>[] = [];
  for (let i = 0; i < trines.length; i++) {
    for (let j = i + 1; j < trines.length; j++) {
      for (let k = j + 1; k < trines.length; k++) {
        const bodies = new Set<Body>([
          trines[i].body1,
          trines[i].body2,
          trines[j].body1,
          trines[j].body2,
          trines[k].body1,
          trines[k].body2,
        ]);

        if (bodies.size === 3) {
          const bodyList = Array.from(bodies);
          if (
            haveAspect(bodyList[0], bodyList[1], "trine", edges) &&
            haveAspect(bodyList[0], bodyList[2], "trine", edges) &&
            haveAspect(bodyList[1], bodyList[2], "trine", edges)
          ) {
            grandTrines.push(bodies);
          }
        }
      }
    }
  }

  // For each grand trine, look for a 4th body that forms a kite
  for (const gtBodies of grandTrines) {
    const gtList = Array.from(gtBodies);

    for (const baseBody of gtList) {
      const otherTwo = gtList.filter((b) => b !== baseBody);

      for (const opp of oppositions) {
        if (!involvesBody(opp, baseBody)) continue;

        const fourthBody = getOtherBody(opp, baseBody);
        if (!fourthBody || gtBodies.has(fourthBody)) continue;

        if (
          haveAspect(fourthBody, otherTwo[0], "sextile", edges) &&
          haveAspect(fourthBody, otherTwo[1], "sextile", edges)
        ) {
          // Found a Kite!
          const bodies = [baseBody, otherTwo[0], otherTwo[1], fourthBody];

          const phase = determineMultiBodyPhase(
            allEdges,
            currentMinute,
            bodies,
            // Check if Kite pattern exists in given edges
            (edgesAtTime) => {
              // Check if all required aspects exist
              return (
                haveAspect(baseBody, fourthBody, "opposite", edgesAtTime) &&
                haveAspect(baseBody, otherTwo[0], "trine", edgesAtTime) &&
                haveAspect(baseBody, otherTwo[1], "trine", edgesAtTime) &&
                haveAspect(otherTwo[0], otherTwo[1], "trine", edgesAtTime) &&
                haveAspect(fourthBody, otherTwo[0], "sextile", edgesAtTime) &&
                haveAspect(fourthBody, otherTwo[1], "sextile", edgesAtTime)
              );
            }
          );

          if (phase) {
            events.push(
              getQuadrupleAspectEvent({
                timestamp: currentMinute.toDate(),
                body1: bodies[0],
                body2: bodies[1],
                body3: bodies[2],
                body4: bodies[3],
                quadrupleAspect: "kite",
                focalOrApexBody: fourthBody,
                phase,
              })
            );
          }
        }
      }
    }
  }

  return events;
}

/**
 * Create a quadruple aspect event
 */
function getQuadrupleAspectEvent(params: {
  timestamp: Date;
  body1: Body;
  body2: Body;
  body3: Body;
  body4: Body;
  quadrupleAspect: QuadrupleAspect;
  focalOrApexBody?: Body;
  phase: AspectPhase;
}): QuadrupleAspectEvent {
  const {
    timestamp,
    body1,
    body2,
    body3,
    body4,
    quadrupleAspect,
    focalOrApexBody,
    phase,
  } = params;

  const body1Capitalized = _.startCase(body1);
  const body2Capitalized = _.startCase(body2);
  const body3Capitalized = _.startCase(body3);
  const body4Capitalized = _.startCase(body4);

  const body1Symbol = symbolByBody[body1];
  const body2Symbol = symbolByBody[body2];
  const body3Symbol = symbolByBody[body3];
  const body4Symbol = symbolByBody[body4];
  const quadrupleAspectSymbol = symbolByQuadrupleAspect[quadrupleAspect];

  const bodiesSorted = [
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
    body4Capitalized,
  ].sort();

  const description = focalOrApexBody
    ? `${bodiesSorted.join(", ")} ${quadrupleAspect} ${phase} (${_.startCase(
        focalOrApexBody
      )} focal)`
    : `${bodiesSorted.join(", ")} ${quadrupleAspect} ${phase}`;

  let phaseEmoji = "";
  if (phase === "forming") phaseEmoji = "➡️ ";
  else if (phase === "exact") phaseEmoji = "🎯 ";
  else if (phase === "dissolving") phaseEmoji = "⬅️ ";

  const summary = `${phaseEmoji}${quadrupleAspectSymbol} ${body1Symbol}-${body2Symbol}-${body3Symbol}-${body4Symbol} ${description}`;

  const categories = [
    "Astronomy",
    "Astrology",
    "Compound Aspect",
    "Quadruple Aspect",
    _.startCase(quadrupleAspect),
    _.startCase(phase),
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
    body4Capitalized,
  ];

  if (focalOrApexBody) {
    categories.push(`${_.startCase(focalOrApexBody)} Focal`);
  }

  return {
    start: timestamp,
    end: timestamp,
    description: description as any,
    summary: summary as any,
    categories,
  } as QuadrupleAspectEvent;
}

/**
 * Main entry point: compose all quadruple aspect events from stored 2-body aspects
 */
export function getQuadrupleAspectEvents(
  aspectEvents: Event[],
  currentMinute: Moment
): QuadrupleAspectEvent[] {
  const edges = parseAspectEvents(aspectEvents);
  const events: QuadrupleAspectEvent[] = [];

  events.push(...composeGrandCrosses(edges, currentMinute));
  events.push(...composeKites(edges, currentMinute));

  return events;
}

// #region Duration Events

export function getQuadrupleAspectDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to quadruple aspect events only
  const quadrupleAspectEvents = events.filter((event) =>
    event.categories.includes("Quadruple Aspect")
  ) as QuadrupleAspectEvent[];

  // Group by body quartet and aspect type using categories
  const groupedEvents = _.groupBy(quadrupleAspectEvents, (event) => {
    const planets = event.categories
      .filter((category) =>
        quadrupleAspectBodies.map(_.startCase).includes(category)
      )
      .sort();

    const aspect = event.categories.find((category) =>
      ["Grand Cross", "Kite"].includes(category)
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
          const categories = currentEvent.categories.filter(
            (c) => c !== "Forming" && c !== "Exact" && c !== "Dissolving"
          );

          durationEvents.push({
            start: currentEvent.start,
            end: potentialDissolvingEvent.start,
            summary: currentEvent.summary.replace(/^[➡️🎯⬅️]\s/, ""),
            description: currentEvent.description.replace(
              / (forming|exact|dissolving)( \(.*\))?$/i,
              ""
            ),
            categories,
          });

          break; // Found the pair, move to next forming event
        }
      }
    }
  }

  return durationEvents;
}
