import _ from "lodash";
import type { Moment } from "moment";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type { Body, AspectPhase } from "../../types";
import type { QuadrupleAspectEvent } from "./quadrupleAspects.events";
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
import { symbolByBody, symbolByQuadrupleAspect } from "../../constants";
import type { Event } from "../../calendar.utilities";

/**
 * Compose Grand Cross patterns from stored 2-body aspects
 * Grand Cross = 2 oppositions + 4 squares forming a cross
 */
function composeGrandCrosses(
  edges: AspectEdge[],
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>,
  currentMinute: Moment
): QuadrupleAspectEvent[] {
  const events: QuadrupleAspectEvent[] = [];
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
        const calculateTightness = (longitudes: number[]) => {
          // Sum of deviations from ideal angles (2 oppositions + 4 squares)
          let totalDeviation = 0;
          for (let i = 0; i < 4; i++) {
            for (let j = i + 1; j < 4; j++) {
              const angle = Math.abs(longitudes[i] - longitudes[j]);
              const normalized = angle > 180 ? 360 - angle : angle;

              // Bodies should either be opposite (180°) or square (90°)
              const idealAngle = Math.abs(i - j) === 2 ? 180 : 90;
              totalDeviation += Math.abs(normalized - idealAngle);
            }
          }
          return totalDeviation;
        };

        const phaseInfo = determineMultiBodyPhase(
          [opp1, opp2],
          coordinateEphemerisByBody,
          currentMinute,
          calculateTightness,
          bodyList,
          // Check if Grand Cross pattern exists at given longitudes
          (longitudes) => {
            const orb = 8;
            for (let i = 0; i < 4; i++) {
              for (let j = i + 1; j < 4; j++) {
                const angle = Math.abs(longitudes[i] - longitudes[j]);
                const normalized = angle > 180 ? 360 - angle : angle;
                const idealAngle = Math.abs(i - j) === 2 ? 180 : 90;
                if (Math.abs(normalized - idealAngle) >= orb) return false;
              }
            }
            return true;
          }
        );

        if (phaseInfo) {
          events.push(
            createQuadrupleAspectEvent({
              timestamp: currentMinute.toDate(),
              body1: bodyList[0],
              body2: bodyList[1],
              body3: bodyList[2],
              body4: bodyList[3],
              quadrupleAspect: "grand cross",
              phase: phaseInfo.phase,
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
  edges: AspectEdge[],
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>,
  currentMinute: Moment
): QuadrupleAspectEvent[] {
  const events: QuadrupleAspectEvent[] = [];
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

          const calculateTightness = (longitudes: number[]) => {
            // Deviation from ideal Kite configuration
            const [base, side1, side2, apex] = longitudes;
            return (
              Math.abs(Math.abs(base - apex) - 180) +
              Math.abs(Math.abs(base - side1) - 120) +
              Math.abs(Math.abs(base - side2) - 120) +
              Math.abs(Math.abs(apex - side1) - 60) +
              Math.abs(Math.abs(apex - side2) - 60) +
              Math.abs(Math.abs(side1 - side2) - 120)
            );
          };

          const phaseInfo = determineMultiBodyPhase(
            [opp],
            coordinateEphemerisByBody,
            currentMinute,
            calculateTightness,
            bodies,
            // Check if Kite pattern exists at given longitudes
            (longitudes) => {
              const [base, side1, side2, apex] = longitudes;
              const orb = 8;

              const angle_base_apex = Math.abs(base - apex);
              const norm_base_apex =
                angle_base_apex > 180 ? 360 - angle_base_apex : angle_base_apex;

              const angle_base_side1 = Math.abs(base - side1);
              const norm_base_side1 =
                angle_base_side1 > 180
                  ? 360 - angle_base_side1
                  : angle_base_side1;

              const angle_base_side2 = Math.abs(base - side2);
              const norm_base_side2 =
                angle_base_side2 > 180
                  ? 360 - angle_base_side2
                  : angle_base_side2;

              const angle_apex_side1 = Math.abs(apex - side1);
              const norm_apex_side1 =
                angle_apex_side1 > 180
                  ? 360 - angle_apex_side1
                  : angle_apex_side1;

              const angle_apex_side2 = Math.abs(apex - side2);
              const norm_apex_side2 =
                angle_apex_side2 > 180
                  ? 360 - angle_apex_side2
                  : angle_apex_side2;

              const angle_side1_side2 = Math.abs(side1 - side2);
              const norm_side1_side2 =
                angle_side1_side2 > 180
                  ? 360 - angle_side1_side2
                  : angle_side1_side2;

              return (
                Math.abs(norm_base_apex - 180) < orb &&
                Math.abs(norm_base_side1 - 120) < orb &&
                Math.abs(norm_base_side2 - 120) < orb &&
                Math.abs(norm_apex_side1 - 60) < orb &&
                Math.abs(norm_apex_side2 - 60) < orb &&
                Math.abs(norm_side1_side2 - 120) < orb
              );
            }
          );

          if (phaseInfo) {
            events.push(
              createQuadrupleAspectEvent({
                timestamp: currentMinute.toDate(),
                body1: bodies[0],
                body2: bodies[1],
                body3: bodies[2],
                body4: bodies[3],
                quadrupleAspect: "kite",
                focalOrApexBody: fourthBody,
                phase: phaseInfo.phase,
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
function createQuadrupleAspectEvent(params: {
  timestamp: Date;
  body1: Body;
  body2: Body;
  body3: Body;
  body4: Body;
  quadrupleAspect: "grand cross" | "kite";
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
export function composeQuadrupleAspectEvents(
  aspectEvents: Event[],
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>,
  currentMinute: Moment
): QuadrupleAspectEvent[] {
  const edges = parseAspectEvents(aspectEvents);
  const events: QuadrupleAspectEvent[] = [];

  events.push(
    ...composeGrandCrosses(edges, coordinateEphemerisByBody, currentMinute)
  );
  events.push(...composeKites(edges, coordinateEphemerisByBody, currentMinute));

  return events;
}
