import { Injectable, Logger } from "@nestjs/common";
import {
  Entry,
  Translation,
  type PartOfSpeech,
} from "@monorepo/lexico-entities";
import * as cheerio from "cheerio";

import type { WiktionaryEntry } from "../../lexico-ingestion.types.js";

/**
 * Parses Wiktionary HTML into structured Entry objects.
 */
@Injectable()
export class IngesterService {
  private readonly logger = new Logger(IngesterService.name);

  async parseEntries(wiktionaryEntry: WiktionaryEntry): Promise<Entry[]> {
    if (!wiktionaryEntry.html) return [];

    const $ = cheerio.load(wiktionaryEntry.html);
    const entries: Entry[] = [];

    const posHeadings = $("h3, h4").filter((_i, el) => {
      const text = $(el).text().toLowerCase();
      return this.isPartOfSpeech(text);
    });

    if (posHeadings.length === 0) {
      this.logger.warn(`No parts of speech found for: ${wiktionaryEntry.word}`);
      return [];
    }

    let index = 0;
    for (const heading of posHeadings.toArray()) {
      const posText = $(heading).text().toLowerCase().trim();
      const partOfSpeech = this.normalizePartOfSpeech(posText);
      if (!partOfSpeech) continue;

      const entry = new Entry();
      entry.id = `${wiktionaryEntry.word}:${index}`;
      entry.partOfSpeech = partOfSpeech;

      const translationTexts: string[] = [];
      let sibling = $(heading).next();
      while (sibling.length > 0 && !sibling.is("h3, h4")) {
        sibling.find("ol > li").each((_i, li) => {
          const text = $(li)
            .clone()
            .children("ul")
            .remove()
            .end()
            .text()
            .trim();
          if (text) translationTexts.push(text);
        });
        sibling = sibling.next();
      }

      entry.translations = translationTexts.map(
        (t) => new Translation(t, entry),
      );
      entries.push(entry);
      index++;
    }

    return entries;
  }

  private isPartOfSpeech(text: string): boolean {
    return [
      "noun",
      "verb",
      "adjective",
      "adverb",
      "pronoun",
      "preposition",
      "conjunction",
      "interjection",
      "participle",
      "numeral",
      "prefix",
      "suffix",
      "phrase",
      "proverb",
      "idiom",
    ].some((pos) => text.includes(pos));
  }

  private normalizePartOfSpeech(text: string): PartOfSpeech | undefined {
    const posMap: Array<[string, PartOfSpeech]> = [
      ["noun", "noun"],
      ["verb", "verb"],
      ["adjective", "adjective"],
      ["adverb", "adverb"],
      ["pronoun", "pronoun"],
      ["preposition", "preposition"],
      ["conjunction", "conjunction"],
      ["interjection", "interjection"],
      ["participle", "participle"],
      ["numeral", "numeral"],
      ["prefix", "prefix"],
      ["suffix", "suffix"],
      ["phrase", "phrase"],
      ["proverb", "proverb"],
      ["idiom", "idiom"],
    ];
    for (const [key, val] of posMap) {
      if (text.includes(key)) return val;
    }
    return undefined;
  }
}
