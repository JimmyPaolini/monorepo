import { Lexeme, Translation } from "@monorepo/lexico-entities";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import numberToWords from "number-to-words";
import { Repository } from "typeorm";

import { WordsService } from "../words/words.service";

import {
  buildHicTemplate,
  buildIlleTemplate,
  buildOmnisTemplate,
  buildPraenomenAbbreviationTemplate,
  buildRomanNumeralTemplate,
  MANUAL_LEXEMES_TO_DELETE,
  PRAENOMEN_ABBREVIATIONS,
} from "./manual.constants";

/**
 * Ingests manually-curated dictionary lexemes (hic, ille, omnis, Roman numerals).
 */
@Injectable()
export class ManualService {
  private readonly logger = new Logger(ManualService.name);

  // 🏗️ Dependency Injection
  constructor(
    @InjectRepository(Lexeme)
    private readonly lexemesRepository: Repository<Lexeme>,
    private readonly wordsService: WordsService,
  ) {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /** Runs the full manual-lexeme pipeline: deletes stale overrides, re-creates
   * hic/ille/omnis lexemes, populates praenomen abbreviations, and ingests
   * Roman numeral lexemes I–MMMCMXCIX. */
  async ingestManual(): Promise<void> {
    this.logger.log("📋 Ingesting manual lexemes");

    for (const { lemma, disambiguator } of MANUAL_LEXEMES_TO_DELETE) {
      await this.deleteManual(lemma, disambiguator);
    }

    await this.createManual(buildHicTemplate());
    await this.createManual(buildIlleTemplate());
    await this.createManual(buildOmnisTemplate());

    await this.ingestPraenomenAbbreviations();
    await this.ingestRomanNumerals();

    this.logger.log("📋 Ingested manual lexemes");
  }

  /** Deletes any existing row with the same lemma and disambiguator then saves `manual` and
   * re-ingests its word search records. */
  async createManual(manual: Lexeme): Promise<void> {
    await this.deleteManual(manual.lemma, manual.disambiguator);
    this.logger.log(`✏️ Creating "${manual.lemma}:${manual.disambiguator}"`);
    const lexeme = await this.lexemesRepository.save(manual, { reload: false });
    await this.wordsService.ingestLexemeWords(lexeme);
    this.logger.log(`✏️ Created "${manual.lemma}:${manual.disambiguator}"`);
  }

  /** Removes the `Lexeme` row identified by `lemma` and `disambiguator` from the database. */
  async deleteManual(lemma: string, disambiguator: number): Promise<void> {
    this.logger.log(`🗑️ Deleting "${lemma}:${disambiguator}"`);
    await this.lexemesRepository.delete({ lemma, disambiguator });
    this.logger.log(`🗑️ Deleted "${lemma}:${disambiguator}"`);
  }

  private decimalToRoman(decimal: number): string {
    if (decimal < 1 || decimal > 3999) {
      throw new Error(
        `Decimal ${decimal} is out of range for Roman numerals (1–3999)`,
      );
    }

    let roman = "";

    function convertDigit(
      digit: number,
      low: string,
      mid: string,
      top: string,
    ): void {
      if (digit < 4) roman += low.repeat(digit);
      else if (digit === 4) roman += low + mid;
      else if (digit < 9) roman += mid + low.repeat(digit - 5);
      else if (digit === 9) roman += low + top;
    }

    convertDigit(Math.floor((decimal % 10_000) / 1000), "M", "", "");
    convertDigit(Math.floor((decimal % 1000) / 100), "C", "D", "M");
    convertDigit(Math.floor((decimal % 100) / 10), "X", "L", "C");
    convertDigit(Math.floor((decimal % 10) / 1), "I", "V", "X");

    return roman;
  }

  private async ingestPraenomenAbbreviations(): Promise<void> {
    this.logger.log("🏷️ Ingesting praenomen abbreviations");
    for (const [abbreviation, praenomen] of Object.entries(
      PRAENOMEN_ABBREVIATIONS,
    )) {
      const lexeme = buildPraenomenAbbreviationTemplate();
      lexeme.lemma = abbreviation;
      if (lexeme.principalParts[0]) {
        lexeme.principalParts[0].text = [abbreviation];
      }
      if (lexeme.principalParts[1]) {
        lexeme.principalParts[1].text = [`${abbreviation}.`];
      }
      lexeme.translations = [];
      if (praenomen.masculine) {
        lexeme.translations.push(
          new Translation(
            `Praenomen abbreviation: ${praenomen.masculine} (male)`,
            lexeme,
          ),
        );
      }
      if (praenomen.feminine) {
        lexeme.translations.push(
          new Translation(
            `Praenomen abbreviation: ${praenomen.feminine} (female)`,
            lexeme,
          ),
        );
      }

      const inflection = lexeme.inflection;
      if (inflection && "gender" in inflection) {
        if (praenomen.masculine && !praenomen.feminine) {
          inflection.gender = "masculine";
        } else if (!praenomen.masculine && praenomen.feminine) {
          inflection.gender = "feminine";
        } else {
          inflection.gender = "neuter";
        }
      }
      await this.createManual(lexeme);
    }
    this.logger.log("🏷️ Ingested praenomen abbreviations");
  }

  private async ingestRomanNumerals(): Promise<void> {
    this.logger.log("🔢 Ingesting Roman numerals");
    for (let i = 1; i < 4000; i++) {
      const roman = this.decimalToRoman(i).toLowerCase();
      const lexeme = buildRomanNumeralTemplate();
      lexeme.lemma = roman;
      if (lexeme.principalParts[0]) {
        lexeme.principalParts[0].text = [roman];
      }
      lexeme.translations = [
        new Translation(
          `Roman numeral: ${i} (${numberToWords.toWords(i)})`,
          lexeme,
        ),
      ];
      await this.createManual(lexeme);
    }
    this.logger.log("🔢 Ingested Roman numerals");
  }
}
