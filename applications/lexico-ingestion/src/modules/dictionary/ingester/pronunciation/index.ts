import { Pronunciation } from "@monorepo/lexico-entities";

import { getClassicalPhonemes } from "./classical.js";
import {
  getEcclesiasticalPronunciations,
  parsePhonics,
} from "./pronunciation.js";

import type * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

/**
 * Parses pronunciation data from the Wiktionary HTML element context.
 * Requires `macronizedWord` to already be resolved (call `parsePrincipalParts`
 * before this function).
 */
export function parsePronunciation(
  $: cheerio.CheerioAPI,
  elt: AnyNode,
  macronizedWord: string,
): Pronunciation {
  const pronunciation = new Pronunciation();
  pronunciation.classical = {
    phonemes: getClassicalPhonemes(macronizedWord),
    phonemic: "",
    phonetic: "",
  };
  pronunciation.ecclesiastical = {
    phonemes: getEcclesiasticalPronunciations(macronizedWord)[0] ?? "",
    phonemic: "",
    phonetic: "",
  };
  pronunciation.vulgar = { phonemes: "", phonemic: "", phonetic: "" };

  const pronunciationHeader = $(elt)
    .prevAll(":header:contains('Pronunciation')")
    .first();
  if (pronunciationHeader.length <= 0) return pronunciation;

  for (const pr of pronunciationHeader.next("ul").children()) {
    if (/^audio/i.test($(pr).text())) continue;

    const pronunciationsText = $(pr).text().split("IPA(key):")[1]?.split(", ");
    if (!pronunciationsText) continue;

    const anchorText = $(pr).find("a").text();
    if (anchorText.includes("Classical")) {
      Object.assign(pronunciation.classical, parsePhonics(pronunciationsText));
    } else if (anchorText.includes("Ecclesiastical")) {
      Object.assign(
        pronunciation.ecclesiastical,
        parsePhonics(pronunciationsText),
      );
    } else if (anchorText.includes("Vulgar")) {
      Object.assign(pronunciation.vulgar, parsePhonics(pronunciationsText));
    }
  }

  return pronunciation;
}
