import _ from "lodash";

import { symbolByBody, symbolByQuadrupleAspect } from "../../symbols";
import { quadrupleAspectBodies } from "../../types";

import {
  type AspectEdge,
  determineMultiBodyPhase,
  getOtherBody,
  groupAspectsByType,
  haveAspect,
  involvesBody,
  parseAspectEvents,
} from "./aspects.composition";

import type { Event } from "../../calendar.utilities";
import type { AspectPhase, Body, QuadrupleAspect } from "../../types";
import type { Moment } from "moment";

/**
 * Composes Grand Cross patterns from stored 2-body aspects.
 *
 * A Grand Cross is an intense configuration consisting of:
 * - 2 oppositions (180°) at right angles to each other
 * - 4 squares (90°) connecting adjacent bodies
 *
 * Visual pattern:
 * ```
 *     Body1
 *       |
 *       | square
 *       |
 * Body4 + Body2
 *       |
 *       | square
 *       |
 *     Body3
 * ```
 *
 * The four bodies form a cross with all cardinal/fixed/mutable signs.
 * Represents maximum tension and dynamic energy requiring integration
 * of four conflicting forces. Often indicates major life challenges
 * and potential for significant achievement.
 *
 * @param allEdges - All aspect edges across time for phase detection
 * @param currentMinute - The minute to check for Grand Cross patterns
 * @returns Array of Grand Cross events detected at this minute
 * @see {@link determineMultiBodyPhase} for phase calculation
 */
function composeGrandCrosses(
  allEdges: AspectEdge[],
  currentMinute: Moment,
): Event[] {
  const events: Event[] = [];

  // Filter to current minute for pattern detection
  const currentTimestamp = currentMinute.toDate().getTime();
  const edges = allEdges.filter(
    (edge) =>
      edge.event.start.getTime() <= currentTimestamp &&
      edge.event.end.getTime() >= currentTimestamp,
  );

  const aspectsByType = groupAspectsByType(edges);

  const oppositions = aspectsByType.get("opposite") || [];
  const squares = aspectsByType.get("square") || [];

  // Need at least 2 oppositions and 4 squares
  if (oppositions.length < 2 || squares.length < 4) {
    return events;
  }

  // Try each pair of oppositions
  for (let i = 0; i < oppositions.length; i++) {
    const opp1 = oppositions[i];
    if (!opp1) {
      continue;
    }
    for (let j = i + 1; j < oppositions.length; j++) {
      const opp2 = oppositions[j];
      if (!opp2) {
        continue;
      }

      // Collect all 4 unique bodies from both oppositions
      const bodies = new Set<Body>([
        opp1.body1,
        opp1.body2,
        opp2.body1,
        opp2.body2,
      ]);
      if (bodies.size !== 4) {
        continue;
      }

      const bodyList = [...bodies];

      const oppositeBodyMap = new Map<Body, Body>([
        [opp1.body1, opp1.body2],
        [opp1.body2, opp1.body1],
        [opp2.body1, opp2.body2],
        [opp2.body2, opp2.body1],
      ]);

      // Verify all adjacent pairs (in cross configuration) are in square
      let hasAllSquares = true;
      for (const body of bodyList) {
        // Find which body is opposite to this one
        const oppositeBody = oppositeBodyMap.get(body) ?? null;

        if (!oppositeBody) {
          hasAllSquares = false;
          break;
        }

        // This body should be square to the two bodies that are NOT opposite to it
        const adjacentBodies = bodyList.filter(
          (b) => b !== body && b !== oppositeBody,
        );
        for (const adjBody of adjacentBodies) {
          if (!haveAspect(body, adjBody, "square", edges)) {
            hasAllSquares = false;
            break;
          }
        }
        if (!hasAllSquares) {
          break;
        }
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
              oppositionsAtTime,
            );
            const hasOpp2 = haveAspect(
              opp2.body1,
              opp2.body2,
              "opposite",
              oppositionsAtTime,
            );
            if (!hasOpp1 || !hasOpp2) {
              return false;
            }

            // Verify all adjacent pairs are in square
            const innerOppositeBodyMap = new Map<Body, Body>([
              [opp1.body1, opp1.body2],
              [opp1.body2, opp1.body1],
              [opp2.body1, opp2.body2],
              [opp2.body2, opp2.body1],
            ]);
            for (const body of bodyList) {
              const oppositeBody = innerOppositeBodyMap.get(body) ?? null;

              if (!oppositeBody) {
                return false;
              }

              const adjacentBodies = bodyList.filter(
                (b) => b !== body && b !== oppositeBody,
              );
              for (const adjBody of adjacentBodies) {
                if (!haveAspect(body, adjBody, "square", squaresAtTime)) {
                  return false;
                }
              }
            }

            return true;
          },
        );

        if (phase && bodyList[0] && bodyList[1] && bodyList[2] && bodyList[3]) {
          events.push(
            getQuadrupleAspectEvent({
              timestamp: currentMinute.toDate(),
              body1: bodyList[0],
              body2: bodyList[1],
              body3: bodyList[2],
              body4: bodyList[3],
              quadrupleAspect: "grand cross",
              phase,
            }),
          );
        }
      }
    }
  }

  return events;
}

