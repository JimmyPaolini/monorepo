import {
  type Inflection,
  type NounDeclension,
  nounDeclensionValues,
  type NounGender,
  nounGenderValues,
  NounInflection,
  Uninflected,
} from "@monorepo/lexico-entities";

import type * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

const nounDeclensionRegex = new RegExp(
  nounDeclensionValues.filter(Boolean).join("|"),
);
const genderRegex = new RegExp(nounGenderValues.filter(Boolean).join("|"));

export const NOUN_FIRST_PP = "nominative";

/** Ingest a noun's declension and gender from its Wiktionary headword line. */
export function ingestNounInflection(
  $: cheerio.CheerioAPI,
  elt: AnyNode,
): Inflection {
  const inflectionHtml = $(elt)
    .nextUntil("h3", ':header:contains("Declension")')
    .first()
    .next();

  if (inflectionHtml.length === 0) return new Uninflected();

  const declension = inflectionHtml
    .text()
    .replaceAll(/(-declension)|(declension)|(noun)|[.\d[\]]/gi, "")
    .replaceAll(/\s+/g, " ")
    .toLowerCase()
    .trim();

  let gender = $(elt).children("span.gender").text();
  gender = gender
    .replace(/^m|m$/, "masculine")
    .replace(/^f|f$/, "feminine")
    .replace(/^n|n$/, "neuter")
    .replace("sg", "singular")
    .replace("pl", "plural");

  if (declension.length === 0 && gender.length === 0) return new Uninflected();

  const other = `${declension}, ${gender}`;
  const matchedDeclension = declension.match(nounDeclensionRegex)?.[0] ?? "";
  const matchedGender = gender.match(genderRegex)?.[0] ?? "";

  const noun = new NounInflection();
  noun.declension = matchedDeclension as NounDeclension;
  noun.gender = matchedGender as NounGender;
  noun.other = other;
  return noun;
}
