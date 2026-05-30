import {
  type AdjectiveDeclension,
  adjectiveDeclensionValues,
  type AdjectiveDegree,
  adjectiveDegreeValues,
  AdjectiveInflection,
  type Inflection,
  Uninflected,
} from "@monorepo/lexico-entities";

import type * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

const adjectiveDeclensionRegex = new RegExp(
  adjectiveDeclensionValues.filter(Boolean).join("|"),
);
const adjectiveDegreeRegex = new RegExp(
  adjectiveDegreeValues.filter(Boolean).join("|"),
);

/**
 * Parses adjective inflection from the Wiktionary headword element.
 * Exported so it can be reused by related POS ingesters.
 */
export function ingestAdjectiveInflection(
  $: cheerio.CheerioAPI,
  elt: AnyNode,
): Inflection {
  const inflectionHtml = $(elt)
    .nextUntil("h3", ':header:contains("Declension")')
    .first()
    .next();

  if (inflectionHtml.length === 0) return new Uninflected();

  let declension = inflectionHtml
    .text()
    .replaceAll(
      /(-declension)|(declension)|(adjective)|(participle)|(numeral)|[.\d[\]]/gi,
      "",
    )
    .replaceAll(/\s+/g, " ")
    .toLowerCase()
    .trim();

  if (declension.length === 0) return new Uninflected();

  const other = declension;
  const degree = declension.match(adjectiveDegreeRegex)?.[0] ?? "positive";
  declension = declension.match(adjectiveDeclensionRegex)?.[0] ?? "";

  const adj = new AdjectiveInflection();
  adj.declension = declension as AdjectiveDeclension;
  adj.degree = degree as AdjectiveDegree;
  adj.other = other;
  return adj;
}

export const ADJECTIVE_FIRST_PP = "masculine";
