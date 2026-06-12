/**
 * Adjective declension forms organized by gender.
 */
export interface AdjectiveForms {
  feminine?: NounForms;
  masculine?: NounForms;
  neuter?: NounForms;
}

/**
 * Full entry data from database (for individual entry pages).
 */
export interface EntryFull {
  etymology: null | string;
  forms: Forms;
  id: string;
  inflection: Record<string, object>;

  part_of_speech: PartOfSpeech;

  principal_parts: PrincipalParts;
  pronunciation: Pronunciation;
  translations: string[];
}

/**
 *
 */
export interface EntrySearchResult {
  etymology: null | string;
  forms: Forms;
  id: string;
  inflection: Record<string, object>;

  part_of_speech: PartOfSpeech;

  principal_parts: PrincipalParts;
  pronunciation: Pronunciation;
  similarities: number[];
  translations: string[];
  words: string[];
}

/**
 * Union type for all form structures.
 */
export type Forms =
  | AdjectiveForms
  | NounForms
  | Record<string, unknown>
  | VerbForms;

/**
 * Noun declension forms organized by case and number.
 */
export interface NounForms {
  ablative?: NumberGroup;
  accusative?: NumberGroup;
  dative?: NumberGroup;
  genitive?: NumberGroup;
  locative?: NumberGroup;
  nominative?: NumberGroup;
  vocative?: NumberGroup;
}

/**
 * Number grouping (singular and plural).
 */
export interface NumberGroup {
  plural?: string[];
  singular?: string[];
}

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
  /** Additional principal parts */
  [key: string]: string | undefined;
  /** Genitive singular (nouns/adjectives) */
  genitive?: string;
  /** Infinitive form (verbs) */
  infinitive?: string;
  /** Nominative singular (nouns/adjectives) */
  nominative?: string;
  /** Perfect tense stem (verbs) */
  perfect?: string;
  /** Present tense stem (verbs) */
  present?: string;
  /** Supine form (verbs) */
  supine?: string;
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
 * Complete verb conjugation forms organized by mood, tense, voice.
 */
export interface VerbForms {
  imperative?: {
    active?: ImperativeTenses;
    passive?: ImperativeTenses;
  };
  indicative?: {
    active?: TenseGroup;
    passive?: TenseGroup;
  };
  nonFinite?: {
    infinitive?: InfinitiveGroup;
    participle?: ParticipleGroup;
  };
  subjunctive?: {
    active?: SubjunctiveTenses;
    passive?: SubjunctiveTenses;
  };
  verbalNoun?: {
    gerund?: GerundForms;
    supine?: SupineForms;
  };
}

/**
 * Gerund forms by case.
 */
interface GerundForms {
  ablative?: string[];
  accusative?: string[];
  dative?: string[];
  genitive?: string[];
}

/**
 * Person grouping for imperative forms (second and third person only).
 */
interface ImperativePersonGroup {
  plural?: { second?: string[]; third?: string[] };
  singular?: { second?: string[]; third?: string[] };
}

/**
 * Tense group for imperative forms.
 */
interface ImperativeTenses {
  future?: ImperativePersonGroup;
  present?: ImperativePersonGroup;
}

/**
 * Infinitive forms by voice and tense.
 */
interface InfinitiveGroup {
  active?: { future?: string[]; perfect?: string[]; present?: string[] };
  passive?: { future?: string[]; perfect?: string[]; present?: string[] };
}

/**
 * Participle forms by voice and tense.
 */
interface ParticipleGroup {
  active?: { future?: string[]; present?: string[] };
  passive?: { future?: string[]; perfect?: string[] };
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
 * Person-number grouping for finite verb forms.
 */
interface PersonNumberGroup {
  plural?: PersonGroup;
  singular?: PersonGroup;
}

/**
 * Tense group for subjunctive forms.
 */
interface SubjunctiveTenses {
  imperfect?: PersonNumberGroup;
  perfect?: PersonNumberGroup;
  pluperfect?: PersonNumberGroup;
  present?: PersonNumberGroup;
}

/**
 * Entry search result from Supabase RPC search function.
 */

/**
 * Supine forms by case.
 */
interface SupineForms {
  ablative?: string[];
  accusative?: string[];
}

/**
 * Tense group for indicative forms (active or passive voice).
 */
interface TenseGroup {
  future?: PersonNumberGroup;
  futurePerfect?: PersonNumberGroup;
  imperfect?: PersonNumberGroup;
  perfect?: PersonNumberGroup;
  pluperfect?: PersonNumberGroup;
  present?: PersonNumberGroup;
}
