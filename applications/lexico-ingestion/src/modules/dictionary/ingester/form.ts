import * as cheerio from "cheerio";
import cheerioTableParser from "cheerio-tableparser";

import { isCase, isGender, isNumber } from "./utils/forms.js";

import type { Entry, Forms } from "@monorepo/lexico-entities";
import type { AnyNode } from "domhandler";

/**
 * Parses the inflection table following the headword element into a Forms object.
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function parseForms(
  $: cheerio.CheerioAPI,
  elt: AnyNode,
  entry: Entry,
): Promise<Forms | null> {
  const table = parseFormTable($, elt);
  if (!table) return null;

  // eslint-disable-next-line unicorn/consistent-function-scoping
  function parseWords(cell: string): string[] {
    return cell.trim().replaceAll(/[\d*]/g, "").toLowerCase().split(", ");
  }

  function findIdentifiers(i: number, j: number, tbl: string[][]): string[] {
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
        [...identifiers].find((id) => isNumber(id)) ?? "",
        [...identifiers].find((id) => isCase(id)) ?? "",
        [...identifiers].find((id) => isGender(id)) ?? "neuter",
      ].filter(Boolean);
    }

    return [...identifiers];
  }

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
    sortIdentifiers(inflection, forms);
  }
  return forms as unknown as Forms;
}

/**
 *
 */
export function parseFormTable(
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

/**
 *
 */
export function sortIdentifiers(
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
    obj[identifier] = sortIdentifiers(
      inflection,
      obj[identifier] as Record<string, unknown>,
    );
    return obj;
  }
}
