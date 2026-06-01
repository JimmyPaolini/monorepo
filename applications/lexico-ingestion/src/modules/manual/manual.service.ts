import { Entry, Translation } from "@monorepo/lexico-entities";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import numberToWords from "number-to-words";
import { Repository } from "typeorm";

import hicJson from "../../../data/dictionary/hic.json" with { type: "json" };
import illeJson from "../../../data/dictionary/ille.json" with { type: "json" };
import omnisJson from "../../../data/dictionary/omnis.json" with { type: "json" };
import praenomenAbbreviationTemplate from "../../../data/dictionary/template/praenomenAbbreviation.json" with { type: "json" };
import romanNumeralTemplate from "../../../data/dictionary/template/romanNumeral.json" with { type: "json" };
import { WordsService } from "../words/words.service.js";

import {
  MANUAL_ENTRIES_TO_DELETE,
  PRAENOMEN_ABBREVIATIONS,
} from "./manual.constants";

/**
 * Ingests manually-curated dictionary entries (hic, ille, omnis, Roman numerals).
 */
@Injectable()
export class ManualService {
  private readonly logger = new Logger(ManualService.name);

  // 🏗️ Dependency Injection
  constructor(
    @InjectRepository(Entry)
    private readonly entriesRepository: Repository<Entry>,
    private readonly wordsService: WordsService,
  ) {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /** Runs the full manual-entry pipeline: deletes stale overrides, re-creates
   * hic/ille/omnis entries, populates praenomen abbreviations, and ingests
   * Roman numeral entries I–MMMCMXCIX. */
  async ingestManual(): Promise<void> {
    this.logger.log("📋 Ingesting manual entries");

    for (const id of MANUAL_ENTRIES_TO_DELETE) {
      await this.deleteManual(id);
    }

    await this.createManual(Object.assign(new Entry(), hicJson));
    await this.createManual(Object.assign(new Entry(), illeJson));
    await this.createManual(Object.assign(new Entry(), omnisJson));

    await this.ingestPraenomenAbbreviations();
    await this.ingestRomanNumerals();

    this.logger.log("📋 Ingested manual entries");
  }

  /** Deletes any existing row with the same id then saves `manual` and
   * re-ingests its word search records. */
  async createManual(manual: Entry): Promise<void> {
    await this.deleteManual(manual.id);
    this.logger.log(`✏️ Creating "${manual.id}"`);
    const entry = await this.entriesRepository.save(manual, { reload: false });
    await this.wordsService.ingestEntryWords(entry);
    this.logger.log(`✏️ Created "${manual.id}"`);
  }

  /** Removes the `Entry` row identified by `id` from the database. */
  async deleteManual(id: string): Promise<void> {
    this.logger.log(`🗑️ Deleting "${id}"`);
    await this.entriesRepository.delete(id);
    this.logger.log(`🗑️ Deleted "${id}"`);
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
      const entry = Object.assign(
        new Entry(),
        structuredClone(praenomenAbbreviationTemplate),
      );
      entry.id = `${abbreviation}:100`;
      if (entry.principalParts[0]) {
        entry.principalParts[0].text = [abbreviation];
      }
      if (entry.principalParts[1]) {
        entry.principalParts[1].text = [`${abbreviation}.`];
      }
      entry.translations = [];
      if (praenomen.masculine) {
        entry.translations.push(
          new Translation(
            `Praenomen abbreviation: ${praenomen.masculine} (male)`,
          ),
        );
      }
      if (praenomen.feminine) {
        entry.translations.push(
          new Translation(
            `Praenomen abbreviation: ${praenomen.feminine} (female)`,
          ),
        );
      }
      if (praenomen.masculine && !praenomen.feminine) {
        entry.inflection.gender = "masculine";
      } else if (!praenomen.masculine && praenomen.feminine) {
        entry.inflection.gender = "feminine";
      } else {
        entry.inflection.gender = "neuter";
      }
      await this.createManual(entry);
    }
    this.logger.log("🏷️ Ingested praenomen abbreviations");
  }

  private async ingestRomanNumerals(): Promise<void> {
    this.logger.log("🔢 Ingesting Roman numerals");
    for (let i = 1; i < 4000; i++) {
      const roman = this.decimalToRoman(i).toLowerCase();
      const entry = Object.assign(
        new Entry(),
        structuredClone(romanNumeralTemplate),
      );
      entry.id = `${roman}:100`;
      if (entry.principalParts[0]) {
        entry.principalParts[0].text = [roman];
      }
      entry.inflection.declension = "";
      entry.inflection.degree = "positive";
      entry.translations = [
        new Translation(`Roman numeral: ${i} (${numberToWords.toWords(i)})`),
      ];
      await this.createManual(entry);
    }
    this.logger.log("🔢 Ingested Roman numerals");
  }
}
