import _ from "lodash";

import {
  classicalDevocalize,
  classicalPhonemes,
  ecclesiasticalPhonemes,
} from "./pronunciation.constants.js";

import type { Pronunciation } from "@monorepo/lexico-entities";
import type * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

/**
 * Classifies pronunciation phonemes for Classical and Ecclesiastical Latin.
 */
export class PronunciationClassifier {
  // 🔏 Public Methods

  private classifyClassicalH(args: {
    index: number;
    isVowel: (index: number) => boolean;
    phonemes: string[];
    word: string[];
  }): void {
    const { index, isVowel, phonemes } = args;
    if (
      index === 0 ||
      (isVowel(index + 1) && index - 1 >= 0 && args.word[index - 1] !== "r")
    ) {
      phonemes.push("H");
    }
  }

  private classifyClassicalI(args: {
    ch: string;
    index: number;
    isVowel: (index: number) => boolean;
    phonemes: string[];
  }): void {
    const { ch, index, isVowel, phonemes } = args;
    if (isVowel(index + 1) && (index === 0 || isVowel(index - 1)))
      phonemes.push("J");
    else phonemes.push(classicalPhonemes[ch] ?? "");
  }

  private classifyClassicalJ(args: {
    ch: string;
    index: number;
    isVowel: (index: number) => boolean;
    phonemes: string[];
    word: string[];
  }): void {
    const { ch, index, isVowel, phonemes, word } = args;
    if (
      !isVowel(index - 1) &&
      ["l", "m", "n", "q", "t"].includes(word[index - 1] ?? "")
    ) {
      phonemes.push("I");
    } else phonemes.push(classicalPhonemes[ch] ?? "");
  }

  private classifyClassicalN(args: {
    ch: string;
    index: number;
    isVowel: (index: number) => boolean;
    phonemes: string[];
    word: string[];
  }): void {
    const { ch, index, isVowel, phonemes, word } = args;
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
    let nextIndex = index;
    if (
      nextIndex + 1 < word.length &&
      this.isPalatalizedCConsonant(nextIndex, word)
    ) {
      phonemes.push("ch");
    } else if (nextIndex + 1 < word.length && word[nextIndex + 1] === "c") {
      phonemes.push("ch");
      nextIndex++;
    } else phonemes.push("k");
    return nextIndex;
  }

  private classifyEcclesiasticalG(
    index: number,
    word: string[],
    phonemes: (string | string[][])[],
  ): number {
    let nextIndex = index;
    if (
      nextIndex + 1 < word.length &&
      this.isPalatalizedGConsonant(nextIndex, word)
    ) {
      phonemes.push("dg");
    } else if (nextIndex + 1 < word.length && word[nextIndex + 1] === "g") {
      phonemes.push("dg");
      nextIndex++;
    } else phonemes.push("g");
    return nextIndex;
  }

