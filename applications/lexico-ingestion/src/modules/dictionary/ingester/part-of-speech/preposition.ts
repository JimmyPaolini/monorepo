import {
  type Inflection,
  type PrepositionCase,
  prepositionCaseValues,
  PrepositionInflection,
} from "@monorepo/lexico-entities";

import type * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

const prepositionCaseRegex = new RegExp(
  prepositionCaseValues.filter(Boolean).join("|"),
);

export const PREPOSITION_FIRST_PP = "preposition";

/** Ingest a preposition's case from its Wiktionary headword line. */
export function ingestPrepositionInflection($: cheerio.CheerioAPI, elt: AnyNode): Inflection {
    const text = $(elt).text();
    const other = text.split("(+ ")[1]?.split(")")[0];

    if (!other?.length) {
      const prep = new PrepositionInflection();
      prep.case = "accusative";
      return prep;
    }

    const prepositionCase = other.match(prepositionCaseRegex)?.[0] ?? "";
    const prep = new PrepositionInflection();
    prep.case = prepositionCase as PrepositionCase;
    prep.other = other;
    