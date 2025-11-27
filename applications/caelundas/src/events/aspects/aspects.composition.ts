import _ from "lodash";

import { aspects, bodies } from "../../constants";
import { aspectPhases } from "../../types";

import type { Event } from "../../calendar.utilities";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type { Aspect, AspectPhase, Body } from "../../types";
import type { Moment } from "moment";

/**
 * Represents a 2-body aspect relationship extracted from stored events
 */
export interface AspectEdge {
  body1: Body;
  body2: Body;
  aspectType: Aspect;
  phase: AspectPhase;
  event: Event;
}

/**
 * Parse stored aspect events to extract aspect relationships
 */
export function parseAspectEvents(events: Event[]): AspectEdge[] {
  const edges: AspectEdge[] = [];

  // Pre-compute lowercase body names for efficient lookup
  const bodiesLowercase = bodies.map((body) => body.toLowerCase());

  for (const event of events) {
    try {
      // Normalize categories once
      const normalizedCategories = event.categories.map((category) =>
        category.toLowerCase().trim()
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
          bodiesInEvent.push(bodies[bodyIndex]);
        }
      }

      if (bodiesInEvent.length !== 2) {
        continue; // Not a 2-body aspect
      }

      // Extract aspect type from categories
      const aspectType = normalizedCategories.find((category) =>
        aspects.includes(category as Aspect)
      ) as Aspect | undefined;

      if (!aspectType) {
        continue; // No aspect type found
      }

      // Extract phase from categories
      const phase = normalizedCategories.find((category) =>
        aspectPhases.includes(category as AspectPhase)
      ) as AspectPhase | undefined;

      if (!phase) {
        continue; // No phase found
      }

      edges.push({
        body1: bodiesInEvent[0],
        body2: bodiesInEvent[1],
        aspectType,
        phase,
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
 * Group aspect edges by aspect type for efficient lookup
 */
export function groupAspectsByType(
  edges: AspectEdge[]
): Map<Aspect, AspectEdge[]> {
  const grouped = _.groupBy(edges, "aspectType");
  return new Map(Object.entries(grouped)) as Map<Aspect, AspectEdge[]>;
}

/**
 * Check if an aspect edge involves a specific body
 */
export function involvesBody(edge: AspectEdge, body: Body): boolean {
  return edge.body1 === body || edge.body2 === body;
}

/**
 * Get the other body in an aspect edge
 */
export function getOtherBody(edge: AspectEdge, body: Body): Body | null {
  if (edge.body1 === body) {return edge.body2;}
  if (edge.body2 === body) {return edge.body1;}
  return null;
}

/**
 * Find all bodies that have a specific aspect to a given body
 */
export function findBodiesWithAspectTo(
  body: Body,
  aspectType: Aspect,
  edges: AspectEdge[]
): Body[] {
  return edges
    .filter(
      (edge) => edge.aspectType === aspectType && involvesBody(edge, body)
    )
    .map((edge) => getOtherBody(edge, body))
    .filter((b): b is Body => b !== null);
}

/**
 * Check if two bodies have a specific aspect between them
 */
export function haveAspect(
  body1: Body,
  body2: Body,
  aspectType: Aspect,
  edges: AspectEdge[]
): boolean {
  return edges.some(
    (edge) =>
      edge.aspectType === aspectType &&
      ((edge.body1 === body1 && edge.body2 === body2) ||
        (edge.body1 === body2 && edge.body2 === body1))
  );
}

/**
 * Determine the phase of a multi-body aspect pattern using stored aspect events.
 * Returns the phase (forming/dissolving) based on temporal boundary detection.
 * Returns null if pattern exists in all three time points (no event needed).
 */
export function determineMultiBodyPhase(
  allAspectEdges: AspectEdge[],
  currentMinute: Moment,
  bodies: Body[],
  checkPatternExists: (edges: AspectEdge[]) => boolean
): AspectPhase | null {
  // Get edges at current, previous, and next minutes
  const currentTimestamp = currentMinute.toDate().getTime();
  const previousTimestamp = currentMinute
    .clone()
    .subtract(1, "minute")
    .toDate()
    .getTime();
  const nextTimestamp = currentMinute
    .clone()
    .add(1, "minute")
    .toDate()
    .getTime();

  // Filter edges by timestamp and involved bodies
  const bodySet = new Set(bodies);
  const filterEdges = (timestamp: number) =>
    allAspectEdges.filter(
      (edge) =>
        edge.event.start.getTime() <= timestamp &&
        edge.event.end.getTime() >= timestamp &&
        bodySet.has(edge.body1) &&
        bodySet.has(edge.body2)
    );

  const currentEdges = filterEdges(currentTimestamp);
  const previousEdges = filterEdges(previousTimestamp);
  const nextEdges = filterEdges(nextTimestamp);

  // Check if pattern exists at each time point
  const currentExists = checkPatternExists(currentEdges);
  if (!currentExists) {return null;}

  const previousExists = checkPatternExists(previousEdges);
  const nextExists = checkPatternExists(nextEdges);

  // Determine phase based on existence only
  // Note: "exact" phase removed to avoid duplicate events - only track forming/dissolving

  if (!previousExists && currentExists) {
    return "forming";
  }

  if (currentExists && !nextExists) {
    return "dissolving";
  }

  // Pattern exists in all three time points - no event needed
  return null;
}
