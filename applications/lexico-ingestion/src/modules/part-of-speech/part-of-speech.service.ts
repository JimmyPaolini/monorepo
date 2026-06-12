import { Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";
import cheerioTableParser from "cheerio-tableparser";

import {
  adjectiveDeclensionValues,
  adjectiveDegreeValues,
  AdjectiveInflection,
  AdverbInflection,
  type AdverbType,
  type Inflection,
  type Lexeme,
  nounDeclensionValues,
  nounGenderValues,
  NounInflection,
  type PartOfSpeech,
  partOfSpeechValues,
  prepositionCaseValues,
  PrepositionInflection,
  type PrincipalPart,
  Uninflected,
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
  sumEsseFui,
  verbConjugationRegex,
} from "./part-of-speech.constants";

import type { AnyNode } from "domhandler";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
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

  // 🔑 Public Fields

  // 🔏 Private Methods

  private flattenForms(object: unknown): string[] {
    if (!object) return [];
    if (isUnknownArray(object))
      return object.filter((v): v is string => typeof v === "string");
    if (isRecord(object)) {
      return Object.values(object).flatMap((value) => this.flattenForms(value));
    }
    return [];
  }

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
    adj.declension =
      adjectiveDeclensionValues.find((v) => v === declension) ?? "";
    adj.degree = adjectiveDegreeValues.find((v) => v === degree) ?? "positive";
    adj.other = other;
    return adj;
  }

  private ingestAdverbForms(principalParts: PrincipalPart[]): unknown {
    const forms: Record<string, string[]> = {
      positive: principalParts[0]?.text ?? [],
    };
    if (principalParts.length >= 2)
      forms["comparative"] = principalParts[1]?.text ?? [];
    if (principalParts.length >= 3)
      forms["superlative"] = principalParts[2]?.text ?? [];
    return forms;
  }

  private ingestAdverbInflection(principalParts: PrincipalPart[]): Inflection {
    const type: AdverbType =
      principalParts.length > 1 ? "descriptive" : "conjunctional";
    const adverbInflection = new AdverbInflection();
    adverbInflection.adverbType = type;
    adverbInflection.degree = "positive";
    return adverbInflection;
  }

  private ingestConjunctionInflection(): Inflection {
    return new Uninflected();
  }

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

    if (declension.length === 0 && gender.length === 0)
      return new Uninflected();

    const other = `${declension}, ${gender}`;
    const matchedDeclension = declension.match(nounDeclensionRegex)?.[0] ?? "";
    const matchedGender = gender.match(genderRegex)?.[0] ?? "";

    const noun = new NounInflection();
    noun.declension =
      nounDeclensionValues.find((v) => v === matchedDeclension) ?? "";
    noun.gender = nounGenderValues.find((v) => v === matchedGender) ?? "";
    noun.other = other;
    return noun;
  }

  private ingestPrefixInflection(): Inflection {
    return new Uninflected();
  }

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
      prepositionCaseValues.find((v) => v === prepositionCase) ?? "";
    prepositionInflection.other = other;
    return prepositionInflection;
  }

  private ingestPronounInflection(
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

    const adjectiveInflection = new AdjectiveInflection();
    adjectiveInflection.declension =
      adjectiveDeclensionValues.find((v) => v === declension) ?? "";
    adjectiveInflection.degree = "positive";
    return adjectiveInflection;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async ingestVerbForms(
    $: cheerio.CheerioAPI,
    elt: AnyNode,
  ): Promise<unknown> {
    const table = this.parseFormTable($, elt);
    if (!table) return null;

    // eslint-disable-next-line unicorn/consistent-function-scoping
    function parseWords(
      cell: string,
      number: string,
      person: string,
    ): string[] {
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const isMood = (w: string): boolean =>
        [
          "imperative",
          "indicative",
          "non-finite",
          "subjunctive",
          "verbal nouns",
        ].includes(w);
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const isVoice = (w: string): boolean => ["active", "passive"].includes(w);
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const isTense = (w: string): boolean =>
        [
          "future",
          "future perfect",
          "imperfect",
          "perfect",
          "pluperfect",
          "present",
        ].includes(w);

      const cleaned = cell
        .trim()
        .replaceAll(/[\d*]+/g, "")
        .toLowerCase();
      if (cleaned.includes(", ")) return cleaned.split(", ");
      if (cleaned.includes(" + ")) {
        const identifiers = cleaned.split(" ");
        let mood = "";
        let voice = "";
        let tense = "";
        for (const identifier of identifiers) {
          if (isMood(identifier)) mood = identifier;
          else if (isVoice(identifier)) voice = identifier;
          else if (isTense(identifier)) tense = identifier;
        }
        const sumEntry = sumEsseFui[mood]?.[voice]?.[tense]?.[number]?.[person];
        if (sumEntry) {
          return sumEntry.map(
            (extension) => `${identifiers[0] ?? ""} ${extension}`,
          );
        }
        return [cleaned];
      }
      return [cleaned];
    }

    // eslint-disable-next-line unicorn/consistent-function-scoping
    function findIdentifiers(
      index: number,
      index_: number,
      table_: string[][],
    ): string[] {
      const identifiers = new Set<string>();
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const isForm = (cell: string): boolean =>
        cell.includes("<span ") || cell.includes("—") || cell.includes(" + ");

      let m = index;
      while (m > 0 && isForm(table_[m]?.[index_] ?? "")) m--;
      identifiers.add((table_[m]?.[index_] ?? "").toLowerCase().trim());
      if (m - 1 >= 0)
        identifiers.add((table_[m - 1]?.[index_] ?? "").toLowerCase().trim());

      let n = index_;
      while (n > 0 && isForm(table_[index]?.[n] ?? "")) n--;
      identifiers.add((table_[index]?.[n] ?? "").toLowerCase().trim());
      if (n - 1 >= 0)
        identifiers.add((table_[index]?.[n - 1] ?? "").toLowerCase().trim());

      identifiers.add((table_[m]?.[n] ?? "").toLowerCase().trim());

      return [...identifiers]
        .map((id) =>
          id
            .replace(/future\s?perfect/i, "futurePerfect")
            .replace("non-finite forms", "nonFinite")
            .replace("verbal nouns", "verbalNouns")
            .replace(/s$/, ""),
        )
        .filter(Boolean);
    }

    const disorganizedForms: { identifiers: string[]; word: string[] }[] = [];

    for (let index = 0; index < table.length; index++) {
      const row = table[index] ?? [];
      for (const [index_, element] of row.entries()) {
        const cell = element;
        if (cell.includes("<span ") || cell.includes(" + ")) {
          const c = cheerio.load(cell);
          const identifiers = findIdentifiers(index, index_, table);
          const text = c.text();
          if (!/[A-Za-zāēīōūȳ\-\s]+/.test(text)) continue;
          disorganizedForms.push({
            identifiers,
            word: parseWords(text, identifiers[1] ?? "", identifiers[0] ?? ""),
          });
        }
      }
    }

    const forms: Record<string, unknown> = {};
    for (const inflection of structuredClone(disorganizedForms)) {
      this.sortIdentifiers(inflection, forms);
    }
    return forms;
  }

  private ingestVerbInflection(
    $: cheerio.CheerioAPI,
    elt: AnyNode,
  ): Inflection {
    if (!$(elt).text().includes(";")) return new Uninflected();

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
      verbConjugationValues.find((v) => v === finalConjugation) ?? "";
    verbInflection.other = other;
    return verbInflection;
  }

  private isCase(str: string): boolean {
    return /^((nominative)|(genitive)|(dative)|(accusative)|(ablative)|(vocative)|(locative))$/i.test(
      str,
    );
  }

  private isGender(str: string): boolean {
    return /^((masculine)|(feminine)|(neuter))$/i.test(str);
  }

  private isNumber(str: string): boolean {
    return /^((singular)|(plural))$/i.test(str);
  }

  private parseFormTable(
    $: cheerio.CheerioAPI,
    elt: AnyNode,
  ): null | string[][] {
    const tableHtml = $(elt)
      .nextAll("div")
      .filter(
        (_: number, element: AnyNode) => $(element).find("table").length > 0,
      )
      .first()
      .find("table")
      .first();
    if (tableHtml.length <= 0) return null;

    const $table = cheerio.load($.html(tableHtml));
    cheerioTableParser($table);

    let table: string[][] = $table("table").parsetable(true, true, false);

    // Transpose: table[col][row] → table[row][col]
    table = (table[0] ?? []).map((_: unknown, index: number) =>
      table.map((col: string[]) => col[index] ?? ""),
    );

    table = table.map((tr: string[]) =>
      tr.map((tc: string) => {
        const c = cheerio.load(tc);
        if (c("span").length <= 0) return c.text().trim();
        return c("body").html() ?? "";
      }),
    );

    return table;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async parseGenericForms(
    $: cheerio.CheerioAPI,
    elt: AnyNode,
    lexeme: Lexeme,
  ): Promise<unknown> {
    const table = this.parseFormTable($, elt);
    if (!table) return null;

    // eslint-disable-next-line unicorn/consistent-function-scoping
    function parseWords(cell: string): string[] {
      return cell.trim().replaceAll(/[\d*]/g, "").toLowerCase().split(", ");
    }

    const findIdentifiers = (
      index: number,
      index_: number,
      table_: string[][],
    ): string[] => {
      const identifiers = new Set<string>();
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const isForm = (cell: string): boolean =>
        cell.includes("<span ") ||
        cell.includes("—") ||
        cell.includes(" + ") ||
        cell.length === 0;

      let m = index;
      while (m >= 0 && isForm(table_[m]?.[index_] ?? "")) m--;
      while (m >= 0 && !isForm(table_[m]?.[index_] ?? "")) {
        identifiers.add(
          (table_[m--]?.[index_] ?? "")
            .replaceAll(/[./]/g, "")
            .toLowerCase()
            .trim(),
        );
      }

      let n = index_;
      while (n >= 0 && isForm(table_[index]?.[n] ?? "")) n--;
      while (n >= 0 && !isForm(table_[index]?.[n] ?? "")) {
        identifiers.add(
          (table_[index]?.[n--] ?? "")
            .replaceAll(/[./]/g, "")
            .toLowerCase()
            .trim(),
        );
      }

      const nextM = m + 1;
      const nextN = n + 1;
      const corner = table_[nextM]?.[nextN] ?? "";
      if (["Plural", "Singular"].includes(corner)) {
        identifiers.add(corner.toLowerCase().trim());
      }

      if (
        ["adjective", "numeral", "participle", "suffix"].includes(
          lexeme.partOfSpeech,
        )
      ) {
        return [
          [...identifiers].find((id) => this.isNumber(id)) ?? "",
          [...identifiers].find((id) => this.isCase(id)) ?? "",
          [...identifiers].find((id) => this.isGender(id)) ?? "neuter",
        ].filter(Boolean);
      }

      return [...identifiers];
    };

    const disorganizedForms: { identifiers: string[]; word: string[] }[] = [];

    for (let index = 0; index < table.length; index++) {
      const row = table[index] ?? [];
      for (const [index_, element] of row.entries()) {
        const cell = element;
        if (cell.includes("<span ")) {
          const c = cheerio.load(cell);
          const words = c("span")
            .toArray()
            .map((s: AnyNode) => c(s).text())
            .join(", ");
          if (!/[A-Za-zāēīōūȳ\-\s]+/.test(words)) continue;
          disorganizedForms.push({
            identifiers: findIdentifiers(index, index_, table),
            word: parseWords(words),
          });
        }
      }
    }

    const forms: Record<string, unknown> = {};
    for (const inflection of structuredClone(disorganizedForms)) {
      this.sortIdentifiers(inflection, forms);
    }
    return forms;
  }

  private sortIdentifiers(
    inflection: { identifiers: string[]; word: string[] },
    object: Record<string, unknown>,
  ): Record<string, unknown> {
    const identifier = inflection.identifiers.pop();
    if (!identifier) return object;
    if (inflection.identifiers.length === 0) {
      object[identifier] = inflection.word;
      return object;
    } else {
      if (!object[identifier]) object[identifier] = {};
      const current = object[identifier];
      object[identifier] = this.sortIdentifiers(
        inflection,
        isRecord(current) ? current : {},
      );
      return object;
    }
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
    return partOfSpeechValues.find((v) => v === text) ?? "phrase";
  }

  /**
   * Dispatches to the appropriate inflection parser for the given POS.
   */
  ingestInflection(
    pos: PartOfSpeech,
    $: cheerio.CheerioAPI,
    elt: AnyNode,
    principalParts: PrincipalPart[],
  ): Inflection {
    switch (pos) {
      case "abbreviation":
      case "conjunction":
      case "idiom":
      case "inflection":
      case "interjection":
      case "particle":
      case "phrase":
      case "proverb": {
        return this.ingestConjunctionInflection();
      }
      case "adjective":
      case "numeral":
      case "participle":
      case "suffix": {
        return this.ingestAdjectiveInflection($, elt);
      }
      case "adverb": {
        return this.ingestAdverbInflection(principalParts);
      }
      case "circumfix":
      case "interfix":
      case "prefix": {
        return this.ingestPrefixInflection();
      }
      case "determiner":
      case "pronoun": {
        return this.ingestPronounInflection($, elt);
      }
      case "noun":
      case "properNoun": {
        return this.ingestNounInflection($, elt);
      }
      case "preposition": {
        return this.ingestPrepositionInflection($, elt);
      }
      case "verb": {
        return this.ingestVerbInflection($, elt);
      }
    }
  }

  /**
   * Parses forms for the given lexeme. Dispatches to POS-specific form parsers
   * for verbs and adverbs; falls back to the generic form-table parser.
   */
  async parseForms(
    pos: PartOfSpeech,
    $: cheerio.CheerioAPI,
    elt: AnyNode,
    lexeme: Lexeme,
    principalParts: PrincipalPart[],
  ): Promise<unknown> {
    switch (pos) {
      case "abbreviation":
      case "adjective":
      case "circumfix":
      case "conjunction":
      case "determiner":
      case "idiom":
      case "inflection":
      case "interfix":
      case "interjection":
      case "noun":
      case "numeral":
      case "participle":
      case "particle":
      case "phrase":
      case "prefix":
      case "preposition":
      case "pronoun":
      case "properNoun":
      case "proverb":
      case "suffix": {
        return this.parseGenericForms($, elt, lexeme);
      }
      case "adverb": {
        return this.ingestAdverbForms(principalParts);
      }
      case "verb": {
        return this.ingestVerbForms($, elt);
      }
    }
  }
}
