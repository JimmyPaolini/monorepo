import {
  type AdjectiveDeclension,
  adjectiveDeclensionValues,
  type AdjectiveDegree,
  adjectiveDegreeValues,
  AdjectiveInflection,
  AdverbForms,
  AdverbInflection,
  type AdverbType,
  type Entry,
  type Forms,
  type Inflection,
  type NounDeclension,
  nounDeclensionValues,
  type NounGender,
  nounGenderValues,
  NounInflection,
  type PartOfSpeech,
  type PrepositionCase,
  prepositionCaseValues,
  PrepositionInflection,
  type PrincipalPart,
  Uninflected,
  type VerbConjugation,
  verbConjugationValues,
  VerbInflection,
} from "@monorepo/lexico-entities";
import { Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";
import cheerioTableParser from "cheerio-tableparser";
import _ from "lodash";

import type { AnyNode } from "domhandler";

// ♟️ POS regex constants
const nounDeclensionRegex = new RegExp(
  _.compact(nounDeclensionValues).join("|"),
);
const genderRegex = new RegExp(_.compact(nounGenderValues).join("|"));
const adjectiveDeclensionRegex = new RegExp(
  _.compact(adjectiveDeclensionValues).join("|"),
);
const adjectiveDegreeRegex = new RegExp(
  _.compact(adjectiveDegreeValues).join("|"),
);
const verbConjugationRegex = new RegExp(
  _.compact(verbConjugationValues).join("|"),
);
const prepositionCaseRegex = new RegExp(
  _.compact(prepositionCaseValues).join("|"),
);

// ♟️ First principal part name per POS
const firstPrincipalPartNames: Partial<Record<PartOfSpeech, string>> = {
  noun: "nominative",
  properNoun: "nominative",
  verb: "present active",
  adjective: "masculine",
  participle: "masculine",
  numeral: "masculine",
  suffix: "masculine",
  prefix: "masculine",
  interfix: "masculine",
  circumfix: "masculine",
  pronoun: "masculine",
  determiner: "masculine",
  adverb: "positive",
  preposition: "preposition",
  conjunction: "conjunction",
  interjection: "conjunction",
  abbreviation: "conjunction",
  inflection: "conjunction",
  particle: "conjunction",
  phrase: "conjunction",
  proverb: "conjunction",
  idiom: "conjunction",
};

// ♟️ esse/fui lookup table for periphrastic verb forms
const sumEsseFui: Record<
  string,
  Record<string, Record<string, Record<string, Record<string, string[]>>>>
> = {
  indicative: {
    active: {
      present: {
        singular: { first: ["sum"], second: ["es"], third: ["est"] },
        plural: { first: ["sumus"], second: ["estis"], third: ["sunt"] },
      },
      imperfect: {
        singular: { first: ["eram"], second: ["erās"], third: ["erat"] },
        plural: { first: ["erāmus"], second: ["erātis"], third: ["erant"] },
      },
      future: {
        singular: { first: ["erō"], second: ["eris"], third: ["erit"] },
        plural: { first: ["erimus"], second: ["eritis"], third: ["erunt"] },
      },
      perfect: {
        singular: { first: ["fuī"], second: ["fuistī"], third: ["fuit"] },
        plural: {
          first: ["fuimus"],
          second: ["fuistis"],
          third: ["fuērunt", "fuēre"],
        },
      },
      pluperfect: {
        singular: { first: ["fueram"], second: ["fuerās"], third: ["fuerat"] },
        plural: {
          first: ["fuerāmus"],
          second: ["fuerātis"],
          third: ["fuerant"],
        },
      },
      futurePerfect: {
        singular: { first: ["fuerō"], second: ["fueris"], third: ["fuerit"] },
        plural: {
          first: ["fuerimus"],
          second: ["fueritis"],
          third: ["fuerint"],
        },
      },
    },
  },
  subjunctive: {
    active: {
      present: {
        singular: { first: ["sim"], second: ["sīs"], third: ["sit"] },
        plural: { first: ["sīmus"], second: ["sītis"], third: ["sint"] },
      },
      imperfect: {
        singular: {
          first: ["essem", "forem"],
          second: ["essēs", "forēs"],
          third: ["esset", "foret"],
        },
        plural: {
          first: ["essēmus", "forēmus"],
          second: ["essētis", "forētis"],
          third: ["essent", "forent"],
        },
      },
      perfect: {
        singular: { first: ["fuerim"], second: ["fuerīs"], third: ["fuerit"] },
        plural: {
          first: ["fuerīmus"],
          second: ["fuerītis"],
          third: ["fuerint"],
        },
      },
      pluperfect: {
        singular: {
          first: ["fuissem"],
          second: ["fuissēs"],
          third: ["fuisset"],
        },
        plural: {
          first: ["fuissēmus"],
          second: ["fuissētis"],
          third: ["fuissent"],
        },
      },
    },
  },
};

/**
 * Resolves the part of speech from a Wiktionary HTML element, dispatches
 * inflection and forms parsing for all supported parts of speech, and provides
 * shared form-table parsing utilities.
 */
@Injectable()
export class PartOfSpeechService {
  // 🏗️ Dependency Injection
  constructor() {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  private ingestNounInflection(
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

    if (declension.length === 0 && gender.length === 0)
      return new Uninflected();

    const other = `${declension}, ${gender}`;
    const matchedDeclension = declension.match(nounDeclensionRegex)?.[0] ?? "";
    const matchedGender = gender.match(genderRegex)?.[0] ?? "";

    const noun = new NounInflection();
    noun.declension = matchedDeclension as NounDeclension;
    noun.gender = matchedGender as NounGender;
    noun.other = other;
    return noun;
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

    const vi = new VerbInflection();
    vi.conjugation = finalConjugation as VerbConjugation;
    vi.other = other;
    return vi;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async ingestVerbForms(
    $: cheerio.CheerioAPI,
    elt: AnyNode,
  ): Promise<Forms | null> {
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
          "indicative",
          "subjunctive",
          "imperative",
          "non-finite",
          "verbal nouns",
        ].includes(w);
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const isVoice = (w: string): boolean => ["active", "passive"].includes(w);
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const isTense = (w: string): boolean =>
        [
          "present",
          "imperfect",
          "future",
          "perfect",
          "pluperfect",
          "future perfect",
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
          return sumEntry.map((ext) => `${identifiers[0] ?? ""} ${ext}`);
        }
        return [cleaned];
      }
      return [cleaned];
    }

    // eslint-disable-next-line unicorn/consistent-function-scoping
    function findIdentifiers(i: number, j: number, tbl: string[][]): string[] {
      const identifiers = new Set<string>();
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const isForm = (cell: string): boolean =>
        cell.includes("<span ") || cell.includes("—") || cell.includes(" + ");

      let m = i;
      while (m > 0 && isForm(tbl[m]?.[j] ?? "")) m--;
      identifiers.add((tbl[m]?.[j] ?? "").toLowerCase().trim());
      if (m - 1 >= 0)
        identifiers.add((tbl[m - 1]?.[j] ?? "").toLowerCase().trim());

      let n = j;
      while (n > 0 && isForm(tbl[i]?.[n] ?? "")) n--;
      identifiers.add((tbl[i]?.[n] ?? "").toLowerCase().trim());
      if (n - 1 >= 0)
        identifiers.add((tbl[i]?.[n - 1] ?? "").toLowerCase().trim());

      identifiers.add((tbl[m]?.[n] ?? "").toLowerCase().trim());

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

    const disorganizedForms: { word: string[]; identifiers: string[] }[] = [];

    for (let i = 0; i < table.length; i++) {
      const row = table[i] ?? [];
      for (const [j, element] of row.entries()) {
        const cell = element;
        if (cell.includes("<span ") || cell.includes(" + ")) {
          const c = cheerio.load(cell);
          const identifiers = findIdentifiers(i, j, table);
          const text = c.text();
          if (!/[A-Za-zāēīōūȳ\-\s]+/.test(text)) continue;
          disorganizedForms.push({
            word: parseWords(text, identifiers[1] ?? "", identifiers[0] ?? ""),
            identifiers,
          });
        }
      }
    }

    const forms: Record<string, unknown> = {};
    for (const inflection of structuredClone(disorganizedForms)) {
      this.sortIdentifiers(inflection, forms);
    }
    return forms as unknown as Forms;
  }

  private ingestAdjectiveInflection(
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

  private ingestAdverbInflection(principalParts: PrincipalPart[]): Inflection {
    const type: AdverbType =
      principalParts.length > 1 ? "descriptive" : "conjunctional";
    const adv = new AdverbInflection();
    adv.type = type;
    adv.degree = "positive";
    return adv;
  }

  private ingestAdverbForms(principalParts: PrincipalPart[]): Forms {
    const forms = new AdverbForms();
    forms.positive = principalParts[0]?.text ?? [];
    if (principalParts.length >= 2)
      forms.comparative = principalParts[1]?.text ?? [];
    if (principalParts.length >= 3)
      forms.superlative = principalParts[2]?.text ?? [];
    return forms;
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

    const adj = new AdjectiveInflection();
    adj.declension = declension as AdjectiveDeclension;
    adj.degree = "positive";
    return adj;
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
    const prep = new PrepositionInflection();
    prep.case = prepositionCase as PrepositionCase;
    prep.other = other;
    return prep;
  }

  private ingestPrefixInflection(): Inflection {
    return new Uninflected();
  }

  private ingestConjunctionInflection(): Inflection {
    return new Uninflected();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async parseGenericForms(
    $: cheerio.CheerioAPI,
    elt: AnyNode,
    entry: Entry,
  ): Promise<Forms | null> {
    const table = this.parseFormTable($, elt);
    if (!table) return null;

    // eslint-disable-next-line unicorn/consistent-function-scoping
    function parseWords(cell: string): string[] {
      return cell.trim().replaceAll(/[\d*]/g, "").toLowerCase().split(", ");
    }

    const findIdentifiers = (
      i: number,
      j: number,
      tbl: string[][],
    ): string[] => {
      const identifiers = new Set<string>();
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const isForm = (cell: string): boolean =>
        cell.includes("<span ") ||
        cell.includes("—") ||
        cell.includes(" + ") ||
        cell.length === 0;

      let m = i;
      while (m >= 0 && isForm(tbl[m]?.[j] ?? "")) m--;
      while (m >= 0 && !isForm(tbl[m]?.[j] ?? "")) {
        identifiers.add(
          (tbl[m--]?.[j] ?? "").replaceAll(/\.|\//, "").toLowerCase().trim(),
        );
      }

      let n = j;
      while (n >= 0 && isForm(tbl[i]?.[n] ?? "")) n--;
      while (n >= 0 && !isForm(tbl[i]?.[n] ?? "")) {
        identifiers.add(
          (tbl[i]?.[n--] ?? "").replaceAll(/\.|\//, "").toLowerCase().trim(),
        );
      }

      const nextM = m + 1;
      const nextN = n + 1;
      const corner = tbl[nextM]?.[nextN] ?? "";
      if (["Singular", "Plural"].includes(corner)) {
        identifiers.add(corner.toLowerCase().trim());
      }

      if (
        ["adjective", "participle", "numeral", "suffix"].includes(
          entry.partOfSpeech,
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

    const disorganizedForms: { word: string[]; identifiers: string[] }[] = [];

    for (let i = 0; i < table.length; i++) {
      const row = table[i] ?? [];
      for (const [j, element] of row.entries()) {
        const cell = element;
        if (cell.includes("<span ")) {
          const c = cheerio.load(cell);
          const words = c("span")
            .toArray()
            .map((s) => c(s).text())
            .join(", ");
          if (!/[A-Za-zāēīōūȳ\-\s]+/.test(words)) continue;
          disorganizedForms.push({
            word: parseWords(words),
            identifiers: findIdentifiers(i, j, table),
          });
        }
      }
    }

    const forms: Record<string, unknown> = {};
    for (const inflection of structuredClone(disorganizedForms)) {
      this.sortIdentifiers(inflection, forms);
    }
    return forms as unknown as Forms;
  }

  private parseFormTable(
    $: cheerio.CheerioAPI,
    elt: AnyNode,
  ): string[][] | null {
    const tableHtml = $(elt).nextUntil("h3", "table").first();
    if (tableHtml.length <= 0) return null;

    const $table = cheerio.load($.html(tableHtml));
    cheerioTableParser($table);

    type ParseTableFn = (a: boolean, b: boolean, c: boolean) => string[][];
    let table: string[][] = (
      $table("table") as unknown as { parsetable: ParseTableFn }
    ).parsetable(true, true, false);

    // Transpose: table[col][row] → table[row][col]
    table = (table[0] ?? []).map((_: unknown, i: number) =>
      table.map((col: string[]) => col[i] ?? ""),
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

  private sortIdentifiers(
    inflection: { word: string[]; identifiers: string[] },
    obj: Record<string, unknown>,
  ): Record<string, unknown> {
    const identifier = inflection.identifiers.pop();
    if (!identifier) return obj;
    if (inflection.identifiers.length === 0) {
      obj[identifier] = inflection.word;
      return obj;
    } else {
      if (!obj[identifier]) obj[identifier] = {};
      obj[identifier] = this.sortIdentifiers(
        inflection,
        obj[identifier] as Record<string, unknown>,
      );
      return obj;
    }
  }

  private flattenForms(
    obj: string[] | Record<string, unknown> | null | undefined,
  ): string[] {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    return Object.values(obj).reduce<string[]>(
      (acc, val) => [
        ...acc,
        ...this.flattenForms(val as string[] | Record<string, unknown>),
      ],
      [],
    );
  }

  private isNumber(str: string): boolean {
    return /^((singular)|(plural))$/i.test(str);
  }

  private isCase(str: string): boolean {
    return /^((nominative)|(genitive)|(dative)|(accusative)|(ablative)|(vocative)|(locative))$/i.test(
      str,
    );
  }

  private isGender(str: string): boolean {
    return /^((masculine)|(feminine)|(neuter))$/i.test(str);
  }

  // 🌎 Public Methods

  /**
   * Resolves the part-of-speech label from the nearest preceding heading.
   */
  getPartOfSpeech($: cheerio.CheerioAPI, elt: AnyNode): PartOfSpeech {
    return $(elt)
      .prevAll(":header, h3, h4")
      .last()
      .text()
      .toLowerCase()
      .replaceAll(/(\[edit])|\d+/g, "")
      .trim()
      .replace("proper noun", "properNoun") as PartOfSpeech;
  }

  /**
   * Returns the first principal part name for the given part of speech,
   * or undefined if the POS is not supported.
   */
  getFirstPrincipalPartName(pos: PartOfSpeech): string | undefined {
    return firstPrincipalPartNames[pos];
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
      case "noun":
      case "properNoun": {
        return this.ingestNounInflection($, elt);
      }
      case "verb": {
        return this.ingestVerbInflection($, elt);
      }
      case "adjective":
      case "participle":
      case "numeral":
      case "suffix": {
        return this.ingestAdjectiveInflection($, elt);
      }
      case "adverb": {
        return this.ingestAdverbInflection(principalParts);
      }
      case "pronoun":
      case "determiner": {
        return this.ingestPronounInflection($, elt);
      }
      case "preposition": {
        return this.ingestPrepositionInflection($, elt);
      }
      case "prefix":
      case "interfix":
      case "circumfix": {
        return this.ingestPrefixInflection();
      }
      default: {
        return this.ingestConjunctionInflection();
      }
    }
  }

  /**
   * Parses forms for the given entry. Dispatches to POS-specific form parsers
   * for verbs and adverbs; falls back to the generic form-table parser.
   */
  async parseForms(
    pos: PartOfSpeech,
    $: cheerio.CheerioAPI,
    elt: AnyNode,
    entry: Entry,
    principalParts: PrincipalPart[],
  ): Promise<Forms | null> {
    switch (pos) {
      case "verb": {
        return this.ingestVerbForms($, elt);
      }
      case "adverb": {
        return this.ingestAdverbForms(principalParts);
      }
      default: {
        return this.parseGenericForms($, elt, entry);
      }
    }
  }
}
