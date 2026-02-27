import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env["SUPABASE_URL"] as string | undefined;
const supabaseAnonKey = import.meta.env["SUPABASE_ANON_KEY"] as
  | string
  | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY",
  );
}

/**
 * Typed Supabase client for Lexico database
 *
 * Usage:
 * ```ts
 * import { supabase } from '~/lib/supabase';
 *
 * // Query entries with full type safety
 * const { data } = await supabase.from('entries').select('*');
 *
 * // Use RPC functions
 * const { data } = await supabase.rpc('search_latin', { query: 'amo' });
 * ```
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Re-export types for convenience
export type { User, Session } from "@supabase/supabase-js";
export type { Database } from "./database.types";
export {
  type Author,
  type Bookmark,
  type Book,
  type Entry,
  type Line,
  type LineWord,
  type PartOfSpeech,
  type SearchResult,
  type Text,
  type Translation,
  type TranslationWord,
  type UserText,
  type Word,
} from "./database.types";
