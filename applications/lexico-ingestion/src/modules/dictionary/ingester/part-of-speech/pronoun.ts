import {
  type AdjectiveDeclension,
  adjectiveDeclensionValues,
  AdjectiveInflection,
  type Inflection,
  Uninflected,
} from "@monorepo/lexico-entities";

import type * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

const adjectiveDeclensionRegex = new RegExp(
  adjectiveDeclensionValues.filter(Boolean).join("|"),
);

export const PRONOUN_FIRST_PP = "masculine";

/** Ingest a pronoun's declension from its Wiktionary headword line. */
export function ingestPronounInflection(
  $: cheerio.CheerioAPI,
  elt: AnyNode,
): Inflection {
  if (!$(elt).text().includes(";")) return new Uninflected();

  let declension = ($(elt).text().split("; ")[1] ?? "")
    .replace("pronoun", "")
    .replace("-", "")
    .replace("declension", "")
    .replaceAll(/\s+/g, " ")
    .trim();

  if (declension.length === 0) return new Uninflected();

  declension = declension.match(adjectiveDeclensionRegex)?.[0] ?? "";

  const adj = new AdjectiveInflection();
  adj.declension = declension as AdjectiveDeclension;
  adj.degree = "positive";
  return adj;
}
