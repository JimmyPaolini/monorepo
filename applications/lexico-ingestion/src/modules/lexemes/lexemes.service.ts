import { Lexeme } from "@monorepo/lexico-entities";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as cheerio from "cheerio";
import { Repository } from "typeorm";

import { EtymologyService } from "../etymology/etymology.service";
import { FormsService } from "../forms/forms.service";
import { LEXICO_INGESTION_BY_ID } from "../lexico-ingestion/lexico-ingestion.constants";
import { LoggerService } from "../logger/logger.service";
import { PartOfSpeechService } from "../part-of-speech/part-of-speech.service";
import { PrincipalPartsService } from "../principal-parts/principalParts.service";
import { PronunciationService } from "../pronunciation/pronunciation.service";
import { TranslationsService } from "../translations/translations.service";
import { WordsService } from "../words/words.service";

import { skipPOS, validPOS } from "./lexemes.constants";

import type { WiktionaryPage } from "../lexico-ingestion/lexico-ingestion.types";

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
    private readonly wordsService: WordsService,
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

  /** Persists a parsed Lexeme and its related entities. */
  async saveParsedLexeme(lexeme: Lexeme): Promise<Lexeme | null> {
    await this.upsertLexeme(lexeme);
    const savedLexeme = await this.fetchSavedLexeme(
      lexeme.lemma,
      lexeme.disambiguator,
    );
    if (!savedLexeme) return null;

    if (lexeme.inflection) {
      lexeme.inflection.lexeme = savedLexeme;
      await lexeme.inflection.save();
      savedLexeme.inflection = lexeme.inflection;
    }

    await this.principalPartsService.ingestLexemePrincipalParts(
      savedLexeme,
      lexeme.principalParts,
    );
    if (lexeme.pronunciations !== undefined && lexeme.pronunciations !== null) {
      await this.pronunciationService.ingestLexemePronunciations(
        savedLexeme,
        lexeme.pronunciations,
      );
    }
    if (lexeme.translations !== undefined && lexeme.translations !== null) {
      const preparedTranslations =
        this.translationsService.prepareTranslationsForSave(
          savedLexeme,
          lexeme.translations,
        );
      savedLexeme.translations = preparedTranslations;
      await this.lexemeRepository.save(savedLexeme);
    }
    if (lexeme.forms.length > 0) {
      await this.formsService.ingestLexemeForms(lexeme.forms, savedLexeme);
    }
    await this.wordsService.ingestLexemeWords(savedLexeme);
    this.logger.debug(
      `Upserted lexeme "${lexeme.lemma}" (disambiguator: ${lexeme.disambiguator})`,
    );
    return savedLexeme;
  }

  /** Upserts the Lexeme row. */
  async upsertLexeme(lexeme: Lexeme): Promise<void> {
    lexeme.createdBy = LEXICO_INGESTION_BY_ID;
    lexeme.updatedBy = LEXICO_INGESTION_BY_ID;
    await this.lexemeRepository.upsert(lexeme, {
      conflictPaths: ["lemma", "disambiguator"],
      skipUpdateIfNoValuesChanged: true,
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

  /** Returns true if a lexeme matching `lemma` already exists in the DB. */
  async existsByLemma(lemma: string): Promise<boolean> {
    const count = await this.lexemeRepository
      .createQueryBuilder("lexeme")
      .where("lexeme.lemma = :lemma", { lemma })
      .getCount();
    return count > 0;
  }

  /** Finds all lexemes matching `lemma`, including their translations. */
  async findLexemesByLemmaWithTranslations(lemma: string): Promise<Lexeme[]> {
    return this.lexemeRepository
      .createQueryBuilder("lexeme")
      .leftJoinAndSelect("lexeme.translations", "translations")
      .where("lexeme.lemma = :lemma", { lemma })
      .getMany();
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
