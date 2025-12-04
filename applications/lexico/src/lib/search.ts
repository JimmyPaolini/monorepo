import { createServerFn } from "@tanstack/react-start";

import { getSupabaseServerClient } from "./supabase-server";

import type { EntrySearchResult } from "./types";

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
