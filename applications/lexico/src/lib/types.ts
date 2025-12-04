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

// Pronunciation info
export interface Pronunciation {
  classical?: string;
  ecclesiastical?: string;
}

// Entry search result from Supabase RPC
// Using snake_case to match Supabase column names
/* eslint-disable @typescript-eslint/naming-convention */
export interface EntrySearchResult {
  id: string;
  principal_parts: PrincipalParts;
  part_of_speech: PartOfSpeech;
  inflection: Record<string, unknown>;
  pronunciation: Pronunciation;
  forms: Record<string, unknown>;
  translations: string[];
  words: string[];
  similarities: number[];
}
/* eslint-enable @typescript-eslint/naming-convention */
