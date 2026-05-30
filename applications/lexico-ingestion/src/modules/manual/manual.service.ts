import {
  type AdjectiveInflection,
  Entry,
  type PrincipalPart,
  Translation,
} from "@monorepo/lexico-entities";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { toWords } from "number-to-words";
import { Repository } from "typeorm";

import hicJson from "../../../data/dictionary/hic.json" with { type: "json" };
import illeJson from "../../../data/dictionary/ille.json" with { type: "json" };
import omnisJson from "../../../data/dictionary/omnis.json" with { type: "json" };
import romanNumeralTemplate from "../../../data/dictionary/template/romanNumeral.json" with { type: "json" };
import { WordsService } from "../words/words.service.js";

const MANUAL_ENTRIES_TO_DELETE = [
  "qui:0",
  "quis:0",
  "latinitas:0",
  "ille:0",
  "ille:1",
  "omnis:0",
];

/**
 * Ingests manually-curated dictionary entries (hic, ille, omnis, Roman numerals).
 */
@Injectable()
export class ManualService {
  private readonly logger = new Logger(ManualService.name);

  constructor(
    @InjectRepository(Entry)
    private readonly entriesRepository: Repository<Entry>,
    private readonly wordsService: WordsService,
  ) {}

  /**
   *
   */
  async ingestManual(): Promise<void> {
    this.logger.log("Ingesting manual entries");

    for (const id of MANUAL_ENTRIES_TO_DELETE) {
      await this.deleteManual(id);
    }

    await this.createManual(hicJson as unknown as Entry);
    await this.createManual(illeJson as unknown as Entry);
    await this.createManual(omnisJson as unknown as Entry);

    await this.ingestRomanNumerals();

    this.logger.log("Ingested manual entries");
  }

  /**
   *
   */
  async createManual(manual: Entry): Promise<void> {
    await this.deleteManual(manual.id);
    this.logger.log(`Creating ${manual.id}`);
    const entry = await this.entriesRepository.save(manual, { reload: false });
    await this.wordsService.ingestEntryWords(entry);
    this.logger.log(`Created ${manual.id}`);
  }

  /**
   *
   */
  async deleteManual(id: string): Promise<void> {
    this.logger.log(`Deleting ${id}`);
    await this.entriesRepository.delete(id);
    this.logger.log(`Deleted ${id}`);
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

  private async ingestRomanNumerals(): Promise<void> {
    this.logger.log("Ingesting Roman numerals");
    for (let i = 1; i < 4000; i++) {
      const roman = this.decimalToRoman(i).toLowerCase();
      const entry = structuredClone(
        romanNumeralTemplate,
      ) as unknown as Entry & {
        principalParts: PrincipalPart[];
      };
      entry.id = `${roman}:100`;
      if (entry.principalParts[0]) {
        entry.principalParts[0].text = [roman];
      }
      const inflection = entry.inflection as AdjectiveInflection;
      inflection.declension = "";
      inflection.degree = "positive";
      entry.translations = [
        {
          translation: `Roman numeral: ${i} (${toWords(i)})`,
        } as Translation,
      ];
      await this.createManual(entry);
    }
    this.logger.log("Ingested Roman numerals");
  }
}
