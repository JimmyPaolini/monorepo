// Part of speech enum matching Supabase
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

// Principal parts structure
export interface PrincipalParts {
  // Verbs typically have 4 principal parts
  present?: string;
  infinitive?: string;
  perfect?: string;
  supine?: string;
  // Nouns/Adjectives have nominative and genitive
  nominative?: string;
  genitive?: string;
  // Generic parts array for flexibility
  [key: string]: string | undefined;
}

// Pronunciation info - each dialect has phonetic representations
export interface PronunciationDialect {
  phonemes?: string;
  phonemic?: string;
  phonetic?: string;
}

export interface Pronunciation {
  classical?: PronunciationDialect;
  ecclesiastical?: PronunciationDialect;
}

// Verb forms structure
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

interface TenseGroup {
  present?: PersonNumberGroup;
  imperfect?: PersonNumberGroup;
  future?: PersonNumberGroup;
  perfect?: PersonNumberGroup;
  pluperfect?: PersonNumberGroup;
  futurePerfect?: PersonNumberGroup;
}

interface SubjunctiveTenses {
  present?: PersonNumberGroup;
  imperfect?: PersonNumberGroup;
  perfect?: PersonNumberGroup;
  pluperfect?: PersonNumberGroup;
}

interface ImperativeTenses {
  present?: ImperativePersonGroup;
  future?: ImperativePersonGroup;
}

interface PersonNumberGroup {
  singular?: PersonGroup;
  plural?: PersonGroup;
}

interface PersonGroup {
  first?: string[];
  second?: string[];
  third?: string[];
}

interface ImperativePersonGroup {
  singular?: { second?: string[]; third?: string[] };
  plural?: { second?: string[]; third?: string[] };
}

interface InfinitiveGroup {
  active?: { present?: string[]; perfect?: string[]; future?: string[] };
  passive?: { present?: string[]; perfect?: string[]; future?: string[] };
}

interface ParticipleGroup {
  active?: { present?: string[]; future?: string[] };
  passive?: { perfect?: string[]; future?: string[] };
}

interface GerundForms {
  genitive?: string[];
  dative?: string[];
  accusative?: string[];
  ablative?: string[];
}

interface SupineForms {
  accusative?: string[];
  ablative?: string[];
}

// Noun forms structure
export interface NounForms {
  nominative?: NumberGroup;
  genitive?: NumberGroup;
  dative?: NumberGroup;
  accusative?: NumberGroup;
  ablative?: NumberGroup;
  vocative?: NumberGroup;
  locative?: NumberGroup;
}

export interface NumberGroup {
  singular?: string[];
  plural?: string[];
}

// Adjective forms structure
export interface AdjectiveForms {
  masculine?: NounForms;
  feminine?: NounForms;
  neuter?: NounForms;
}

// Union of all form types
export type Forms =
  | VerbForms
  | NounForms
  | AdjectiveForms
  | Record<string, unknown>;

// Entry search result from Supabase RPC
// Using snake_case to match Supabase column names
/* eslint-disable @typescript-eslint/naming-convention */
export interface EntrySearchResult {
  id: string;
  principal_parts: PrincipalParts;
  part_of_speech: PartOfSpeech;
  inflection: Record<string, unknown>;
  pronunciation: Pronunciation;
  forms: Forms;
  translations: string[];
  words: string[];
  similarities: number[];
}

// Full entry from database (for word page)
export interface EntryFull {
  id: string;
  principal_parts: PrincipalParts;
  part_of_speech: PartOfSpeech;
  inflection: Record<string, unknown>;
  pronunciation: Pronunciation;
  forms: Forms;
  etymology: string | null;
  translations: string[];
}
/* eslint-enable @typescript-eslint/naming-convention */
