import { PronunciationParts } from "@monorepo/lexico-entities";

import { getEcclesiasticalPhonemes } from "./ecclesiastical.js";

function phonemesToPronunciations(phonemes: (string | string[][])[]): string[] {
  const pronunciations: string[] = [];

  function buildPronunciations(
    prev: (string | string[][])[],
    next: (string | string[][])[],
  ): void {
    if (next.length === 0) {
      pronunciations.push(prev.join(" "));
      return;
    }
    const phoneme = next.shift();
    if (Array.isArray(phoneme)) {
      for (const option of phoneme) {
        if (Array.isArray(option)) {
          buildPronunciations([...prev, ...option], [...next]);
        } else buildPronunciations([...prev, option], [...next]);
      }
    } else {
      buildPronunciations([...prev, phoneme] as (string | string[][])[], [
        ...next,
      ]);
    }
  }

  buildPronunciations([], phonemes);
  return pronunciations;
}

/**
 *
 */
export function getEcclesiasticalPronunciations(word: string): string[] {
  return phonemesToPronunciations(getEcclesiasticalPhonemes(word));
}

/**
 *
 */
export function parsePhonics(pronunciations: string[]): PronunciationParts {
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
