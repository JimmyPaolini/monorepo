/**
 * Part of speech classification for lexical entries.
 */
export type PartOfSpeech =
  | "adjective"
  | "adverb"
  | "conjunction"
  | "interjection"
  | "noun"
  | "numeral"
  | "preposition"
  | "pronoun"
  | "properNoun"
  | "suffix"
  | "verb";

/**
 * Principal parts of a lexical entry (e.g., nominative/genitive for nouns).
 */
export interface PrincipalParts {
  /** Present tense stem (verbs) */
  present?: string;
  /** Infinitive form (verbs) */
  infinitive?: string;
  /** Perfect tense stem (verbs) */
  perfect?: string;
  /** Supine form (verbs) */
  supine?: string;
  /** Nominative singular (nouns/adjectives) */
  nominative?: string;
  /** Genitive singular (nouns/adjectives) */
  genitive?: string;
  /** Additional principal parts */
  [key: string]: string | undefined;
}

/**
 * Pronunciation data for a specific Latin dialect.
 */
export interface PronunciationDialect {
  /** Phoneme representation */
  phonemes?: string;
  /** Phonemic transcription */
  phonemic?: string;
  /** Phonetic transcription (IPA) */
  phonetic?: string;
}

/**
 * Pronunciation data for both Classical and Ecclesiastical Latin.
 */
export interface Pronunciation {
  /** Classical Latin pronunciation */
  classical?: PronunciationDialect;
  /** Ecclesiastical Latin pronunciation */
  ecclesiastical?: PronunciationDialect;
}

/**
 * Complete verb conjugation forms organized by mood, tense, voice.
 */
export interface VerbForms {
  indicative?: {
    active?: TenseGroup;
    passive?: TenseGroup;
  };
  subjunctive?: {
    active?: SubjunctiveTenses;
    passive?: SubjunctiveTenses;
  };
  imperative?: {
    active?: ImperativeTenses;
    passive?: ImperativeTenses;
  };
  nonFinite?: {
    infinitive?: InfinitiveGroup;
    participle?: ParticipleGroup;
  };
  verbalNoun?: {
    gerund?: GerundForms;
    supine?: SupineForms;
  };
}

/**
 * Tense group for indicative forms (active or passive voice).
 */
interface TenseGroup {
  present?: PersonNumberGroup;
  imperfect?: PersonNumberGroup;
  future?: PersonNumberGroup;
  perfect?: PersonNumberGroup;
  pluperfect?: PersonNumberGroup;
  futurePerfect?: PersonNumberGroup;
}

/**
 * Tense group for subjunctive forms.
 */
interface SubjunctiveTenses {
  present?: PersonNumberGroup;
  imperfect?: PersonNumberGroup;
  perfect?: PersonNumberGroup;
  pluperfect?: PersonNumberGroup;
}

/**
 * Tense group for imperative forms.
 */
interface ImperativeTenses {
  present?: ImperativePersonGroup;
  future?: ImperativePersonGroup;
}

/**
 * Person-number grouping for finite verb forms.
 */
interface PersonNumberGroup {
  singular?: PersonGroup;
  plural?: PersonGroup;
}

/**
 * Person grouping (first, second, third).
 */
interface PersonGroup {
  first?: string[];
  second?: string[];
  third?: string[];
}

/**
 * Person grouping for imperative forms (second and third person only).
 */
interface ImperativePersonGroup {
  singular?: { second?: string[]; third?: string[] };
  plural?: { second?: string[]; third?: string[] };
}

/**
 * Infinitive forms by voice and tense.
 */
interface InfinitiveGroup {
  active?: { present?: string[]; perfect?: string[]; future?: string[] };
  passive?: { present?: string[]; perfect?: string[]; future?: string[] };
}

/**
 * Participle forms by voice and tense.
 */
interface ParticipleGroup {
  active?: { present?: string[]; future?: string[] };
  passive?: { perfect?: string[]; future?: string[] };
}

/**
 * Gerund forms by case.
 */
interface GerundForms {
  genitive?: string[];
  dative?: string[];
  accusative?: string[];
  ablative?: string[];
}

/**
 * Supine forms by case.
 */
interface SupineForms {
  accusative?: string[];
  ablative?: string[];
}

/**
 * Noun declension forms organized by case and number.
 */
export interface NounForms {
  nominative?: NumberGroup;
  genitive?: NumberGroup;
  dative?: NumberGroup;
  accusative?: NumberGroup;
  ablative?: NumberGroup;
  vocative?: NumberGroup;
  locative?: NumberGroup;
}

/**
 * Number grouping (singular and plural).
 */
export interface NumberGroup {
  singular?: string[];
  plural?: string[];
}

/**
 * Adjective declension forms organized by gender.
 */
export interface AdjectiveForms {
  masculine?: NounForms;
  feminine?: NounForms;
  neuter?: NounForms;
}

/**
 * Union type for all form structures.
 */
export type Forms =
  | VerbForms
  | NounForms
  | AdjectiveForms
  | Record<string, unknown>;

/**
 * Entry search result from Supabase RPC search function.
 */
/* eslint-disable @typescript-eslint/naming-convention */
export interface EntrySearchResult {
  id: string;
  principal_parts: PrincipalParts;
  part_of_speech: PartOfSpeech;
  inflection: Record<string, object>;
  pronunciation: Pronunciation;
  forms: Forms;
  etymology: string | null;
  translations: string[];
  words: string[];
  similarities: number[];
}

/**
 * Full entry data from database (for individual entry pages).
 */
export interface EntryFull {
  id: string;
  principal_parts: PrincipalParts;
  part_of_speech: PartOfSpeech;
  inflection: Record<string, object>;
  pronunciation: Pronunciation;
  forms: Forms;
  etymology: string | null;
  translations: string[];
}
/* eslint-enable @typescript-eslint/naming-convention */
