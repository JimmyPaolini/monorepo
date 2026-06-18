// ♟️ Constants

import { partOfSpeechEnumValues } from "@monorepo/lexico-entities";

export const skipPOS = new Set<string>(["letter"]);
export const validPOS = new Set<string>(partOfSpeechEnumValues);
