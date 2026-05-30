/**
 * Converts a macronized Latin word to its Classical Latin phonemes string.
 */
export function getClassicalPhonemes(wordString: string): string {
  for (const [pattern, replacement] of Object.entries(substitutions)) {
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
        if (i === 0 || (isVowel(i + 1) && i - 1 >= 0 && word[i - 1] !== "r")) {
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
        if (Object.prototype.hasOwnProperty.call(devocalize, ch)) {
          if (
            i + 1 < word.length &&
            ["c", "f", "k", "p", "q", "s", "t"].includes(word[i + 1] ?? "")
          ) {
            phonemes.push(devocalize[ch] ?? "");
          } else phonemes.push(classicalPhonemes[ch] ?? "");
        } else if (
          i + 2 < word.length &&
          classicalPhonemes[ch + (word[i + 1] ?? "") + (word[i + 2] ?? "")]
        ) {
          phonemes.push(
            classicalPhonemes[ch + (word[++i] ?? "") + (word[++i] ?? "")] ?? "",
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

const substitutions: Record<string, string> = {
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

const devocalize: Record<string, string> = { b: "p", d: "t", g: "k", z: "s" };
