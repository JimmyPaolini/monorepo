import _ from "lodash";

import { aspects, bodies } from "../../constants";
import { aspectPhases } from "../../types";

import type { ActiveAspect } from "./aspects.store";
import type { Event } from "../../calendar.utilities";
import type { Aspect, AspectPhase, Body } from "../../types";
import type moment from "moment-timezone";

/**
 * Represents a 2-body aspect relationship extracted from stored events.
 *
 * Extends {@link ActiveAspect} with phase and event metadata
 * needed for temporal analysis during post-processing.
 *
 * @see {@link parseAspectEvents} for extraction from event data
 */
export interface AspectEdge extends ActiveAspect {
  phase: AspectPhase;
  event: Event;
}

/**
 * Parses stored aspect events to extract simplified aspect relationships.
 *
 * Converts calendar events with rich metadata into lightweight edge
 * representations suitable for graph algorithms. Filters to simple
 * 2-body aspects (not compound patterns) and extracts:
 * - Body pair involved
 * - Aspect type (conjunction, trine, square, etc.)
 * - Phase (forming, exact, dissolving)
 * - Original event reference
 *
 * Malformed events are skipped with warnings logged to console.
 *
 * @param events - All calendar events to parse
 * @returns Array of aspect edges suitable for pattern composition
 * @see {@link AspectEdge} for edge data structure
 */
export function parseAspectEvents(events: Event[]): AspectEdge[] {
  const edges: AspectEdge[] = [];

  // Pre-compute lowercase body names for efficient lookup
  const bodiesLowercase = bodies.map((body) => body.toLowerCase());

  for (const event of events) {
    try {
      // Normalize categories once
      const normalizedCategories = event.categories.map((category) =>
        category.toLowerCase().trim(),
      );

      // Validate this is a simple aspect event (not compound)
      if (!normalizedCategories.includes("simple aspect")) {
        continue;
      }

      // Extract bodies from categories
      const bodiesInEvent: Body[] = [];
      for (const category of normalizedCategories) {
        const bodyIndex = bodiesLowercase.indexOf(category);
        if (bodyIndex !== -1) {
          const body = bodies[bodyIndex];
          if (body) {
            bodiesInEvent.push(body);
          }
        }
      }

      if (bodiesInEvent.length !== 2) {
        continue; // Not a 2-body aspect
      }

      // Extract aspect type from categories
      const aspectType = normalizedCategories.find((category) =>
        aspects.includes(category as Aspect),
      ) as Aspect | undefined;

      if (!aspectType) {
        continue; // No aspect type found
      }

      // Extract phase from categories
      const phase = normalizedCategories.find((category) =>
        aspectPhases.includes(category as AspectPhase),
      ) as AspectPhase | undefined;

      const resolvedPhase: AspectPhase = phase ?? "perfective";

      const body1 = bodiesInEvent[0];
      const body2 = bodiesInEvent[1];
      if (!body1 || !body2) {
        continue; // Invalid body assignment
      }

      edges.push({
        bodies: [body1, body2],
        aspect: aspectType,
        phase: resolvedPhase,
        event,
      });
    } catch (error) {
      // Skip malformed events
      console.warn(`Failed to parse aspect event: ${event.summary}`, error);
    }
  }

  return edges;
}

/**
 * Groups aspect edges by aspect type for efficient lookup.
 *
 * Creates a map where keys are aspect types (conjunction, trine, etc.)
 * and values are arrays of all edges with that aspect. This enables
 * O(1) lookup when searching for specific aspect types during pattern
 * composition.
 *
 * @param edges - Aspect edges to group
 * @returns Map of aspect type to edges of that type
 */
export function groupAspectsByType<T extends ActiveAspect>(
  edges: T[],
): Map<Aspect, T[]> {
  const grouped = _.groupBy(edges, "aspect");
  return new Map(Object.entries(grouped)) as Map<Aspect, T[]>;
}

/**
 * Checks if an aspect edge involves a specific body.
 *
 * @param edge - Aspect edge to check
 * @param body - Body to search for
 * @returns True if body is either body1 or body2 in the edge
 */
export function involvesBody(edge: ActiveAspect, body: Body): boolean {
  return edge.bodies[0] === body || edge.bodies[1] === body;
}

/**
 * Retrieves the other body in an aspect edge.
 *
 * @param edge - Aspect edge
 * @param body - Known body in the edge
 * @returns The other body in the edge, or null if body not found
 */
export function getOtherBody(edge: ActiveAspect, body: Body): Body | null {
  if (edge.bodies[0] === body) {
    return edge.bodies[1];
  }
  if (edge.bodies[1] === body) {
    return edge.bodies[0];
  }
  return null;
}

/**
 * Finds all bodies that have a specific aspect to a given body.
 *
 * Useful for building adjacency lists when analyzing aspect patterns.
 * For example, finding all bodies in trine to Jupiter.
 *
 * @param body - The reference body
 * @param aspectType - Type of aspect to search for
 * @param edges - Edges to search through
 * @returns Array of bodies with the specified aspect to the reference body
 */
export function findBodiesWithAspectTo(
  body: Body,
  aspectType: Aspect,
  edges: ActiveAspect[],
): Body[] {
  return edges
    .filter((edge) => edge.aspect === aspectType && involvesBody(edge, body))
    .map((edge) => getOtherBody(edge, body))
    .filter((b): b is Body => b !== null);
}

