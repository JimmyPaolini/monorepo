// ♟️ Constants

import { partOfSpeechValues } from "@monorepo/lexico-entities";

export const skipPOS = new Set<string>(["letter"]);
export const validPOS = new Set<string>(partOfSpeechValues);
