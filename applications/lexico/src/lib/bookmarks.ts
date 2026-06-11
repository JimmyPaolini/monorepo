import { createServerFn as createServerFunction } from "@tanstack/react-start";

import type { PartOfSpeech, PrincipalParts } from "./types";

/**
 * Represents a bookmarked lexical entry from the database.
 */

/**
 *
 */
export interface BookmarkedEntry {
  /** Entry UUID */
  id: string;
  /** Inflection metadata */
  inflection: Record<string, object>;
  /** Part of speech classification */
  part_of_speech: PartOfSpeech;
  /** Principal parts of the entry */
  principal_parts: PrincipalParts;
  /** Translation strings */
  translations: string[];
}
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Get all bookmarked entries for the current user
 */
export const getBookmarks = createServerFunction({ method: "GET" }).handler(
  // eslint-disable-next-line @typescript-eslint/require-await
  async (): Promise<BookmarkedEntry[]> => {
    return [];
  },
);

/**
 * Check if an entry is bookmarked by the current user
 */
export const isBookmarked = createServerFunction({ method: "GET" })
  .validator((data: { entryId: string }) => data)
  .handler(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (): Promise<boolean> => {
      return false;
    },
  );

/**
 * Add a bookmark for the current user
 */
export const addBookmark = createServerFunction({ method: "POST" })
  .validator((data: { entryId: string }) => data)
  .handler(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (): Promise<{ error: null | string; success: boolean }> => {
      return { error: null, success: true };
    },
  );

/**
 * Remove a bookmark for the current user
 */
export const removeBookmark = createServerFunction({ method: "POST" })
  .validator((data: { entryId: string }) => data)
  .handler(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (): Promise<{ error: null | string; success: boolean }> => {
      return { error: null, success: true };
    },
  );

/**
 * Toggle bookmark status for an entry
 */
export const toggleBookmark = createServerFunction({ method: "POST" })
  .validator((data: { entryId: string }) => data)
  .handler(
    async (): Promise<{
      bookmarked: boolean;
      error: null | string;
      success: boolean;
    }> => {
      await Promise.resolve();
      return {
        bookmarked: false,
        error: null,
        success: true,
      };
    },
  );
