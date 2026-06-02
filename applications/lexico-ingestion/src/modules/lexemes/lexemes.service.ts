import { Lexeme, PrincipalPart, Translation } from "@monorepo/lexico-entities";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as cheerio from "cheerio";
import _ from "lodash";
import { Repository } from "typeorm";

import { FormsService } from "../forms/forms.service.js";
import { LEXICO_INGESTION_BY_ID } from "../lexico-ingestion/lexico-ingestion.constants.js";
import { LoggerService } from "../logger/logger.service.js";
import { PartOfSpeechService } from "../part-of-speech/part-of-speech.service.js";
import { PronunciationService } from "../pronunciation/pronunciation.service.js";

import { skipPOS, translationSkipRegex, validPOS } from "./lexemes.constants";

import type { WiktionaryPage } from "../lexico-ingestion/lexico-ingestion.types.js";
import type { AnyNode } from "domhandler";

/**
 * Orchestrates Wiktionary HTML parsing into fully-populated Lexeme objects.
 * Delegates POS detection, inflection, forms, and pronunciation to injected
 * services while inlining etymology, principal-parts, and translation logic.
 */
@Injectable()
export class LexemesService {
  // 🏗️ Dependency Injection
  constructor(
    @InjectRepository(Lexeme)
    private readonly lexemeRepository: Repository<Lexeme>,
    private readonly logger: LoggerService,
    private readonly formsService: FormsService,
    private readonly partOfSpeechService: PartOfSpeechService,
    private readonly pronunciationService: PronunciationService,
  ) {
    this.logger.setContext(LexemesService.name);
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

  private parsePrincipalParts(
    lexeme: Lexeme,
    $: cheerio.CheerioAPI,
    elt: AnyNode,
    firstPrincipalPartName: string,
  ): { principalParts: PrincipalPart[]; macronizedWord: string } {
    const principalParts: PrincipalPart[] = [];

    const firstPP = new PrincipalPart();
    firstPP.name = firstPrincipalPartName;
    firstPP.text = $(elt)
      .children("strong.Latn.headword")
      .toArray()
      .map((p1: AnyNode) => $(p1).text().toLowerCase());
    firstPP.lexeme = lexeme;
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
        pp.lexeme = lexeme;
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
    lexeme: Lexeme,
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
          .map((ref: AnyNode) => `{*${this.normalize($(ref).text())}*}`)
          .join(" ")}`;
      }

      translations.push(new Translation(translation, lexeme));
    }

    translations = translations.filter((t) => !!t.translation);
    return translations;
  }

  private parseEtymology(
    $: cheerio.CheerioAPI,
    elt: AnyNode,
    lexeme: Lexeme,
  ): { etymology: string; participleTranslation?: Translation } {
    const etymologyHeaderDiv = $(elt)
      .prevAll("div.mw-heading")
      .filter((_: number, el: AnyNode) => /etymology/i.test($(el).text()))
      .first();

    if (etymologyHeaderDiv.length <= 0) return { etymology: "" };

    const etymologyP = etymologyHeaderDiv.nextAll("p").first();
    if (etymologyP.length <= 0 || etymologyP.text().trim().length === 0) {
      return { etymology: "" };
    }

    const etymology = etymologyP.text().trim();

    const participleMatch =
      /((present)|(perfect)|(future)) ((active)|(passive) )?participle (\(gerundive\) )?of [A-Za-z\u00C0-\u017F]+/i.exec(
        etymology,
      );
    if (participleMatch) {
      const text = this.capitalizeFirstLetter(participleMatch[0].trim());
      return {
        etymology,
        participleTranslation: new Translation(text, lexeme),
      };
    }

    return { etymology };
  }

  // 🌎 Public Methods

  /** Upserts the Lexeme row. Explicitly saves the @ChildEntity inflection
   * first — TypeORM's cascade for STI child entities doesn't reliably set
   * the FK on the parent row. */
  async upsertLexeme(lexeme: Lexeme): Promise<void> {
    if (lexeme.inflection) {
      await lexeme.inflection.save();
    }
    lexeme.createdBy = LEXICO_INGESTION_BY_ID;
    lexeme.updatedBy = LEXICO_INGESTION_BY_ID;
    await this.lexemeRepository.upsert(lexeme, {
      conflictPaths: ["lemma", "disambiguator"],
      skipUpdateIfNoValuesChanged: false,
    });
  }

  /**
   *
   */
  async fetchSavedLexeme(
    lemma: string,
    disambiguator: number,
  ): Promise<Lexeme | null> {
    return this.lexemeRepository.findOne({
      where: { lemma, disambiguator },
      relations: {
        principalParts: true,
        pronunciations: true,
        translations: true,
        inflection: true,
      },
    });
  }

  /** Assigns the new principalParts and pronunciations onto the loaded entity
   * so TypeORM diffs against the loaded state and cascade-removes orphaned records. */
  async updateLexemePrincipalParts(
    savedLexeme: Lexeme,
    lexeme: Lexeme,
  ): Promise<void> {
    savedLexeme.principalParts = lexeme.principalParts;
    if (lexeme.pronunciations !== undefined) {
      savedLexeme.pronunciations = lexeme.pronunciations;
    }
    await this.lexemeRepository.save(savedLexeme);
  }

  /**
   * Parses Wiktionary HTML into fully-populated Lexeme objects using the
   * `p:has(strong.Latn.headword)` selector strategy.
   */
  async parseLexemes(wiktionaryPage: WiktionaryPage): Promise<Lexeme[]> {
    if (!wiktionaryPage.html) return [];

    const $ = cheerio.load(wiktionaryPage.html);
    const word = this.normalize(wiktionaryPage.word);
    const lexemes: Lexeme[] = [];

    const headwordElements = $("p:has(strong.Latn.headword)").toArray();

    if (headwordElements.length === 0) {
      this.logger.warn(`No headwords found for: ${wiktionaryPage.word}`);
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

      const lexeme = new Lexeme();
      lexeme.lemma = word;
      lexeme.disambiguator = i;
      lexeme.partOfSpeech = partOfSpeech;

      try {
        const { principalParts, macronizedWord } = this.parsePrincipalParts(
          lexeme,
          $,
          elt,
          firstPrincipalPartName,
        );
        lexeme.principalParts = principalParts;

        lexeme.inflection = this.partOfSpeechService.ingestInflection(
          partOfSpeech,
          $,
          elt,
          principalParts,
        );

        const translations = await this.parseTranslations($, elt, lexeme);
        const { etymology, participleTranslation } = this.parseEtymology(
          $,
          elt,
          lexeme,
        );
        lexeme.etymology = etymology;
        lexeme.translations = participleTranslation
          ? [...translations, participleTranslation]
          : translations;

        lexeme.pronunciations = this.pronunciationService.parse(
          $,
          elt,
          macronizedWord,
        );

        const rawForms = await this.partOfSpeechService.parseForms(
          partOfSpeech,
          $,
          elt,
          lexeme,
          principalParts,
        );
        lexeme.forms = this.formsService.buildForms(
          partOfSpeech,
          rawForms,
          lexeme,
        );

        lexemes.push(lexeme);
      } catch (error) {
        this.logger.warn(
          `Failed to parse ${lexeme.lemma}:${lexeme.disambiguator}: ${String(error)}`,
        );
      }
    }

    return lexemes;
  }
}
