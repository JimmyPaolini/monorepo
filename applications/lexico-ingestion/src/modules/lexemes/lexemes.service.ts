import { Lexeme } from "@monorepo/lexico-entities";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as cheerio from "cheerio";
import { Repository } from "typeorm";

import { EtymologyService } from "../etymology/etymology.service.js";
import { FormsService } from "../forms/forms.service.js";
import { LEXICO_INGESTION_BY_ID } from "../lexico-ingestion/lexico-ingestion.constants.js";
import { LoggerService } from "../logger/logger.service.js";
import { PartOfSpeechService } from "../part-of-speech/part-of-speech.service.js";
import { PrincipalPartsService } from "../principal-parts/principal-parts.service.js";
import { PronunciationService } from "../pronunciation/pronunciation.service.js";
import { TranslationsService } from "../translations/translations.service.js";

import { skipPOS, validPOS } from "./lexemes.constants";

import type { WiktionaryPage } from "../lexico-ingestion/lexico-ingestion.types.js";

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
    private readonly etymologyService: EtymologyService,
    private readonly formsService: FormsService,
    private readonly partOfSpeechService: PartOfSpeechService,
    private readonly principalPartsService: PrincipalPartsService,
    private readonly pronunciationService: PronunciationService,
    private readonly translationsService: TranslationsService,
  ) {
    this.logger.setContext(LexemesService.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  private normalize(str: string): string {
    return str
      .normalize("NFD")
      .replaceAll(/[\u0300-\u036F]/gu, "")
      .toLowerCase()
      .trim();
  }

  // 🌎 Public Methods

  /** Upserts the Lexeme row. Explicitly saves the ChildEntity inflection
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
      lexeme.lemma = this.normalize(word);
      lexeme.disambiguator = i;
      lexeme.partOfSpeech = partOfSpeech;

      try {
        const { principalParts, macronizedWord } =
          this.principalPartsService.parsePrincipalParts(
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

        const translations = this.translationsService.parseTranslations(
          $,
          elt,
          lexeme,
        );
        const { etymology, participleTranslation } =
          this.etymologyService.parseEtymology($, elt, lexeme);
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
