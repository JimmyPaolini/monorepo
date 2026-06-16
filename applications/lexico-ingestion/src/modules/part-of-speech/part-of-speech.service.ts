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

  // 🔑 Public Fields

  // 🔏 Private Methods

  private buildAdjectiveInflection(
    declension: string,
    other: string,
  ): AdjectiveInflection {
    const degree = declension.match(adjectiveDegreeRegex)?.[0] ?? "positive";
    const matchedDeclension =
      declension.match(adjectiveDeclensionRegex)?.[0] ?? "";
    const adj = new AdjectiveInflection();
    adj.declension =
      adjectiveDeclensionValues.find((v) => v === matchedDeclension) ?? "";
    adj.degree = adjectiveDegreeValues.find((v) => v === degree) ?? "positive";
    adj.other = other;
    return adj;
  }

  private buildNounInflection(
    declension: string,
    gender: string,
    other: string,
  ): NounInflection {
    const matchedDeclension = declension.match(nounDeclensionRegex)?.[0] ?? "";
    const matchedGender = gender.match(genderRegex)?.[0] ?? "";
    const noun = new NounInflection();
    noun.declension =
      nounDeclensionValues.find((v) => v === matchedDeclension) ?? "";
    noun.gender = nounGenderValues.find((v) => v === matchedGender) ?? "";
    noun.other = other;
    return noun;
  }

  private collectTableIdentifiers(
    index: number,
    index_: number,
    table_: string[][],
  ): Set<string> {
    const { finalIndex: finalM, identifiers: columnIds } = this.scanTableAxis(
      index,
      (m) => table_[m]?.[index_] ?? "",
    );
    const { finalIndex: finalN, identifiers: rowIds } = this.scanTableAxis(
      index_,
      (n) => table_[index]?.[n] ?? "",
    );
    const corner = table_[finalM + 1]?.[finalN + 1] ?? "";
    const cornerEntries: string[] = ["Plural", "Singular"].includes(corner)
      ? [corner.toLowerCase().trim()]
      : [];
    return new Set([...columnIds, ...rowIds, ...cornerEntries]);
  }

  private findGenericIdentifiers(
    index: number,
    index_: number,
    table_: string[][],
    lexeme: Lexeme,
  ): string[] {
    const identifiers = this.collectTableIdentifiers(index, index_, table_);
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
  }

  private findVerbIdentifiers(
    index: number,
    index_: number,
    table_: string[][],
  ): string[] {
    const { finalIndex: finalM, identifiers: columnIds } = this.scanVerbHeader(
      index,
      (m) => table_[m]?.[index_] ?? "",
    );
    const { finalIndex: finalN, identifiers: rowIds } = this.scanVerbHeader(
      index_,
      (n) => table_[index]?.[n] ?? "",
    );
    const cornerEntry = (table_[finalM]?.[finalN] ?? "").toLowerCase().trim();
    return [...new Set([...columnIds, ...rowIds, cornerEntry])]
      .map((id) =>
        id
          .replace(/future\s?perfect/i, "futurePerfect")
          .replace("non-finite forms", "nonFinite")
          .replace("verbal nouns", "verbalNouns")
          .replace(/s$/, ""),
      )
      .filter(Boolean);
  }

  private flattenForms(object: unknown): string[] {
    if (!object) return [];
    if (isUnknownArray(object))
      return object.filter((v): v is string => typeof v === "string");
    if (isRecord(object)) {
      return Object.values(object).flatMap((value) => this.flattenForms(value));
    }
    return [];
  }

  private getTextOrEmpty(part: PrincipalPart | undefined): string[] {
    return part?.text ?? [];
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

    const declension = inflectionHtml
      .text()
      .replaceAll(
        /(-declension)|(declension)|(adjective)|(participle)|(numeral)|[.\d[\]]/gi,
        "",
      )
      .replaceAll(/\s+/g, " ")
      .toLowerCase()
      .trim();

    if (declension.length === 0) return new Uninflected();

    return this.buildAdjectiveInflection(declension, declension);
  }

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

    return this.buildNounInflection(
      declension,
      gender,
      `${declension}, ${gender}`,
    );
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

    const disorganizedForms: { identifiers: string[]; word: string[] }[] = [];

    for (let index = 0; index < table.length; index++) {
      const row = table[index] ?? [];
      for (const [index_, element] of row.entries()) {
        this.processVerbFormRow(
          index,
          index_,
          element,
          table,
          disorganizedForms,
        );
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

  private isGenericFormCell(cell: string): boolean {
    return (
      cell.includes("<span ") ||
      cell.includes("\u2014") ||
      cell.includes(" + ") ||
      cell.length === 0
    );
  }

  private isNumber(str: string): boolean {
    return /^((singular)|(plural))$/i.test(str);
  }

  private isVerbFormCell(cell: string): boolean {
    return (
      cell.includes("<span ") || cell.includes("\u2014") || cell.includes(" + ")
    );
  }

  private lookupSumEsseFuiEntry(
    mood: string,
    voice: string,
    tense: string,
    number: string,
    person: string,
  ): string[] | undefined {
    return sumEsseFui[mood]?.[voice]?.[tense]?.[number]?.[person];
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
      table.map((column: string[]) => column[index] ?? ""),
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
            identifiers: this.findGenericIdentifiers(
              index,
              index_,
              table,
              lexeme,
            ),
            word: words
              .trim()
              .replaceAll(/[\d*]/g, "")
              .toLowerCase()
              .split(", "),
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

  private parseVerbWordCell(
    cell: string,
    number: string,
    person: string,
  ): string[] {
    const cleaned = cell
      .trim()
      .replaceAll(/[\d*]+/g, "")
      .toLowerCase();
    if (cleaned.includes(", ")) return cleaned.split(", ");
    if (cleaned.includes(" + "))
      return this.resolveVerbSumEntry(cleaned, number, person);
    return [cleaned];
  }

  private processVerbFormRow(
    index: number,
    index_: number,
    cell: string,
    table: string[][],
    disorganizedForms: { identifiers: string[]; word: string[] }[],
  ): void {
    if (!cell.includes("<span ") && !cell.includes(" + ")) return;
    const c = cheerio.load(cell);
    const identifiers = this.findVerbIdentifiers(index, index_, table);
    const text = c.text();
    if (!/[A-Za-za\u0113\u012B\u014D\u016B\u0233\-\s]+/.test(text)) return;
    disorganizedForms.push({
      identifiers,
      word: this.parseVerbWordCell(
        text,
        identifiers[1] ?? "",
        identifiers[0] ?? "",
      ),
    });
  }

  private resolveVerbSumEntry(
    cleaned: string,
    number: string,
    person: string,
  ): string[] {
    const moodValues = new Set([
      "imperative",
      "indicative",
      "non-finite",
      "subjunctive",
      "verbal nouns",
    ]);
    const voiceValues = new Set(["active", "passive"]);
    const tenseValues = new Set([
      "future",
      "future perfect",
      "imperfect",
      "perfect",
      "pluperfect",
      "present",
    ]);
    const identifiers = cleaned.split(" ");
    let mood = "";
    let voice = "";
    let tense = "";
    for (const identifier of identifiers) {
      if (moodValues.has(identifier)) mood = identifier;
      else if (voiceValues.has(identifier)) voice = identifier;
      else if (tenseValues.has(identifier)) tense = identifier;
    }
    const sumEntry = this.lookupSumEsseFuiEntry(
      mood,
      voice,
      tense,
      number,
      person,
    );
    if (sumEntry) {
      return sumEntry.map(
        (extension) => `${identifiers[0] ?? ""} ${extension}`,
      );
    }
    return [cleaned];
  }

  private scanTableAxis(
    startIndex: number,
    cellGetter: (index: number) => string,
  ): { finalIndex: number; identifiers: Set<string> } {
    let index = startIndex;
    const identifiers = new Set<string>();
    while (index >= 0 && this.isGenericFormCell(cellGetter(index))) index--;
    while (index >= 0 && !this.isGenericFormCell(cellGetter(index))) {
      identifiers.add(
        cellGetter(index--).replaceAll(/[./]/g, "").toLowerCase().trim(),
      );
    }
    return { finalIndex: index, identifiers };
  }

  private scanVerbHeader(
    startIndex: number,
    getCell: (index: number) => string,
  ): { finalIndex: number; identifiers: Set<string> } {
    let index = startIndex;
    while (index > 0 && this.isVerbFormCell(getCell(index))) index--;
    const cells = [getCell(index).toLowerCase().trim()];
    if (index - 1 >= 0)
      cells.push(
        getCell(index - 1)
          .toLowerCase()
          .trim(),
      );
    return { finalIndex: index, identifiers: new Set(cells) };
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
  parseForms(
    pos: PartOfSpeech,
    $: cheerio.CheerioAPI,
    elt: AnyNode,
    lexeme: Lexeme,
    principalParts: PrincipalPart[],
  ): unknown {
    const group = PartOfSpeechService.FORMS_GROUP[pos];
    const handlers: Record<string, () => unknown> = {
      adverb: () => this.ingestAdverbForms(principalParts),
      generic: async () => this.parseGenericForms($, elt, lexeme),
      verb: async () => this.ingestVerbForms($, elt),
    };
    return (handlers[group] ?? (() => null))();
  }
}
