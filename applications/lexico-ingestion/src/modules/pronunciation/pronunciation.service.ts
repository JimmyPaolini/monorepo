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

  private applyWiktionaryPronunciations(
    $: cheerio.CheerioAPI,
    elt: AnyNode,
    classical: Pronunciation,
    ecclesiastical: Pronunciation,
    vulgar: Pronunciation,
  ): void {
    const pronunciationHeader = $(elt)
      .prevAll("div.mw-heading")
      .filter((_: number, element: AnyNode) =>
        /pronunciation/i.test($(element).text()),
      )
      .first();
    if (pronunciationHeader.length <= 0) return;
    for (const pr of pronunciationHeader.next("ul").children()) {
      if (/^audio/i.test($(pr).text())) continue;
      const pronunciationsText = $(pr)
        .text()
        .split("IPA(key):")[1]
        ?.split(", ");
      if (!pronunciationsText) continue;
      const anchorText = $(pr).find("a").text();
      this.updateVariantPronunciation(
        anchorText,
        pronunciationsText,
        classical,
        ecclesiastical,
        vulgar,
      );
    }
  }

  private buildDefaultPronunciation(
    variant: "classical" | "ecclesiastical" | "vulgar",
    phonemes: null | string,
  ): Pronunciation {
    const pronunciation = new Pronunciation();
    pronunciation.variant = variant;
    pronunciation.phonemes = phonemes;
    pronunciation.phonemic = null;
    pronunciation.phonetic = null;
    return pronunciation;
  }

  private buildPronunciations(phonemes: (string | string[][])[]): string[] {
    const pronunciations: string[] = [];

    function build(
      previous: (string | string[][])[],
      next: (string | string[][])[],
    ): void {
      if (next.length === 0) {
        pronunciations.push(previous.join(" "));
        return;
      }
      const rest = [...next];
      const phoneme = rest.shift();
      if (Array.isArray(phoneme)) {
        for (const option of phoneme) {
          if (Array.isArray(option)) {
            build([...previous, ...option], [...rest]);
          } else build([...previous, option], [...rest]);
        }
      } else if (phoneme !== undefined) {
        build([...previous, phoneme], [...rest]);
      }
    }

    build([], phonemes);
    return pronunciations;
  }

  private classifyClassicalH(
    index: number,
    word: string[],
    isVowel: (index: number) => boolean,
    phonemes: string[],
  ): void {
    if (
      index === 0 ||
      (isVowel(index + 1) && index - 1 >= 0 && word[index - 1] !== "r")
    ) {
      phonemes.push("H");
    }
  }

  private classifyClassicalI(
    ch: string,
    index: number,
    isVowel: (index: number) => boolean,
    phonemes: string[],
  ): void {
    if (isVowel(index + 1) && (index === 0 || isVowel(index - 1)))
      phonemes.push("J");
    else phonemes.push(classicalPhonemes[ch] ?? "");
  }

  private classifyClassicalJ(
    ch: string,
    index: number,
    word: string[],
    isVowel: (index: number) => boolean,
    phonemes: string[],
  ): void {
    if (
      !isVowel(index - 1) &&
      ["l", "m", "n", "q", "t"].includes(word[index - 1] ?? "")
    ) {
      phonemes.push("I");
    } else phonemes.push(classicalPhonemes[ch] ?? "");
  }

  private classifyClassicalN(
    ch: string,
    index: number,
    word: string[],
    isVowel: (index: number) => boolean,
    phonemes: string[],
  ): void {
    if (
      !isVowel(index + 1) &&
      ["c", "g", "q", "x"].includes(word[index + 1] ?? "")
    ) {
      phonemes.push("NG");
    } else phonemes.push(classicalPhonemes[ch] ?? "");
  }

  private classifyEcclesiasticalC(
    index: number,
    word: string[],
    phonemes: (string | string[][])[],
  ): number {
    if (index + 1 < word.length && this.isPalatalizedCConsonant(index, word)) {
      phonemes.push("ch");
    } else if (index + 1 < word.length && word[index + 1] === "c") {
      phonemes.push("ch");
      index++;
    } else phonemes.push("k");
    return index;
  }

  private classifyEcclesiasticalG(
    index: number,
    word: string[],
    phonemes: (string | string[][])[],
  ): number {
    if (index + 1 < word.length && this.isPalatalizedGConsonant(index, word)) {
      phonemes.push("dg");
    } else if (index + 1 < word.length && word[index + 1] === "g") {
      phonemes.push("dg");
      index++;
    } else phonemes.push("g");
    return index;
  }

  private classifyEcclesiasticalH(
    index: number,
    wordString: string,
    word: string[],
    phonemes: (string | string[][])[],
  ): void {
    if (
      (index - 2 >= 0 &&
        index + 1 < word.length &&
        wordString.slice(index - 2, index + 2) === "mihi") ||
      (index - 2 >= 0 &&
        index + 2 < word.length &&
        wordString.slice(index - 2, index + 3) === "nihil")
    ) {
      phonemes.push("k");
    }
  }

  private classifyEcclesiasticalI(
    index: number,
    word: string[],
    isVowel: (letter: string) => boolean,
    phonemes: (string | string[][])[],
  ): void {
    if (this.isEcclesiasticalVocalI(index, word, isVowel)) phonemes.push("j");
    else phonemes.push(getStringPhoneme(ecclesiasticalPhonemes, "i"));
  }

  private classifyEcclesiasticalS(
    index: number,
    word: string[],
    isVowel: (letter: string) => boolean,
    phonemes: (string | string[][])[],
  ): number {
    if (this.isBetweenVowels(index, word, isVowel)) {
      phonemes.push("z");
    } else if (this.isScConsonant(index, word)) {
      phonemes.push("sh");
      index++;
    } else phonemes.push("s");
    if (word[index + 1] === "s") index++;
    return index;
  }

  private classifyEcclesiasticalT(
    index: number,
    word: string[],
    phonemes: (string | string[][])[],
  ): void {
    if (word[index + 1] === "i") phonemes.push("ts");
    else phonemes.push("t");
  }

  private classifyEcclesiasticalX(
    index: number,
    word: string[],
    isVowel: (letter: string) => boolean,
    phonemes: (string | string[][])[],
  ): number {
    if (this.isBetweenVowels(index, word, isVowel)) {
      phonemes.push("gz");
    } else if (this.isScConsonant(index, word)) {
      phonemes.push("ksh");
      index++;
    } else phonemes.push("ks");
    return index;
  }

  private getClassicalPhonemes(wordString: string): string {
    for (const [pattern, replacement] of Object.entries(
      classicalSubstitutions,
    )) {
      wordString = wordString.replace(new RegExp(pattern), replacement);
    }
    // eslint-disable-next-line @typescript-eslint/no-misused-spread
    const word = [...wordString.toLowerCase()];
    const isVowel = (index: number): boolean =>
      index >= 0 &&
      index < word.length &&
      // eslint-disable-next-line @typescript-eslint/no-misused-spread
      [..."aeiouāēīōūȳ"].includes(word[index] ?? "");
    const phonemes: string[] = [];
    for (let index = 0; index < word.length; index++) {
      const ch = word[index] ?? "";
      index = this.processClassicalCharacter(
        ch,
        index,
        word,
        isVowel,
        phonemes,
      );
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
    for (let index = 0; index < word.length; index++) {
      const ch = word[index] ?? "";
      index = this.processEcclesiasticalCharacter(
        ch,
        index,
        word,
        wordString,
        isVowel,
        phonemes,
      );
    }
    return phonemes;
  }

  private getEcclesiasticalPronunciations(word: string): string[] {
    return this.buildPronunciations(this.getEcclesiasticalPhonemes(word));
  }

  private isBetweenVowels(
    index: number,
    word: string[],
    isVowel: (letter: string) => boolean,
  ): boolean {
    return (
      index > 0 &&
      isVowel(word[index - 1] ?? "") &&
      isVowel(word[index + 1] ?? "")
    );
  }

  private isEcclesiasticalVocalI(
    index: number,
    word: string[],
    isVowel: (letter: string) => boolean,
  ): boolean {
    return (
      this.isInitialVocalI(index, word, isVowel) ||
      this.isInterVocalicI(index, word, isVowel)
    );
  }

  private isInitialVocalI(
    index: number,
    word: string[],
    isVowel: (letter: string) => boolean,
  ): boolean {
    return (
      index === 0 && index + 1 < word.length && isVowel(word[index + 1] ?? "")
    );
  }

  private isInterVocalicI(
    index: number,
    word: string[],
    isVowel: (letter: string) => boolean,
  ): boolean {
    return (
      index - 1 > 0 &&
      index + 1 < word.length &&
      isVowel(word[index - 1] ?? "") &&
      isVowel(word[index + 1] ?? "")
    );
  }

  private isPalatalizedCConsonant(index: number, word: string[]): boolean {
    const nextCharacter = word[index + 1] ?? "";
    const nextTwoChars = nextCharacter + (word[index + 2] ?? "");
    return (
      ["ae", "æ", "e", "i", "oe", "y"].includes(nextCharacter) ||
      ["ae", "oe"].includes(nextTwoChars)
    );
  }

  private isPalatalizedGConsonant(index: number, word: string[]): boolean {
    const nextCharacter = word[index + 1] ?? "";
    const nextTwoChars = nextCharacter + (word[index + 2] ?? "");
    return (
      ["e", "i", "y"].includes(nextCharacter) ||
      ["ae", "oe"].includes(nextTwoChars)
    );
  }

  private isScConsonant(index: number, word: string[]): boolean {
    return (
      index + 2 < word.length &&
      ["ce", "ci"].includes((word[index + 1] ?? "") + (word[index + 2] ?? ""))
    );
  }

  private lookupClassicalDevocalizeCharacter(
    ch: string,
    index: number,
    word: string[],
    phonemes: string[],
  ): void {
    const nextCharacter = word[index + 1] ?? "";
    if (
      index + 1 < word.length &&
      ["c", "f", "k", "p", "q", "s", "t"].includes(nextCharacter)
    ) {
      phonemes.push(classicalDevocalize[ch] ?? "");
    } else phonemes.push(classicalPhonemes[ch] ?? "");
  }

  private lookupMultiCharacterPhoneme(
    ch: string,
    index: number,
    word: string[],
    phonemes: string[],
  ): number {
    const twoAheadKey = ch + word.slice(index + 1, index + 3).join("");
    const oneAheadKey = ch + (word[index + 1] ?? "");
    const twoCharacterPhoneme = classicalPhonemes[twoAheadKey];
    const oneCharacterPhoneme = classicalPhonemes[oneAheadKey];
    if (index + 2 < word.length && twoCharacterPhoneme !== undefined) {
      phonemes.push(twoCharacterPhoneme);
      return index + 2;
    }
    if (index + 1 < word.length && oneCharacterPhoneme !== undefined) {
      phonemes.push(oneCharacterPhoneme);
      return index + 1;
    }
    phonemes.push(classicalPhonemes[ch] ?? "");
    return index;
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

  private processClassicalCharacter(
    ch: string,
    index: number,
    word: string[],
    isVowel: (index: number) => boolean,
    phonemes: string[],
  ): number {
    switch (ch) {
      case "h": {
        this.classifyClassicalH(index, word, isVowel, phonemes);
        break;
      }
      case "i": {
        this.classifyClassicalI(ch, index, isVowel, phonemes);
        break;
      }
      case "j": {
        this.classifyClassicalJ(ch, index, word, isVowel, phonemes);
        break;
      }
      case "n": {
        this.classifyClassicalN(ch, index, word, isVowel, phonemes);
        break;
      }
      default: {
        return this.processClassicalDefaultCharacter(ch, index, word, phonemes);
      }
    }
    return index;
  }

  private processClassicalDefaultCharacter(
    ch: string,
    index: number,
    word: string[],
    phonemes: string[],
  ): number {
    if (Object.hasOwn(classicalDevocalize, ch)) {
      this.lookupClassicalDevocalizeCharacter(ch, index, word, phonemes);
      return index;
    }
    return this.lookupMultiCharacterPhoneme(ch, index, word, phonemes);
  }

  private processEcclesiasticalCharacter(
    ch: string,
    index: number,
    word: string[],
    wordString: string,
    isVowel: (letter: string) => boolean,
    phonemes: (string | string[][])[],
  ): number {
    switch (ch) {
      case "c": {
        return this.classifyEcclesiasticalC(index, word, phonemes);
      }
      case "g": {
        return this.classifyEcclesiasticalG(index, word, phonemes);
      }
      case "h": {
        this.classifyEcclesiasticalH(index, wordString, word, phonemes);
        break;
      }
      case "i": {
        this.classifyEcclesiasticalI(index, word, isVowel, phonemes);
        break;
      }
      case "s": {
        return this.classifyEcclesiasticalS(index, word, isVowel, phonemes);
      }
      case "t": {
        this.classifyEcclesiasticalT(index, word, phonemes);
        break;
      }
      case "x": {
        return this.classifyEcclesiasticalX(index, word, isVowel, phonemes);
      }
      default: {
        return this.processEcclesiasticalDefaultCharacter(
          ch,
          index,
          word,
          phonemes,
        );
      }
    }
    return index;
  }

  private processEcclesiasticalDefaultCharacter(
    ch: string,
    index: number,
    word: string[],
    phonemes: (string | string[][])[],
  ): number {
    const nextCharacter = word[index + 1] ?? "";
    const twoCharacterKey = ch + nextCharacter;
    if (ecclesiasticalPhonemes[twoCharacterKey]) {
      phonemes.push(getStringPhoneme(ecclesiasticalPhonemes, twoCharacterKey));
      return index + 1;
    }
    phonemes.push(getStringPhoneme(ecclesiasticalPhonemes, ch));
    return index;
  }

  private updateVariantPronunciation(
    anchorText: string,
    pronunciationsText: string[],
    classical: Pronunciation,
    ecclesiastical: Pronunciation,
    vulgar: Pronunciation,
  ): void {
    if (anchorText.includes("Classical")) {
      _.assign(classical, this.parsePhonics(pronunciationsText));
    } else if (anchorText.includes("Ecclesiastical")) {
      _.assign(ecclesiastical, this.parsePhonics(pronunciationsText));
    } else if (anchorText.includes("Vulgar")) {
      _.assign(vulgar, this.parsePhonics(pronunciationsText));
    }
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
    const classical = this.buildDefaultPronunciation(
      "classical",
      this.getClassicalPhonemes(macronizedWord),
    );
    const ecclesiastical = this.buildDefaultPronunciation(
      "ecclesiastical",
      this.getEcclesiasticalPronunciations(macronizedWord)[0] ?? null,
    );
    const vulgar = this.buildDefaultPronunciation("vulgar", null);
    this.applyWiktionaryPronunciations(
      $,
      elt,
      classical,
      ecclesiastical,
      vulgar,
    );
    return [classical, ecclesiastical, vulgar];
  }
}
