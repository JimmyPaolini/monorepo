import { Entry, partOfSpeechValues } from "@monorepo/lexico-entities";
import { Injectable, Logger } from "@nestjs/common";
import * as cheerio from "cheerio";

import { parseEtymology } from "./ingester/etymology.js";
import { parseForms } from "./ingester/form.js";
import {
  getPartOfSpeech,
  ingestersMap,
} from "./ingester/part-of-speech/index.js";
import { parsePrincipalParts } from "./ingester/principal-part.js";
import { parsePronunciation } from "./ingester/pronunciation/index.js";
import { parseTranslations } from "./ingester/translation.js";
import { normalize } from "./ingester/utils/strings.js";

import type { WiktionaryEntry } from "../../lexico-ingestion.types.js";

const skipPOS = new Set<string>(["letter"]);
const validPOS = new Set<string>(partOfSpeechValues);

/**
 * Parses Wiktionary HTML into fully-populated Entry objects using the
 * `p:has(strong.Latn.headword)` selector strategy.
 */
@Injectable()
export class IngesterService {
  private readonly logger = new Logger(IngesterService.name);

  /**
   *
   */
  async parseEntries(wiktionaryEntry: WiktionaryEntry): Promise<Entry[]> {
    if (!wiktionaryEntry.html) return [];

    const $ = cheerio.load(wiktionaryEntry.html);
    const word = normalize(wiktionaryEntry.word);
    const entries: Entry[] = [];

    const headwordElements = $("p:has(strong.Latn.headword)").toArray();

    if (headwordElements.length === 0) {
      this.logger.warn(`No headwords found for: ${wiktionaryEntry.word}`);
      return [];
    }

    for (const [i, elt] of headwordElements.entries()) {
      const partOfSpeech = getPartOfSpeech($, elt);

      if (!validPOS.has(partOfSpeech)) {
        if (!skipPOS.has(partOfSpeech)) {
          this.logger.debug(`Skipping POS "${partOfSpeech}" for: ${word}`);
        }
        continue;
      }

      const posIngester = ingestersMap[partOfSpeech];
      if (!posIngester) {
        this.logger.debug(
          `No ingester for POS "${partOfSpeech}" — skipping ${word}`,
        );
        continue;
      }

      const entry = new Entry();
      entry.id = `${word}:${i}`;
      entry.partOfSpeech = partOfSpeech;

      try {
        const { principalParts, macronizedWord } = await parsePrincipalParts(
          entry,
          $,
          elt,
          posIngester.firstPrincipalPartName,
        );
        entry.principalParts = principalParts;

        entry.inflection = posIngester.ingestInflection($, elt, principalParts);

        const translations = await parseTranslations($, elt, entry);
        const { etymology, participleTranslation } = parseEtymology(
          $,
          elt,
          entry,
        );
        entry.etymology = etymology;
        entry.translations = participleTranslation
          ? [...translations, participleTranslation]
          : translations;

        entry.pronunciation = parsePronunciation($, elt, macronizedWord);

        entry.forms = posIngester.ingestForms
          ? await posIngester.ingestForms($, elt, entry, principalParts)
          : await parseForms($, elt, entry);

        entries.push(entry);
      } catch (error) {
        this.logger.warn(`Failed to parse ${entry.id}: ${String(error)}`);
      }
    }

    return entries;
  }
}
