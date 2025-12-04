import { createServerFn } from "@tanstack/react-start";

import { getSupabaseServerClient } from "./supabase-server";

import type { EntryFull, EntrySearchResult } from "./types";

// Helper to detect if query is likely Latin
function isLatinQuery(query: string): boolean {
  // Latin text typically doesn't have common English-only characters/patterns
  // Check for Latin diacritics or common Latin word patterns
  const latinPattern = /[āēīōūȳĀĒĪŌŪȲ]/;
  if (latinPattern.test(query)) return true;

  // Common English words that suggest English search
  const englishWords = [
    "the",
    "and",
    "for",
    "with",
    "from",
    "that",
    "this",
    "have",
    "what",
  ];
  const lowerQuery = query.toLowerCase();
  if (englishWords.some((word) => lowerQuery.includes(word))) return false;

  // Default to Latin for single words
  return true;
}

interface SearchInput {
  query: string;
  language?: "auto" | "latin" | "english";
}

export const searchEntries = createServerFn({ method: "GET" })
  .inputValidator((data: SearchInput) => data)
  .handler(async ({ data }): Promise<EntrySearchResult[]> => {
    const supabase = getSupabaseServerClient();
    const language = data.language ?? "auto";

    const isLatin =
      language === "latin" || (language === "auto" && isLatinQuery(data.query));
    const searchFunction = isLatin ? "search_latin" : "search_english";

    const { data: results, error } = await supabase.rpc(searchFunction, {
      query: data.query.toLowerCase().trim(),
    });

    if (error) {
      console.error("Search error:", error);
      throw new Error(`Search failed: ${error.message}`);
    }

    return results as EntrySearchResult[];
  });

interface GetEntryInput {
  id: string;
}

export const getEntry = createServerFn({ method: "GET" })
  .inputValidator((data: GetEntryInput) => data)
  .handler(async ({ data }): Promise<EntryFull | null> => {
    const supabase = getSupabaseServerClient();

    const { data: entry, error } = await supabase
      .from("entries")
      .select(
        `
        id,
        principal_parts,
        part_of_speech,
        inflection,
        pronunciation,
        forms,
        etymology
      `,
      )
      .eq("id", data.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - entry not found
        return null;
      }
      console.error("Get entry error:", error);
      throw new Error(`Failed to fetch entry: ${error.message}`);
    }

    // Fetch translations separately from the translations table
    const { data: translations, error: transError } = await supabase
      .from("translations")
      .select("translation")
      .eq("entry_id", data.id);

    if (transError) {
      console.error("Get translations error:", transError);
    }

    return {
      ...entry,
      translations: translations?.map((t) => t.translation) ?? [],
    } as EntryFull;
  });
