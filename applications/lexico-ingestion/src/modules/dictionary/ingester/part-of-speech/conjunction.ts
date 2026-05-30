import { type Inflection, Uninflected } from "@monorepo/lexico-entities";

export const CONJUNCTION_FIRST_PP = "conjunction";

/** A conjunction has no inflection to parse. */
export function ingestConjunctionInflection(): Inflection {
  return new Uninflected();
}
