import {
  type AdjectiveInflection,
  Entry,
  type PrincipalPart,
  Translation,
} from "@monorepo/lexico-entities";
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

const MANUAL_ENTRIES_TO_DELETE = [
  "qui:0",
  "quis:0",
  "latinitas:0",
  "ille:0",
  "ille:1",
  "omnis:0",
];

// Data sourced from https://en.wikipedia.org/wiki/Praenomen
const PRAENOMEN_ABBREVIATIONS: Record<
  string,
  { masculine?: string; feminine?: string }
> = {
  a: { masculine: "aulus", feminine: "aula" },
  agr: { masculine: "agrippa" },
  ap: { masculine: "appius", feminine: "appia" },
  d: { masculine: "decimo", feminine: "decima" },
  f: { masculine: "faustus", feminine: "fausta" },
  c: { masculine: "gaius", feminine: "gaia" },
  gn: { masculine: "gnaeus", feminine: "gnaea" },
  h: { feminine: "hosta" },
  k: { masculine: "caeso" },
  l: { masculine: "lucius", feminine: "lucia" },
  m: { masculine: "marcus", feminine: "marcia" },
  "m'": { masculine: "manius", feminine: "mania" },
  mai: { feminine: "maio" },
  mam: { masculine: "mamercus", feminine: "mamerca" },
  min: { feminine: "mino" },
  n: { masculine: "numerius", feminine: "numeria" },
  o: { masculine: "octavius" },
  oct: { feminine: "octavia" },
  opet: { masculine: "opiter" },
  post: { masculine: "postumus", feminine: "postuma" },
  p: { masculine: "publius" },
  pro: { masculine: "proculus", feminine: "procula" },
  q: { masculine: "quintus", feminine: "quinta" },
  s: { masculine: "spurius" },
  sp: { feminine: "spuria" },
  st: { masculine: "statius", feminine: "statia" },
  sec: { feminine: "secunda" },
  seq: { feminine: "secunda" },
  ser: { masculine: "servius", feminine: "servia" },
  sert: { masculine: "sertor" },
  sex: { masculine: "sextus", feminine: "sexta" },
  t: { masculine: "titus", feminine: "titia" },
  ti: { masculine: "tiberius", feminine: "tiberia" },
  v: { masculine: "vibius", feminine: "vibia" },
  vol: { masculine: "volesus", feminine: "volusa" },
  vop: { masculine: "vopiscus", feminine: "vopisca" },
};

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

    await this.ingestPraenomenAbbreviations();
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

  private async ingestPraenomenAbbreviations(): Promise<void> {
    this.logger.log("Ingesting praenomen abbreviations");
    for (const [abbreviation, praenomen] of Object.entries(
      PRAENOMEN_ABBREVIATIONS,
    )) {
      const entry = structuredClone(
        praenomenAbbreviationTemplate,
      ) as unknown as Entry & {
        principalParts: PrincipalPart[];
        inflection: { declension: string; gender: string; other: string };
      };
      entry.id = `${abbreviation}:100`;
      if (entry.principalParts[0]) {
        entry.principalParts[0].text = [abbreviation];
      }
      if (entry.principalParts[1]) {
        entry.principalParts[1].text = [`${abbreviation}.`];
      }
      entry.translations = [];
      if (praenomen.masculine) {
        entry.translations.push({
          translation: `Praenomen abbreviation: ${praenomen.masculine} (male)`,
        } as Translation);
      }
      if (praenomen.feminine) {
        entry.translations.push({
          translation: `Praenomen abbreviation: ${praenomen.feminine} (female)`,
        } as Translation);
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
    this.logger.log("Ingested praenomen abbreviations");
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
          translation: `Roman numeral: ${i} (${numberToWords.toWords(i)})`,
        } as Translation,
      ];
      await this.createManual(entry);
    }
    this.logger.log("Ingested Roman numerals");
  }
}
