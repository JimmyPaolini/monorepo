import { type Inflection, Uninflected } from "@monorepo/lexico-entities";

export const PREFIX_FIRST_PP = "masculine";

/** A prefix has no inflection to parse. */
export function ingestPrefixInflection(): Inflection {
  return new Uninflected();
}
