import { Translation } from "@monorepo/lexico-entities";

import { capitalizeFirstLetter } from "./utils/strings.js";

import type { Entry } from "@monorepo/lexico-entities";
import type * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";

/**
 * Result of parsing an etymology section.
 */
export interface ParsedEtymology {
  etymology: string;
  participleTranslation?: Translation;
}

/**
 * Parses the etymology section preceding the current headword element.
 * Returns the etymology text and an optional participle translation when one
 * is found; the caller is responsible for merging it into the entry's
 * translations list.
 */
export function parseEtymology(
  $: cheerio.CheerioAPI,
  elt: AnyNode,
  entry: Entry,
): ParsedEtymology {
  const etymologyHeader = $(elt)
    .prevAll(":header:contains('Etymology')")
    .first();

  if (
    etymologyHeader.length <= 0 ||
    (etymologyHeader.next()[0] as (Element & { name?: string }) | undefined)
      ?.name !== "p" ||
    etymologyHeader.next().text().trim().length === 0
  ) {
    return { etymology: "" };
  }

  const etymology = etymologyHeader.next().text().trim();

  const participleMatch =
    /((present)|(perfect)|(future)) ((active)|(passive) )?participle (\(gerundive\) )?of [A-Za-z\u00C0-\u017F]+/i.exec(
      etymology,
    );
  if (participleMatch) {
    const text = capitalizeFirstLetter(participleMatch[0].trim());
    return { etymology, participleTranslation: new Translation(text, entry) };
  }

  return { etymology };
}
