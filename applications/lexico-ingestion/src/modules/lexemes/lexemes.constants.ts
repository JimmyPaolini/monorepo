// ♟️ Constants

import { partOfSpeechValues } from "@monorepo/lexico-entities";

export const skipPOS = new Set<string>(["letter"]);
export const validPOS = new Set<string>(partOfSpeechValues);

export const translationSkipRegex =
  /(alternative)|(alternate)|(abbreviation)|(initialism)|(archaic)|(synonym)|(clipping)|(spelling)/i;
