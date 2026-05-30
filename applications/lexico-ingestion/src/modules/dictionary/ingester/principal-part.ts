import { PrincipalPart } from "@monorepo/lexico-entities";

import type { Entry } from "@monorepo/lexico-entities";
import type * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

/**
 * Result of parsing the principal parts for an entry.
 */
export interface ParsedPrincipalParts {
  principalParts: PrincipalPart[];
  macronizedWord: string;
}

/**
 * Parses the principal parts (headword forms) from the Wiktionary headword paragraph.
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function parsePrincipalParts(
  entry: Entry,
  $: cheerio.CheerioAPI,
  elt: AnyNode,
  firstPrincipalPartName: string,
): Promise<ParsedPrincipalParts> {
  const principalParts: PrincipalPart[] = [];

  const firstPP = new PrincipalPart();
  firstPP.name = firstPrincipalPartName;
  firstPP.text = $(elt)
    .children("strong.Latn.headword")
    .toArray()
    .map((p1) => $(p1).text().toLowerCase());
  firstPP.entry = entry;
  principalParts.push(firstPP);

  for (const b of $(elt).children("b")) {
    const prev = $(b).prev("i").text();
    if (prev === "or") {
      const lastPrincipalPart = principalParts.pop();
      if (!lastPrincipalPart) continue;
      lastPrincipalPart.text = [
        ...lastPrincipalPart.text,
        $(b).text().toLowerCase(),
      ];
      principalParts.push(lastPrincipalPart);
    } else {
      const pp = new PrincipalPart();
      pp.name = prev;
      pp.text = [$(b).text().toLowerCase()];
      pp.entry = entry;
      principalParts.push(pp);
    }
  }

  if (principalParts.length === 0) throw new Error("no principal parts");
  const macronizedWord = principalParts[0]?.text[0] ?? "";
  return { principalParts, macronizedWord };
}
