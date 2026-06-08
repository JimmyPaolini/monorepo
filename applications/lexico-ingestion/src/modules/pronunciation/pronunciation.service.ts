import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as cheerio from "cheerio";
import _ from "lodash";
import { Repository } from "typeorm";

import { Lexeme, Pronunciation } from "@monorepo/lexico-entities";

import { LoggerService } from "../logger/logger.service";

import {
  classicalDevocalize,
  classicalPhonemes,
  classicalSubstitutions,
  ecclesiasticalPhonemes,
} from "./pronunciation.constants";

import type { AnyNode } from "domhandler";

function getStringPhoneme(
  map: Record<string, string | string[][]>,
  key: string,
): string {
  const value = map[key];
  return typeof value === "string" ? value : "";
}

/**
 * Parses Classical and Ecclesiastical Latin pronunciation from
 * a macronized word and Wiktionary HTML element context.
 */
@Injectable()
export class PronunciationService {
  // 🏗 Dependency Injection

  constructor(
    @InjectRepository(Lexeme)
    private readonly lexemeRepository: Repository<Lexeme>,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(PronunciationService.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  private buildPronunciations(phonemes: (string | string[][])[]): string[] {
    const pronunciations: string[] = [];

    function build(
      prev: (string | string[][])[],
      next: (string | string[][])[],
    ): void {
      if (next.length === 0) {
        pronunciations.push(prev.join(" "));
        return;
      }
      const rest = [...next];
      const phoneme = rest.shift();
      if (Array.isArray(phoneme)) {
        for (const option of phoneme) {
          if (Array.isArray(option)) {
            build([...prev, ...option], [...rest]);
          } else build([...prev, option], [...rest]);
        }
      } else if (phoneme !== undefined) {
        build([...prev, phoneme], [...rest]);
      }
    }

    build([], phonemes);
    return pronunciations;
  }

  private getClassicalPhonemes(wordString: string): string {
    for (const [pattern, replacement] of Object.entries(
      classicalSubstitutions,
    )) {
      wordString = wordString.replace(new RegExp(pattern), replacement);
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-spread
    const word = [...wordString.toLowerCase()];
    const isVowel = (i: number): boolean =>
      i >= 0 &&
      i < word.length &&
      // eslint-disable-next-line @typescript-eslint/no-misused-spread
      [..."aeiouāēīōūȳ"].includes(word[i] ?? "");

    const phonemes: string[] = [];
    for (let i = 0; i < word.length; i++) {
      const ch = word[i] ?? "";
      switch (ch) {
        case "h": {
          if (
            i === 0 ||
            (isVowel(i + 1) && i - 1 >= 0 && word[i - 1] !== "r")
          ) {
            phonemes.push("H");
          }
          break;
        }
        case "i": {
          if (isVowel(i + 1) && (i === 0 || isVowel(i - 1))) phonemes.push("J");
          else phonemes.push(classicalPhonemes[ch] ?? "");
          break;
        }
        case "j": {
          if (
            !isVowel(i - 1) &&
            ["l", "m", "n", "q", "t"].includes(word[i - 1] ?? "")
          ) {
            phonemes.push("I");
          } else phonemes.push(classicalPhonemes[ch] ?? "");
          break;
        }
        case "n": {
          if (
            !isVowel(i + 1) &&
            ["c", "g", "q", "x"].includes(word[i + 1] ?? "")
          ) {
            phonemes.push("NG");
          } else phonemes.push(classicalPhonemes[ch] ?? "");
          break;
        }
        default: {
          if (Object.hasOwn(classicalDevocalize, ch)) {
            if (
              i + 1 < word.length &&
              ["c", "f", "k", "p", "q", "s", "t"].includes(word[i + 1] ?? "")
            ) {
              phonemes.push(classicalDevocalize[ch] ?? "");
            } else phonemes.push(classicalPhonemes[ch] ?? "");
          } else if (
            i + 2 < word.length &&
            classicalPhonemes[ch + (word[i + 1] ?? "") + (word[i + 2] ?? "")]
          ) {
            phonemes.push(
              classicalPhonemes[ch + (word[++i] ?? "") + (word[++i] ?? "")] ??
                "",
            );
          } else if (
            i + 1 < word.length &&
            classicalPhonemes[ch + (word[i + 1] ?? "")]
          ) {
            phonemes.push(classicalPhonemes[ch + (word[++i] ?? "")] ?? "");
          } else {
            phonemes.push(classicalPhonemes[ch] ?? "");
          }
        }
      }
    }

    return phonemes.join(" ");
  }

  private getEcclesiasticalPhonemes(
    wordString: string,
  ): (string | string[][])[] {
    const phonemes: (string | string[][])[] = [];
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const isVowel = (letter: string): boolean =>
      ["a", "e", "i", "o", "u"].includes(letter);
    // eslint-disable-next-line @typescript-eslint/no-misused-spread
    const word = [...wordString];

    for (let i = 0; i < word.length; i++) {
      const ch = word[i] ?? "";
      switch (ch) {
        case "c": {
          if (
            (i + 1 < word.length &&
              ["e", "i", "y"].includes(word[i + 1] ?? "")) ||
            (i + 2 < word.length &&
              ["ae", "oe"].includes((word[i + 1] ?? "") + (word[i + 2] ?? "")))
          ) {
            phonemes.push("ch");
          } else if (i + 1 < word.length && word[i + 1] === "c") {
            phonemes.push("ch");
            i++;
          } else phonemes.push("k");
          break;
        }
        case "g": {
          if (
            (i + 2 < word.length &&
              ["ae", "oe"].includes(
                (word[i + 1] ?? "") + (word[i + 2] ?? ""),
              )) ||
            ["e", "i", "y"].includes(word[i + 1] ?? "")
          ) {
            phonemes.push("dg");
          } else if (i + 1 < word.length && word[i + 1] === "g") {
            phonemes.push("dg");
            i++;
          } else phonemes.push("g");
          break;
        }
        case "h": {
          if (
            (i - 2 >= 0 &&
              i + 1 < word.length &&
              wordString.slice(i - 2, i + 2) === "mihi") ||
            (i - 2 >= 0 &&
              i + 2 < word.length &&
              wordString.slice(i - 2, i + 3) === "nihil")
          ) {
            phonemes.push("k");
          }
          break;
        }
        case "i": {
          if (i === 0 && i + 1 < word.length && isVowel(word[i + 1] ?? "")) {
            phonemes.push("j");
          } else if (
            i - 1 > 0 &&
            i + 1 < word.length &&
            isVowel(word[i - 1] ?? "") &&
            isVowel(word[i + 1] ?? "")
          ) {
            phonemes.push("j");
          } else phonemes.push(getStringPhoneme(ecclesiasticalPhonemes, "i"));
          break;
        }
        case "s": {
          if (
            i > 0 &&
            isVowel(word[i - 1] ?? "") &&
            isVowel(word[i + 1] ?? "")
          ) {
            phonemes.push("z");
          } else if (
            i + 2 < word.length &&
            ["ce", "ci"].includes((word[i + 1] ?? "") + (word[i + 2] ?? ""))
          ) {
            phonemes.push("sh");
            i++;
          } else phonemes.push("s");
          if (word[i + 1] === "s") i++;
          break;
        }
        case "t": {
          if (word[i + 1] === "i") phonemes.push("ts");
          else phonemes.push("t");
          break;
        }
        case "x": {
          if (
            i > 0 &&
            isVowel(word[i - 1] ?? "") &&
            isVowel(word[i + 1] ?? "")
          ) {
            phonemes.push("gz");
          } else if (
            i + 2 < word.length &&
            ["ce", "ci"].includes((word[i + 1] ?? "") + (word[i + 2] ?? ""))
          ) {
            phonemes.push("ksh");
            i++;
          } else phonemes.push("ks");
          break;
        }
        default: {
          if (ecclesiasticalPhonemes[ch + (word[i + 1] ?? "")]) {
            phonemes.push(
              getStringPhoneme(ecclesiasticalPhonemes, ch + (word[++i] ?? "")),
            );
          } else {
            phonemes.push(getStringPhoneme(ecclesiasticalPhonemes, ch));
          }
        }
      }
    }

    return phonemes;
  }

  private getEcclesiasticalPronunciations(word: string): string[] {
    return this.buildPronunciations(this.getEcclesiasticalPhonemes(word));
  }

  private parsePhonics(
    pronunciations: string[],
  ): Pick<Pronunciation, "phonemic" | "phonetic"> {
    const parsed: Pick<Pronunciation, "phonemic" | "phonetic"> = {
      phonemic: null,
      phonetic: null,
    };
    for (const pronunciation of pronunciations) {
      if (/\/.*\//.test(pronunciation)) {
        parsed.phonemic = pronunciation.trim();
      } else if (/\[.*\]/.test(pronunciation)) {
        parsed.phonetic = pronunciation.trim();
      }
    }
    return parsed;
  }

  // 🌎 Public Methods

  /**
   * Assigns the new pronunciations onto the loaded entity
   * so TypeORM diffs against the loaded state and cascade-removes orphaned records.
   */
  async ingestLexemePronunciations(
    savedLexeme: Lexeme,
    pronunciations: Pronunciation[],
  ): Promise<void> {
    // Preserve existing IDs to prevent insert/delete churn and unique constraint violations
    if (savedLexeme.pronunciations) {
      for (const newPron of pronunciations) {
        const existing = savedLexeme.pronunciations.find(
          (p) => p.variant === newPron.variant,
        );
        if (existing) newPron.id = existing.id;
      }
    }
    savedLexeme.pronunciations = pronunciations;
    await this.lexemeRepository.save(savedLexeme);
  }

  /**
   * Parses pronunciation data from the Wiktionary HTML element context.
   * Requires `macronizedWord` to already be resolved (call `parsePrincipalParts`
   * before this function). Returns one `Pronunciation` entity per variant.
   */
  parse(
    $: cheerio.CheerioAPI,
    elt: AnyNode,
    macronizedWord: string,
  ): Pronunciation[] {
    const classical = new Pronunciation();
    classical.variant = "classical";
    classical.phonemes = this.getClassicalPhonemes(macronizedWord);
    classical.phonemic = null;
    classical.phonetic = null;

    const ecclesiastical = new Pronunciation();
    ecclesiastical.variant = "ecclesiastical";
    ecclesiastical.phonemes =
      this.getEcclesiasticalPronunciations(macronizedWord)[0] ?? null;
    ecclesiastical.phonemic = null;
    ecclesiastical.phonetic = null;

    const vulgar = new Pronunciation();
    vulgar.variant = "vulgar";
    vulgar.phonemes = null;
    vulgar.phonemic = null;
    vulgar.phonetic = null;

    const pronunciationHeader = $(elt)
      .prevAll("div.mw-heading")
      .filter((_: number, el: AnyNode) => /pronunciation/i.test($(el).text()))
      .first();
    if (pronunciationHeader.length <= 0)
      return [classical, ecclesiastical, vulgar];

    for (const pr of pronunciationHeader.next("ul").children()) {
      if (/^audio/i.test($(pr).text())) continue;

      const pronunciationsText = $(pr)
        .text()
        .split("IPA(key):")[1]
        ?.split(", ");
      if (!pronunciationsText) continue;

      const anchorText = $(pr).find("a").text();
      if (anchorText.includes("Classical")) {
        _.assign(classical, this.parsePhonics(pronunciationsText));
      } else if (anchorText.includes("Ecclesiastical")) {
        _.assign(ecclesiastical, this.parsePhonics(pronunciationsText));
      } else if (anchorText.includes("Vulgar")) {
        _.assign(vulgar, this.parsePhonics(pronunciationsText));
      }
    }

    return [classical, ecclesiastical, vulgar];
  }
}
