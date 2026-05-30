import {
  type Forms,
  type Inflection,
  Uninflected,
  type VerbConjugation,
  verbConjugationValues,
  VerbInflection,
} from "@monorepo/lexico-entities";
import * as cheerio from "cheerio";

import { parseFormTable, sortIdentifiers } from "../form.js";

import type { AnyNode } from "domhandler";

const verbConjugationRegex = new RegExp(
  (verbConjugationValues as readonly string[]).filter(Boolean).join("|"),
);

export const VERB_FIRST_PP = "present active";

/** Infer a verb's conjugation from its Wiktionary headword line. */
export function ingestVerbInflection(
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

/** Parse the verb form table from a Wiktionary entry into a Forms object. */
// eslint-disable-next-line @typescript-eslint/require-await
export async function ingestVerbForms(
  $: cheerio.CheerioAPI,
  elt: AnyNode,
): Promise<Forms | null> {
  const table = parseFormTable($, elt);
  if (!table) return null;

  // eslint-disable-next-line unicorn/consistent-function-scoping
  function parseWords(cell: string, number: string, person: string): string[] {
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
    sortIdentifiers(inflection, forms);
  }
  return forms as unknown as Forms;
}

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
    },
  },
};