  private classifyEcclesiasticalH(args: {
    index: number;
    phonemes: (string | string[][])[];
    word: string[];
    wordString: string;
  }): void {
    const { index, phonemes, word, wordString } = args;
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

  private classifyEcclesiasticalI(args: {
    index: number;
    isVowel: (letter: string) => boolean;
    phonemes: (string | string[][])[];
    word: string[];
  }): void {
    const { index, isVowel, phonemes, word } = args;
    if (this.isEcclesiasticalVocalI(index, word, isVowel)) phonemes.push("j");
    else phonemes.push(getStringPhoneme(ecclesiasticalPhonemes, "i"));
  }

  private classifyEcclesiasticalS(args: {
    index: number;
    isVowel: (letter: string) => boolean;
    phonemes: (string | string[][])[];
    word: string[];
  }): number {
    const { isVowel, phonemes, word } = args;
    let nextIndex = args.index;
    if (this.isBetweenVowels(nextIndex, word, isVowel)) {
      phonemes.push("z");
    } else if (this.isScConsonant(nextIndex, word)) {
      phonemes.push("sh");
      nextIndex++;
    } else phonemes.push("s");
    if (word[nextIndex + 1] === "s") nextIndex++;
    return nextIndex;
  }

  private classifyEcclesiasticalT(
    index: number,
    word: string[],
    phonemes: (string | string[][])[],
  ): void {
    if (word[index + 1] === "i") phonemes.push("ts");
    else phonemes.push("t");
  }

  private classifyEcclesiasticalX(args: {
    index: number;
    isVowel: (letter: string) => boolean;
    phonemes: (string | string[][])[];
    word: string[];
  }): number {
    const { isVowel, phonemes, word } = args;
    let nextIndex = args.index;
    if (this.isBetweenVowels(nextIndex, word, isVowel)) {
      phonemes.push("gz");
    } else if (this.isScConsonant(nextIndex, word)) {
      phonemes.push("ksh");
      nextIndex++;
    } else phonemes.push("ks");
    return nextIndex;
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

  private lookupClassicalDevocalizeCharacter(args: {
    ch: string;
    index: number;
    phonemes: string[];
    word: string[];
  }): void {
    const { ch, index, phonemes, word } = args;
    const nextCharacter = word[index + 1] ?? "";
    if (
      index + 1 < word.length &&
      ["c", "f", "k", "p", "q", "s", "t"].includes(nextCharacter)
    ) {
      phonemes.push(classicalDevocalize[ch] ?? "");
    } else phonemes.push(classicalPhonemes[ch] ?? "");
  }

  private lookupMultiCharacterPhoneme(args: {
    ch: string;
    index: number;
    phonemes: string[];
    word: string[];
  }): number {
    const { ch, index, phonemes, word } = args;
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

  private processClassicalDefaultCharacter(args: {
    ch: string;
    index: number;
    phonemes: string[];
    word: string[];
  }): number {
    const { ch, index, phonemes, word } = args;
    if (Object.hasOwn(classicalDevocalize, ch)) {
      this.lookupClassicalDevocalizeCharacter({ ch, index, phonemes, word });
      return index;
    }
    return this.lookupMultiCharacterPhoneme({ ch, index, phonemes, word });
  }

  private processEcclesiasticalDefaultCharacter(args: {
    ch: string;
    index: number;
    phonemes: (string | string[][])[];
    word: string[];
  }): number {
    const { ch, index, phonemes, word } = args;
    const nextCharacter = word[index + 1] ?? "";
    const twoCharacterKey = ch + nextCharacter;
    if (ecclesiasticalPhonemes[twoCharacterKey]) {
      phonemes.push(getStringPhoneme(ecclesiasticalPhonemes, twoCharacterKey));
      return index + 1;
    }
    phonemes.push(getStringPhoneme(ecclesiasticalPhonemes, ch));
    return index;
  }

  private updateVariantPronunciation(args: {
    anchorText: string;
    classical: Pronunciation;
    ecclesiastical: Pronunciation;
    pronunciationsText: string[];
    vulgar: Pronunciation;
  }): void {
    const {
      anchorText,
      classical,
      ecclesiastical,
      pronunciationsText,
      vulgar,
    } = args;
    if (anchorText.includes("Classical")) {
      _.assign(classical, this.parsePhonics(pronunciationsText));
    } else if (anchorText.includes("Ecclesiastical")) {
      _.assign(ecclesiastical, this.parsePhonics(pronunciationsText));
    } else if (anchorText.includes("Vulgar")) {
      _.assign(vulgar, this.parsePhonics(pronunciationsText));
    }
  }

  /**
   * Applies Wiktionary IPA pronunciations onto pronunciation variants.
   */
  public applyWiktionaryPronunciations(args: {
    $: cheerio.CheerioAPI;
    classical: Pronunciation;
    ecclesiastical: Pronunciation;
    elt: AnyNode;
    vulgar: Pronunciation;
  }): void {
    const { $, classical, ecclesiastical, elt, vulgar } = args;
    const pronunciationHeader = $(elt)
      .prevAll("div.mw-heading")
      .filter((_index: number, element: AnyNode) =>
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
      this.updateVariantPronunciation({
        anchorText,
        classical,
        ecclesiastical,
        pronunciationsText,
        vulgar,
      });
    }
  }

  /**
   * Processes one classical-character position and returns the next index.
   */
  public processClassicalCharacter(args: {
    ch: string;
    index: number;
    isVowel: (index: number) => boolean;
    phonemes: string[];
    word: string[];
  }): number {
    const { ch, isVowel, phonemes, word } = args;
    const index = args.index;
    switch (ch) {
      case "h": {
        this.classifyClassicalH({ index, isVowel, phonemes, word });
        break;
      }
      case "i": {
        this.classifyClassicalI({ ch, index, isVowel, phonemes });
        break;
      }
      case "j": {
        this.classifyClassicalJ({ ch, index, isVowel, phonemes, word });
        break;
      }
      case "n": {
        this.classifyClassicalN({ ch, index, isVowel, phonemes, word });
        break;
      }
      default: {
        return this.processClassicalDefaultCharacter({
          ch,
          index,
          phonemes,
          word,
        });
      }
    }
    return index;
  }

  /**
   * Processes one ecclesiastical-character position and returns the next index.
   */
  public processEcclesiasticalCharacter(args: {
    ch: string;
    index: number;
    isVowel: (letter: string) => boolean;
    phonemes: (string | string[][])[];
    word: string[];
    wordString: string;
  }): number {
    const { ch, isVowel, phonemes, word, wordString } = args;
    const index = args.index;
    switch (ch) {
      case "c": {
        return this.classifyEcclesiasticalC(index, word, phonemes);
      }
      case "g": {
        return this.classifyEcclesiasticalG(index, word, phonemes);
      }
      case "h": {
        this.classifyEcclesiasticalH({ index, phonemes, word, wordString });
        break;
      }
      case "i": {
        this.classifyEcclesiasticalI({ index, isVowel, phonemes, word });
        break;
      }
      case "s": {
        return this.classifyEcclesiasticalS({ index, isVowel, phonemes, word });
      }
      case "t": {
        this.classifyEcclesiasticalT(index, word, phonemes);
        break;
      }
      case "x": {
        return this.classifyEcclesiasticalX({ index, isVowel, phonemes, word });
      }
      default: {
        return this.processEcclesiasticalDefaultCharacter({
          ch,
          index,
          phonemes,
          word,
        });
      }
    }
    return index;
  }
}

function getStringPhoneme(
  map: Record<string, string | string[][]>,
  key: string,
): string {
  const value = map[key];
  return typeof value === "string" ? value : "";
}
