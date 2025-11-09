import _ from "lodash";
import type { Moment } from "moment";
import type { Event } from "../../calendar.utilities";
import type { Body, Aspect, AspectPhase } from "../../types";
import { bodies, aspects, aspectPhases } from "../../constants";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";

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
  if (edge.body1 === body) return edge.body2;
  if (edge.body2 === body) return edge.body1;
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
 * Calculate the overall tightness/phase of a multi-body aspect
 * based on the phases of its component aspects.
 * Returns null if pattern exists in all three time points without being at peak (no event needed).
 */
export function determineMultiBodyPhase(
  componentAspects: AspectEdge[],
  coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>,
  currentMinute: Moment,
  calculateTightness: (longitudes: number[]) => number,
  bodies: Body[],
  checkPatternExists: (longitudes: number[]) => boolean
): { phase: "forming" | "exact" | "dissolving"; tightness: number } | null {
  // Get current longitudes for all involved bodies
  const currentLongitudes = bodies.map(
    (body) =>
      coordinateEphemerisByBody[body][currentMinute.toISOString()].longitude
  );

  // Check if pattern currently exists
  const currentExists = checkPatternExists(currentLongitudes);
  if (!currentExists) return null;

  const currentTightness = calculateTightness(currentLongitudes);

  // Get previous and next longitudes
  const previousMinute = currentMinute.clone().subtract(1, "minute");
  const nextMinute = currentMinute.clone().add(1, "minute");

  const previousLongitudes = bodies.map(
    (body) =>
      coordinateEphemerisByBody[body][previousMinute.toISOString()].longitude
  );

  const nextLongitudes = bodies.map(
    (body) =>
      coordinateEphemerisByBody[body][nextMinute.toISOString()].longitude
  );

  // Check if pattern exists in previous and next minutes
  const previousExists = checkPatternExists(previousLongitudes);
  const nextExists = checkPatternExists(nextLongitudes);

  const previousTightness = previousExists
    ? calculateTightness(previousLongitudes)
    : Infinity;
  const nextTightness = nextExists
    ? calculateTightness(nextLongitudes)
    : Infinity;

  // Determine phase based on existence and tightness
  // Note: "exact" phase removed to avoid duplicate events - only track forming/dissolving

  if (!previousExists && currentExists) {
    return { phase: "forming", tightness: currentTightness };
  }

  if (currentExists && !nextExists) {
    return { phase: "dissolving", tightness: currentTightness };
  }

  // Pattern exists in all three time points - no event needed
  return null;
}
