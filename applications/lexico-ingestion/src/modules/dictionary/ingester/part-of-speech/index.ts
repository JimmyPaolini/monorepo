import { ADJECTIVE_FIRST_PP, ingestAdjectiveInflection } from "./adjective.js";
import {
  ADVERB_FIRST_PP,
  ingestAdverbForms,
  ingestAdverbInflection,
} from "./adverb.js";
import {
  CONJUNCTION_FIRST_PP,
  ingestConjunctionInflection,
} from "./conjunction.js";
import { ingestNounInflection, NOUN_FIRST_PP } from "./noun.js";
import { ingestPrefixInflection, PREFIX_FIRST_PP } from "./prefix.js";
import {
  ingestPrepositionInflection,
  PREPOSITION_FIRST_PP,
} from "./preposition.js";
import { ingestPronounInflection, PRONOUN_FIRST_PP } from "./pronoun.js";
import {
  ingestVerbForms,
  ingestVerbInflection,
  VERB_FIRST_PP,
} from "./verb.js";

import type {
  Entry,
  Forms,
  Inflection,
  PartOfSpeech,
  PrincipalPart,
} from "@monorepo/lexico-entities";
import type * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

interface DispatchEntry {
  firstPrincipalPartName: string;
  ingestInflection(
    $: cheerio.CheerioAPI,
    elt: AnyNode,
    principalParts: PrincipalPart[],
  ): Inflection;
  ingestForms?(
    $: cheerio.CheerioAPI,
    elt: AnyNode,
    entry: Entry,
    principalParts: PrincipalPart[],
  ): Promise<Forms | null> | Forms | null;
}

/**
 * Maps each part-of-speech value to its corresponding ingester.
 */
export const ingestersMap: Partial<Record<PartOfSpeech, DispatchEntry>> = {
  noun: {
    firstPrincipalPartName: NOUN_FIRST_PP,
    ingestInflection: ingestNounInflection,
  },
  properNoun: {
    firstPrincipalPartName: NOUN_FIRST_PP,
    ingestInflection: ingestNounInflection,
  },
  verb: {
    firstPrincipalPartName: VERB_FIRST_PP,
    ingestInflection: ingestVerbInflection,
    ingestForms: ingestVerbForms,
  },
  adjective: {
    firstPrincipalPartName: ADJECTIVE_FIRST_PP,
    ingestInflection: ingestAdjectiveInflection,
  },
  participle: {
    firstPrincipalPartName: ADJECTIVE_FIRST_PP,
    ingestInflection: ingestAdjectiveInflection,
  },
  numeral: {
    firstPrincipalPartName: ADJECTIVE_FIRST_PP,
    ingestInflection: ingestAdjectiveInflection,
  },
  suffix: {
    firstPrincipalPartName: ADJECTIVE_FIRST_PP,
    ingestInflection: ingestAdjectiveInflection,
  },
  prefix: {
    firstPrincipalPartName: PREFIX_FIRST_PP,
    ingestInflection: ingestPrefixInflection,
  },
  interfix: {
    firstPrincipalPartName: PREFIX_FIRST_PP,
    ingestInflection: ingestPrefixInflection,
  },
  circumfix: {
    firstPrincipalPartName: PREFIX_FIRST_PP,
    ingestInflection: ingestPrefixInflection,
  },
  pronoun: {
    firstPrincipalPartName: PRONOUN_FIRST_PP,
    ingestInflection: ingestPronounInflection,
  },
  determiner: {
    firstPrincipalPartName: PRONOUN_FIRST_PP,
    ingestInflection: ingestPronounInflection,
  },
  adverb: {
    firstPrincipalPartName: ADVERB_FIRST_PP,
    ingestInflection: (_cheerio, _elt, principalParts) =>
      ingestAdverbInflection(principalParts),
    ingestForms: (_cheerio, _elt, _entry, principalParts) =>
      ingestAdverbForms(principalParts),
  },
  preposition: {
    firstPrincipalPartName: PREPOSITION_FIRST_PP,
    ingestInflection: ingestPrepositionInflection,
  },
  conjunction: {
    firstPrincipalPartName: CONJUNCTION_FIRST_PP,
    ingestInflection: ingestConjunctionInflection,
  },
  interjection: {
    firstPrincipalPartName: CONJUNCTION_FIRST_PP,
    ingestInflection: ingestConjunctionInflection,
  },
  abbreviation: {
    firstPrincipalPartName: CONJUNCTION_FIRST_PP,
    ingestInflection: ingestConjunctionInflection,
  },
  inflection: {
    firstPrincipalPartName: CONJUNCTION_FIRST_PP,
    ingestInflection: ingestConjunctionInflection,
  },
  particle: {
    firstPrincipalPartName: CONJUNCTION_FIRST_PP,
    ingestInflection: ingestConjunctionInflection,
  },
  phrase: {
    firstPrincipalPartName: CONJUNCTION_FIRST_PP,
    ingestInflection: ingestConjunctionInflection,
  },
  proverb: {
    firstPrincipalPartName: CONJUNCTION_FIRST_PP,
    ingestInflection: ingestConjunctionInflection,
  },
  idiom: {
    firstPrincipalPartName: CONJUNCTION_FIRST_PP,
    ingestInflection: ingestConjunctionInflection,
  },
};

/**
 * Resolves the part-of-speech label from the nearest preceding heading.
 */
export function getPartOfSpeech(
  $: cheerio.CheerioAPI,
  elt: AnyNode,
): PartOfSpeech {
  return $(elt)
    .prevAll(":header, h3, h4")
    .last()
    .text()
    .toLowerCase()
    .replaceAll(/(\[edit])|\d+/g, "")
    .trim()
    .replace("proper noun", "properNoun") as PartOfSpeech;
}
