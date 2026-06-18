import {
  formCaseValues,
  formGerundCaseValues,
  formMoodValues,
  formNonFiniteTenseValues,
  formNumberValues,
  formPersonValues,
  formSupineCaseValues,
  formTenseValues,
  formVoiceValues,
  type PartOfSpeech,
  partOfSpeechEnumValues,
} from "@monorepo/lexico-entities";

// ♟️ Constants

export const adjectivalPartOfSpeechSet: ReadonlySet<PartOfSpeech> =
  new Set<PartOfSpeech>(["adjective", "numeral", "participle", "suffix"]);

export const nominalPartOfSpeechSet: ReadonlySet<PartOfSpeech> =
  new Set<PartOfSpeech>(["determiner", "noun", "pronoun", "properNoun"]);

export const unsupportedPartOfSpeechSet: ReadonlySet<PartOfSpeech> =
  new Set<PartOfSpeech>([
    "abbreviation",
    "circumfix",
    "conjunction",
    "idiom",
    "inflection",
    "interfix",
    "interjection",
    "particle",
    "phrase",
    "prefix",
    "preposition",
    "proverb",
  ]);

export const formCaseValueList = normalizeStringArray(formCaseValues);
export const formGerundCaseValueList =
  normalizeStringArray(formGerundCaseValues);
export const formMoodValueList = normalizeStringArray(formMoodValues);
export const formNonFiniteTenseValueList = normalizeStringArray(
  formNonFiniteTenseValues,
);
export const formNumberValueList = normalizeStringArray(formNumberValues);
export const formPersonValueList = normalizeStringArray(formPersonValues);
export const formSupineCaseValueList =
  normalizeStringArray(formSupineCaseValues);
export const formTenseValueList = normalizeStringArray(formTenseValues);
export const formVoiceValueList = normalizeStringArray(formVoiceValues);
export const partOfSpeechValueList = normalizeStringArray(
  partOfSpeechEnumValues,
);

/**
 * Normalizes mixed unknown arrays into a string-only list.
 */
function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}
