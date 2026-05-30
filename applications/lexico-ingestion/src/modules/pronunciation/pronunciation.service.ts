import { Pronunciation, PronunciationParts } from "@monorepo/lexico-entities";
import { Injectable } from "@nestjs/common";
import type { CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";

// ♟️ Classical Latin phoneme maps
const classicalPhonemes: Record<string, string> = {
  b: "B",
  c: "K",
  d: "D",
  f: "F",
  g: "G",
  j: "J",
  k: "K",
  l: "L",
  m: "M",
  n: "N",
  p: "P",
  q: "KW",
  r: "R",
  s: "S",
  t: "T",
  v: "W",
  w: "W",
  x: "KS",
  z: "Z",
  a: "A",
  ā: "AA",
  e: "E",
  ē: "EE",
  i: "I",
  ī: "II",
  o: "O",
  ō: "OO",
  u: "U",
  ū: "UU",
  y: "Y",
  ȳ: "YY",
  ae: "AE",
  oe: "OE",
  au: "AU",
  eu: "EU",
  " ": "_",
  ".": "_",
  "-": "",
};

const classicalSubstitutions: Record<string, string> = {
  iace: "jace",
  iacē: "jacē",
  iact: "jact",
  iacu: "jacu",
  iect: "ject",
  ien: "jen",
  ier: "jer",
  io$: "jo",
  iud: "jud",
  iue: "jue",
  iug: "jug",
  iun: "jun",
  iur: "jur",
  iut: "jut",
  iuv: "juv",
  iūd: "jūd",
  iūe: "jūe",
  iūg: "jūg",
  iūn: "jūn",
  iūr: "jūr",
  iūt: "jūt",
  iūv: "jūv",
  qu: "q",
  th: "t",
  ph: "p",
  ch: "c",
  xs: "x",
};

const classicalDevocalize: Record<string, string> = {
  b: "p",
  d: "t",
  g: "k",
  z: "s",
};

// ♟️ Ecclesiastical Latin phoneme map
const ecclesiasticalPhonemes: Record<string, string | string[][]> = {
  b: "b",
  d: "d",
  f: "f",
  gn: "gn",
  k: "k",
  l: "l",
  m: "m",
  n: "n",
  ng: [["ng", "g"]],
  nc: [["ng", "k"]],
  nq: [["ng", "q"]],
  nx: [["ng", "ks"]],
  p: "p",
  ph: "f",
  qu: "kw",
  r: "r",
  v: "v",
  z: "dz",
  a: "a:",
  ā: "a:",
  e: "e:",
  ē: "e:",
  i: "i:",
  ī: "i:",
  o: "o:",
  ō: "o:",
  u: "u:",
  ū: "u:",
  y: "y:",
  ȳ: "y:",
  ae: "e",
  oe: "e",
  au: "au",
  eu: "eu",
  ei: "ei",
  ui: "ui",
  " ": "_",
};

/**
 * Parses Classical and Ecclesiastical Latin pronunciation from
 * a macronized word and Wiktionary HTML element context.
 */
@Injectable()
export class PronunciationService {
  // 🏗️ Dependency Injection
  constructor() {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

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
          if (Object.prototype.hasOwnProperty.call(classicalDevocalize, ch)) {
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
          } else phonemes.push(ecclesiasticalPhonemes["i"] as string);
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
              ecclesiasticalPhonemes[ch + (word[++i] ?? "")] as string,
            );
          } else {
            phonemes.push(ecclesiasticalPhonemes[ch] as string);
          }
        }
      }
    }

    return phonemes;
  }

  private getEcclesiasticalPronunciations(word: string): string[] {
    return this.buildPronunciations(this.getEcclesiasticalPhonemes(word));
  }

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
      } else {
        build([...prev, phoneme] as (string | string[][])[], [...rest]);
      }
    }

    build([], phonemes);
    return pronunciations;
  }

  private parsePhonics(pronunciations: string[]): PronunciationParts {
    const parsed = new PronunciationParts();
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
   * Parses pronunciation data from the Wiktionary HTML element context.
   * Requires `macronizedWord` to already be resolved (call `parsePrincipalParts`
   * before this function).
   */
  parse($: CheerioAPI, elt: AnyNode, macronizedWord: string): Pronunciation {
    const pronunciation = new Pronunciation();
    pronunciation.classical = {
      phonemes: this.getClassicalPhonemes(macronizedWord),
      phonemic: "",
      phonetic: "",
    };
    pronunciation.ecclesiastical = {
      phonemes: this.getEcclesiasticalPronunciations(macronizedWord)[0] ?? "",
      phonemic: "",
      phonetic: "",
    };
    pronunciation.vulgar = { phonemes: "", phonemic: "", phonetic: "" };

    const pronunciationHeader = $(elt)
      .prevAll(":header:contains('Pronunciation')")
      .first();
    if (pronunciationHeader.length <= 0) return pronunciation;

    for (const pr of pronunciationHeader.next("ul").children()) {
      if (/^audio/i.test($(pr).text())) continue;

      const pronunciationsText = $(pr)
        .text()
        .split("IPA(key):")[1]
        ?.split(", ");
      if (!pronunciationsText) continue;

      const anchorText = $(pr).find("a").text();
      if (anchorText.includes("Classical")) {
        Object.assign(
          pronunciation.classical,
          this.parsePhonics(pronunciationsText),
        );
      } else if (anchorText.includes("Ecclesiastical")) {
        Object.assign(
          pronunciation.ecclesiastical,
          this.parsePhonics(pronunciationsText),
        );
      } else if (anchorText.includes("Vulgar")) {
        Object.assign(
          pronunciation.vulgar,
          this.parsePhonics(pronunciationsText),
        );
      }
    }

    return pronunciation;
  }
}
