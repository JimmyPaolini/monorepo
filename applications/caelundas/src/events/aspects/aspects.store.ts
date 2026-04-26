import { aspects, bodies } from "../../constants";

import type { Event } from "../../calendar.utilities";
import type { Aspect, Body } from "../../types";

/**
 * Represents an active aspect between two celestial bodies at a specific moment.
 */
export interface ActiveAspect {
  aspect: Aspect;
  bodies: [Body, Body];
}

const activeAspects = new Map<string, ActiveAspect>();

function makeKey(body1: Body, body2: Body, aspect: Aspect): string {
  const [sortedBody1, sortedBody2] = [body1, body2].toSorted();
  return `${sortedBody1}\u001F${sortedBody2}\u001F${aspect}`;
}

/**
 * Updates the in-memory active aspect store from simple aspect events.
 *
 * @remarks
 * Function name retained for compatibility with earlier integration work.
 */
export function updateActiveAspectsStoreByPerfectiveEvents(events: Event[]): void {
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
      activeAspects.delete(key);
      continue;
    }

    if (!activeAspects.has(key)) {
      activeAspects.set(key, { aspect, bodies: [body1, body2] });
    }
  }
}

/**
 * Returns a snapshot of currently active aspects.
 */
export function getActiveAspects(): ActiveAspect[] {
  return [...activeAspects.values()];
}

/**
 * Clears active store state.
 */
export function resetActiveAspectsStore(): void {
  activeAspects.clear();
}
