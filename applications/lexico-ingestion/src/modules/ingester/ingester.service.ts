import {
  Entry,
  partOfSpeechValues,
  PrincipalPart,
  Translation,
} from "@monorepo/lexico-entities";
import { Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";
import _ from "lodash";

import { LoggerService } from "../logger/logger.service.js";
import { PartOfSpeechService } from "../partOfSpeech/partOfSpeech.service.js";
import { PronunciationService } from "../pronunciation/pronunciation.service.js";

import type { WiktionaryEntry } from "../lexico-ingestion/lexico-ingestion.types.js";
import type { AnyNode, Element } from "domhandler";

const skipPOS = new Set<string>(["letter"]);
const validPOS = new Set<string>(partOfSpeechValues);

const translationSkipRegex =
  /(alternative)|(alternate)|(abbreviation)|(initialism)|(archaic)|(synonym)|(clipping)|(spelling)/i;

/**
 * Orchestrates Wiktionary HTML parsing into fully-populated Entry objects.
 * Delegates POS detection, inflection, forms, and pronunciation to injected
 * services while inlining etymology, principal-parts, and translation logic.
 */
@Injectable()
export class IngesterService {
  // 🏗️ Dependency Injection
  constructor(
    private readonly logger: LoggerService,
    private readonly partOfSpeechService: PartOfSpeechService,
    private readonly pronunciationService: PronunciationService,
  ) {
    this.logger.setContext(IngesterService.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  private normalize(str: string): string {
    return str
      .normalize("NFC")
      .replaceAll(/[\u0300-\u036F]/gu, "")
      .toLowerCase()
      .trim();
  }

  private capitalizeFirstLetter(str: string): string {
    return _.upperFirst(str);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async parsePrincipalParts(
    entry: Entry,
    $: cheerio.CheerioAPI,
    elt: AnyNode,
    firstPrincipalPartName: string,
  ): Promise<{ principalParts: PrincipalPart[]; macronizedWord: string }> {
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

  // eslint-disable-next-line @typescript-eslint/require-await
  private async parseTranslations(
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
      translation = this.capitalizeFirstLetter(
        translation.trim().replace(/\.$/, ""),
      );

      if ($(li).find("span.form-of-definition-link").length > 0) {
        if (!translationSkipRegex.test(translation)) continue;
        translation = `${translation} ${$(li)
          .find("span.form-of-definition-link")
          .toArray()
          .map((ref) => `{*${this.normalize($(ref).text())}*}`)
          .join(" ")}`;
      }

      translations.push(new Translation(translation, entry));
    }

    translations = translations.filter((t) => !!t.translation);
    return translations;
  }

  private parseEtymology(
    $: cheerio.CheerioAPI,
    elt: AnyNode,
    entry: Entry,
  ): { etymology: string; participleTranslation?: Translation } {
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
      const text = this.capitalizeFirstLetter(participleMatch[0].trim());
      return { etymology, participleTranslation: new Translation(text, entry) };
    }

    return { etymology };
  }

  // 🌎 Public Methods

  /**
   * Parses Wiktionary HTML into fully-populated Entry objects using the
   * `p:has(strong.Latn.headword)` selector strategy.
   */
  async parseEntries(wiktionaryEntry: WiktionaryEntry): Promise<Entry[]> {
    if (!wiktionaryEntry.html) return [];

    const $ = cheerio.load(wiktionaryEntry.html);
    const word = this.normalize(wiktionaryEntry.word);
    const entries: Entry[] = [];

    const headwordElements = $("p:has(strong.Latn.headword)").toArray();

    if (headwordElements.length === 0) {
      this.logger.warn(`No headwords found for: ${wiktionaryEntry.word}`);
      return [];
    }

    for (const [i, elt] of headwordElements.entries()) {
      const partOfSpeech = this.partOfSpeechService.getPartOfSpeech($, elt);

      if (!validPOS.has(partOfSpeech)) {
        if (!skipPOS.has(partOfSpeech)) {
          this.logger.debug(`Skipping POS "${partOfSpeech}" for: ${word}`);
        }
        continue;
      }

      const firstPrincipalPartName =
        this.partOfSpeechService.getFirstPrincipalPartName(partOfSpeech);
      if (firstPrincipalPartName === undefined) {
        this.logger.debug(
          `No principal-part name for POS "${partOfSpeech}" — skipping ${word}`,
        );
        continue;
      }

      const entry = new Entry();
      entry.id = `${word}:${i}`;
      entry.partOfSpeech = partOfSpeech;

      try {
        const { principalParts, macronizedWord } =
          await this.parsePrincipalParts(entry, $, elt, firstPrincipalPartName);
        entry.principalParts = principalParts;

        entry.inflection = this.partOfSpeechService.ingestInflection(
          partOfSpeech,
          $,
          elt,
          principalParts,
        );

        const translations = await this.parseTranslations($, elt, entry);
        const { etymology, participleTranslation } = this.parseEtymology(
          $,
          elt,
          entry,
        );
        entry.etymology = etymology;
        entry.translations = participleTranslation
          ? [...translations, participleTranslation]
          : translations;

        entry.pronunciation = this.pronunciationService.parse(
          $,
          elt,
          macronizedWord,
        );

        entry.forms = await this.partOfSpeechService.parseForms(
          partOfSpeech,
          $,
          elt,
          entry,
          principalParts,
        );

        entries.push(entry);
      } catch (error) {
        this.logger.warn(`Failed to parse ${entry.id}: ${String(error)}`);
      }
    }

    return entries;
  }
}