/**
 * Checks if two bodies have a specific aspect between them.
 *
 * Searches edges for an aspect of the given type connecting the two bodies.
 * Order-independent: checks both (body1, body2) and (body2, body1).
 *
 * @param body1 - First body
 * @param body2 - Second body
 * @param aspectType - Type of aspect to check for
 * @param edges - Edges to search through
 * @returns True if aspect exists between the bodies
 */
export function haveAspect(
  body1: Body,
  body2: Body,
  aspectType: Aspect,
  edges: ActiveAspect[],
): boolean {
  return edges.some(
    (edge) =>
      edge.aspect === aspectType &&
      ((edge.bodies[0] === body1 && edge.bodies[1] === body2) ||
        (edge.bodies[0] === body2 && edge.bodies[1] === body1)),
  );
}

/**
 * Determines the phase of a multi-body aspect pattern using temporal boundaries.
 *
 * Checks if a pattern exists at current, previous, and next minutes to determine
 * whether it's forming (didn't exist before), dissolving (won't exist after),
 * or stable (exists at all three times, no event needed).
 *
 * This temporal boundary detection ensures we only create events at the exact
 * moments when patterns enter or exit their active period, avoiding duplicate
 * events during stable periods.
 *
 * @param allAspectEdges - All aspect edges across time for temporal analysis
 * @param currentMinute - The current minute to check
 * @param bodies - Bodies involved in the pattern
 * @param checkPatternExists - Function that validates if pattern exists given edges
 * @returns Phase (forming/dissolving) or null if no event needed
 * @remarks Returns null when pattern exists at all three time points to avoid
 *          generating duplicate events during stable periods
 */
export function determineMultiBodyPhase(
  allAspectEdges: AspectEdge[],
  currentMinute: moment.Moment,
  bodies: Body[],
  checkPatternExists: (edges: AspectEdge[]) => boolean,
): AspectPhase | null {
  // Get edges at current, previous, and next minutes
  const currentTimestamp = currentMinute.valueOf();
  const previousTimestamp = currentMinute.valueOf() - 60_000;
  const nextTimestamp = currentMinute.valueOf() + 60_000;

  // Filter edges by timestamp and involved bodies
  const bodySet = new Set(bodies);
  const filterEdges = (timestamp: number): AspectEdge[] =>
    allAspectEdges.filter(
      (edge) =>
        edge.event.start.valueOf() <= timestamp &&
        edge.event.end.valueOf() >= timestamp &&
        bodySet.has(edge.bodies[0]) &&
        bodySet.has(edge.bodies[1]),
    );

  const currentEdges = filterEdges(currentTimestamp);
  const previousEdges = filterEdges(previousTimestamp);
  const nextEdges = filterEdges(nextTimestamp);

  // Check if pattern exists at each time point
  const currentExists = checkPatternExists(currentEdges);
  if (!currentExists) {
    return null;
  }

  const previousExists = checkPatternExists(previousEdges);
  const nextExists = checkPatternExists(nextEdges);

  // Determine phase based on existence only
  // Note: "perfective" phase removed to avoid duplicate events - only track forming/dissolving

  if (!previousExists) {
    return "forming";
  }

  if (!nextExists) {
    return "dissolving";
  }

  // Pattern exists in all three time points - no event needed
  return null;
}

/**
 * Determines the phase of a compound aspect pattern by comparing snapshots.
 *
 * Uses the active aspects store snapshots (current vs previous minute)
 * instead of scanning event arrays with timestamp filtering.
 *
 * - Forming: pattern exists in current snapshot but not previous → event at currentMinute
 * - Dissolving: pattern exists in previous snapshot but not current → event at currentMinute - 1min
 * - Stable/absent: no event needed
 *
 * @param currentEdges - Current minute's active aspect relationships
 * @param previousEdges - Previous minute's active aspect relationships
 * @param patternBodies - Bodies involved in the pattern
 * @param currentMinute - The current minute being processed
 * @param checkPatternExists - Predicate that validates if pattern exists in given edges
 * @returns Phase and event minute, or null if no event needed
 */
export function determineCompoundPhaseFromSnapshots(
  currentEdges: ActiveAspect[],
  previousEdges: ActiveAspect[],
  patternBodies: Body[],
  currentMinute: moment.Moment,
  checkPatternExists: (edges: ActiveAspect[]) => boolean,
): { phase: AspectPhase; eventMinute: moment.Moment } | null {
  const bodySet = new Set(patternBodies);
  const filterByBodies = (edges: ActiveAspect[]): ActiveAspect[] =>
    edges.filter((e) => bodySet.has(e.bodies[0]) && bodySet.has(e.bodies[1]));

  const currentFiltered = filterByBodies(currentEdges);
  const previousFiltered = filterByBodies(previousEdges);

  const currentExists = checkPatternExists(currentFiltered);
  const previousExists = checkPatternExists(previousFiltered);

  if (currentExists && !previousExists) {
    return { phase: "forming", eventMinute: currentMinute };
  }
  if (!currentExists && previousExists) {
    return {
      phase: "dissolving",
      eventMinute: currentMinute.clone().subtract(1, "minute"),
    };
  }
  return null;
}
