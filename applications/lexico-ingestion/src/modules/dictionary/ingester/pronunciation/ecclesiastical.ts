/**
 * Converts a macronized Latin word to its Ecclesiastical Latin phoneme variants.
 */
export function getEcclesiasticalPhonemes(
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
            ["ae", "oe"].includes((word[i + 1] ?? "") + (word[i + 2] ?? ""))) ||
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
        } else phonemes.push(ecclesiasticalPhonemes["i"] ?? "");

        break;
      }
      case "s": {
        if (i > 0 && isVowel(word[i - 1] ?? "") && isVowel(word[i + 1] ?? "")) {
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
        if (i > 0 && isVowel(word[i - 1] ?? "") && isVowel(word[i + 1] ?? "")) {
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
          phonemes.push(ecclesiasticalPhonemes[ch + (word[++i] ?? "")] ?? "");
        } else {
          phonemes.push(ecclesiasticalPhonemes[ch] ?? "");
        }
      }
    }
  }

  return phonemes;
}

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
