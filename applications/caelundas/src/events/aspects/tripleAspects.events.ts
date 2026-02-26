import _ from "lodash";

import { symbolByBody, symbolByTripleAspect } from "../../symbols";
import { tripleAspectBodies } from "../../types";

import {
  type AspectEdge,
  determineMultiBodyPhase,
  findBodiesWithAspectTo,
  groupAspectsByType,
  haveAspect,
  parseAspectEvents,
} from "./aspects.composition";

import type { Event } from "../../calendar.utilities";
import type { AspectPhase, Body, TripleAspect } from "../../types";
import type { Moment } from "moment";

/**
 * Composes T-Square patterns from stored 2-body aspects.
 *
 * A T-Square is a challenging configuration consisting of:
 * - 1 opposition (180°) between two bodies
 * - 2 squares (90°) from both opposition bodies to a third focal body
 *
 * Visual pattern:
 * ```
 *     Body1
 *       |
 *       | square (90°)
 *       |
 *    FocalBody -------- Body2
 *              opposition (180°)
 * ```
 *
 * The focal body receives tension from both opposition bodies and
 * represents the point of release or action in astrological interpretation.
 *
 * @param allEdges - All aspect edges across time for phase detection
 * @param currentMinute - The minute to check for T-Square patterns
 * @returns Array of T-Square events detected at this minute
 * @see {@link determineMultiBodyPhase} for phase calculation
 */
