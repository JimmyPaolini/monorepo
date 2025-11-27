import type { Event } from "./calendar.utilities";

/**
 * Pair beginning/ending phase events chronologically.
 * Returns valid pairs as tuples and warns about unpaired or invalid events.
 */
export function pairDurationEvents<E extends Event>(
  beginningEvents: E[],
  endingEvents: E[],
  eventName: string,
): [E, E][] {
  const beginnings = [...beginningEvents].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const endings = [...endingEvents].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const pairs: [E, E][] = [];

  // Pair each beginning with the next valid ending
  for (
    let beginningIndex = 0, endingIndex = 0;
    beginningIndex < beginnings.length && endingIndex < endings.length;
    beginningIndex++, endingIndex++
  ) {
    const beginning = beginnings[beginningIndex];
    const ending = endings[endingIndex];
    if (!beginning || !ending) {
      continue;
    }

    if (ending.start <= beginning.start) {
      console.warn(
        `⚠️ Skipping invalid ${eventName} ending: ` +
          `ending (${ending.start.toISOString()}) is before or equal to ` +
          `beginning (${beginning.start.toISOString()})`,
      );
      beginningIndex--;
      continue;
    }

    pairs.push([beginning, ending]);
  }

  const unpairedBeginnings = beginnings.length - pairs.length;
  const unpairedEndings = endings.length - pairs.length;

  if (unpairedBeginnings > 0) {
    console.warn(
      `⚠️ ${unpairedBeginnings} unpaired ${eventName} beginning(s) ` +
        `(likely extends beyond date range)`,
    );
  }

  if (unpairedEndings > 0) {
    console.warn(
      `⚠️ ${unpairedEndings} unpaired ${eventName} ending(s) ` +
        `(likely started before date range)`,
    );
  }

  return pairs;
}
