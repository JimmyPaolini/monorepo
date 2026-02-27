import { createServerFn } from "@tanstack/react-start";

import { getSupabaseServerClient } from "./supabase-server";

/**
 * Represents a user's saved text in the library.
 */
/* eslint-disable @typescript-eslint/naming-convention */
/**
 *
 */
export interface UserText {
  /** Text UUID */
  id: string;
  /** Title of the text */
  title: string;
  /** Content of the text */
  text: string;
  /** ID of the user who owns the text */
  user_id: string;
}
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Get all texts for the current user
 */
export const getUserTexts = createServerFn({ method: "GET" }).handler(
  async (): Promise<UserText[]> => {
    const supabase = getSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from("user_texts")
      .select("id, title, text, user_id")
      .eq("user_id", user.id)
      .order("title");

    if (error) {
      console.error("Error fetching user texts:", error);
      return [];
    }

    return data as UserText[];
  },
);

/**
 * Create a new text for the current user
 */
export const createUserText = createServerFn({ method: "POST" })
  .inputValidator((data: { title: string; text: string }) => data)
  .handler(
    async ({
      data,
    }): Promise<{
      success: boolean;
      text: UserText | null;
      error: string | null;
    }> => {
      const supabase = getSupabaseServerClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, text: null, error: "Not authenticated" };
      }

      const { data: newText, error } = await supabase
        .from("user_texts")
        .insert({
          id: crypto.randomUUID(),
          title: data.title,
          text: data.text,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating text:", error);
        return { success: false, text: null, error: error.message };
      }

      return { success: true, text: newText as UserText, error: null };
    },
  );

/**
 * Update an existing text
 */
export const updateUserText = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; title: string; text: string }) => data)
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
        .from("user_texts")
        .update({
          title: data.title,
          text: data.text,
        })
        .eq("id", data.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating text:", error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    },
  );

/**
 * Delete a text
 */
export const deleteUserText = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
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
        .from("user_texts")
        .delete()
        .eq("id", data.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting text:", error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    },
  );
