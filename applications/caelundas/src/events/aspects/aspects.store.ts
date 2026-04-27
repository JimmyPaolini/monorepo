import { aspects, bodies } from "../../constants";

import type { Event } from "../../calendar.utilities";
import type { Aspect, Body } from "../../types";

/**
 * Represents an active aspect between two celestial bodies at a specific moment.
 */
export interface AspectBodies {
  aspect: Aspect;
  bodies: [Body, Body];
}

const aspectBodiesMap = new Map<string, AspectBodies>();

function makeKey(body1: Body, body2: Body, aspect: Aspect): string {
  const [sortedBody1, sortedBody2] = [body1, body2].toSorted();
  return `${sortedBody1}\u001F${sortedBody2}\u001F${aspect}`;
}

/**
 * Updates the in-memory active aspect store from simple aspect events.
 *
 * Parses each event's categories to determine whether it marks the forming or
 * dissolving of a two-body aspect, then adds or removes the corresponding
 * entry from the store. Events for patterns other than simple aspects are
 * ignored.
 *
 * @param events - Perfective events emitted during the current processing window
 *
 * @remarks
 * Function name retained for compatibility with earlier integration work.
 */
export function updateAspectBodiesStoreByPerfectiveEvents(
  events: Event[],
): void {
  const lowercaseBodies = bodies.map((body) => body.toLowerCase());

  for (const event of events) {
    const normalizedCategories = event.categories.map((category) =>
      category.toLowerCase().trim(),
    );

    if (!normalizedCategories.includes("simple aspect")) {
      continue;
    }

    const isForming = normalizedCategories.includes("forming");
    const isDissolving = normalizedCategories.includes("dissolving");

    if (!isForming && !isDissolving) {
      continue;
    }

    const eventBodies: Body[] = [];
    for (const category of normalizedCategories) {
      const bodyIndex = lowercaseBodies.indexOf(category);
      if (bodyIndex !== -1) {
        const body = bodies[bodyIndex];
        if (body) {
          eventBodies.push(body);
        }
      }
    }

    if (eventBodies.length !== 2) {
      continue;
    }

    const aspect = normalizedCategories.find((category) =>
      aspects.includes(category as Aspect),
    ) as Aspect | undefined;

    if (!aspect) {
      continue;
    }

    const [body1, body2] = eventBodies as [Body, Body];
    const key = makeKey(body1, body2, aspect);

    if (isDissolving) {
      aspectBodiesMap.delete(key);
      continue;
    }

    if (!aspectBodiesMap.has(key)) {
      aspectBodiesMap.set(key, { aspect, bodies: [body1, body2] });
    }
  }
}

/**
 * Returns a snapshot of all currently active two-body aspects.
 *
 * The returned array reflects the state after processing the most recent
 * perfective event batch and is used by compound-aspect detectors to
 * determine which multi-body patterns are currently formed.
 */
export function getAspectBodies(): AspectBodies[] {
  return [...aspectBodiesMap.values()];
}

/**
 * Clears all active aspects from the store.
 *
 * Called at the start of each day's processing window so that aspects
 * carried over from a previous run do not pollute detection for the new range.
 */
export function resetAspectBodiesStore(): void {
  aspectBodiesMap.clear();
}