function composeTSquares(
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

  for (const opposition of oppositions) {
    const body1 = opposition.body1;
    const body2 = opposition.body2;

    // Find bodies that are square to both opposition bodies
    const squaresToBody1 = findBodiesWithAspectTo(body1, "square", squares);
    const squaresToBody2 = findBodiesWithAspectTo(body2, "square", squares);

    // Find common bodies (focal point of T-Square)
    const focalBodies = _.intersection(squaresToBody1, squaresToBody2);

    for (const focalBody of focalBodies) {
      // Verify all three aspects exist
      if (
        haveAspect(body1, body2, "opposite", edges) &&
        haveAspect(body1, focalBody, "square", edges) &&
        haveAspect(body2, focalBody, "square", edges)
      ) {
        const phase = determineMultiBodyPhase(
          allEdges,
          currentMinute,
          [body1, body2, focalBody],
          // Check if T-Square pattern exists in given edges
          (edgesAtTime) => {
            // Check if we have the required aspects
            return (
              haveAspect(body1, body2, "opposite", edgesAtTime) &&
              haveAspect(body1, focalBody, "square", edgesAtTime) &&
              haveAspect(body2, focalBody, "square", edgesAtTime)
            );
          },
        );

        if (phase) {
          events.push(
            getTripleAspectEvent({
              timestamp: currentMinute.toDate(),
              body1,
              body2,
              body3: focalBody,
              tripleAspect: "t-square",
              focalOrApexBody: focalBody,
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
 * Composes Yod patterns from stored 2-body aspects.
 *
 * A Yod ("Finger of God") is a spiritual configuration consisting of:
 * - 1 sextile (60°) at the base between two bodies
 * - 2 quincunxes (150°) from both base bodies to a third apex body
 *
 * Visual pattern:
 * ```
 *       ApexBody
 *         /  \
 *   150° /    \ 150°
 *       /      \
 *   Body1 --- Body2
 *      sextile (60°)
 * ```
 *
 * The apex body represents a fated point requiring adjustment and
 * integration of the energies from the sextile base.
 *
 * @param allEdges - All aspect edges across time for phase detection
 * @param currentMinute - The minute to check for Yod patterns
 * @returns Array of Yod events detected at this minute
 * @see {@link determineMultiBodyPhase} for phase calculation
 */
function composeYods(allEdges: AspectEdge[], currentMinute: Moment): Event[] {
  const events: Event[] = [];

  // Filter to current minute for pattern detection
  const currentTimestamp = currentMinute.toDate().getTime();
  const edges = allEdges.filter(
    (edge) =>
      edge.event.start.getTime() <= currentTimestamp &&
      edge.event.end.getTime() >= currentTimestamp,
  );

  const aspectsByType = groupAspectsByType(edges);

  const sextiles = aspectsByType.get("sextile") || [];
  const quincunxes = aspectsByType.get("quincunx") || [];

  for (const sextile of sextiles) {
    const body1 = sextile.body1;
    const body2 = sextile.body2;

    // Find bodies that are quincunx to both sextile bodies
    const quincunxToBody1 = findBodiesWithAspectTo(
      body1,
      "quincunx",
      quincunxes,
    );
    const quincunxToBody2 = findBodiesWithAspectTo(
      body2,
      "quincunx",
      quincunxes,
    );

    // Find common bodies (apex of Yod)
    const apexBodies = _.intersection(quincunxToBody1, quincunxToBody2);

    for (const apexBody of apexBodies) {
      if (
        haveAspect(body1, body2, "sextile", edges) &&
        haveAspect(body1, apexBody, "quincunx", edges) &&
        haveAspect(body2, apexBody, "quincunx", edges)
      ) {
        const phase = determineMultiBodyPhase(
          allEdges,
          currentMinute,
          [body1, body2, apexBody],
          // Check if Yod pattern exists in given edges
          (edgesAtTime) => {
            return (
              haveAspect(body1, body2, "sextile", edgesAtTime) &&
              haveAspect(body1, apexBody, "quincunx", edgesAtTime) &&
              haveAspect(body2, apexBody, "quincunx", edgesAtTime)
            );
          },
        );

        if (phase) {
          events.push(
            getTripleAspectEvent({
              timestamp: currentMinute.toDate(),
              body1,
              body2,
              body3: apexBody,
              tripleAspect: "yod",
              focalOrApexBody: apexBody,
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
 * Composes Grand Trine patterns from stored 2-body aspects.
 *
 * A Grand Trine is a harmonious configuration consisting of:
 * - 3 trines (120°) forming an equilateral triangle
 *
 * Visual pattern:
 * ```
 *       Body1
 *       /   \
 * 120° /     \ 120°
 *     /       \
 * Body2 ----- Body3
 *      120°
 * ```
 *
 * All three bodies are in the same element (fire/earth/air/water),
 * creating a flow of harmonious energy. Can indicate talent but
 * may lack motivation without challenging aspects.
 *
 * @param allEdges - All aspect edges across time for phase detection
 * @param currentMinute - The minute to check for Grand Trine patterns
 * @returns Array of Grand Trine events detected at this minute
 * @see {@link determineMultiBodyPhase} for phase calculation
 */
function composeGrandTrines(
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

  const trines = aspectsByType.get("trine") || [];

  // Find sets of three bodies where each pair is in trine
  const bodiesInTrines = new Set<Body>();
  for (const trine of trines) {
    bodiesInTrines.add(trine.body1);
    bodiesInTrines.add(trine.body2);
  }

  const bodiesArray = [...bodiesInTrines];

  // Check all combinations of 3 bodies
  for (let i = 0; i < bodiesArray.length; i++) {
    for (let j = i + 1; j < bodiesArray.length; j++) {
      for (let k = j + 1; k < bodiesArray.length; k++) {
        const body1 = bodiesArray[i];
        const body2 = bodiesArray[j];
        const body3 = bodiesArray[k];
        if (!body1 || !body2 || !body3) {
          continue;
        }

        // Check if all three pairs are in trine
        if (
          haveAspect(body1, body2, "trine", trines) &&
          haveAspect(body1, body3, "trine", trines) &&
          haveAspect(body2, body3, "trine", trines)
        ) {
          const phase = determineMultiBodyPhase(
            allEdges,
            currentMinute,
            [body1, body2, body3],
            // Check if Grand Trine pattern exists in given edges
            (edgesAtTime) => {
              return (
                haveAspect(body1, body2, "trine", edgesAtTime) &&
                haveAspect(body1, body3, "trine", edgesAtTime) &&
                haveAspect(body2, body3, "trine", edgesAtTime)
              );
            },
          );

          if (phase) {
            events.push(
              getTripleAspectEvent({
                timestamp: currentMinute.toDate(),
                body1,
                body2,
                body3,
                tripleAspect: "grand trine",
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
 * Detects all triple aspect patterns from stored 2-body aspect events.
 *
 * Analyzes combinations of simple aspects to identify higher-order patterns:
 * - T-Square (1 opposition + 2 squares)
 * - Yod (1 sextile + 2 quincunxes)
 * - Grand Trine (3 trines)
 *
 * These compound aspects represent significant configurations where
 * the whole is greater than the sum of parts, indicating major themes
 * in astrological interpretation.
 *
 * @param storedAspects - Previously detected simple aspect events
 * @param currentMinute - The minute to check for triple aspect patterns
 * @returns Array of all detected triple aspect events at this minute
 * @see {@link parseAspectEvents} for extracting aspect relationships
 * @see {@link composeTSquares} for T-Square detection
 * @see {@link composeYods} for Yod detection
 * @see {@link composeGrandTrines} for Grand Trine detection
 */
export function getTripleAspectEvents(
  storedAspects: Event[],
  currentMinute: Moment,
): Event[] {
  const edges = parseAspectEvents(storedAspects);

  return [
    ...composeTSquares(edges, currentMinute),
    ...composeYods(edges, currentMinute),
    ...composeGrandTrines(edges, currentMinute),
    // Can add more patterns: Hammer, etc.
  ];
}

// Helper function to create triple aspect events
function getTripleAspectEvent(args: {
  timestamp: Date;
  body1: Body;
  body2: Body;
  body3: Body;
  tripleAspect: TripleAspect;
  phase: AspectPhase;
  focalOrApexBody?: Body;
}): Event {
  const {
    timestamp,
    body1,
    body2,
    body3,
    tripleAspect,
    phase,
    focalOrApexBody,
  } = args;

  const body1Capitalized = _.startCase(body1);
  const body2Capitalized = _.startCase(body2);
  const body3Capitalized = _.startCase(body3);

  const body1Symbol = symbolByBody[body1];
  const body2Symbol = symbolByBody[body2];
  const body3Symbol = symbolByBody[body3];
  const tripleAspectSymbol = symbolByTripleAspect[tripleAspect];

  const bodiesSorted = _.sortBy([
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
  ]);

  const description = focalOrApexBody
    ? `${bodiesSorted[0]}, ${bodiesSorted[1]}, ${
        bodiesSorted[2]
      } ${tripleAspect} ${phase} (${_.startCase(focalOrApexBody)} focal)`
    : `${bodiesSorted[0]}, ${bodiesSorted[1]}, ${bodiesSorted[2]} ${tripleAspect} ${phase}`;

  let phaseEmoji = "";
  if (phase === "forming") {
    phaseEmoji = "➡️ ";
  } else if (phase === "dissolving") {
    phaseEmoji = "⬅️ ";
  } else {
    phaseEmoji = "🎯 ";
  }

  const summary = `${phaseEmoji}${tripleAspectSymbol} ${body1Symbol}-${body2Symbol}-${body3Symbol} ${description}`;

  console.log(`${summary} at ${timestamp.toISOString()}`);

  const categories = [
    "Astronomy",
    "Astrology",
    "Compound Aspect",
    "Triple Aspect",
    _.startCase(tripleAspect),
    _.startCase(phase),
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
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

// #region Duration Events

/**
 * Converts instantaneous triple aspect events into duration events.
 *
 * Pairs forming and dissolving events for the same body triplet and
 * pattern type to create events spanning the entire active period.
 * Duration events show when a pattern is in effect rather than just
 * boundary moments.
 *
 * @param events - All events to process (non-triple-aspect events are filtered out)
 * @returns Array of duration events spanning from forming to dissolving
 * @see {@link pairDurationEvents} for forming/dissolving pairing logic
 */
export function getTripleAspectDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to triple aspect events only
  const tripleAspectEvents = events.filter((event) =>
    event.categories.includes("Triple Aspect"),
  );

  // Group by body triplet and aspect type using categories
  const groupedEvents = _.groupBy(tripleAspectEvents, (event) => {
    const planets = _.sortBy(
      event.categories.filter((category) =>
        tripleAspectBodies
          .map((tripleAspectBody) => _.startCase(tripleAspectBody))
          .includes(category),
      ),
    );

    const aspect = event.categories.find((category) =>
      ["T Square", "Grand Trine", "Yod"].includes(category),
    );

    if (planets.length === 3 && aspect) {
      return `${planets[0]}-${planets[1]}-${planets[2]}-${aspect}`;
    }
    return "";
  });

  // Process each group
  for (const [key, groupEvents] of Object.entries(groupedEvents)) {
    if (!key) {
      continue;
    }

    const formingEvents = groupEvents.filter((event) =>
      event.categories.includes("Forming"),
    );
    const dissolvingEvents = groupEvents.filter((event) =>
      event.categories.includes("Dissolving"),
    );

    // Sort events by start time
    formingEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
    dissolvingEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Pair forming and dissolving events
    const minLength = Math.min(formingEvents.length, dissolvingEvents.length);

    for (let i = 0; i < minLength; i++) {
      const forming = formingEvents[i];
      const dissolving = dissolvingEvents[i];
      if (!forming || !dissolving) {
        continue;
      }

      // Only create duration if dissolving comes after forming
      if (dissolving.start.getTime() > forming.start.getTime()) {
        const bodiesCapitalized = _.sortBy(
          forming.categories.filter((category) =>
            tripleAspectBodies
              .map((tripleAspectBody) => _.startCase(tripleAspectBody))
              .includes(category),
          ),
        );

        const aspectCapitalized = forming.categories.find((category) =>
          ["T Square", "Grand Trine", "Yod"].includes(category),
        );

        if (bodiesCapitalized.length !== 3 || !aspectCapitalized) {
          continue;
        }

        const body1Capitalized = bodiesCapitalized[0] ?? "";
        const body2Capitalized = bodiesCapitalized[1] ?? "";
        const body3Capitalized = bodiesCapitalized[2] ?? "";

        // Convert aspect name back to the key format
        const aspectMap: Record<string, TripleAspect> = {
          "T Square": "t-square",
          "Grand Trine": "grand trine",
          Yod: "yod",
        };
        const aspect = aspectMap[aspectCapitalized];
        if (!aspect) {
          console.warn(`Unknown aspect type: ${aspectCapitalized}`);
          continue;
        }

        const body1 = body1Capitalized.toLowerCase() as Body;
        const body2 = body2Capitalized.toLowerCase() as Body;
        const body3 = body3Capitalized.toLowerCase() as Body;

        const body1Symbol = symbolByBody[body1];
        const body2Symbol = symbolByBody[body2];
        const body3Symbol = symbolByBody[body3];
        const aspectSymbol = symbolByTripleAspect[aspect];

        // Extract focal/apex info if present
        const focalCategory = forming.categories.find((cat) =>
          cat.includes(" Focal"),
        );
        let extraInfo = "";
        if (focalCategory) {
          const focalBody = focalCategory.replace(" Focal", "");
          if (aspect === "t-square") {
            extraInfo = ` (focal: ${focalBody})`;
          } else if (aspect === "yod") {
            extraInfo = ` (apex: ${focalBody})`;
          }
        }

        durationEvents.push({
          start: forming.start,
          end: dissolving.start,
          summary: `${aspectSymbol} ${body1Symbol}-${body2Symbol}-${body3Symbol} ${body1Capitalized}, ${body2Capitalized}, ${body3Capitalized} ${aspect}${extraInfo}`,
          description: `${body1Capitalized}, ${body2Capitalized}, ${body3Capitalized} ${aspect}`,
          categories: [
            "Astronomy",
            "Astrology",
            "Compound Aspect",
            "Triple Aspect",
            aspectCapitalized,
            body1Capitalized,
            body2Capitalized,
            body3Capitalized,
          ],
        });
      }
    }
  }

  return durationEvents;
}