/**
 * Composes Kite patterns from stored 2-body aspects.
 *
 * A Kite is a mixed configuration consisting of:
 * - 1 Grand Trine (3 trines forming a triangle)
 * - 1 opposition from one trine body to a fourth focal body
 * - 2 sextiles from the focal body to the other two trine bodies
 *
 * Visual pattern:
 * ```
 *        Body1
 *        /   \
 *  trine/     \trine
 *      /       \
 *  Body2 ----- Body3
 *      \  trine /
 * sextile\   /sextile
 *         \ /
 *      FocalBody
 * ```
 *
 * The focal body provides direction and motivation to the harmonious
 * Grand Trine, creating a configuration that balances ease with drive.
 * Often indicates talent with opportunity for manifestation.
 *
 * @param allEdges - All aspect edges across time for phase detection
 * @param currentMinute - The minute to check for Kite patterns
 * @returns Array of Kite events detected at this minute
 * @see {@link determineMultiBodyPhase} for phase calculation
 */
function composeKites(allEdges: AspectEdge[], currentMinute: Moment): Event[] {
  const events: Event[] = [];

  // Filter to current minute for pattern detection
  const currentTimestamp = currentMinute.toDate().getTime();
  const edges = allEdges.filter(
    (edge) =>
      edge.event.start.getTime() <= currentTimestamp &&
      edge.event.end.getTime() >= currentTimestamp,
  );

  const aspectsByType = groupAspectsByType(edges);

  const trines = aspectsByType.get("trine") || [];
  const oppositions = aspectsByType.get("opposite") || [];
  const sextiles = aspectsByType.get("sextile") || [];

  if (trines.length < 3 || oppositions.length === 0 || sextiles.length < 2) {
    return events;
  }

  // First find all grand trines (3 bodies all in trine with each other)
  const grandTrines: Set<Body>[] = [];
  for (let i = 0; i < trines.length; i++) {
    const trineI = trines[i];
    if (!trineI) {
      continue;
    }
    for (let j = i + 1; j < trines.length; j++) {
      const trineJ = trines[j];
      if (!trineJ) {
        continue;
      }
      for (let k = j + 1; k < trines.length; k++) {
        const trineK = trines[k];
        if (!trineK) {
          continue;
        }
        const bodies = new Set<Body>([
          trineI.body1,
          trineI.body2,
          trineJ.body1,
          trineJ.body2,
          trineK.body1,
          trineK.body2,
        ]);

        if (bodies.size === 3) {
          const bodyList = [...bodies];
          const body0 = bodyList[0];
          const body1 = bodyList[1];
          const body2 = bodyList[2];
          if (
            body0 &&
            body1 &&
            body2 &&
            haveAspect(body0, body1, "trine", edges) &&
            haveAspect(body0, body2, "trine", edges) &&
            haveAspect(body1, body2, "trine", edges)
          ) {
            grandTrines.push(bodies);
          }
        }
      }
    }
  }

  // For each grand trine, look for a 4th body that forms a kite
  for (const gtBodies of grandTrines) {
    const gtList = [...gtBodies];

    for (const baseBody of gtList) {
      const otherTwo = gtList.filter((b) => b !== baseBody);

      for (const opp of oppositions) {
        if (!involvesBody(opp, baseBody)) {
          continue;
        }

        const fourthBody = getOtherBody(opp, baseBody);
        if (!fourthBody || gtBodies.has(fourthBody)) {
          continue;
        }

        const other0 = otherTwo[0];
        const other1 = otherTwo[1];
        if (
          other0 &&
          other1 &&
          haveAspect(fourthBody, other0, "sextile", edges) &&
          haveAspect(fourthBody, other1, "sextile", edges)
        ) {
          // Found a Kite!
          const bodies = [baseBody, other0, other1, fourthBody];

          const phase = determineMultiBodyPhase(
            allEdges,
            currentMinute,
            bodies,
            // Check if Kite pattern exists in given edges
            (edgesAtTime) => {
              // Check if all required aspects exist
              return (
                haveAspect(baseBody, fourthBody, "opposite", edgesAtTime) &&
                haveAspect(baseBody, other0, "trine", edgesAtTime) &&
                haveAspect(baseBody, other1, "trine", edgesAtTime) &&
                haveAspect(other0, other1, "trine", edgesAtTime) &&
                haveAspect(fourthBody, other0, "sextile", edgesAtTime) &&
                haveAspect(fourthBody, other1, "sextile", edgesAtTime)
              );
            },
          );

          if (phase && bodies[0] && bodies[1] && bodies[2] && bodies[3]) {
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
              }),
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
}): Event {
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

  const bodiesSorted = _.sortBy([
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
    body4Capitalized,
  ]);

  const description = focalOrApexBody
    ? `${bodiesSorted.join(", ")} ${quadrupleAspect} ${phase} (${_.startCase(
        focalOrApexBody,
      )} focal)`
    : `${bodiesSorted.join(", ")} ${quadrupleAspect} ${phase}`;

  let phaseEmoji = "";
  if (phase === "forming") {
    phaseEmoji = "➡️ ";
  } else if (phase === "exact") {
    phaseEmoji = "🎯 ";
  } else {
    phaseEmoji = "⬅️ ";
  }

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
    description,
    summary,
    categories,
  } as Event;
}

/**
 * Detects all quadruple aspect patterns from stored 2-body aspect events.
 *
 * Analyzes combinations of simple aspects to identify 4-body patterns:
 * - Grand Cross (2 oppositions + 4 squares)
 * - Kite (Grand Trine + opposition + 2 sextiles)
 *
 * These rare configurations represent major life themes and turning points,
 * indicating either intense challenge (Grand Cross) or channeled talent (Kite).
 *
 * @param aspectEvents - Previously detected simple aspect events
 * @param currentMinute - The minute to check for quadruple aspect patterns
 * @returns Array of all detected quadruple aspect events at this minute
 * @see {@link parseAspectEvents} for extracting aspect relationships
 * @see {@link composeGrandCrosses} for Grand Cross detection
 * @see {@link composeKites} for Kite detection
 */
export function getQuadrupleAspectEvents(
  aspectEvents: Event[],
  currentMinute: Moment,
): Event[] {
  const edges = parseAspectEvents(aspectEvents);
  return [
    ...composeGrandCrosses(edges, currentMinute),
    ...composeKites(edges, currentMinute),
  ];
}

// #region Duration Events

/**
 * Converts instantaneous quadruple aspect events into duration events.
 *
 * Pairs forming and dissolving events for the same body quartet and
 * pattern type to create events spanning the entire active period.
 * Duration events show when a pattern is in effect rather than just
 * boundary moments.
 *
 * @param events - All events to process (non-quadruple-aspect events are filtered out)
 * @returns Array of duration events spanning from forming to dissolving
 */
export function getQuadrupleAspectDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to quadruple aspect events only
  const quadrupleAspectEvents = events.filter((event) =>
    event.categories.includes("Quadruple Aspect"),
  );

  // Group by body quartet and aspect type using categories
  const groupedEvents = _.groupBy(quadrupleAspectEvents, (event) => {
    const planets = _.sortBy(
      event.categories.filter((category) =>
        quadrupleAspectBodies
          .map((quadrupleAspectBody) => _.startCase(quadrupleAspectBody))
          .includes(category),
      ),
    );

    const aspect = event.categories.find((category) =>
      ["Grand Cross", "Kite"].includes(category),
    );

    return `${planets.join("-")}_${aspect}`;
  });

  // Process each group to find forming/dissolving pairs
  for (const group of Object.values(groupedEvents)) {
    const sortedEvents = _.sortBy(group, "start");

    for (let i = 0; i < sortedEvents.length; i++) {
      const currentEvent = sortedEvents[i];
      if (!currentEvent) {
        continue;
      }

      // Skip if not a forming event
      if (!currentEvent.categories.includes("Forming")) {
        continue;
      }

      // Look for the next dissolving event
      for (let j = i + 1; j < sortedEvents.length; j++) {
        const potentialDissolvingEvent = sortedEvents[j];
        if (!potentialDissolvingEvent) {
          continue;
        }

        if (potentialDissolvingEvent.categories.includes("Dissolving")) {
          // Create duration event
          const categories = currentEvent.categories.filter(
            (c) => c !== "Forming" && c !== "Exact" && c !== "Dissolving",
          );

          durationEvents.push({
            start: currentEvent.start,
            end: potentialDissolvingEvent.start,
            summary: currentEvent.summary.replace(/^(➡️|⬅️|🎯)\s/, ""),
            description: currentEvent.description.replace(
              / (forming|exact|dissolving)( \(.*\))?$/i,
              "",
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
