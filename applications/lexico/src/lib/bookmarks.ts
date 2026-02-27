import { createServerFn } from "@tanstack/react-start";

import { getSupabaseServerClient } from "./supabase-server";

import type { PartOfSpeech, PrincipalParts } from "./types";

/**
 * Represents a bookmarked lexical entry from the database.
 */
/* eslint-disable @typescript-eslint/naming-convention */
/**
 *
 */
export interface BookmarkedEntry {
  /** Entry UUID */
  id: string;
  /** Principal parts of the entry */
  principal_parts: PrincipalParts;
  /** Part of speech classification */
  part_of_speech: PartOfSpeech;
  /** Inflection metadata */
  inflection: Record<string, object>;
  /** Translation strings */
  translations: string[];
}
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Get all bookmarked entries for the current user
 */
export const getBookmarks = createServerFn({ method: "GET" }).handler(
  async (): Promise<BookmarkedEntry[]> => {
    const supabase = getSupabaseServerClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    // Get bookmarked entry IDs
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from("bookmarks")
      .select("entry_id")
      .eq("user_id", user.id);

    if (bookmarksError) {
      console.error("Error fetching bookmarks:", bookmarksError);
      return [];
    }

    if (bookmarks.length === 0) {
      return [];
    }

    const entryIds = bookmarks.map((b) => b.entry_id);

    // Get entry details
    const { data: entries, error: entriesError } = await supabase
      .from("entries")
      .select("id, principal_parts, part_of_speech, inflection")
      .in("id", entryIds);

    if (entriesError) {
      console.error("Error fetching entries:", entriesError);
      return [];
    }

    // Get translations for each entry
    const { data: translations, error: transError } = await supabase
      .from("translations")
      .select("entry_id, translation")
      .in("entry_id", entryIds);

    if (transError) {
      console.error("Error fetching translations:", transError);
    }

    // Group translations by entry_id
    const translationsByEntry: Record<string, string[]> = {};
    for (const t of translations ?? []) {
      const entryId = t.entry_id;
      if (!entryId) continue;
      if (!translationsByEntry[entryId]) {
        translationsByEntry[entryId] = [];
      }
      if (t.translation) {
        translationsByEntry[entryId].push(t.translation);
      }
    }

    // Combine entries with translations
    return entries.map((entry) => ({
      ...entry,
      translations: translationsByEntry[entry.id] ?? [],
    })) as BookmarkedEntry[];
  },
);

/**
 * Check if an entry is bookmarked by the current user
 */
export const isBookmarked = createServerFn({ method: "GET" })
  .inputValidator((data: { entryId: string }) => data)
  .handler(async ({ data }): Promise<boolean> => {
    const supabase = getSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data: bookmark } = await supabase
      .from("bookmarks")
      .select("entry_id")
      .eq("entry_id", data.entryId)
      .eq("user_id", user.id)
      .single();

    return Boolean(bookmark);
  });

/**
 * Add a bookmark for the current user
 */
export const addBookmark = createServerFn({ method: "POST" })
  .inputValidator((data: { entryId: string }) => data)
  .handler(
    async ({ data }): Promise<{ success: boolean; error: string | null }> => {
      const supabase = getSupabaseServerClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: "Not authenticated" };
      }

      const { error } = await supabase
        .from("bookmarks")
        .insert({ entry_id: data.entryId, user_id: user.id });

      if (error) {
        // Ignore duplicate key errors (already bookmarked)
        if (error.code === "23505") {
          return { success: true, error: null };
        }
        console.error("Error adding bookmark:", error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    },
  );

/**
 * Remove a bookmark for the current user
 */
export const removeBookmark = createServerFn({ method: "POST" })
  .inputValidator((data: { entryId: string }) => data)
  .handler(
    async ({ data }): Promise<{ success: boolean; error: string | null }> => {
      const supabase = getSupabaseServerClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: "Not authenticated" };
      }

      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("entry_id", data.entryId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error removing bookmark:", error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    },
  );

/**
 * Toggle bookmark status for an entry
 */
export const toggleBookmark = createServerFn({ method: "POST" })
  .inputValidator((data: { entryId: string }) => data)
  .handler(
    async ({
      data,
    }): Promise<{
      success: boolean;
      bookmarked: boolean;
      error: string | null;
    }> => {
      const supabase = getSupabaseServerClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          bookmarked: false,
          error: "Not authenticated",
        };
      }

      // Check if already bookmarked
      const { data: existing } = await supabase
        .from("bookmarks")
        .select("entry_id")
        .eq("entry_id", data.entryId)
        .eq("user_id", user.id)
        .single();

      if (existing) {
        // Remove bookmark
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("entry_id", data.entryId)
          .eq("user_id", user.id);

        if (error) {
          return { success: false, bookmarked: true, error: error.message };
        }
        return { success: true, bookmarked: false, error: null };
      } else {
        // Add bookmark
        const { error } = await supabase
          .from("bookmarks")
          .insert({ entry_id: data.entryId, user_id: user.id });

        if (error) {
          return { success: false, bookmarked: false, error: error.message };
        }
        return { success: true, bookmarked: true, error: null };
      }
    },
  );
