import { Translation } from "@monorepo/lexico-entities";

import { capitalizeFirstLetter, normalize } from "./utils/strings.js";

import type { Entry } from "@monorepo/lexico-entities";
import type * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

const translationSkipRegex =
  /(alternative)|(alternate)|(abbreviation)|(initialism)|(archaic)|(synonym)|(clipping)|(spelling)/gi;

/**
 * Parses the ordered-list translations following the headword paragraph.
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function parseTranslations(
  $: cheerio.CheerioAPI,
  elt: AnyNode,
  entry: Entry,
): Promise<Translation[]> {
  const translationsHeader = $(elt).nextAll("ol").first();
  if (translationsHeader.length <= 0) return [];

  let translations: Translation[] = [];

  for (const li of translationsHeader.children("li")) {
    if ($(li).find("span.form-of-definition-link .selflink").length > 0)
      continue;
    if ($(li).text().length === 0) continue;

    $(li).children("ol, ul, dl").remove();
    let translation = $(li).text();
    if (translation.includes("This term needs a translation to English"))
      continue;
    translation = capitalizeFirstLetter(translation.trim().replace(/\.$/, ""));

    if ($(li).find("span.form-of-definition-link").length > 0) {
      if (!translationSkipRegex.test(translation)) continue;
      translation = `${translation} ${$(li)
        .find("span.form-of-definition-link")
        .toArray()
        .map((ref) => `{*${normalize($(ref).text())}*}`)
        .join(" ")}`;
    }

    translations.push(new Translation(translation, entry));
  }

  translations = translations.filter((t) => !!t.translation);
  return translations;
}
