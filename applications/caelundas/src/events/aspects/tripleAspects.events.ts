import _ from "lodash";
import type { Moment } from "moment";
import type { Body, AspectPhase, TripleAspect } from "../../types";
import { tripleAspectBodies } from "../../types";
import {
  type AspectEdge,
  parseAspectEvents,
  groupAspectsByType,
  findBodiesWithAspectTo,
  haveAspect,
  involvesBody,
  getOtherBody,
  determineMultiBodyPhase,
} from "./aspects.composition";
import { symbolByBody, symbolByTripleAspect } from "../../symbols";
import type { Event } from "../../calendar.utilities";

/**
 * Compose T-Squares from stored 2-body aspects
 * T-Square = 1 opposition + 2 squares forming a T
 */
function composeTSquares(
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
          }
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
            })
          );
        }
      }
    }
  }

  return events;
}

/**
 * Compose Yods from stored 2-body aspects
 * Yod = 1 sextile + 2 quincunxes forming a finger
 */
function composeYods(allEdges: AspectEdge[], currentMinute: Moment): Event[] {
  const events: Event[] = [];

  // Filter to current minute for pattern detection
  const currentTimestamp = currentMinute.toDate().getTime();
  const edges = allEdges.filter(
    (edge) =>
      edge.event.start.getTime() <= currentTimestamp &&
      edge.event.end.getTime() >= currentTimestamp
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
      quincunxes
    );
    const quincunxToBody2 = findBodiesWithAspectTo(
      body2,
      "quincunx",
      quincunxes
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
          }
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
            })
          );
        }
      }
    }
  }

  return events;
}

/**
 * Compose Grand Trines from stored 2-body aspects
 * Grand Trine = 3 trines forming a triangle
 */
function composeGrandTrines(
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

  const trines = aspectsByType.get("trine") || [];

  // Find sets of three bodies where each pair is in trine
  const bodiesInTrines = new Set<Body>();
  for (const trine of trines) {
    bodiesInTrines.add(trine.body1);
    bodiesInTrines.add(trine.body2);
  }

  const bodiesArray = Array.from(bodiesInTrines);

  // Check all combinations of 3 bodies
  for (let i = 0; i < bodiesArray.length; i++) {
    for (let j = i + 1; j < bodiesArray.length; j++) {
      for (let k = j + 1; k < bodiesArray.length; k++) {
        const body1 = bodiesArray[i];
        const body2 = bodiesArray[j];
        const body3 = bodiesArray[k];

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
            }
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
 * Main composition function for triple aspects
 */
export function getTripleAspectEvents(
  storedAspects: Event[],
  currentMinute: Moment
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

  const bodiesSorted = [
    body1Capitalized,
    body2Capitalized,
    body3Capitalized,
  ].sort();

  const description = focalOrApexBody
    ? `${bodiesSorted[0]}, ${bodiesSorted[1]}, ${
        bodiesSorted[2]
      } ${tripleAspect} ${phase} (${_.startCase(focalOrApexBody)} focal)`
    : `${bodiesSorted[0]}, ${bodiesSorted[1]}, ${bodiesSorted[2]} ${tripleAspect} ${phase}`;

  let phaseEmoji = "";
  if (phase === "forming") phaseEmoji = "➡️ ";
  else if (phase === "exact") phaseEmoji = "🎯 ";
  else if (phase === "dissolving") phaseEmoji = "⬅️ ";

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
    description: description as any,
    summary: summary as any,
    categories,
  } as Event;
}

// #region Duration Events

export function getTripleAspectDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  // Filter to triple aspect events only
  const tripleAspectEvents = events.filter((event) =>
    event.categories.includes("Triple Aspect")
  ) as Event[];

  // Group by body triplet and aspect type using categories
  const groupedEvents = _.groupBy(tripleAspectEvents, (event) => {
    const planets = event.categories
      .filter((category) =>
        tripleAspectBodies.map(_.startCase).includes(category)
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
        const categories = forming.categories || [];

        const bodiesCapitalized = categories
          .filter((category) =>
            tripleAspectBodies.map(_.startCase).includes(category)
          )
          .sort();

        const aspectCapitalized = categories.find((category) =>
          ["T Square", "Grand Trine", "Yod"].includes(category)
        );

        if (bodiesCapitalized.length !== 3 || !aspectCapitalized) {
          continue;
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

        const body1Symbol = symbolByBody[body1];
        const body2Symbol = symbolByBody[body2];
        const body3Symbol = symbolByBody[body3];
        const aspectSymbol = symbolByTripleAspect[aspect];

        // Extract focal/apex info if present
        const focalCategory = categories.find((cat) => cat.includes(" Focal"));
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
