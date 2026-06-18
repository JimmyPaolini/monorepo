import { Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";

import {
  type AdjectiveDeclension,
  adjectiveDeclensionValues,
  type AdjectiveDegree,
  adjectiveDegreeValues,
  AdjectiveInflection,
  AdverbInflection,
  type Inflection,
  type Lexeme,
  type NounDeclension,
  nounDeclensionValues,
  type NounGender,
  nounGenders,
  NounInflection,
  type PartOfSpeech,
  partOfSpeechEnumValues,
  type PrepositionCase,
  prepositionCases,
  PrepositionInflection,
  type PrincipalPart,
  UninflectedInflection,
  type VerbConjugation,
  verbConjugationValues,
  VerbInflection,
} from "@monorepo/lexico-entities";

import {
  adjectiveDeclensionRegex,
  adjectiveDegreeRegex,
  firstPrincipalPartNames,
  genderRegex,
  nounDeclensionRegex,
  prepositionCaseRegex,
  verbConjugationRegex,
} from "./part-of-speech.constants";
import { PartOfSpeechFormsParser } from "./part-of-speech.forms-parser";

import type { AnyNode } from "domhandler";

const adjectiveDeclensionValueList = normalizeStringArray(
  adjectiveDeclensionValues,
);
const adjectiveDegreeValueList = normalizeStringArray(adjectiveDegreeValues);
const nounDeclensionValueList = normalizeStringArray(nounDeclensionValues);
const nounGenderValueList = normalizeStringArray(nounGenders);
const partOfSpeechValueList = normalizeStringArray(partOfSpeechEnumValues);
const prepositionCaseValueList = normalizeStringArray(prepositionCases);
const verbConjugationValueList = normalizeStringArray(verbConjugationValues);

/**
 * Declaration for part-of-speech parsing.
 */
function findTypedValue<ValueType extends string>(
  values: readonly ValueType[],
  candidate: string,
): undefined | ValueType {
  return values.find((value) => value === candidate);
}

/**
 * Normalizes input values used by part-of-speech parsing.
 */
function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

/**
 * Resolves the part of speech from a Wiktionary HTML element, dispatches
 * inflection and forms parsing for all supported parts of speech, and provides
 * shared form-table parsing utilities.
 */
@Injectable()
export class PartOfSpeechService {
  // 🏗 Dependency Injection

  constructor() {}

  // 🔐 Private Fields

  private static readonly FORMS_GROUP: Record<
    PartOfSpeech,
    "adverb" | "generic" | "verb"
  > = {
    abbreviation: "generic",
    adjective: "generic",
    adverb: "adverb",
    circumfix: "generic",
    conjunction: "generic",
    determiner: "generic",
    idiom: "generic",
    inflection: "generic",
    interfix: "generic",
    interjection: "generic",
    noun: "generic",
    numeral: "generic",
    participle: "generic",
    particle: "generic",
    phrase: "generic",
    prefix: "generic",
    preposition: "generic",
    pronoun: "generic",
    properNoun: "generic",
    proverb: "generic",
    suffix: "generic",
    verb: "verb",
  };

  private static readonly INFLECTION_GROUP: Record<
    PartOfSpeech,
    | "adjective"
    | "adverb"
    | "noun"
    | "prefix"
    | "preposition"
    | "pronoun"
    | "uninflected"
    | "verb"
  > = {
    abbreviation: "uninflected",
    adjective: "adjective",
    adverb: "adverb",
    circumfix: "prefix",
    conjunction: "uninflected",
    determiner: "pronoun",
    idiom: "uninflected",
    inflection: "uninflected",
    interfix: "prefix",
    interjection: "uninflected",
    noun: "noun",
    numeral: "adjective",
    participle: "adjective",
    particle: "uninflected",
    phrase: "uninflected",
    prefix: "prefix",
    preposition: "preposition",
    pronoun: "pronoun",
    properNoun: "noun",
    proverb: "uninflected",
    suffix: "adjective",
    verb: "verb",
  };

  private readonly formsParser = new PartOfSpeechFormsParser();

  // 🔑 Public Fields

  // 🔏 Private Methods

  /**
   * Builds adjective inflection for part-of-speech parsing.
   */
  private buildAdjectiveInflection(declension: string): AdjectiveInflection {
    const degree = declension.match(adjectiveDegreeRegex)?.[0] ?? "positive";
    const matchedDeclension =
      declension.match(adjectiveDeclensionRegex)?.[0] ?? "";
    const adj = new AdjectiveInflection();
    adj.declension =
      (findTypedValue(adjectiveDeclensionValueList, matchedDeclension) as
        | AdjectiveDeclension
        | undefined) ?? "";
    adj.degree =
      (findTypedValue(adjectiveDegreeValueList, degree) as
        | AdjectiveDegree
        | undefined) ?? "positive";
    return adj;
  }

  /**
   * Builds noun inflection for part-of-speech parsing.
   */
  private buildNounInflection(
    declension: string,
    gender: string,
  ): NounInflection {
    const matchedDeclension = declension.match(nounDeclensionRegex)?.[0] ?? "";
    const matchedGender = gender.match(genderRegex)?.[0] ?? "";
    const noun = new NounInflection();
    noun.declension =
      (findTypedValue(nounDeclensionValueList, matchedDeclension) as
        | NounDeclension
        | undefined) ?? "";
    noun.gender =
      (findTypedValue(nounGenderValueList, matchedGender) as
        | NounGender
        | undefined) ?? "";
    return noun;
  }

  /**
   * Gets text or empty used by part-of-speech parsing.
   */
  private getTextOrEmpty(part: PrincipalPart | undefined): string[] {
    return part?.text ?? [];
  }

  /**
   * Ingests adjective inflection in the part-of-speech parsing pipeline.
   */
  private ingestAdjectiveInflection(
    $: cheerio.CheerioAPI,
    elt: AnyNode,
  ): Inflection {
    const inflectionHtml = $(elt)
      .nextAll("div.mw-heading")
      .filter((_: number, element: AnyNode) =>
        /declension/i.test($(element).text()),
      )
      .first()
      .next();

    if (inflectionHtml.length === 0) return new UninflectedInflection();

    const declension = inflectionHtml
      .text()
      .replaceAll(
        /(-declension)|(declension)|(adjective)|(participle)|(numeral)|[.\d[\]]/gi,
        "",
      )
      .replaceAll(/\s+/g, " ")
      .toLowerCase()
      .trim();

    if (declension.length === 0) return new UninflectedInflection();

    return this.buildAdjectiveInflection(declension);
  }

  /**
   * Ingests adverb forms in the part-of-speech parsing pipeline.
   */
  private ingestAdverbForms(principalParts: PrincipalPart[]): unknown {
    const forms: Record<string, string[]> = {
      positive: this.getTextOrEmpty(principalParts[0]),
    };
    if (principalParts.length >= 2)
      forms["comparative"] = this.getTextOrEmpty(principalParts[1]);
    if (principalParts.length >= 3)
      forms["superlative"] = this.getTextOrEmpty(principalParts[2]);
    return forms;
  }

  /**
   * Ingests adverb inflection in the part-of-speech parsing pipeline.
   */
  private ingestAdverbInflection(principalParts: PrincipalPart[]): Inflection {
    const adverbInflection = new AdverbInflection();
    adverbInflection.adverbType =
      principalParts.length > 1 ? "descriptive" : "conjunctional";
    adverbInflection.degree = "positive";
    return adverbInflection;
  }

  /**
   * Ingests conjunction inflection in the part-of-speech parsing pipeline.
   */
  private ingestConjunctionInflection(): Inflection {
    return new UninflectedInflection();
  }

  /**
   * Ingests noun inflection in the part-of-speech parsing pipeline.
   */
  private ingestNounInflection(
    $: cheerio.CheerioAPI,
    elt: AnyNode,
  ): Inflection {
    const inflectionHtml = $(elt)
      .nextAll("div.mw-heading")
      .filter((_: number, element: AnyNode) =>
        /declension/i.test($(element).text()),
      )
      .first()
      .next();

    if (inflectionHtml.length === 0) return new UninflectedInflection();

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

    if (declension.length === 0 && gender.length === 0)
      return new UninflectedInflection();

    return this.buildNounInflection(declension, gender);
  }

  /**
   * Ingests prefix inflection in the part-of-speech parsing pipeline.
   */
  private ingestPrefixInflection(): Inflection {
    return new UninflectedInflection();
  }

  /**
   * Ingests preposition inflection in the part-of-speech parsing pipeline.
   */
  private ingestPrepositionInflection(
    $: cheerio.CheerioAPI,
    elt: AnyNode,
  ): Inflection {
    const text = $(elt).text();
    const other = text.split("(+ ")[1]?.split(")")[0];

    if (!other?.length) {
      const prep = new PrepositionInflection();
      prep.case = "accusative";
      return prep;
    }

    const prepositionCase = other.match(prepositionCaseRegex)?.[0] ?? "";
    const prepositionInflection = new PrepositionInflection();
    prepositionInflection.case =
      (findTypedValue(prepositionCaseValueList, prepositionCase) as
        | PrepositionCase
        | undefined) ?? "";
    prepositionInflection.other = other;
    return prepositionInflection;
  }

  /**
   * Ingests pronoun inflection in the part-of-speech parsing pipeline.
   */
  private ingestPronounInflection(
    $: cheerio.CheerioAPI,
    elt: AnyNode,
  ): Inflection {
    if (!$(elt).text().includes(";")) return new UninflectedInflection();

    let declension = ($(elt).text().split("; ")[1] ?? "")
      .replace("pronoun", "")
      .replace("-", "")
      .replace("declension", "")
      .replaceAll(/\s+/g, " ")
      .trim();

    if (declension.length === 0) return new UninflectedInflection();

    declension = declension.match(adjectiveDeclensionRegex)?.[0] ?? "";

    const adjectiveInflection = new AdjectiveInflection();
    adjectiveInflection.declension =
      (findTypedValue(adjectiveDeclensionValueList, declension) as
        | AdjectiveDeclension
        | undefined) ?? "";
    adjectiveInflection.degree = "positive";
    return adjectiveInflection;
  }

  /**
   * Ingests verb inflection in the part-of-speech parsing pipeline.
   */
  private ingestVerbInflection(
    $: cheerio.CheerioAPI,
    elt: AnyNode,
  ): Inflection {
    if (!$(elt).text().includes(";")) return new UninflectedInflection();

    let conjugation = $(elt).text().trim().split("; ")[1] ?? "";
    conjugation = conjugation
      .replaceAll(/(conjugation)|[\d[\]]/gi, "")
      .replace(" ,", ",")
      .replaceAll(/\s+/g, " ")
      .trim();

    const other = conjugation;
    const finalConjugation = /third.*io-variant/.test(conjugation)
      ? "third-io"
      : (conjugation.match(verbConjugationRegex)?.[0] ?? "");

    const verbInflection = new VerbInflection();
    verbInflection.conjugation =
      (findTypedValue(verbConjugationValueList, finalConjugation) as
        | undefined
        | VerbConjugation) ?? "";
    verbInflection.other = other;
    return verbInflection;
  }

  // 🌎 Public Methods

  /**
   * Returns the first principal part name for the given part of speech,
   * or undefined if the POS is not supported.
   */
  getFirstPrincipalPartName(pos: PartOfSpeech): string | undefined {
    return firstPrincipalPartNames[pos];
  }

  /**
   * Resolves the part-of-speech label from the nearest preceding heading.
   */
  getPartOfSpeech($: cheerio.CheerioAPI, elt: AnyNode): PartOfSpeech {
    const text = $(elt)
      .prevAll("div.mw-heading")
      .first()
      .find("h3, h4")
      .text()
      .toLowerCase()
      .replaceAll(/(\[edit])|\d+/g, "")
      .trim()
      .replace("proper noun", "properNoun");
    return partOfSpeechValueList.includes(text)
      ? (text as PartOfSpeech)
      : "phrase";
  }

  /**
   * Dispatches to the appropriate inflection parser for the given POS.
   */
  ingestInflection(args: {
    $: cheerio.CheerioAPI;
    elt: AnyNode;
    pos: PartOfSpeech;
    principalParts: PrincipalPart[];
  }): Inflection {
    const { $, elt, pos, principalParts } = args;
    const group = PartOfSpeechService.INFLECTION_GROUP[pos];
    const handlers: Record<string, () => Inflection> = {
      adjective: () => this.ingestAdjectiveInflection($, elt),
      adverb: () => this.ingestAdverbInflection(principalParts),
      noun: () => this.ingestNounInflection($, elt),
      prefix: () => this.ingestPrefixInflection(),
      preposition: () => this.ingestPrepositionInflection($, elt),
      pronoun: () => this.ingestPronounInflection($, elt),
      uninflected: () => this.ingestConjunctionInflection(),
      verb: () => this.ingestVerbInflection($, elt),
    };
    return (handlers[group] ?? (() => this.ingestConjunctionInflection()))();
  }

  /**
   * Parses forms for the given lexeme. Dispatches to POS-specific form parsers
   * for verbs and adverbs; falls back to the generic form-table parser.
   */
  parseForms(args: {
    $: cheerio.CheerioAPI;
    elt: AnyNode;
    lexeme: Lexeme;
    pos: PartOfSpeech;
    principalParts: PrincipalPart[];
  }): unknown {
    const { $, elt, lexeme, pos, principalParts } = args;
    const group = PartOfSpeechService.FORMS_GROUP[pos];
    const handlers: Record<string, () => unknown> = {
      adverb: () => this.ingestAdverbForms(principalParts),
      generic: () => this.formsParser.parseGenericForms({ $, elt, lexeme }),
      verb: () => this.formsParser.parseVerbForms({ $, elt }),
    };
    return (handlers[group] ?? (() => null))();
  }
}
